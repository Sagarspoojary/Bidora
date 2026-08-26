import express from 'express';
import { placeBid, getMyBids, getStats } from '../controllers/bidController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, placeBid);
router.get('/my-bids', requireAuth, getMyBids);
router.get('/stats', requireAuth, getStats);

export default router;
