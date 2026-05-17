import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  getWorkers,
} from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const VALID_ROLES = [
  "community_member",
  "facility_manager",
  "worker",
  "admin",
];

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required."),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain a letter and a number."),
  body("role")
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),
], register);

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required."),
  body("password")
    .notEmpty()
    .withMessage("Password is required."),
], login);

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", authenticate, logout);

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", authenticate, getMe);

// ─── GET /api/auth/workers ─────────────────────────────────────────────────────
router.get("/workers", authenticate, authorize("facility_manager"), getWorkers);

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", forgotPassword);

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
router.post("/reset-password", resetPassword);

// ─── PUT /api/auth/change-password ────────────────────────────────────────────
router.put("/change-password", authenticate, [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters."),
], changePassword);

export default router;