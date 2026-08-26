import { pgPool } from '../config/db.js';

// Retrieve notifications for authenticated user
export async function getNotifications(req, res) {
  const userId = req.user.id;

  try {
    const query = `
      SELECT id, title, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pgPool.query(query, [userId]);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error while retrieving notifications.' });
  }
}

// Mark all user notifications as read
export async function markNotificationsAsRead(req, res) {
  const userId = req.user.id;

  try {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1;
    `;
    await pgPool.query(query, [userId]);
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark notifications read error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error while clearing notifications.' });
  }
}
