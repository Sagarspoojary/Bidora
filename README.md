# Bidora — Online Auction System

Bidora is a high-performance, single-item online auction system built as a robust system design implementation to showcase transactional correctness, concurrency safety, and real-time updates.

## Technology Stack

* **Frontend**: React.js (Vite)
* **Backend**: Node.js + Express.js
* **Primary Database**: PostgreSQL
* **Secondary Database**: MongoDB
* **In-Memory Cache**: Redis

---

## Requirements

Ensure you have the following installed on your host system:

* **Node.js** (v16+)
* **PostgreSQL**
* **MongoDB**
* **Redis**

---

## Environment Variables

Copy the example configuration to a local `.env` file in the server directory:

```bash
cp server/.env.example server/.env
```

### Variables:

* `PORT`: Port number for the backend Express server (default: `5000`)
* `DATABASE_URL`: PostgreSQL connection URI (e.g. `postgresql://user:password@localhost:5432/bidora`)
* `MONGODB_URI`: MongoDB connection URI (e.g. `mongodb://localhost:27017/bidora`)
* `REDIS_URL`: Redis server URL (e.g. `redis://localhost:6379`)
* `JWT_SECRET`: Secret key used for signing JSON Web Tokens
* `JWT_EXPIRES_IN`: JWT expiration length (e.g. `1d`)
* `CORS_ORIGIN`: Allowed origins for API requests (default: `http://localhost:5173`)

---

## Running the Application

### 1. Backend Server

Navigate to the `server/` directory, install packages, and start the development server:

```bash
cd server
npm install
npm run dev
```

The server runs on http://localhost:5000 by default.

### 2. Frontend client

Navigate to the `client/` directory, install packages, and start the dev environment:

```bash
cd client
npm install
npm run dev
```

The frontend launches on http://localhost:5173 by default.

---

## Verification & Health Check

The backend exposes a health check endpoint to inspect infrastructure connection status:

### Endpoint:
`GET http://localhost:5000/api/health`

### Example Response:
```json
{
  "success": true,
  "message": "Bidora API is running",
  "services": {
    "postgresql": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```
