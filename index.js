const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { logger } = require("./src/config/logger");
const connectDB = require("./src/config/db");

// Import routes
const jobRoutes = require("./src/routes/job.routes");
const clientRoutes = require("./src/routes/client.routes");
const outreachRoutes = require("./src/routes/outreach.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.MAX_REQUESTS_PER_HOUR || 100,
  message: {
    error: "Too many requests from this IP, please try again after an hour.",
  },
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://yourdomain.com"]
      : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: req.method === "POST" ? req.body : undefined,
  });
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Client Finder Bot API is running successfully!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "operational",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/analytics", analyticsRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(error.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || "development",
    port: PORT,
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
