# DailyFlow AI

DailyFlow AI is a MERN-stack personal productivity assistant. It keeps authentication, focus tasks, calendar events, local weather and news in one workspace, then presents them as an AI-style daily brief for planning the next useful action.

The current assistant brief is powered by the app's own user context and productivity data, so it works without adding a paid AI provider. The structure is ready to extend later with an LLM API if needed.

## Features

- JWT authentication with register, login and protected routes
- Personal profile with city context for weather
- Focus task management with descriptions, priorities and deadlines
- Calendar event management
- Weather context from OpenWeather
- News brief from NewsAPI
- AI Assistant Brief dashboard card
- AI Task Generator with local template fallback
- Loading states and basic error handling on the client
- JSON 404/error responses on the server

## Tech Stack

- MongoDB + Mongoose
- Express.js
- React + Vite
- Node.js
- Axios
- dotenv

## Project Structure

```text
DailyFlow/
  client/
    src/
      components/
      hooks/
      pages/
      services/
      utils/
  server/
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

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dailyflow
JWT_SECRET=replace-with-your-secret
OPENWEATHER_API_KEY=replace-with-your-openweather-key
NEWS_API_KEY=replace-with-your-newsapi-key
```

Optional client API override:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the backend

```bash
cd server
npm run dev
```

The API runs at:

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

The frontend runs at the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Core API Areas

- `/api/auth` - register, login, current user, profile update
- `/api/tasks` - authenticated task CRUD
- `/api/events` - authenticated event CRUD
- `/api/weather` - weather for the user's profile city
- `/api/news` - latest news headlines
- `/api/ai/generate-tasks` - generate task suggestions from a user goal
- `/api/health` - service health check

## DailyFlow AI Concept

DailyFlow AI is positioned as a personal web assistant rather than a plain dashboard. The assistant brief combines existing project data into a productivity snapshot:

- how many tasks are still open
- how many tasks are complete
- what schedule context is coming next
- what the user should focus on first

This keeps the original MERN coursework functionality intact while making the product feel like an AI-powered productivity assistant.
