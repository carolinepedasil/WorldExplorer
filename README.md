# 🌍 World Explorer (Global Travel and Tourism Planner)

World Explorer is a full-stack web application that helps travelers discover, organize, and plan trips around the world.  
It combines real-time event listings, personalized itinerary management, and a modern, responsive interface to make travel planning simple and enjoyable.

---

## ✨ Purpose

Many travelers spend hours switching between different websites to find interesting activities when visiting new places. World Explorer aims to bring everything together, helping users find local events, festivals, and tours, then organize them into an easy-to-manage travel itinerary.

---

## 🚀 Features

### 🧭 Core Features
- **Destination Search:** Find public events by city or country.  
- **Event Details:** View full information about events, including description, and date/time.  
- **Itinerary Management:** Create, update, and delete itineraries, organize events by date and location.  
- **User Authentication:** Secure sign-in using GitHub OAuth.  

### 🌟 Enhancements
- **Interactive Map View:** Display saved events on a map and get quick directions.  
- **Share & Export:** Share your favorite itineraries via link and export to calendar files (.ics).  

---

## 🧩 Architecture

World Explorer follows a client–server architecture:  
- **Frontend:** A single-page application (SPA) built with React.  
- **Backend:** RESTful API developed in Node.js and Express.  
- **Database:** MongoDB Atlas for storing users, itineraries, and event data. 

---

## 🛠️ Technologies

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, React Query, Axios, Zustand  
**Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB Atlas), Passport (GitHub OAuth), JWT  
**DevOps:** GitHub Actions, Vercel/Render for deployment  

---

## 📦 Project Structure

```
WorldExplorer/
├── client/                 # Next.js frontend application
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable React components
│   ├── lib/               # API client, utilities, and store
│   ├── package.json       # Frontend dependencies
│   └── .env.local         # Frontend environment variables
│
├── server/                # Node.js/Express backend API
│   ├── src/
│   │   ├── config/       # Configuration (Passport, etc.)
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── server.ts     # Server entry point
│   ├── package.json      # Backend dependencies
│   └── .env              # Backend environment variables
│
└── README.md             # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier available)
- GitHub OAuth App credentials

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `server/.env`:
   - Set your MongoDB Atlas connection string in `MONGODB_URI`
   - Add your GitHub OAuth credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
   - Update `JWT_SECRET` and `SESSION_SECRET` with secure random strings
   - Ensure `CLIENT_URL` points to your frontend (default: http://localhost:3000)

4. Run the backend development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `client/.env.local`:
   - `NEXT_PUBLIC_API_URL` should point to your backend API (default: http://localhost:5000/api)

4. Run the frontend development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### GitHub OAuth Setup

1. Go to GitHub Settings → Developer Settings → OAuth Apps → New OAuth App
2. Set the following:
   - **Application name**: WorldExplorer (or your choice)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
3. Copy the Client ID and Client Secret to your `server/.env` file

---

## 🔑 API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth flow
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current authenticated user

### Users
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users` - Get all users (protected)

### Health
- `GET /api/health` - API health check

---

## 🗣️ Favorite Quote

Caroline:
> "Logic will get you from A to B. Imagination will take you everywhere."  
> — Albert Einstein  

Joe:
> "Nothing is as permanent as a temporary solution that works"  
> — Russian Proverb 