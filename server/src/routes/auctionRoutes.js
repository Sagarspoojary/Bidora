import express from 'express';
import { 
  getAuctions, 
  getActiveAuction, 
  getAuctionById, 
  createAuction, 
  getMyAuctions, 
  deleteAuction,
  updateAuction
} from '../controllers/auctionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected endpoints for auction pipeline
router.get('/', requireAuth, getAuctions);
router.get('/active', requireAuth, getActiveAuction);
router.get('/my-auctions', requireAuth, getMyAuctions);
router.get('/:id', requireAuth, getAuctionById);
router.post('/', requireAuth, createAuction);
router.put('/:id', requireAuth, updateAuction);
router.delete('/:id', requireAuth, deleteAuction);

export default router;
