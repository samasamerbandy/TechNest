export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with this value already exists." });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  // Default
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error.";

  res.status(status).json({ error: message });
};