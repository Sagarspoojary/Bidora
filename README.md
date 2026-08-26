<div align="center">

# 🏛️ BIDORA
### Online Auction Platform

**A high-performance, concurrency-safe auction system built with MERN + PostgreSQL + Redis**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

*Every Bid. One Winner.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Concurrency Design](#-concurrency-design)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Health Check](#-health-check)
- [Key Design Decisions](#-key-design-decisions)
- [Known Limitations](#-known-limitations)

---

## 🌟 Overview

Bidora is a full-stack **real-time online auction platform** built as a system design implementation challenge. The project focuses on:

- **Transactional correctness** — every bid is atomic; no partial state ever reaches the database
- **Concurrency safety** — PostgreSQL row-level locking (`SELECT FOR UPDATE`) prevents race conditions when multiple users bid simultaneously
- **Multi-database architecture** — PostgreSQL for ACID-critical data, MongoDB for audit logs, Redis for caching and rate limiting
- **Real-time notifications** — users are alerted on new auctions, successful bids, and outbid events
- **Premium UI** — glassmorphism design system with Framer Motion animations

The full system design document is available in [`DESIGN_DOCUMENT.md`](./DESIGN_DOCUMENT.md).

---

## ✨ Features

### 🔐 Authentication
- Email & password registration / login with JWT
- Google OAuth 2.0 sign-in (`@react-oauth/google`)
- Secure password reset via email link (Nodemailer + Gmail SMTP)
- Bcrypt password hashing (cost factor 12)
- Account status management: `ACTIVE` · `SUSPENDED` · `DISABLED`

### 🏺 Auction Management
- Create auction listings with title, description, image URL, starting price, currency (USD / INR / EUR / GBP), start time, and end time
- Live auction status calculated dynamically: `UPCOMING` → `LIVE` → `ENDED`
- Featured centerpiece display for the currently live auction
- Search auctions by title or description (server-side `ILIKE`)
- Edit own auction metadata (price locked if bids exist)
- Delete own auction (cascades all associated bids)
- Winner contact details revealed to creator after auction ends

### 💰 Bidding System
- Place bids on live auctions with strict server-side validation
- Bid must be strictly greater than current price — enforced inside a DB transaction
- Concurrency-safe: `SELECT FOR UPDATE` row lock prevents simultaneous bid corruption
- Live bid history per auction with bidder information
- "My Bids" dashboard showing current winning/losing status per auction

### 🔔 Notifications
- Real-time (10-second polling) in-app notification bell
- Unread count badge on bell icon
- Triggered on: new auction listed, bid received on your auction, outbid event
- All notification inserts happen atomically inside the bid transaction

### 👤 Profile Management
- Update display name
- Change password (requires current password verification)
- Avatar display with fallback initials

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Frontend | React.js + Vite | 19 / 8 | Fast SPA with HMR dev server |
| Animations | Framer Motion | latest | Fluid page and card animations |
| Backend | Node.js + Express.js | 20 / 5 | Non-blocking I/O, minimal API framework |
| Primary DB | PostgreSQL | 15 | ACID transactions, row-level locking for bids |
| Secondary DB | MongoDB | 6.0 | Flexible schema for audit logs and activity |
| Cache / Lock | Redis | 7 | Hot read cache, rate limiting, distributed locks |
| Auth | jsonwebtoken | latest | Stateless JWT authentication |
| OAuth | @react-oauth/google | latest | Google Sign-In integration |
| Password | bcrypt | latest | Secure hashing with configurable cost factor |
| Email | Nodemailer | latest | Password reset email via Gmail SMTP |
| Containers | Docker + docker-compose | latest | One-command local infrastructure |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│               CLIENT (React.js + Vite)                  │
│   Hash routing · Framer Motion · Google OAuth           │
│   Glassmorphism UI · 10s notification polling           │
└──────────────────────────┬──────────────────────────────┘
                           │  Bearer JWT · fetch() API
┌──────────────────────────▼──────────────────────────────┐
│              API SERVER (Node.js + Express)              │
│   Port 5001                                             │
│                                                         │
│   /api/auth/*          authController.js                │
│   /api/auctions/*      auctionController.js             │
│   /api/bids/*          bidController.js                 │
│   /api/notifications/* notificationController.js        │
│   /api/health          health check                     │
│                                                         │
│   requireAuth middleware (JWT → DB user verification)   │
└───────┬──────────────────┬──────────────────┬───────────┘
        │                  │                  │
┌───────▼──────┐  ┌────────▼───────┐  ┌──────▼──────────┐
│ PostgreSQL 15 │  │  MongoDB 6.0   │  │    Redis 7       │
│  Port 5433    │  │  Port 27017    │  │    Port 6379     │
│               │  │                │  │                  │
│  users        │  │  auction_events│  │  Hot read cache  │
│  auctions     │  │  activity_logs │  │  Rate limiting   │
│  bids         │  │                │  │  Distributed lock│
│  notifications│  │  (connected &  │  │  (connected &    │
│               │  │   ready)       │  │   ready)         │
│  ACID + locks │  │                │  │                  │
└───────────────┘  └────────────────┘  └──────────────────┘
        │
┌───────▼─────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                        │
│   Gmail SMTP (Nodemailer) — password reset emails        │
│   Google OAuth 2.0     — social sign-in verification    │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Bidora/
├── docker-compose.yml          # PostgreSQL + MongoDB + Redis containers
├── .env.example                # Environment variable template
├── DESIGN_DOCUMENT.md          # Full system design document
│
├── server/                     # Express.js API
│   ├── package.json
│   └── src/
│       ├── app.js              # Entry point, middleware registration, server boot
│       ├── config/
│       │   └── db.js           # PostgreSQL pool, MongoDB, Redis connections
│       ├── controllers/
│       │   ├── authController.js        # register, login, OAuth, password reset
│       │   ├── auctionController.js     # CRUD for auctions
│       │   ├── bidController.js         # placeBid (SELECT FOR UPDATE), history
│       │   └── notificationController.js# get & mark-read notifications
│       ├── db/
│       │   └── migrate.js      # Schema migration script (run once)
│       ├── middleware/
│       │   ├── auth.js         # requireAuth JWT middleware
│       │   └── errorHandler.js # Global error formatter
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── auctionRoutes.js
│       │   ├── bidRoutes.js
│       │   ├── notificationRoutes.js
│       │   └── health.js
│       ├── services/
│       │   └── emailService.js # Nodemailer password reset email
│       └── utils/
│           └── jwt.js          # generateToken, verifyToken helpers
│
└── client/                     # React.js SPA (Vite)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Hash router, route definitions
        ├── App.css             # Full design system (glassmorphism, animations)
        ├── main.jsx            # React root mount
        ├── context/
        │   └── AuthContext.jsx # Global auth state, login/logout/profile actions
        ├── components/
        │   └── DashboardLayout.jsx  # Sidebar, header, notification bell
        ├── pages/
        │   ├── Auth.jsx        # Login, Register, ForgotPassword, ResetPassword
        │   ├── Dashboard.jsx   # Home with live auction centerpiece
        │   ├── AuctionArena.jsx# Live bidding interface
        │   ├── AuctionDetails.jsx  # Full auction detail view
        │   ├── Auctions.jsx    # Browsable catalog with search
        │   ├── CreateAuction.jsx   # New auction form
        │   ├── MyAuctions.jsx  # Manage own listings, see bids, winner
        │   ├── MyBids.jsx      # Bids placed by current user
        │   └── Profile.jsx     # Edit name, change password
        └── services/
            ├── auctionService.js
            ├── bidService.js
            ├── authService.js
            └── notificationService.js
```

---

## 🗄️ Database Schema

### PostgreSQL (Transactional Core)

```sql
-- UUIDs as primary keys throughout
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(100) NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  avatar_url          VARCHAR(512),
  role                VARCHAR(50)  NOT NULL DEFAULT 'USER',     -- USER | ADMIN
  status              VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | SUSPENDED | DISABLED
  reset_token         VARCHAR(255),                             -- bcrypt-hashed reset token
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

-- Auctions
CREATE TABLE auctions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(255)   NOT NULL,
  description     TEXT           NOT NULL,
  image_url       TEXT           NOT NULL,
  starting_price  NUMERIC(12,2)  NOT NULL,
  current_price   NUMERIC(12,2)  NOT NULL,  -- updated atomically on every accepted bid
  currency        VARCHAR(10)    DEFAULT 'USD',
  start_time      TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time        TIMESTAMP WITH TIME ZONE NOT NULL,
  status          VARCHAR(50)    NOT NULL DEFAULT 'ACTIVE',
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bids (immutable append-only log)
CREATE TABLE bids (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id  UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_user    ON bids(user_id);

-- Notifications
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT         NOT NULL,
  is_read     BOOLEAN      DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

### MongoDB (Audit / Activity — schema-less)

```js
// Collection: auction_events
{
  event_type: "BID_PLACED" | "AUCTION_CREATED" | "AUCTION_DELETED",
  actor_id:   "<user-uuid>",
  target_id:  "<auction-uuid>",
  metadata:   { bid_amount: 5200, currency: "INR", auction_title: "..." },
  created_at: ISODate
}

// Collection: user_activity_logs
{
  user_id:    "<user-uuid>",
  action:     "LOGIN" | "LOGOUT" | "PASSWORD_RESET" | "PROFILE_UPDATE",
  ip_address: "103.x.x.x",
  user_agent: "Mozilla/5.0...",
  timestamp:  ISODate
}
```

---

## 📡 API Reference

**Base URL:** `http://localhost:5001/api`  
**Auth header:** `Authorization: Bearer <token>` (required on all 🔒 routes)

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/auth/register` | — | Register with name, email, password |
| `POST` | `/auth/login` | — | Login, receive JWT |
| `POST` | `/auth/google-login` | — | Exchange Google OAuth credential for JWT |
| `POST` | `/auth/forgot-password` | — | Send password reset email |
| `POST` | `/auth/reset-password` | — | Reset password using token from email |
| `POST` | `/auth/logout` | — | Stateless logout acknowledgement |
| `GET`  | `/auth/me` | 🔒 | Get current user profile |
| `PUT`  | `/auth/profile` | 🔒 | Update display name |
| `PUT`  | `/auth/change-password` | 🔒 | Change password (requires current password) |

### Auctions

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/auctions` | 🔒 | List all auctions. Supports `?search=keyword` |
| `GET` | `/auctions/active` | 🔒 | Get the current live centerpiece auction |
| `GET` | `/auctions/my-auctions` | 🔒 | Get auctions created by current user |
| `GET` | `/auctions/:id` | 🔒 | Get a single auction by ID |
| `POST` | `/auctions` | 🔒 | Create a new auction listing |
| `PUT` | `/auctions/:id` | 🔒 | Update own auction metadata |
| `DELETE` | `/auctions/:id` | 🔒 | Delete own auction (cascades bids) |

**POST `/auctions` — Request body:**
```json
{
  "title": "Vintage Omega Seamaster 1968",
  "description": "Pristine condition. Original crown and bracelet.",
  "image_url": "https://example.com/watch.jpg",
  "starting_price": 12000,
  "currency": "USD",
  "start_time": "2026-08-26T10:00:00Z",
  "end_time": "2026-08-26T18:00:00Z"
}
```

**Auction Status** — calculated dynamically on every response, never stale in DB:
| Status | Condition |
|--------|-----------|
| `UPCOMING` | `now < start_time` |
| `LIVE` | `start_time <= now < end_time` |
| `ENDED` | `now >= end_time` |

### Bids

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/bids` | 🔒 | Place a bid (concurrency-safe, see below) |
| `GET` | `/bids/my-bids` | 🔒 | Get all bids placed by current user |
| `GET` | `/bids/stats` | 🔒 | Get bid statistics (counts) for current user |
| `GET` | `/bids/auction/:auctionId` | 🔒 | Get all bids for a specific auction |

**POST `/bids` — Request body:**
```json
{
  "auction_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 13500
}
```

**POST `/bids` — Response (201):**
```json
{
  "success": true,
  "message": "Bid placed successfully!",
  "data": {
    "id": "bid-uuid",
    "amount": 13500,
    "created_at": "2026-08-26T10:15:00Z"
  }
}
```

**POST `/bids` — Error responses:**
```json
{ "success": false, "message": "Your bid must be strictly higher than the current price of $13,000." }
{ "success": false, "message": "This auction has already ended." }
{ "success": false, "message": "Bidding has not started yet for this auction." }
{ "success": false, "message": "Auction item not found." }
```

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/notifications` | 🔒 | Get all notifications for current user |
| `POST` | `/notifications/read` | 🔒 | Mark all notifications as read |

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/health` | — | Returns connection status of all databases |

```json
{
  "status": "ok",
  "services": {
    "postgresql": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

## ⚡ Concurrency Design

### The Problem

In a naive implementation, two users bidding simultaneously causes a race condition:

```
Time →      User A                    User B
            reads current = $500      reads current = $500
            validates 510 > 500 ✓     validates 510 > 500 ✓  ← BOTH pass!
            inserts bid $510          inserts bid $510
            updates price = $510      updates price = $510    ← data corruption
```

### The Solution: `SELECT FOR UPDATE` + PostgreSQL Transaction

Every bid follows this atomic sequence in `bidController.js`:

```
BEGIN;

SELECT ... FROM auctions WHERE id = $1 FOR UPDATE;
         ↑
         Acquires exclusive row lock.
         Any concurrent bid on the same auction is BLOCKED here
         until this transaction COMMITs or ROLLBACKs.

-- Validate (reading the locked, always-fresh row):
✓ Auction exists
✓ now >= start_time  (not too early)
✓ now < end_time     (not expired)
✓ amount > current_price (strictly higher)

INSERT INTO bids (auction_id, user_id, amount);
UPDATE auctions SET current_price = $amount;

INSERT notification → auction creator;
INSERT notification → previous highest bidder (if outbid);

COMMIT;   ← lock released; next waiting bid transaction unblocks
```

**Guarantee:** Even under heavy concurrent load, bids serialize correctly. The second simultaneous bid will wait for the first to commit, then re-read the updated `current_price`. If it's no longer higher, it's rejected with a clear error message.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | v20+ | JavaScript runtime |
| [Docker Desktop](https://docker.com) | latest | Runs PostgreSQL, MongoDB, Redis |
| npm | v10+ | Package manager |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Sagarspoojary/Bidora.git
cd Bidora

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install

# 4. Configure environment variables
cd ..
cp .env.example server/.env
# Open server/.env and fill in all required values (see below)

# 5. Start all databases with Docker
docker-compose up -d

# 6. Run the database migration (one-time setup)
cd server
node --env-file=.env src/db/migrate.js

# 7. Start the backend server (new terminal)
npm run dev

# 8. Start the frontend (new terminal)
cd ../client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example server/.env
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | ✓ | `5001` | Express server port |
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `MONGODB_URI` | ✓ | — | MongoDB connection string |
| `REDIS_URL` | ✓ | — | Redis connection URL |
| `JWT_SECRET` | ✓ | — | Secret key for signing JWTs (use a long random string) |
| `CORS_ORIGIN` | ✓ | `http://localhost:5173` | Allowed frontend origin |
| `EMAIL_USER` | ✓ | — | Gmail address for sending reset emails |
| `EMAIL_PASS` | ✓ | — | Gmail App Password (16-character, not your Gmail password) |
| `GOOGLE_CLIENT_ID` | ✓ | — | Google OAuth 2.0 Client ID |

**Full `.env` example:**
```env
PORT=5001
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5433/bidora
MONGODB_URI=mongodb://localhost:27017/bidora
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-very-long-random-secret-key-here
CORS_ORIGIN=http://localhost:5173
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

> **Gmail App Password:** Go to your Google Account → Security → 2-Step Verification → App passwords. Generate one for "Mail".

---

## ▶️ Running the Application

### Start Databases (Docker)

```bash
docker-compose up -d
```

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL | `bidora-postgres` | `5433` |
| Redis | `bidora-redis` | `6379` |
| MongoDB | `bidora-mongodb` | `27017` |

Stop containers:
```bash
docker-compose down
```

### Backend Server

```bash
cd server
npm run dev        # Development with nodemon auto-reload
```

Runs at: `http://localhost:5001`

### Frontend Client

```bash
cd client
npm run dev        # Development with Vite HMR
```

Runs at: `http://localhost:5173`

### Database Migration

Run **once** after initial setup, or whenever the schema changes:

```bash
cd server
node --env-file=.env src/db/migrate.js
```

This creates all tables (`users`, `auctions`, `bids`, `notifications`) and indexes.

---

## 🏥 Health Check

Verify all services are running correctly:

```bash
curl http://localhost:5001/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "services": {
    "postgresql": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

## 💡 Key Design Decisions

### Why PostgreSQL for bids, not MongoDB?

Bids require strict ACID guarantees. The `SELECT FOR UPDATE` row lock and `BEGIN/COMMIT/ROLLBACK` pattern are PostgreSQL-native features that make concurrent bid safety straightforward. MongoDB's optimistic concurrency is harder to reason about under this kind of simultaneous-write pressure.

### Why MongoDB at all?

Audit logs and activity history are write-heavy, schema-less, and don't need relational joins. MongoDB's document model is a natural fit. It also fulfills the MERN stack requirement.

### Why Redis?

Three planned use cases:
1. **Hot cache** for `GET /auctions/active` — most frequently polled endpoint
2. **Distributed lock** per `auction_id` for even stronger concurrency guarantees at scale
3. **Rate limiting** on `POST /bids` to prevent bid flooding

Redis is fully connected at boot — the infrastructure is wired and ready.

### Why polling instead of WebSockets for notifications?

For a v1 system, 10-second polling is simple, reliable, and easy to debug. The trade-off is up to 10 seconds of notification delay. A WebSocket upgrade (Socket.IO) is the natural next step for true real-time updates.

### Auction status is never stored, always computed

The `status` column in the `auctions` table exists but is not relied on for display. Every API response computes the real status dynamically from `start_time`, `end_time`, and `NOW()`. This eliminates the need for cron jobs or status-update workers to flip auction states.

---

## ⚠️ Known Limitations

| Limitation | Better Solution |
|------------|----------------|
| 10-second notification polling | WebSocket (Socket.IO) for instant push |
| Redis connected but cache not wired on reads | Implement cache-aside on `GET /auctions/active` |
| No rate limiting middleware active | `express-rate-limit` or Redis token bucket on `POST /bids` |
| Email reset link hardcoded to `localhost` | `APP_URL` environment variable |
| No pagination on auction list | `LIMIT` + `OFFSET` with cursor-based pagination |
| MongoDB not actively written to yet | Wire `auction_events` inserts in controllers |
| Notification loop INSERT per user on create | Bulk INSERT or BullMQ message queue |
| No image upload (URL only) | Cloudinary or AWS S3 presigned URL upload |
| No admin panel | Admin CRUD routes for user management |

---

## 📄 License

MIT © 2026 Sagar S

---

<div align="center">

Built for the **2-Day System Design & Build Challenge**  
See [`DESIGN_DOCUMENT.md`](./DESIGN_DOCUMENT.md) for the full system design write-up

</div>
