# ChronoSend — Production Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Docker Compose (Recommended)](#docker-compose-recommended)
- [Manual Deployment](#manual-deployment)
- [Database Migrations](#database-migrations)
- [Hosting Platforms](#hosting-platforms)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Docker 24+** and **Docker Compose v2.20+**
- **Node.js 20** (only for manual deployment)
- **PostgreSQL 15** (managed service or self-hosted)
- A domain name with DNS pointed at your server (optional but recommended)

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | — | `development` | Set to `production` |
| `PORT` | — | `4000` | Internal server port |
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | **yes** | — | ≥32 chars, random (use `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | **yes** | — | ≥32 chars, different from access secret |
| `CREDENTIAL_ENCRYPTION_KEY` | **yes** | — | 64 hex chars (32 bytes), use `openssl rand -hex 32` |
| `CORS_ORIGIN` | **yes** | — | Frontend URL (e.g. `https://chronosend.example.com`) |
| `LOG_LEVEL` | — | `info` | `debug`, `info`, `warn`, `error`, `silent` |
| `VITE_API_URL` | — | `http://localhost:4000` | API URL for web build |
| `VITE_WS_URL` | — | `ws://localhost:4000` | WebSocket URL for web build |

### Docker Secrets

All sensitive variables support a `_FILE` variant that points to a mounted file (e.g. `JWT_ACCESS_SECRET_FILE=/run/secrets/jwt_access_secret`). When set, the file content overrides the environment variable. This is the **recommended approach** for Docker Compose and Docker Swarm deployments.

Generate secure secrets:

```bash
openssl rand -hex 32 > secrets/jwt_access_secret.txt
openssl rand -hex 32 > secrets/jwt_refresh_secret.txt
openssl rand -hex 32 > secrets/credential_encryption_key.txt
openssl rand -hex 16 > secrets/postgres_password.txt
chmod 600 secrets/*.txt
```

---

## Docker Compose (Recommended)

The production compose file uses Docker secrets, internal networks, health checks, and resource limits.

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> chronosend
cd chronosend

# 2. Generate secrets
mkdir -p secrets
openssl rand -hex 32 > secrets/jwt_access_secret.txt
openssl rand -hex 32 > secrets/jwt_refresh_secret.txt
openssl rand -hex 32 > secrets/credential_encryption_key.txt
openssl rand -hex 16 > secrets/postgres_password.txt
chmod 600 secrets/*.txt

# 3. Set required env vars
export CORS_ORIGIN=https://chronosend.example.com
export POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)

# 4. Start all services
docker compose -f docker-compose.prod.yml up -d

# 5. Run database migrations
docker compose -f docker-compose.prod.yml exec server node apps/server/dist/db/migrate.js

# 6. (Optional) Seed admin user
docker compose -f docker-compose.prod.yml exec server node apps/server/dist/db/seeds/seed.js

# 7. Check health
curl http://localhost:80/api/health
```

### Updating

```bash
git pull
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec server node apps/server/dist/db/migrate.js
```

### Stopping

```bash
docker compose -f docker-compose.prod.yml down
# To also remove the database volume:
docker compose -f docker-compose.prod.yml down -v
```

---

## Manual Deployment

### Server

```bash
# Build
npm ci
npm run build

# Set up env
cp .env.example .env
# Edit .env with production values

# Run migrations
npm run migrate

# Start with process manager
npm i -g pm2
pm2 start apps/server/dist/index.js --name chronosend-server
pm2 save
pm2 startup
```

### Web (Static Files)

```bash
# Build the frontend
npm run build -w packages/shared
npm run build -w apps/web

# Serve with any static file server (nginx, caddy, etc.)
# The built files are in apps/web/dist/
cp -r apps/web/dist /var/www/chronosend
```

Example nginx config for the web layer:

```nginx
server {
    listen 443 ssl http2;
    server_name chronosend.example.com;

    ssl_certificate /etc/letsencrypt/live/chronosend.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chronosend.example.com/privkey.pem;

    root /var/www/chronosend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Database Migrations

Migrations are managed through Prisma. The migration SQL files live in `apps/server/prisma/migrations/`.

### Production Migration

```bash
# Via Docker Compose
docker compose -f docker-compose.prod.yml exec server node apps/server/dist/db/migrate.js

# Manual
NODE_ENV=production node apps/server/dist/db/migrate.js
```

To create a new migration during development:

```bash
npm run migrate:dev -- --name describe_change
```

Then commit the generated SQL and run it in production.

---

## Hosting Platforms

### Railway (Recommended for Simplicity)

1. Create a new project from your Git repository.
2. Add a PostgreSQL plugin (Railway provides `DATABASE_URL`).
3. Set the build command: `npm run build`
4. Set the start command: `npm start`
5. Add all required env vars (see table above).
6. Deploy.

### Render

- **Web Service** — Point at `apps/server` with build command `npm run build` and start command `npm start`.
- **Static Site** — Point at `apps/web` with publish directory `dist`.
- Add a managed PostgreSQL database.

### AWS (ECS / Fargate)

1. Build and push Docker images to ECR.
2. Create an ECS task definition with the server and a sidecar nginx container.
3. Use RDS for PostgreSQL.
4. Use Secrets Manager for env vars.
5. Set up an Application Load Balancer in front.

### DigitalOcean App Platform

1. Connect your GitHub repo.
2. Add a PostgreSQL dev database.
3. Set build command: `npm run build`
4. Set run command: `npm start`
5. Configure env vars.

### Fly.io

```bash
fly launch
fly secrets set JWT_ACCESS_SECRET=... JWT_REFRESH_SECRET=...
fly postgres create
fly deploy
```

---

## Monitoring & Logging

### Health Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Public — returns `ok` if server is running |
| `GET /api/v1/admin/health` | Admin — DB status, queue depth, WS clients, memory |

### Docker Logging

```bash
# View logs for all services
docker compose -f docker-compose.prod.yml logs --tail=100 -f

# Specific service
docker compose -f docker-compose.prod.yml logs --tail=50 -f server
```

The production compose file limits log files to 3 × 10 MB per service via the `json-file` driver.

### Prometheus / Grafana (Optional)

The server exposes process-level metrics via `process.memoryUsage()` on the health endpoint. For full metrics, add:

1. `express-prom-bundle` or `prom-client` to the server.
2. Expose a `/metrics` endpoint.
3. Point Prometheus at it, then visualize in Grafana.

### Uptime Monitoring

Services like **UptimeRobot**, **Better Uptime**, or **Pingdom** can monitor:

- `https://chronosend.example.com/api/health` (HTTP 200 check)
- TLS certificate expiry

---

## Security Checklist

- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strong and different
- [ ] `CREDENTIAL_ENCRYPTION_KEY` is a 64-char hex string from `openssl rand -hex 32`
- [ ] `POSTGRES_PASSWORD` is strong
- [ ] Secrets are stored in Docker secrets or a secrets manager, never in env files
- [ ] HTTPS is enabled (Let's Encrypt / cloud LB)
- [ ] `CORS_ORIGIN` is set to the exact frontend domain
- [ ] Helmet security headers are active (enabled by default)
- [ ] Rate limiting is configured (enabled by default: 10/min auth, 60/min other)
- [ ] Database is not exposed to the public internet
- [ ] The `node` user is non-root inside containers
- [ ] Docker images use multi-stage builds (already configured)
- [ ] Production env has `NODE_ENV=production`
- [ ] Access logs are captured and rotated

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| Server returns 503 on health check | DB not ready or credentials wrong | Check `DATABASE_URL` and PostgreSQL logs |
| Web shows blank page | API URL mismatch or build failed | Verify `VITE_API_URL` was set during build |
| WebSocket disconnects | Missing proxy config for `/ws/` | Ensure nginx or LB upgrades the connection |
| "Secret file not found" | Docker secrets not mounted | Check `secrets/` directory and `docker-compose.yml` |
| Migration fails | Prisma schema doesn't match DB state | Run `prisma migrate diff` to diagnose |
| CORS errors in browser | `CORS_ORIGIN` doesn't match frontend URL | Set `CORS_ORIGIN` to the exact origin (no trailing slash) |
| Refresh token rejected | `JWT_REFRESH_SECRET` changed | Old tokens are invalid after secret rotation |
| Rate limiting too aggressive | High traffic or misconfigured proxy IP | Set `trust proxy` in Express if behind a reverse proxy |

---

## Architecture Overview

```
                          ┌──────────────┐
                          │   Browser /   │
                          │    PWA App    │
                          └──────┬───────┘
                                 │ HTTPS
                          ┌──────▼───────┐
                          │   Nginx      │  ← docker/Dockerfile.web
                          │  (static)    │
                          └──────┬───────┘
                    ────────┬────┘──────────────
                           /api/           /ws/
                    ┌──────▼───────┐  ┌──────▼───────┐
                    │   Express    │  │   WebSocket   │
                    │   Server     │  │   (ws)        │  ← docker/Dockerfile.server
                    └──────┬───────┘  └───────────────┘
                           │ SQL
                    ┌──────▼───────┐
                    │  PostgreSQL  │  ← postgres:15-alpine
                    └──────────────┘
```

All three services run on an isolated Docker network (`internal`). The database is not exposed to the host. The web nginx proxies `/api/` and `/ws/` requests to the server container.
