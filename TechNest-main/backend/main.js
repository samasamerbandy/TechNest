import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

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
  origin: process.env.CLIENT_URL || "http://localhost:8081",
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

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    app: "Tech Nest API",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/tickets",       ticketRoutes);
app.use("/api/manager",       managerRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 ───────────────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nTech Nest API running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS origin: ${process.env.CLIENT_URL}\n`);
});