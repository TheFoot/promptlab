import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

import config from "./config/index.js";
import apiRoutes from "./routes/index.js";
import chatController from "./controllers/chatController.js";
// serverLogger is imported in index.js where it's used to initialize the global logger

// Set up __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up exception handlers
export const setupExceptionHandlers = () => {
  // Set up global uncaught exception handler
  process.on("uncaughtException", (error) => {
    console.error("UNCAUGHT EXCEPTION:", error.message);
    console.error(error.stack);
    // Log to the global logger if it's been initialized
    if (global.logger) {
      global.logger.fatal("Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });
    }
    // DON'T exit the process - keep the server running despite errors
  });

  // Set up unhandled rejection handler (for promises)
  process.on("unhandledRejection", (reason) => {
    // Properly format the reason before logging
    const errorMessage =
      reason instanceof Error ? reason.message : String(reason);
    console.error("UNHANDLED REJECTION:", errorMessage);

    // Log to the global logger if it's been initialized
    if (global.logger) {
      global.logger.error("Unhandled promise rejection", {
        reason: errorMessage,
        stack:
          reason instanceof Error ? reason.stack : "No stack trace available",
      });
    }
    // DON'T exit the process - keep the server running despite errors
  });
};

// Initialize the application
export const initializeApp = async () => {
  try {
    // Initialize Express app
    const app = express();
    const server = http.createServer(app);

    // Connect to MongoDB - fail fast, no fallbacks
    global.logger.info("Connecting to MongoDB", { uri: config.mongodbUri });
    try {
      await mongoose.connect(config.mongodbUri);
      global.logger.info("MongoDB connected successfully");
    } catch (dbError) {
      global.logger.error("Failed to connect to MongoDB", {
        error: dbError.message,
        stack: dbError.stack,
      });
      // Fail immediately - no fallbacks that mask configuration issues
      throw dbError;
    }

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: "5mb" }));
    
    // Pino HTTP request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        global.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        });
      });
      
      next();
    });

    // API routes
    app.use("/api", apiRoutes);

    // Add error handling middleware
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      global.logger.error("Express error handler caught an error", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });

      res.status(err.status || 500).json({
        error: "Internal Server Error",
        message: config.isDev ? err.message : "Something went wrong",
      });
    });

    return { app, server };
  } catch (error) {
    global.logger.error("Server initialization failed", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Set up WebSocket server
export const setupWebSocketServer = (server) => {
  const wss = new WebSocketServer({
    server,
    path: "/api/chat/ws",
  });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    global.logger.info("WebSocket client connected", {
      ip: clientIp,
      headers: req.headers["user-agent"],
    });

    chatController.handleWebSocket(ws, req);

    ws.on("close", (code, reason) => {
      global.logger.info("WebSocket client disconnected", {
        ip: clientIp,
        code,
        reason: reason.toString(),
      });
    });
  });

  return wss;
};

// Set up static file serving for production
export const setupStaticFileServing = async (app) => {
  if (config.isProd) {
    const frontendBuildPath = path.resolve(__dirname, "../../frontend/dist");

    // Log the path for debugging
    global.logger.info("Serving static files from", {
      path: frontendBuildPath,
    });

    // Check if the path exists
    try {
      const fs = await import("fs");
      if (!fs.existsSync(frontendBuildPath)) {
        global.logger.error("Frontend build path does not exist", {
          path: frontendBuildPath,
        });
      } else {
        global.logger.info("Frontend build path exists", {
          path: frontendBuildPath,
        });

        // Check if index.html exists
        const indexPath = path.join(frontendBuildPath, "index.html");
        if (!fs.existsSync(indexPath)) {
          global.logger.error("index.html not found in build directory", {
            path: indexPath,
          });
        } else {
          global.logger.info("index.html found", { path: indexPath });
        }
      }
    } catch (error) {
      global.logger.error("Error checking frontend build path", {
        error: error.message,
      });
    }

    app.use(express.static(frontendBuildPath));

    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(frontendBuildPath, "index.html"));
    });
  }
};

// Start the server
export const startServer = (server) => {
  return new Promise((resolve) => {
    server.listen(config.port, () => {
      global.logger.info("Server started", {
        mode: config.nodeEnv,
        port: config.port,
      });
      global.logger.info("WebSocket server available", {
        url: `ws://localhost:${config.port}/api/chat/ws`,
      });
      resolve(server);
    });
  });
};
