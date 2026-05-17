import prisma from "../../db/lib/prisma.js";

// ─── List All Workers (Facility Manager) ──────────────────────────────────────
export const listWorkers = async (req, res, next) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: "worker" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: { select: { assignedTickets: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json({ workers });

  } catch (error) {
    next(error);
  }
};

// ─── Toggle Worker Status (Facility Manager) ──────────────────────────────────
export const toggleWorkerStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const worker = await prisma.user.findFirst({
      where: { id, role: "worker" },
    });

    if (!worker) {
      return res.status(404).json({ error: "Worker not found." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !worker.isActive },
      select: { id: true, name: true, isActive: true },
    });

    res.json({
      message: `Worker ${updated.isActive ? "activated" : "deactivated"}.`,
      worker: updated,
    });

  } catch (error) {
    next(error);
  }
};

// ─── List All Users (Admin) ───────────────────────────────────────────────────
export const listAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });

  } catch (error) {
    next(error);
  }
};

// ─── Toggle User Status (Admin) ───────────────────────────────────────────────
export const toggleUserStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, role: true, isActive: true },
    });

    res.json({
      message: `User ${updated.isActive ? "activated" : "deactivated"}.`,
      user: updated,
    });

  } catch (error) {
    next(error);
  }
};

// ─── Assign Role (Admin) ──────────────────────────────────────────────────────
export const assignRole = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    const validRoles = [
      "community_member",
      "facility_manager",
      "worker",
      "admin",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${validRoles.join(", ")}`,
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ message: "Role updated.", user });

  } catch (error) {
    next(error);
  }
};