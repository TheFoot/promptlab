import config from "./config/index.js";
import { serverLogger } from "./modules/logger.js";
import {
  setupExceptionHandlers,
  initializeApp,
  setupWebSocketServer,
  setupStaticFileServing,
  startServer,
} from "./server.js";

// Set up global exception handlers
setupExceptionHandlers();

// Initialize the global logger
global.logger = serverLogger({
  level: config.isDev ? "debug" : "info",
});

// The static file serving with path resolution is handled in server.js module

// IIFE for top-level async/await
(async () => {
  try {
    // Initialize Express app and HTTP server
    const { app, server } = await initializeApp();

    // Set up WebSocket server for chat
    setupWebSocketServer(server);

    // Set up static file serving for production
    await setupStaticFileServing(app);

    // Start the server
    await startServer(server);
  } catch (error) {
    global.logger.error("Server initialization failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
})();
