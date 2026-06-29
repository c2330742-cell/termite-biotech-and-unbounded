import path from 'path';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { config } from './config';
import prisma from './db/client';
import { runSetupSql } from './db/runSetupSql';
import { initWsManager } from './services/websocket';
import { startScheduler } from './services/scheduler';
import { errorHandler } from './api/middleware/errorHandler';
import { sanitizeInput } from './api/middleware/sanitize';
import healthRoutes from './api/routes/health';
import authRoutes from './api/routes/auth';
import oauthRoutes from './api/routes/oauth';
import messagesRoutes from './api/routes/messages';
import settingsRoutes from './api/routes/settings';
import adminRoutes from './api/routes/admin';
import {
  RATE_LIMIT_AUTH_WINDOW_MS,
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_DEFAULT_WINDOW_MS,
  RATE_LIMIT_DEFAULT_MAX,
  API_BASE,
} from '@chronosend/shared';

async function main(): Promise<void> {
  const app = express();
  const server = http.createServer(app);

  // ─── Global Middleware ────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles CSP in dev
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: config.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  if (!config.isTest) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  // ─── Rate Limiters ────────────────────────────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_AUTH_WINDOW_MS,
    max: RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  });

  const defaultLimiter = rateLimit({
    windowMs: RATE_LIMIT_DEFAULT_WINDOW_MS,
    max: RATE_LIMIT_DEFAULT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  });

  // ─── Apex → www redirect (production) ─────────────────────────────────────
  app.use((req, res, next) => {
    const host = req.headers.host || '';
    if (config.isProduction && host === 'chronosend.hexname.com') {
      return res.redirect(301, `https://www.chronosend.hexname.com${req.originalUrl}`);
    }
    next();
  });

  // ─── CSRF Protection ───────────────────────────────────────────────────────
  const CSRF_COOKIE = 'csrf-token';
  app.use((req, res, next) => {
    // Generate CSRF token if not present
    if (!req.cookies[CSRF_COOKIE]) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,  // Must be readable by JS
        sameSite: 'strict',
        secure: config.isProduction,
        maxAge: 86400000, // 24h
      });
    }

    // Validate CSRF for state-changing methods on API routes
    if (req.path.startsWith('/api') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const headerToken = req.headers['x-csrf-token'] as string;
      const cookieToken = req.cookies[CSRF_COOKIE];
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        res.status(403).json({ success: false, error: 'CSRF token mismatch' });
        return;
      }
    }

    next();
  });

  // ─── Routes ────────────────────────────────────────────────────────────────
  // Public health (no rate limit)
  app.use('/api', healthRoutes);

  // Auth routes (stricter rate limit)
  app.use(`${API_BASE}/auth`, authLimiter, authRoutes);
  app.use(`${API_BASE}/auth`, authLimiter, oauthRoutes);

  // Protected routes
  app.use(`${API_BASE}/messages`, defaultLimiter, messagesRoutes);
  app.use(`${API_BASE}/settings`, defaultLimiter, settingsRoutes);
  app.use(`${API_BASE}/admin`, defaultLimiter, adminRoutes);

  // ─── Error Handler (must be last) ─────────────────────────────────────────
  app.use(errorHandler);

  // ─── Static Files (Production) ─────────────────────────────────────────────
  if (config.isProduction) {
    const webDist = path.resolve(__dirname, '../../web/dist');
    app.use(express.static(webDist));
    // SPA fallback — only for non-API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(webDist, 'index.html'), (err) => { if (err) next(err); });
    });
  }

  // ─── WebSocket Server ─────────────────────────────────────────────────────
  const wsManager = initWsManager(server);

  // ─── Scheduler ────────────────────────────────────────────────────────────
  if (!config.isTest) {
    startScheduler();
  }

  // ─── Database Setup ───────────────────────────────────────────────────────
  try {
    await runSetupSql();
  } catch (err) {
    console.warn('[server] Supplementary SQL setup warning:', (err as Error).message);
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  server.listen(config.port, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║          ChronoSend Server              ║
  ║──────────────────────────────────────────║
  ║  Port:    ${String(config.port).padEnd(35)}║
  ║  Env:     ${config.nodeEnv.padEnd(35)}║
  ║  API:     http://localhost:${config.port}${API_BASE}  ║
  ║  WS:      ws://localhost:${config.port}/ws            ║
  ╚══════════════════════════════════════════╝
    `);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async () => {
    console.log('\n[server] Shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[server] Connections closed');
      process.exit(0);
    });
    // Force close after 10s
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
