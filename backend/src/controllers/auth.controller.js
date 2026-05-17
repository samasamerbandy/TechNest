import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validationResult } from "express-validator";
import prisma from "../../db/lib/prisma.js";

// ─── Cookie Config ─────────────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// ─── Register ──────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "community_member",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("technest_token", token, COOKIE_OPTIONS);
    res.status(201).json({
      message: "Account created successfully.",
      token,
      user,
    });

  } catch (error) {
    next(error);
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account deactivated. Contact an administrator." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("technest_token", token, COOKIE_OPTIONS);
    res.json({
      message: "Logged in successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.technest_token;

    if (token) {
      await prisma.revokedToken.create({
        data: { token, userId: req.user?.id || null },
      });
    }

    res.clearCookie("technest_token", { path: "/" });
    res.json({ message: "Logged out successfully." });

  } catch (error) {
    next(error);
  }
};

// ─── Get Current User ──────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: "If this email is registered, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpires: expires },
    });

    const isDev = process.env.NODE_ENV === "development";
    res.json({
      message: "If this email is registered, a reset link has been sent.",
      ...(isDev && { devToken: rawToken }),
    });

  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({ message: "Password reset successfully. Please log in." });

  } catch (error) {
    next(error);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both fields are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Must be at least 8 characters." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    res.json({ message: "Password changed successfully." });

  } catch (error) {
    next(error);
  }
};

// ─── Get All Workers ──────────────────────────────────────────────────────────
export const getWorkers = async (req, res, next) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: "worker", isActive: true },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ workers });
  } catch (error) {
    next(error);
  }
};