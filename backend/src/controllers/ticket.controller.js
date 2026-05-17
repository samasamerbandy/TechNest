import { validationResult } from "express-validator";
import prisma from "../../db/lib/prisma.js";

// ─── Notification Helper ───────────────────────────────────────────────────────
const notify = async (userId, message, ticketId = null) => {
  try {
    await prisma.notification.create({
      data: { userId, message, ticketId },
    });
  } catch (e) {
    console.error("Notification error:", e.message);
  }
};

// ─── Submit Ticket (Community Member) ─────────────────────────────────────────
export const submitTicket = async (req, res, next) => {
  try {
    // DEBUG — remove after fixing
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, category, building, floor, roomNumber } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category,
        building,
        floor,
        roomNumber,
        imageUrl,
        submittedById: req.user.id,
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ message: "Ticket submitted successfully.", ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Get All Tickets (Facility Manager / Admin) ───────────────────────────────
export const getAllTickets = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status)   where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          submittedBy: { select: { id: true, name: true, email: true } },
          assignedTo:  { select: { id: true, name: true, email: true } },
          mergedInto:  { select: { id: true, title: true } },
          _count:      { select: { comments: true, mergedTickets: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: parseInt(limit),
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─── Get My Tickets (Community Member) ───────────────────────────────────────
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { submittedById: req.user.id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count:     { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ tickets });

  } catch (error) {
    next(error);
  }
};

// ─── Get Assigned Tickets (Worker) ────────────────────────────────────────────
export const getAssignedTickets = async (req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { assignedToId: req.user.id },
      include: {
        submittedBy: { select: { id: true, name: true } },
        _count:      { select: { comments: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    res.json({ tickets });

  } catch (error) {
    next(error);
  }
};

// ─── Get Ticket By ID ─────────────────────────────────────────────────────────
export const getTicketById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        submittedBy:   { select: { id: true, name: true, email: true } },
        assignedTo:    { select: { id: true, name: true, email: true } },
        mergedInto:    { select: { id: true, title: true } },
        mergedTickets: { select: { id: true, title: true, status: true } },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    // Community members can only view their own tickets
    if (
      req.user.role === "community_member" &&
      ticket.submittedById !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied." });
    }

    res.json({ ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Update Status (Facility Manager / Worker) ────────────────────────────────
export const updateStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });

    await notify(
      ticket.submittedById,
      `Your ticket "${ticket.title}" status updated to: ${status}`,
      ticket.id
    );

    res.json({ message: "Status updated.", ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Set Priority (Facility Manager) ─────────────────────────────────────────
export const setPriority = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { priority } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { priority },
    });

    res.json({ message: "Priority updated.", ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Assign Ticket (Facility Manager) ────────────────────────────────────────
export const assignTicket = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const workerIdInt = parseInt(req.body.workerId);

    const worker = await prisma.user.findFirst({
      where: { id: workerIdInt, role: "worker", isActive: true },
    });
    if (!worker) {
      return res.status(404).json({ error: "Worker not found or inactive." });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { assignedToId: workerIdInt, status: "in_progress" },
      include: {
        assignedTo:  { select: { id: true, name: true, email: true } },
        submittedBy: { select: { id: true, name: true } },
      },
    });

    await notify(
      workerIdInt,
      `You have been assigned ticket #${ticket.id}: "${ticket.title}"`,
      ticket.id
    );
    await notify(
      ticket.submittedById,
      `Your ticket "${ticket.title}" has been assigned to ${worker.name}`,
      ticket.id
    );

    res.json({ message: "Ticket assigned successfully.", ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Close Ticket (Facility Manager) ─────────────────────────────────────────
export const closeTicket = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status: "closed" },
    });

    await notify(
      ticket.submittedById,
      `Your ticket "${ticket.title}" has been closed.`,
      ticket.id
    );

    res.json({ message: "Ticket closed.", ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Merge Tickets (Facility Manager) ────────────────────────────────────────
export const mergeTickets = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const { ticketIds } = req.body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ error: "Provide ticketIds array to merge." });
    }

    const idsToMerge = ticketIds.map(Number).filter((n) => n !== targetId);

    await prisma.ticket.updateMany({
      where: { id: { in: idsToMerge } },
      data: { mergedIntoId: targetId, status: "closed" },
    });

    const target = await prisma.ticket.findUnique({
      where: { id: targetId },
      include: { mergedTickets: { select: { id: true, title: true } } },
    });

    res.json({
      message: `${idsToMerge.length} ticket(s) merged into #${targetId}.`,
      ticket: target,
    });

  } catch (error) {
    next(error);
  }
};

// ─── Add Comment (Worker / Facility Manager) ──────────────────────────────────
export const addComment = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Comment content is required." });
    }

    const comment = await prisma.comment.create({
      data: { content, ticketId, authorId: req.user.id },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { submittedById: true, title: true },
    });

    if (ticket && ticket.submittedById !== req.user.id) {
      await notify(
        ticket.submittedById,
        `New update on your ticket "${ticket.title}"`,
        ticketId
      );
    }

    res.status(201).json({ message: "Comment added.", comment });

  } catch (error) {
    next(error);
  }
};

// ─── Upload Evidence Photo (Worker) ──────────────────────────────────────────
export const uploadEvidence = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Evidence photo is required." });
    }

    const id = parseInt(req.params.id);

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        evidenceUrl: `/uploads/${req.file.filename}`,
        status: "resolved",
      },
    });

    await notify(
      ticket.submittedById,
      `Your ticket "${ticket.title}" has been resolved!`,
      ticket.id
    );

    res.json({ message: "Evidence uploaded. Ticket marked as resolved.", ticket });

  } catch (error) {
    next(error);
  }
};

// ─── Delete Ticket (Facility Manager / Admin) ────────────────────────────────
export const deleteTicket = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Delete related records first
    await prisma.comment.deleteMany({ where: { ticketId: id } });
    await prisma.notification.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.updateMany({ where: { mergedIntoId: id }, data: { mergedIntoId: null } });

    await prisma.ticket.delete({ where: { id } });
    res.json({ message: "Ticket deleted." });

  } catch (error) {
    next(error);
  }
};