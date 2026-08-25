import express from 'express';
import { getActiveAuction, getAuctionById } from '../controllers/auctionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected endpoints for auction metadata
router.get('/active', requireAuth, getActiveAuction);
router.get('/:id', requireAuth, getAuctionById);

export default router;
