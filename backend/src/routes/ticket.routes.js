import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { upload } from "../config/multer.js";
import {
  submitTicket,
  getAllTickets,
  getMyTickets,
  getAssignedTickets,
  getTicketById,
  updateStatus,
  setPriority,
  assignTicket,
  closeTicket,
  mergeTickets,
  addComment,
  uploadEvidence,
  deleteTicket,
} from "../controllers/ticket.controller.js";

const router = Router();

const VALID_CATEGORIES = [
  "electrical",
  "plumbing",
  "cleaning",
  "furniture",
  "other",
];
const VALID_STATUSES = [
  "pending",
  "in_progress",
  "resolved",
  "closed",
];
const VALID_PRIORITIES = [
  "low",
  "medium",
  "high",
];

// All routes require authentication
router.use(authenticate);

// ─── POST /api/tickets ─────────────────────────────────────────────────────────
router.post("/",
  authorize("community_member"),
  upload.single("image"),
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required."),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required."),
    body("category")
      .isIn(VALID_CATEGORIES)
      .withMessage("Invalid category."),
    body("building")
      .trim()
      .notEmpty()
      .withMessage("Building is required."),
    body("floor")
      .trim()
      .notEmpty()
      .withMessage("Floor is required."),
    body("roomNumber")
      .trim()
      .notEmpty()
      .withMessage("Room number is required."),
  ],
  submitTicket
);

// ─── GET /api/tickets ──────────────────────────────────────────────────────────
router.get("/",
  authorize("facility_manager", "admin"),
  getAllTickets
);

// ─── GET /api/tickets/my ──────────────────────────────────────────────────────
router.get("/my",
  authorize("community_member"),
  getMyTickets
);

// ─── GET /api/tickets/assigned ────────────────────────────────────────────────
router.get("/assigned",
  authorize("worker"),
  getAssignedTickets
);

// ─── GET /api/tickets/:id ─────────────────────────────────────────────────────
router.get("/:id", getTicketById);

// ─── PUT /api/tickets/:id/status ─────────────────────────────────────────────
router.put("/:id/status",
  authorize("facility_manager", "worker"),
  [
    body("status")
      .isIn(VALID_STATUSES)
      .withMessage("Invalid status."),
  ],
  updateStatus
);

// ─── PUT /api/tickets/:id/priority ───────────────────────────────────────────
router.put("/:id/priority",
  authorize("facility_manager"),
  [
    body("priority")
      .isIn(VALID_PRIORITIES)
      .withMessage("Invalid priority."),
  ],
  setPriority
);

// ─── PUT /api/tickets/:id/assign ─────────────────────────────────────────────
router.put("/:id/assign",
  authorize("facility_manager"),
  [
    body("workerId")
      .notEmpty()
      .withMessage("Worker ID is required."),
  ],
  assignTicket
);

// ─── PUT /api/tickets/:id/close ──────────────────────────────────────────────
router.put("/:id/close",
  authorize("facility_manager"),
  closeTicket
);

// ─── POST /api/tickets/:id/merge ─────────────────────────────────────────────
router.post("/:id/merge",
  authorize("facility_manager"),
  [
    body("ticketIds")
      .isArray({ min: 1 })
      .withMessage("Provide at least one ticket ID to merge."),
  ],
  mergeTickets
);

// ─── POST /api/tickets/:id/comments ──────────────────────────────────────────
router.post("/:id/comments",
  authorize("worker", "facility_manager"),
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required."),
  ],
  addComment
);

// ─── POST /api/tickets/:id/evidence ──────────────────────────────────────────
router.post("/:id/evidence",
  authorize("worker"),
  upload.single("evidence"),
  uploadEvidence
);

// ─── DELETE /api/tickets/:id ──────────────────────────────────────────────────
router.delete("/:id",
  authorize("facility_manager", "admin"),
  deleteTicket
);

export default router;