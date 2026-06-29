import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../db/client';
import { authGuard } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, REFRESH_TOKEN_EXPIRY } from '@chronosend/shared';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareToken,
} from '../../services/auth';
import { config } from '../../config';

const router = Router();

// POST /auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password_hash: passwordHash, role: 'user' },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.isProduction,
      maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      path: '/api/v1/auth',
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (!user.password_hash) {
      res.status(401).json({ success: false, error: 'This account uses Google sign-in. Please sign in with Google.' });
      return;
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.isProduction,
      maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      path: '/api/v1/auth',
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, error: 'Refresh token not provided' });
      return;
    }

    // Verify JWT signature and expiry
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    // Find matching refresh token in DB
    const storedTokens = await prisma.refreshToken.findMany({
      where: { user_id: payload.userId },
    });

    let validToken = false;
    for (const stored of storedTokens) {
      if (await compareToken(token, stored.token_hash)) {
        validToken = true;
        // Delete the used token (rotation)
        await prisma.refreshToken.delete({ where: { id: stored.id } });
        break;
      }
    }

    if (!validToken) {
      res.status(401).json({ success: false, error: 'Refresh token has been revoked' });
      return;
    }

    // Issue new tokens
    const newPayload = { userId: payload.userId, email: payload.email, role: payload.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    const newTokenHash = await hashToken(newRefreshToken);

    await prisma.refreshToken.create({
      data: {
        user_id: payload.userId,
        token_hash: newTokenHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
      },
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.isProduction,
      maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      path: '/api/v1/auth',
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    console.error('[auth/refresh]', err);
    res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      // Delete all refresh tokens for this user
      try {
        const payload = verifyRefreshToken(token);
        await prisma.refreshToken.deleteMany({
          where: { user_id: payload.userId },
        });
      } catch {
        // Token may be expired; still clear the cookie
      }
    }

    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    console.error('[auth/logout]', err);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// GET /auth/me
router.get('/me', authGuard, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, role: true, created_at: true, updated_at: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

export default router;
