import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabases } from './config/db.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/authRoutes.js';
import auctionRouter from './routes/auctionRoutes.js';
import bidRouter from './routes/bidRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/auctions', auctionRouter);
app.use('/api/bids', bidRouter);

// Error Handling Middleware
app.use(errorHandler);

// Initialize DBs and start Server
async function startServer() {
  initializeDatabases();
  
  app.listen(PORT, () => {
    console.log(`Express: running on port ${PORT}`);
  });
}

startServer();
