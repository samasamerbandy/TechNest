import prisma from "../../db/lib/prisma.js";

// ─── Get My Notifications ─────────────────────────────────────────────────────
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        ticket: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ notifications });

  } catch (error) {
    next(error);
  }
};

// ─── Mark One Notification as Read ────────────────────────────────────────────
export const markRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied." });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ message: "Marked as read." });

  } catch (error) {
    next(error);
  }
};

// ─── Mark All Notifications as Read ──────────────────────────────────────────
export const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: "All notifications marked as read." });

  } catch (error) {
    next(error);
  }
};

// ─── Delete One Notification ──────────────────────────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied." });
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: "Notification deleted." });

  } catch (error) {
    next(error);
  }
};