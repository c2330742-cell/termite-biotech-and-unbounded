# ChronoSend

**Schedule messages. Send anywhere. One place.**

ChronoSend is a unified scheduled message sender. Compose a message, choose a recipient, pick a target platform, and set a future date and time. The app sends the message automatically when the time arrives across Telegram, Email, SMS, and WhatsApp — all from a single dashboard on desktop and mobile (PWA).

## Features

-   **Multi-Platform Scheduling** — Telegram, Email (Gmail SMTP), SMS (Twilio), WhatsApp (Twilio or Baileys)
-   **Repeat Rules** — Once, daily, weekly, monthly
-   **Real-Time Updates** — WebSocket-based status updates as messages send or fail
-   **Dashboard** — At-a-glance view of pending, sent, and failed messages
-   **Settings** — Per-user encrypted credential storage (AES-256-GCM)
-   **Admin Panel** — System health dashboard, user management, delivery stats
-   **PWA** — Installable on mobile and desktop, offline-capable
-   **Dark Mode** — Light/dark theme with system preference detection

## Tech Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, PWA         |
| Backend       | Node.js 20+, Express 4, TypeScript                               |
| Database      | PostgreSQL 15, Prisma 7 ORM                                      |
| Auth          | JWT (access + refresh tokens), bcrypt                            |
| Real-time     | Native WebSocket (ws library)                                    |
| Scheduler     | node-cron + in-process job queue                                 |
| Encryption    | AES-256-GCM (Node.js crypto)                                     |
| Validation    | Zod (shared between frontend and backend)                        |
| Container     | Docker + Docker Compose                                          |
| CI/CD         | GitHub Actions                                                   |

## Getting Started

### Prerequisites

-   Node.js 20+
-   PostgreSQL 15
-   Docker & Docker Compose (optional)

### Quick Start (Docker)

```bash
# Clone the repository
git clone <repo-url> chronosend
cd chronosend

# Copy environment file
cp .env.example .env
# Edit .env with your secrets

# Start all services
docker compose up -d

# Run migrations
docker compose exec server npm run migrate

# Seed dev data
docker compose exec server npm run seed
```

### Manual Setup

```bash
# Install dependencies
npm install

# Build shared package
npm run build -w packages/shared

# Set up environment
cp .env.example .env
# Edit DATABASE_URL and secrets in .env

# Run database migrations
npm run migrate

# Seed development data (creates admin user)
npm run seed

# Start development servers
npm run dev
# Server: http://localhost:4000
# Web:    http://localhost:5173
```

## Project Structure

```
chronosend/
├── apps/
│   ├── web/              # Vite TypeScript PWA frontend
│   └── server/           # Express TypeScript API backend
├── packages/
│   └── shared/           # Shared types, schemas, constants
├── docker/               # Dockerfiles and configs
├── .github/workflows/    # CI/CD pipelines
└── docker-compose.yml    # Local dev environment
```

## API Endpoints

Base URL: `/api/v1`

### Auth
-   `POST /auth/register` — Create account
-   `POST /auth/login` — Login
-   `POST /auth/refresh` — Refresh access token
-   `POST /auth/logout` — Logout
-   `GET /auth/me` — Get current user

### Messages (auth required)
-   `GET /messages` — List messages (paginated, filterable)
-   `POST /messages` — Create scheduled message
-   `GET /messages/:id` — Get message details
-   `PATCH /messages/:id` — Update pending message
-   `DELETE /messages/:id` — Cancel message
-   `GET /messages/stats` — Dashboard statistics

### Settings (auth required)
-   `GET /settings` — Get credentials (redacted)
-   `PUT /settings` — Save credentials
-   `PUT /settings/timezone` — Update timezone
-   `POST /settings/test/:platform` — Test platform credentials

### Admin (auth + admin role required)
-   `GET /admin/users` — List users with counts
-   `GET /admin/messages` — List all messages
-   `GET /admin/health` — System health
-   `DELETE /admin/users/:id` — Delete user

### Health
-   `GET /api/health` — Public health check

## Testing

```bash
# Backend tests
npm run test:server

# Frontend tests
npm run test:web

# E2E tests
npm run test:e2e

# All tests
npm test
```

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a comprehensive guide covering:

- Production Docker Compose with secrets, health checks, and internal networking
- Manual deployment (PM2 + nginx)
- Database migrations in production
- Hosting platform guides (Railway, Render, AWS, Fly.io, DO Apps)
- Monitoring, logging, and security checklist

## Security

-   Passwords hashed with bcrypt (cost 12)
-   Platform credentials encrypted with AES-256-GCM at rest
-   JWTs with short-lived access tokens (15 min) + refresh tokens (7 days)
-   Refresh tokens stored as hashes in database
-   httpOnly, SameSite=Strict, Secure cookies
-   CORS restricted to known origins
-   Helmet security headers
-   Rate limiting on all endpoints
-   Input validation with Zod
-   Parameterized SQL queries (no injection)
-   RBAC for admin routes

## License

MIT
