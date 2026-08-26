# BIDORA — Online Auction System
## System Design & Build Document

> **Stack**: React.js · Node.js · Express.js · PostgreSQL · MongoDB · Redis
> **GitHub**: https://github.com/Sagarspoojary/Bidora
> **Author**: Sagar S

---

## TABLE OF CONTENTS

1. Problem Understanding & Assumptions
2. High-Level Architecture Diagram
3. Database Schema (PostgreSQL + MongoDB)
4. API Contract
5. Redis Usage Plan
6. Concurrency Solution (Core Challenge)
7. Security Approach
8. Notification System
9. Known Limitations & Trade-offs
10. Scalability Plan
11. Local Setup Guide
12. Flow Diagrams

---

## 1. PROBLEM UNDERSTANDING & ASSUMPTIONS

### What Bidora Solves

Bidora is a real-time Online Auction Platform where:
- Users register and authenticate using Email/Password or Google OAuth
- Any authenticated user can create ("register") an auction listing with a title, description, image, starting price, currency, and auction window (start_time to end_time)
- Any authenticated user (except the creator) can place competitive bids on live auctions
- The system must guarantee that only the highest bid wins and that two simultaneous bids never corrupt the current_price — this is the core concurrency problem
- The auction creator can manage their listings (edit metadata, view all bids, delete)
- When an auction ends, the highest bidder contact information is surfaced to the creator only
- All users receive real-time in-app notifications for: new auction listed, bid received, outbid event

### The Core Concurrency Problem

Two users (User A and User B) both read current_price = $500 at the same time. Both submit a bid of $510. Without proper locking, both bids pass the bid > current_price validation check. This project solves this with PostgreSQL row-level locking inside a transaction — detailed in Section 6.

### Key Assumptions Made

- One "featured centerpiece" auction is active at any given time (most recent live auction)
- Starting price equals initial current_price; current_price only goes up
- Auction creator cannot bid on their own auction (enforced at frontend)
- Currency is selected at creation time and is immutable post-creation
- Passwords are hashed with bcrypt (never stored plain)
- JWT tokens are stateless and stored client-side in localStorage
- Password reset tokens expire after 1 hour
- Notification polling interval is 10 seconds (no WebSocket in v1)

---

## 2. HIGH-LEVEL ARCHITECTURE

```
CLIENT LAYER (React.js SPA - Vite, Hash routing, Framer Motion, Google OAuth)
      |
      | HTTPS / fetch() with Authorization: Bearer JWT
      |
API LAYER (Node.js + Express.js on port 5001)
  /api/auth/*         authController.js
  /api/auctions/*     auctionController.js
  /api/bids/*         bidController.js
  /api/notifications/ notificationController.js
  /api/health         health check
      |
      +---> PostgreSQL 15 (Docker :5433)
      |     Core transactional data: users, auctions, bids, notifications
      |     Row-level locking, ACID transactions, SELECT FOR UPDATE
      |
      +---> MongoDB 6.0 (Docker :27017)
      |     Write-heavy unstructured: audit logs, activity history, event streams
      |
      +---> Redis 7 (Docker :6379)
            Hot read caching, rate limiting, distributed lock (future)
      |
EXTERNAL SERVICES
      Gmail SMTP (Nodemailer) - password reset emails
      Google OAuth 2.0 - social sign-in token verification
```

---

## 3. DATABASE SCHEMA

### 3A. PostgreSQL Schema (Why here: ACID guarantees for bids)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  avatar_url        VARCHAR(512) DEFAULT NULL,
  role              VARCHAR(50)  NOT NULL DEFAULT 'USER',
  status            VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
  reset_token       VARCHAR(255) DEFAULT NULL,
  reset_token_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE auctions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(255)   NOT NULL,
  description     TEXT           NOT NULL,
  image_url       TEXT           NOT NULL,
  starting_price  NUMERIC(12, 2) NOT NULL,
  current_price   NUMERIC(12, 2) NOT NULL,
  currency        VARCHAR(10)    DEFAULT 'USD',
  start_time      TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time        TIMESTAMP WITH TIME ZONE NOT NULL,
  status          VARCHAR(50)    NOT NULL DEFAULT 'ACTIVE',
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bids (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id  UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_user    ON bids(user_id);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

Entity Relationships:
- users ──< auctions   (one user creates many auctions)
- users ──< bids       (one user places many bids)
- auctions ──< bids    (one auction receives many bids, CASCADE delete)
- users ──< notifications (one user has many notifications, CASCADE delete)

### 3B. MongoDB Schema (Why here: write-heavy, unstructured, no strict relations)

```javascript
// Collection: auction_events (audit trail)
{
  _id: ObjectId,
  event_type: "BID_PLACED" | "AUCTION_CREATED" | "AUCTION_DELETED",
  actor_id: "uuid-string",
  target_id: "uuid-string",
  metadata: {
    bid_amount: 5200,
    currency: "INR",
    auction_title: "Antique Vase"
  },
  created_at: ISODate
}

// Collection: user_activity_logs
{
  _id: ObjectId,
  user_id: "uuid-string",
  action: "LOGIN" | "LOGOUT" | "PASSWORD_RESET",
  ip_address: "103.45.67.89",
  user_agent: "Mozilla/5.0...",
  timestamp: ISODate
}
```

---

## 4. API CONTRACT

Base URL: http://localhost:5001/api
Authentication: Authorization: Bearer <JWT> on all protected routes
Response Format: { success: boolean, data?: any, message?: string, errors?: object }

### AUTH ENDPOINTS

POST   /auth/register        No auth  - Register with name, email, password
POST   /auth/login           No auth  - Login and receive JWT
POST   /auth/logout          No auth  - Stateless logout confirmation
GET    /auth/me              Auth     - Get current authenticated user profile
PUT    /auth/profile         Auth     - Update display name
PUT    /auth/change-password Auth     - Change password (requires current password)
POST   /auth/forgot-password No auth  - Send password reset email
POST   /auth/reset-password  No auth  - Reset password with token from email
POST   /auth/google-login    No auth  - Exchange Google credential for JWT

POST /auth/register
  Request:  { "name": "Sagar S", "email": "sagar@example.com", "password": "securepass123" }
  Response 201: { "success": true, "data": { "token": "eyJ...", "user": { "id": "uuid", "name": "Sagar S", "role": "USER" } } }
  Error 400: { "success": false, "message": "Validation failed", "errors": { "email": "Email already registered" } }

POST /auth/login
  Request:  { "email": "sagar@example.com", "password": "securepass123" }
  Response 200: { "success": true, "data": { "token": "eyJ...", "user": { ... } } }
  Error 401: { "success": false, "message": "Invalid email or password" }

### AUCTION ENDPOINTS

GET    /auctions             Auth  - List all auctions (optional ?search=keyword)
GET    /auctions/active      Auth  - Get current live centerpiece auction
GET    /auctions/:id         Auth  - Get single auction details
POST   /auctions             Auth  - Create new auction listing
PUT    /auctions/:id         Auth  - Update own auction (title, desc, price, currency)
DELETE /auctions/:id         Auth  - Delete own auction
GET    /auctions/my-auctions Auth  - Get all auctions created by current user

POST /auctions
  Request: {
    "title": "Vintage Omega Seamaster 1968",
    "description": "Pristine condition, original crown.",
    "image_url": "https://example.com/watch.jpg",
    "starting_price": 12000,
    "currency": "USD",
    "start_time": "2026-08-26T10:00:00Z",
    "end_time": "2026-08-26T14:00:00Z"
  }
  Response 201: { "success": true, "data": { "id": "uuid", "current_price": 12000, "status": "UPCOMING" } }
  Error 400: { "success": false, "message": "title, starting_price, and end_time are required" }

### BID ENDPOINTS

POST   /bids                  Auth  - Place a new bid (CRITICAL CONCURRENCY ENDPOINT)
GET    /bids/auction/:id      Auth  - Get all bids for a specific auction
GET    /bids/my-bids          Auth  - Get all bids placed by current user
GET    /bids/stats            Auth  - Get user bid statistics (counts)

POST /bids (critical endpoint)
  Request: { "auction_id": "uuid", "amount": 13500 }
  Response 201: { "success": true, "message": "Bid placed successfully!", "data": { "id": "bid-uuid", "amount": 13500 } }
  Error 400 (too low): { "success": false, "message": "Your bid must be strictly higher than $13,000." }
  Error 400 (ended):   { "success": false, "message": "This auction has already ended." }
  Error 404:           { "success": false, "message": "Auction item not found." }

### NOTIFICATION ENDPOINTS

GET    /notifications         Auth  - Get all notifications for current user
POST   /notifications/read    Auth  - Mark all notifications as read

### HEALTH ENDPOINT

GET    /health                No auth - Returns DB connection statuses
  Response: { "status": "ok", "services": { "postgresql": "connected", "mongodb": "connected", "redis": "connected" } }

---

## 5. REDIS USAGE PLAN

Redis is fully connected at server boot via config/db.js:
  redisClient = createClient({ url: process.env.REDIS_URL })

### Usage 1: Hot Read Caching (GET /auctions/active)

Most queried endpoint — every dashboard load hits it. Cache-aside pattern:

  1. Check Redis for key 'auction:active'
  2. If cache hit: return cached JSON immediately
  3. If cache miss: query PostgreSQL, store in Redis with 15-second TTL
  4. On bid placed successfully: DEL 'auction:active' to invalidate

TTL Strategy: 15 seconds for live auction (freshness vs DB load balance)
              60-300 seconds for static listings catalog

### Usage 2: Distributed Lock (Future Enhancement)

Per auction_id Redis lock to prevent simultaneous bid processing:
  Key: lock:auction:{auction_id}
  SET lock NX EX 5  (Set if Not eXists, expires in 5s)
  If lock not acquired: return 429 "Auction busy, retry"
  After transaction: DEL lock key

### Usage 3: Rate Limiting on POST /bids

Per user bid rate limiting:
  Key: ratelimit:bid:{userId}
  INCR counter, EXPIRE 60 seconds
  If count > 10: return 429 "Too many bids. Slow down."

---

## 6. CONCURRENCY SOLUTION — THE CORE CHALLENGE

### The Race Condition Problem

Without protection:
  T1: User A reads current_price = $500
  T2: User B reads current_price = $500
  T1: A validates 510 > 500 → PASSES
  T2: B validates 510 > 500 → PASSES (BOTH PASS simultaneously!)
  T1: A inserts bid $510, updates price = $510
  T2: B inserts bid $510, updates price = $510 (silent data corruption)

### The Solution: SELECT FOR UPDATE Inside a PostgreSQL Transaction

Full transaction sequence in bidController.js:

  BEGIN;
  
  SELECT id, current_price, start_time, end_time, created_by, title
  FROM auctions WHERE id = $1
  FOR UPDATE;           ← KEY: acquires exclusive row lock
                           All other transactions for same auction_id
                           BLOCKED here until this COMMIT/ROLLBACK
  
  Validate:
    - auction exists (else ROLLBACK + 404)
    - now >= start_time (else ROLLBACK + 400)
    - now < end_time (else ROLLBACK + 400)
    - bidAmount > currentPrice (else ROLLBACK + 400)
  
  INSERT INTO bids (auction_id, user_id, amount) VALUES ($1, $2, $3);
  
  UPDATE auctions SET current_price = $1, updated_at = NOW() WHERE id = $2;
  
  INSERT notification for auction creator;
  SELECT previous highest bidder (OFFSET 1);
  INSERT outbid notification for previous bidder;
  
  COMMIT;   ← lock released here, next waiting transaction unblocks

  client.release();   ← always return connection to pool

What this guarantees:
  - Only ONE bid transaction active per auction row at any time
  - current_price check always sees the latest committed value
  - Concurrent bids serialize: second bid either succeeds (if higher) or fails clearly
  - Any failure at any step: full ROLLBACK, no partial state

Actual code (simplified from bidController.js):

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT ... FROM auctions WHERE id = $1 FOR UPDATE', [auction_id]
    );
    // ... validations with ROLLBACK on failure ...
    await client.query('INSERT INTO bids ...', [...]);
    await client.query('UPDATE auctions SET current_price = $1 ...', [...]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

---

## 7. SECURITY APPROACH

### Authentication & Authorization

- JWT signed with JWT_SECRET from environment variables, 7-day expiry
- Google OAuth 2.0: backend verifies credential with Google, issues own JWT
- requireAuth middleware: verify signature + PostgreSQL user existence + status check
- Ownership guards: DELETE/PUT check created_by = $userId in SQL itself

### Password Security

- bcrypt hash (cost factor 12) — never store plain text
- Reset token: crypto.randomBytes(32).toString('hex')
- Reset token stored hashed in DB, expires after 1 hour

### Input Validation & Injection Prevention

- All PostgreSQL queries use parameterized queries ($1, $2...) — SQL injection impossible
- Server-side validation on all inputs (never trust frontend)
- express.json({ limit: '10mb' }) prevents payload size attacks
- CORS restricted to configured CORS_ORIGIN env var

### Environment Variables (never hardcoded)

DATABASE_URL, REDIS_URL, MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS,
GOOGLE_CLIENT_ID, CORS_ORIGIN — all in .env, covered by .gitignore

---

## 8. NOTIFICATION SYSTEM

### Trigger Events

Event                   | Recipients         | Message
------------------------|--------------------|-----------------------------------------
New auction created     | ALL users          | "New item '{title}' listed at {price}"
Bid placed              | Auction creator    | "A new bid of {amount} placed on '{title}'"
Bid placed (outbid)     | Previous top bidder| "You have been outbid on '{title}'"

All notification INSERTs happen inside the same PostgreSQL transaction as the bid —
so if the bid fails, no notifications are sent (atomic consistency).

### Frontend Polling

Frontend polls GET /api/notifications every 10 seconds.
Unread count shown as badge on bell icon.
Opening dropdown triggers POST /notifications/read (mark all read).

---

## 9. KNOWN LIMITATIONS & TRADE-OFFS

Limitation                 | Current State          | Better Solution
---------------------------|------------------------|---------------------------
Real-time bidding          | 10s polling            | WebSocket (Socket.IO)
Redis caching              | Connected, not wired   | Cache-aside on active auction
Rate limiting              | Designed, not wired    | express-rate-limit or Redis
Email uses localhost URL   | Points to localhost    | APP_URL env var for production
No pagination              | Returns all rows       | LIMIT + OFFSET or cursor pagination
MongoDB not written        | Connected only         | Wire auction_events inserts
Notification loop INSERT   | Loop per user          | Bulk INSERT or message queue
No image upload            | External URL required  | Cloudinary / S3 presigned URLs
No admin panel             | Role exists in DB      | Admin CRUD routes
No auction categories      | Flat catalog           | Category column + filter UI

---

## 10. SCALABILITY PLAN (100x Traffic)

### Architecture Changes

  Load Balancer (NGINX / AWS ALB)
       |             |
  App Node 1    App Node 2    ...N instances (stateless JWT = any node handles any request)
       |             |
  PgBouncer Connection Pooler (port 6432)
       |
  PostgreSQL Cluster (Primary writes + Read Replicas for SELECT queries)
  
  Redis Cluster (sharded keys, Redis Sentinel for HA)
  MongoDB Sharding (shard by actor_id for write distribution)

### Specific Strategies

1. Stateless app nodes — JWT auth, no server sessions
2. PgBouncer — prevents DB connection exhaustion (PostgreSQL max_connections ~100-200)
3. Read replicas — route all SELECT to replicas, writes to primary only
4. Redis Cluster — shard across multiple Redis nodes
5. Bid rate limiting — token bucket per user in Redis
6. CDN for static assets — frontend bundle from CloudFront/Cloudflare
7. BullMQ message queue — replace notification loop with async queue workers
8. Database indexes — already in place on email, auction_id, user_id, notifications

---

## 11. LOCAL SETUP GUIDE

Prerequisites: Node.js v20+, Docker Desktop, npm v10+

Step 1: Clone & Install
  git clone https://github.com/Sagarspoojary/Bidora.git
  cd Bidora
  cd server && npm install
  cd ../client && npm install

Step 2: Configure Environment
  cd server
  cp ../.env.example .env
  # Edit .env with your values

Required .env:
  DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5433/bidora
  REDIS_URL=redis://localhost:6379
  MONGODB_URI=mongodb://localhost:27017/bidora
  JWT_SECRET=your-very-strong-secret-here
  EMAIL_USER=your-gmail@gmail.com
  EMAIL_PASS=your-gmail-app-password
  GOOGLE_CLIENT_ID=your-google-oauth-client-id
  CORS_ORIGIN=http://localhost:5173
  PORT=5001

Step 3: Start Docker Databases
  docker-compose up -d
  # Starts PostgreSQL:5433, Redis:6379, MongoDB:27017

Step 4: Run Database Migrations
  cd server
  node --env-file=.env src/db/migrate.js

Step 5: Start Backend
  npm run dev
  # Runs on http://localhost:5001

Step 6: Start Frontend
  cd client && npm run dev
  # Runs on http://localhost:5173

---

## 12. FLOW DIAGRAMS

### 12A. User Registration Flow

  Fill Register Form
    → POST /api/auth/register
    → Validate: name≥2, email format, email unique, password≥6
    → bcrypt.hash(password, 12)
    → INSERT INTO users
    → generateToken({ id, role })
    → Return { token, user }
    → Store token in localStorage
    → Redirect to #/dashboard

### 12B. Bid Placement Flow (Concurrency-Safe)

  User enters bid → clicks "Place Bid"
    → Client guard: amount > current_price
    → POST /api/bids { auction_id, amount }
    → requireAuth: verify JWT → SELECT user → check status=ACTIVE
    → pgPool.connect() (dedicated connection)
    → BEGIN TRANSACTION
    → SELECT * FROM auctions WHERE id=$1 FOR UPDATE  ← row LOCKED
         (concurrent bids BLOCKED here)
    → Validate: exists / timing / amount > current_price
    → INSERT INTO bids
    → UPDATE auctions SET current_price = amount
    → INSERT notification → creator
    → SELECT prev highest bidder (OFFSET 1)
    → INSERT outbid notification
    → COMMIT  ← lock released
    → client.release()
    → Response 201 { success: true }

### 12C. Winner Detection Flow

  Auction end_time passes
    → formatAuctionRow() dynamically calculates status = "ENDED"
    → Creator opens Manage modal
    → GET /api/bids/auction/:id
    → Returns bids ORDER BY amount DESC with bidder name + email
    → Frontend detects status === "ENDED"
    → Renders Winner Contact Details panel (creator-only, inside Manage modal):
         Name:  John Doe
         Email: john@example.com
         Winning Bid: $15,200

### 12D. Password Reset Flow

  Click "Forgot Password"
    → POST /api/auth/forgot-password { email }
    → Lookup user by email
    → crypto.randomBytes(32).toString('hex') → rawToken
    → bcrypt.hash(rawToken, 10) → hashedToken
    → UPDATE users SET reset_token=hashedToken, reset_token_expires=now+1hr
    → Send email via Gmail SMTP:
         Link: http://localhost:5173/#/reset-password?token=<rawToken>
    → User clicks link in email
    → App.jsx detects #/reset-password in URL hash → preserves it (no redirect)
    → Auth.jsx detects hash → shows Reset Password form
    → POST /api/auth/reset-password { token, newPassword }
    → SELECT user WHERE reset_token_expires > NOW()
    → bcrypt.compare(token, stored_hash)
    → bcrypt.hash(newPassword, 12)
    → UPDATE users SET password_hash=newHash, reset_token=NULL
    → Response 200: "Password reset successful"

---

## TECH STACK SUMMARY

Layer          | Technology              | Purpose
---------------|-------------------------|----------------------------------
Frontend       | React.js 19 + Vite 8   | SPA with hash routing
Animations     | Framer Motion           | Hover/page/card animations
Backend        | Node.js 20 + Express 5  | HTTP API server
Primary DB     | PostgreSQL 15           | Transactional auction/bid data
Secondary DB   | MongoDB 6.0             | Audit logs, activity history
Cache/Lock     | Redis 7                 | Hot reads, rate limiting, locks
Auth           | JWT (jsonwebtoken)      | Stateless authentication
OAuth          | @react-oauth/google     | Google Sign-In
Password       | bcrypt (cost 12)        | Secure password hashing
Email          | Nodemailer + Gmail SMTP | Password reset emails
Containers     | Docker + docker-compose | Local DB infrastructure
Version Control| GitHub                  | https://github.com/Sagarspoojary/Bidora

---

Document for 2-Day System Design & Build Challenge — Bidora Online Auction Platform
Last updated: August 2026
