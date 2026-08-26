import express from 'express';
import { placeBid, getMyBids, getStats, getBidsByAuction } from '../controllers/bidController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, placeBid);
router.get('/my-bids', requireAuth, getMyBids);
router.get('/stats', requireAuth, getStats);
router.get('/auction/:auctionId', requireAuth, getBidsByAuction);

export default router;
