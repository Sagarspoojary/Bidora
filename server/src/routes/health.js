import express from 'express';
import { getDatabaseStatus } from '../config/db.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const services = getDatabaseStatus();
  
  res.status(200).json({
    success: true,
    message: 'Bidora API is running',
    services,
  });
});

export default router;
