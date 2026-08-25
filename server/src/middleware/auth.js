import { verifyToken } from '../utils/jwt.js';
import { pgPool } from '../config/db.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token is missing or malformed',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.id) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired access token',
    });
  }

  try {
    const result = await pgPool.query(
      'SELECT id, name, email, avatar_url, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User account does not exist',
      });
    }

    const user = result.rows[0];

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Your account has been suspended',
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Your account is disabled',
      });
    }

    // Attach authenticated user information to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in requireAuth middleware:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
}
