import express from 'express';
import { getNotifications, markNotificationsAsRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getNotifications);
router.post('/read', requireAuth, markNotificationsAsRead);

export default router;
