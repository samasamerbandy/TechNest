import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get("/", getMyNotifications);

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────
router.put("/read-all", markAllRead);

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
router.put("/:id/read", markRead);

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
router.delete("/:id", deleteNotification);

export default router;