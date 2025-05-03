import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IIFE for top-level async/await
(async () => {
  try {
    // Initialize Express app
    const app = express();

    // Connect to MongoDB
    console.log('Connecting to MongoDB at', config.mongodbUri);
    try {
      await mongoose.connect(config.mongodbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected');
    } catch (dbError) {
      console.error('Failed to connect to MongoDB:', dbError.message);
      
      // Fallback to localhost if Docker connection fails
      if (config.mongodbUri.includes('mongodb:')) {
        const fallbackUri = 'mongodb://localhost:27017/prompt-library';
        console.log('Trying fallback connection to', fallbackUri);
        await mongoose.connect(fallbackUri);
        console.log('MongoDB connected via fallback');
      } else {
        throw dbError;
      }
    }

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    // API routes
    app.use('/api', apiRoutes);

    // Serve static assets in production
    if (config.isProd) {
      const frontendBuildPath = path.resolve(__dirname, '../../frontend/dist');
      app.use(express.static(frontendBuildPath));

      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
      });
    }

    // Start the server
    app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
})();
