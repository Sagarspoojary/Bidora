import { pgPool } from '../config/db.js';

// Helper to dynamically calculate and format auction data
function formatAuctionRow(row) {
  const now = new Date();
  const startTime = new Date(row.start_time);
  const endTime = new Date(row.end_time);

  let calculatedStatus = 'LIVE';
  if (now < startTime) {
    calculatedStatus = 'UPCOMING';
  } else if (now >= endTime) {
    calculatedStatus = 'ENDED';
  } else {
    calculatedStatus = 'LIVE';
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    starting_price: Number(row.starting_price),
    current_price: Number(row.current_price),
    currency: row.currency || 'USD',
    start_time: row.start_time,
    end_time: row.end_time,
    status: calculatedStatus, // Server authority dynamic calculation
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

// Retrieve the list of all auctions with search filter
export async function getAuctions(req, res) {
  const { search } = req.query;

  try {
    let query = `
      SELECT id, title, description, image_url, starting_price, current_price, currency, start_time, end_time, status, created_by, created_at
      FROM auctions
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` WHERE title ILIKE $1 OR description ILIKE $1`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY created_at DESC;`;

    const result = await pgPool.query(query, params);
    const formatted = result.rows.map(formatAuctionRow);

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get auctions error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching auctions list',
    });
  }
}

// Retrieve the single active auction centerpiece
export async function getActiveAuction(req, res) {
  try {
    const query = `
      SELECT id, title, description, image_url, starting_price, current_price, currency, start_time, end_time, status, created_by, created_at
      FROM auctions
      WHERE start_time <= NOW() AND end_time > NOW()
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
      data: formatAuctionRow(result.rows[0]),
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
      SELECT id, title, description, image_url, starting_price, current_price, currency, start_time, end_time, status, created_by, created_at
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
      data: formatAuctionRow(result.rows[0]),
    });
  } catch (error) {
    console.error('Get auction by ID error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching auction details',
    });
  }
}

// Register a new auction item in the database
export async function createAuction(req, res) {
  const { title, description, image_url, starting_price, currency, start_time, end_time } = req.body;
  const userId = req.user.id;

  try {
    const query = `
      INSERT INTO auctions (title, description, image_url, starting_price, current_price, currency, start_time, end_time, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title, starting_price, current_price, currency, start_time, end_time, created_by;
    `;

    const result = await pgPool.query(query, [
      title,
      description,
      image_url || '/images/luxury_watch.jpg',
      starting_price,
      starting_price, // current_price matches starting_price initially
      currency || 'USD',
      start_time || new Date(),
      end_time,
      userId,
    ]);

    const insertedAuction = result.rows[0];

    // Send notifications to all users
    try {
      const usersResult = await pgPool.query('SELECT id FROM users;');
      const currencyMap = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
      const symbol = currencyMap[insertedAuction.currency] || '$';
      
      for (const row of usersResult.rows) {
        await pgPool.query(
          `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3);`,
          [
            row.id, 
            'New Auction Registered!', 
            `A new premium asset "${insertedAuction.title}" has been listed starting at ${symbol}${Number(insertedAuction.starting_price).toLocaleString('en-US')}.`
          ]
        );
      }
    } catch (notifyErr) {
      console.error('Failed to dispatch new auction notifications:', notifyErr.message);
    }

    return res.status(201).json({
      success: true,
      data: formatAuctionRow(insertedAuction),
    });
  } catch (error) {
    console.error('Create auction error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering auction item',
    });
  }
}

// Retrieve auctions owned by the logged-in user
export async function getMyAuctions(req, res) {
  const userId = req.user.id;

  try {
    const query = `
      SELECT id, title, description, image_url, starting_price, current_price, currency, start_time, end_time, status, created_by, created_at
      FROM auctions
      WHERE created_by = $1
      ORDER BY created_at DESC;
    `;

    const result = await pgPool.query(query, [userId]);
    const formatted = result.rows.map(formatAuctionRow);

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get my auctions error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching your auctions list',
    });
  }
}

// Delete an auction
export async function deleteAuction(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Confirm ownership or allow deletion of local mock items
    const deleteQuery = `
      DELETE FROM auctions
      WHERE id = $1 AND (created_by = $2 OR created_by IS NULL)
      RETURNING id;
    `;

    const result = await pgPool.query(deleteQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found or permission denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Auction deleted successfully',
    });
  } catch (error) {
    console.error('Delete auction error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting auction item',
    });
  }
}

// Update an existing auction details in postgres
export async function updateAuction(req, res) {
  const { id } = req.params;
  const { title, description, starting_price, currency } = req.body;
  const userId = req.user.id;

  try {
    // If bids have been placed, starting_price is usually locked in real apps, but we can update both starting_price and current_price if current_price equals starting_price (meaning no bids placed).
    const updateQuery = `
      UPDATE auctions
      SET 
        title = $1, 
        description = $2, 
        starting_price = $3, 
        current_price = CASE WHEN current_price = starting_price THEN $3 ELSE current_price END,
        currency = $4,
        updated_at = NOW()
      WHERE id = $5 AND (created_by = $6 OR created_by IS NULL)
      RETURNING id, title, description, image_url, starting_price, current_price, currency, start_time, end_time, status, created_by, created_at;
    `;

    const result = await pgPool.query(updateQuery, [
      title,
      description,
      starting_price,
      currency || 'USD',
      id,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found or permission denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Auction updated successfully',
      data: formatAuctionRow(result.rows[0]),
    });
  } catch (error) {
    console.error('Update auction error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating auction parameters.',
    });
  }
}
