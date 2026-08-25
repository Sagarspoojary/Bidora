import { pgPool } from '../config/db.js';

// Retrieve the single active auction centerpiece
export async function getActiveAuction(req, res) {
  try {
    const query = `
      SELECT id, title, description, image_url, starting_price, current_price, start_time, end_time, status
      FROM auctions
      WHERE status = 'ACTIVE' AND start_time <= NOW() AND end_time > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await pgPool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active centerpiece auction found at this time',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get active auction error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching active auction',
    });
  }
}

// Retrieve auction details by ID
export async function getAuctionById(req, res) {
  const { id } = req.params;

  try {
    const query = `
      SELECT id, title, description, image_url, starting_price, current_price, start_time, end_time, status
      FROM auctions
      WHERE id = $1;
    `;

    const result = await pgPool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get auction by ID error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching auction details',
    });
  }
}
