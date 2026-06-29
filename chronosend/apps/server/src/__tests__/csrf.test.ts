import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

function createCsrfApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  const CSRF_COOKIE = 'csrf-token';
  app.use((req, res, next) => {
    if (!req.cookies[CSRF_COOKIE]) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: 'strict',
        secure: false,
        maxAge: 86400000,
      });
    }

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

  app.get('/api/test', (_req, res) => res.json({ ok: true }));
  app.post('/api/test', (_req, res) => res.json({ ok: true }));
  app.post('/non-api', (_req, res) => res.json({ ok: true }));

  return app;
}

describe('CSRF Protection Middleware', () => {
  it('should set CSRF cookie on first request', async () => {
    const app = createCsrfApp();
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies[0] : (cookies as string);
    expect(cookieStr.startsWith('csrf-token=')).toBe(true);
  });

  it('should reject POST without CSRF token header', async () => {
    const app = createCsrfApp();
    const res = await request(app).post('/api/test');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CSRF token mismatch');
  });

  it('should reject POST with mismatched CSRF token', async () => {
    const app = createCsrfApp();
    const res = await request(app)
      .post('/api/test')
      .set('Cookie', 'csrf-token=abc123')
      .set('x-csrf-token', 'wrongtoken');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CSRF token mismatch');
  });

  it('should accept POST with matching CSRF token', async () => {
    const app = createCsrfApp();
    const token = crypto.randomBytes(32).toString('hex');
    const res = await request(app)
      .post('/api/test')
      .set('Cookie', `csrf-token=${token}`)
      .set('x-csrf-token', token);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should not require CSRF for GET requests', async () => {
    const app = createCsrfApp();
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
  });

  it('should not require CSRF for non-API routes', async () => {
    const app = createCsrfApp();
    const res = await request(app).post('/non-api');
    expect(res.status).toBe(200);
  });

  it('should not require CSRF for HEAD and OPTIONS', async () => {
    const app = createCsrfApp();
    const headRes = await request(app).head('/api/test');
    expect(headRes.status).toBe(200);

    const optionsRes = await request(app).options('/api/test');
    expect(optionsRes.status).toBe(200);
  });
});
