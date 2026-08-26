import { pgPool } from '../config/db.js';

function getCurrencySymbol(code) {
  switch (code) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
}

// Place a new bid inside a transaction
export async function placeBid(req, res) {
  const { auction_id, amount } = req.body;
  const userId = req.user.id;

  if (!auction_id || !amount || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid auction reference or bid amount.',
    });
  }

  const client = await pgPool.connect();

  try {
    // Start transactional block
    await client.query('BEGIN');

    // Retrieve and lock the auction row for updates
    const checkQuery = `
      SELECT id, current_price, starting_price, currency, start_time, end_time, created_by, title 
      FROM auctions 
      WHERE id = $1 
      FOR UPDATE;
    `;
    const checkResult = await client.query(checkQuery, [auction_id]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Auction item not found.',
      });
    }

    const auction = checkResult.rows[0];
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);

    // Verify auction dates
    if (now < startTime) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Bidding has not started yet for this auction.',
      });
    }

    if (now >= endTime) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This auction has already ended.',
      });
    }

    // Verify bid amount meets minimum highest criteria
    const currentPrice = Number(auction.current_price || auction.starting_price);
    const bidAmount = Number(amount);

    if (bidAmount <= currentPrice) {
      await client.query('ROLLBACK');
      const symbol = getCurrencySymbol(auction.currency);
      return res.status(400).json({
        success: false,
        message: `Your bid must be strictly higher than the current price of ${symbol}${currentPrice.toLocaleString('en-US')}.`,
      });
    }

    // Insert bid
    const insertQuery = `
      INSERT INTO bids (auction_id, user_id, amount)
      VALUES ($1, $2, $3)
      RETURNING id, amount, created_at;
    `;
    const insertResult = await client.query(insertQuery, [auction_id, userId, bidAmount]);

    // Update auction price
    const updateQuery = `
      UPDATE auctions
      SET current_price = $1, updated_at = NOW()
      WHERE id = $2;
    `;
    await client.query(updateQuery, [bidAmount, auction_id]);

    // 1. Send notification to the auction creator (if someone else bids)
    if (auction.created_by && auction.created_by !== userId) {
      const symbol = getCurrencySymbol(auction.currency);
      await client.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3);`,
        [
          auction.created_by,
          'New Bid Received!',
          `A new bid of ${symbol}${Number(bidAmount).toLocaleString('en-US')} has been placed on your item "${auction.title}".`
        ]
      );
    }

    // 2. Send notification to the previous highest bidder (if they are outbid)
    const prevHighestResult = await client.query(
      `SELECT user_id FROM bids WHERE auction_id = $1 ORDER BY amount DESC LIMIT 1 OFFSET 1;`,
      [auction_id]
    );
    if (prevHighestResult.rows.length > 0) {
      const prevBid = prevHighestResult.rows[0];
      if (prevBid.user_id && prevBid.user_id !== userId) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3);`,
          [
            prevBid.user_id,
            'You have been Outbid!',
            `Someone placed a higher bid on "${auction.title}". Your bid is no longer the highest offer.`
          ]
        );
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Bid placed successfully!',
      data: insertResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Place bid error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while placing your bid.',
    });
  } finally {
    client.release();
  }
}

// Retrieve user's bids
export async function getMyBids(req, res) {
  const userId = req.user.id;

  try {
    const query = `
      SELECT DISTINCT ON (b.auction_id) 
        a.id, a.title, a.image_url, a.starting_price, a.current_price, a.currency, a.end_time,
        b.amount AS user_highest_bid,
        CASE WHEN a.current_price = b.amount THEN 'Winning' ELSE 'Losing' END AS status
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
      WHERE b.user_id = $1
      ORDER BY b.auction_id, b.amount DESC, b.created_at DESC;
    `;

    const result = await pgPool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get my bids error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching your bids list.',
    });
  }
}

// Retrieve dashboard statistics counters
export async function getStats(req, res) {
  const userId = req.user.id;

  try {
    // 1. My bids count (distinct auctions bid on)
    const myBidsResult = await pgPool.query(
      `SELECT COUNT(DISTINCT auction_id) FROM bids WHERE user_id = $1;`,
      [userId]
    );

    // 2. My registered auctions count
    const myAuctionsResult = await pgPool.query(
      `SELECT COUNT(*) FROM auctions WHERE created_by = $1;`,
      [userId]
    );

    // 3. Active participation (distinct auctions bid on that are still active)
    const activeResult = await pgPool.query(
      `SELECT COUNT(DISTINCT b.auction_id) 
       FROM bids b 
       JOIN auctions a ON b.auction_id = a.id 
       WHERE b.user_id = $1 AND a.end_time > NOW();`,
      [userId]
    );

    // 4. Auctions Won (ended auctions where user has highest bid matching current price)
    const wonResult = await pgPool.query(
      `SELECT COUNT(*) FROM (
        SELECT DISTINCT ON (b.auction_id) b.auction_id, b.amount, a.current_price
        FROM bids b
        JOIN auctions a ON b.auction_id = a.id
        WHERE b.user_id = $1 AND a.end_time <= NOW()
        ORDER BY b.auction_id, b.amount DESC
      ) AS user_highest_ended_bids
      WHERE amount = current_price;`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: {
        myBids: Number(myBidsResult.rows[0].count),
        myAuctions: Number(myAuctionsResult.rows[0].count),
        activeParticipation: Number(activeResult.rows[0].count),
        auctionsWon: Number(wonResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while compiling stats metrics.',
    });
  }
}

// Retrieve all bids submitted to a specific auction
export async function getBidsByAuction(req, res) {
  const { auctionId } = req.params;

  try {
    const query = `
      SELECT b.id, b.amount, b.created_at, u.name AS bidder_name, u.email AS bidder_email
      FROM bids b
      JOIN users u ON b.user_id = u.id
      WHERE b.auction_id = $1
      ORDER BY b.amount DESC, b.created_at DESC;
    `;

    const result = await pgPool.query(query, [auctionId]);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get bids by auction error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching bids history.',
    });
  }
}
