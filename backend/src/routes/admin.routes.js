import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  listAllUsers,
  toggleUserStatus,
  assignRole,
} from "../controllers/manager.controller.js";

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, authorize("admin"));

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", listAllUsers);

// ─── PUT /api/admin/users/:id/status ─────────────────────────────────────────
router.put("/users/:id/status", toggleUserStatus);

// ─── PUT /api/admin/users/:id/role ───────────────────────────────────────────
router.put("/users/:id/role", [
  body("role")
    .notEmpty()
    .withMessage("Role is required."),
], assignRole);

export default router;