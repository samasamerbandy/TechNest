import jwt from "jsonwebtoken";
import prisma from "../../db/lib/prisma.js";

// ─── Verify JWT (Supports Mobile Headers & Web Cookies) ──────────────────────
export const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from Header (Bearer token for Mobile) or Cookie (for Web)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : req.cookies?.technest_token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    // 2. Check if token was revoked (server-side logout)
    const revoked = await prisma.revokedToken.findFirst({
      where: { token },
    });
    if (revoked) {
      return res.status(401).json({ error: "Session invalidated. Please log in again." });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated. Contact an administrator." });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
};

// ─── Role-Based Authorization ──────────────────────────────────────────────────
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure req.user exists before accessing role
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const normalizedRoles = roles.map((r) => r.toLowerCase());

    if (!normalizedRoles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({
        error: `Access denied. Required role: ${normalizedRoles.join(", ")}`,
      });
    }
    next();
  };
};