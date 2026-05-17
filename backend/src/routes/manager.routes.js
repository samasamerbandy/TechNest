import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  listWorkers,
  toggleWorkerStatus,
} from "../controllers/manager.controller.js";

const router = Router();

// All routes require authentication + facility_manager or admin role
router.use(authenticate, authorize("facility_manager", "admin"));

// ─── GET /api/manager/workers ─────────────────────────────────────────────────
router.get("/workers", listWorkers);

// ─── PUT /api/manager/workers/:id/status ─────────────────────────────────────
router.put("/workers/:id/status", toggleWorkerStatus);

export default router;