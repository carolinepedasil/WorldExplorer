# WorldExplorer Server

Backend API for WorldExplorer application built with Node.js, Express, TypeScript, and MongoDB.

## Features

- TypeScript
- Express.js REST API
- MongoDB with Mongoose
- GitHub OAuth authentication
- JWT authentication
- Passport.js integration
- Session management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env` file and update with your credentials
- Set up MongoDB Atlas database
- Create GitHub OAuth App and add credentials

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (protected)

### Health
- `GET /api/health` - Health check endpoint
