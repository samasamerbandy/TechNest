import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import prisma from "./db/lib/prisma.js";

// Routes
import authRoutes from "./src/routes/auth.routes.js";
import ticketRoutes from "./src/routes/ticket.routes.js";
import managerRoutes from "./src/routes/manager.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";

// Error handler
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: true,                  // ← allows Expo Go from any IP
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
}));

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));

// ─── Serve Static Files (Uploads) ──────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    app: "CampusCare API",
    timestamp: new Date().toISOString(),
  });
});

// ─── DB Check ─────────────────────────────────────────────────────────────────
app.get("/api/db-check", async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ status: "Success", userCount: count });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/tickets",       ticketRoutes);
app.use("/api/manager",       managerRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nCampusCare API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS: open (development mode)\n`);
});