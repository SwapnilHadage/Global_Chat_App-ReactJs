# Global Chat App

A real-time public chat application built with React, Redux Toolkit, Tailwind CSS, Express, and Socket.IO.

Users can choose a username, join a shared chat room, send messages, see online users, and receive live typing and join/leave updates.

## Tech Stack

### Frontend

- React
- Vite
- Redux Toolkit
- Tailwind CSS
- Socket.IO Client

### Backend

- Node.js
- Express
- Socket.IO
- CORS
- dotenv

## Project Structure

```text
ChatApp/
  backend/
    server.js
    utils/
  frontend/
    public/
    socket/
    src/
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Backend Setup

```bash
cd backend
npm install
npm start
```

By default, the backend runs on:

```text
http://localhost:4600
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. It is usually:

```text
http://localhost:5173
```

## Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=4600
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create a `.env` file inside `frontend/`:

```env
VITE_SERVER_URL=http://localhost:4600
```

## Available Scripts

### Backend

```bash
npm start
```

Starts the Express and Socket.IO server.

### Frontend

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Builds the frontend for production.

```bash
npm run lint
```

Runs ESLint for the frontend.

## Features

- Username-based chat entry
- Real-time public messaging
- Online users list
- Typing indicators
- Join and leave notifications
- Light and dark theme support
- Local chat clearing

## Health Check

The backend provides a basic health endpoint:

```text
GET /health
```

## Notes

- Messages are not stored permanently.
- Online users are tracked in server memory.
- This project currently uses a single shared public chat room.
