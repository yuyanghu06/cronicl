# Cronicl Backend

Minimal auth service for Cronicl - handles Google OAuth, JWT sessions, and optional AI proxy.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

3. Run migrations:
```bash
npm run db:push
```

4. Start dev server:
```bash
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/auth/google/start` | GET | Start Google OAuth flow |
| `/auth/google/callback` | GET | OAuth callback |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Logout (revoke tokens) |
| `/me` | GET | Get current user (auth required) |
| `/api/generate/text` | POST | AI text generation proxy (auth required) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Yes | OAuth callback URL |
| `FRONTEND_URL` | No | Frontend URL (default: http://localhost:5173) |
| `PORT` | No | Server port (default: 3000) |
| `GEMINI_API_KEY` | No | Gemini API key for AI proxy |
