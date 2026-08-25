import pg from 'pg';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL Connection Pool
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let pgConnected = false;
let mongoConnected = false;
let redisConnected = false;

// Redis Client
export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
  redisConnected = false;
});

redisClient.on('connect', () => {
  redisConnected = true;
});

// Initialization function
export async function initializeDatabases() {
  console.log('Bidora API starting...');

  // 1. Initialize PostgreSQL connection
  try {
    // Set a short connection timeout for pgPool
    const client = await Promise.race([
      pgPool.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PostgreSQL connection timeout')), 2000))
    ]);
    client.release();
    pgConnected = true;
    console.log('PostgreSQL: connected');
  } catch (error) {
    console.error('PostgreSQL: connection failed -', error.message);
    pgConnected = false;
  }

  // 2. Initialize MongoDB connection
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    mongoConnected = true;
    console.log('MongoDB: connected');
  } catch (error) {
    console.error('MongoDB: connection failed -', error.message);
    mongoConnected = false;
  }

  // 3. Initialize Redis connection
  try {
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000))
    ]);
    redisConnected = true;
    console.log('Redis: connected');
  } catch (error) {
    console.error('Redis: connection failed -', error.message);
    redisConnected = false;
  }
}

export function getDatabaseStatus() {
  return {
    postgresql: pgConnected ? 'connected' : 'disconnected',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    redis: redisConnected ? 'connected' : 'disconnected',
  };
}
