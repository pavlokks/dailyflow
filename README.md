# DailyFlow

DailyFlow is a MERN-stack coursework project.

## Tech Stack

- MongoDB + Mongoose
- Express.js
- React + Vite
- Node.js
- dotenv

## Project Structure

```text
DailyFlow/
  client/
    src/
      components/
      context/
      pages/
      services/
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
```

## Getting Started

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Create `.env` files from the examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update `server/.env` if your MongoDB connection string is different:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dailyflow
```

### 3. Run the backend

```bash
cd server
npm run dev
```

The API will run at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 4. Run the frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend will run at the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Notes

Authentication is intentionally not implemented yet.
