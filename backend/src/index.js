import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer } from 'ws';

import config from './config/index.js';
import apiRoutes from './routes/index.js';
import chatController from './controllers/chatController.js';
import { serverLogger } from './modules/logger.js';

// Initialize the global logger
global.logger = serverLogger({
  level: config.isDev ? 'debug' : 'info',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IIFE for top-level async/await
(async () => {
  try {
    // Initialize Express app
    const app = express();
    const server = http.createServer(app);

    // Connect to MongoDB
    global.logger.info('Connecting to MongoDB', { uri: config.mongodbUri });
    try {
      await mongoose.connect(config.mongodbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      global.logger.info('MongoDB connected successfully');
    } catch (dbError) {
      global.logger.error('Failed to connect to MongoDB', { 
        error: dbError.message,
        stack: dbError.stack 
      });
      
      // Fallback to localhost if Docker connection fails
      if (config.mongodbUri.includes('mongodb:')) {
        const fallbackUri = 'mongodb://localhost:27017/prompt-library';
        global.logger.info('Trying fallback connection', { uri: fallbackUri });
        await mongoose.connect(fallbackUri);
        global.logger.info('MongoDB connected via fallback');
      } else {
        throw dbError;
      }
    }

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '5mb' }));
    app.use(morgan('dev'));

    // API routes
    app.use('/api', apiRoutes);

    // Set up WebSocket server for chat
    const wss = new WebSocketServer({ 
      server,
      path: '/api/chat/ws'
    });

    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      global.logger.info('WebSocket client connected', { 
        ip: clientIp,
        headers: req.headers['user-agent'] 
      });
      
      chatController.handleWebSocket(ws, req);
      
      ws.on('close', (code, reason) => {
        global.logger.info('WebSocket client disconnected', { 
          ip: clientIp,
          code,
          reason: reason.toString() 
        });
      });
    });

    // Serve static assets in production
    if (config.isProd) {
      const frontendBuildPath = path.resolve(__dirname, '../../frontend/dist');
      app.use(express.static(frontendBuildPath));

      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
      });
    }

    // Start the server
    server.listen(config.port, () => {
      global.logger.info('Server started', { 
        mode: config.nodeEnv, 
        port: config.port 
      });
      global.logger.info('WebSocket server available', { 
        url: `ws://localhost:${config.port}/api/chat/ws` 
      });
    });
  } catch (error) {
    global.logger.error('Server initialization failed', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
})();
