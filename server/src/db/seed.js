import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const seedAuction = {
  title: 'Aetherius Chronograph - Prototype No. 01',
  description: 'Designed by legendary horologist Claude Vanhove, the Aetherius Chronograph features a hand-finished tourbillon escapement housed within an ultra-lightweight titanium and sapphire chassis. Specially commissioned as a 1-of-1 concept, it showcases a cosmic deep-blue skeletal dial, custom complications, and a double-axis orbital tourbillon. Fully certified and serial-stamped for absolute exclusivity.',
  image_url: '/images/luxury_watch.jpg',
  starting_price: 45000.00,
  current_price: 45000.00,
};

async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Seeding failed: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();

    console.log('Cleaning existing auctions...');
    await client.query('DELETE FROM auctions');

    console.log('Inserting active centerpiece auction...');
    // Set start time to 5 mins ago, end time to 24 hours from now
    const startTime = new Date(Date.now() - 5 * 60 * 1000);
    const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const query = `
      INSERT INTO auctions (title, description, image_url, starting_price, current_price, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title;
    `;

    const result = await client.query(query, [
      seedAuction.title,
      seedAuction.description,
      seedAuction.image_url,
      seedAuction.starting_price,
      seedAuction.current_price,
      startTime,
      endTime,
      'ACTIVE'
    ]);

    console.log('Seeded successfully! Active auction details:');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
