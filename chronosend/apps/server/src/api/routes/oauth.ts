import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../../db/client';
import { config } from '../../config';

const router = Router();

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

// POST /api/v1/auth/google — verify Google ID token and login/register
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ success: false, error: 'Missing credential' });
      return;
    }

    if (!config.googleClientId) {
      console.error('[oauth] GOOGLE_CLIENT_ID is not set on the server');
      res.status(500).json({ success: false, error: 'Google Sign-In is not configured on the server (GOOGLE_CLIENT_ID missing)' });
      return;
    }

    const client = new OAuth2Client(config.googleClientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });
    } catch (verifyErr: any) {
      console.error('[oauth] Token verification failed:', verifyErr?.message);
      res.status(401).json({
        success: false,
        error: `Google token verification failed: ${verifyErr?.message || 'Unknown error'}. Make sure the Authorized JavaScript origins in Google Cloud Console include your current domain.`,
      });
      return;
    }

    const payload = ticket.getPayload() as GoogleTokenPayload | undefined;
    if (!payload || !payload.email) {
      res.status(401).json({ success: false, error: 'Google token payload missing email' });
      return;
    }

    const { sub: googleId, email } = payload;

    // Look up existing OAuth link
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_provider_account_id: { provider: 'google', provider_account_id: googleId } },
      include: { user: true },
    });

    if (oauthAccount) {
      // Existing OAuth link — login as that user
      const accessToken = jwt.sign(
        { id: oauthAccount.user.id, email: oauthAccount.user.email, role: oauthAccount.user.role },
        config.jwtAccessSecret,
        { expiresIn: '15m' },
      );

      const refreshToken = jwt.sign(
        { id: oauthAccount.user.id },
        config.jwtRefreshSecret,
        { expiresIn: '7d' },
      );

      await prisma.refreshToken.create({
        data: {
          user_id: oauthAccount.user.id,
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
      });

      res.json({
        success: true,
        data: {
          accessToken,
          user: {
            id: oauthAccount.user.id,
            email: oauthAccount.user.email,
            role: oauthAccount.user.role,
          },
        },
      });
      return;
    }

    // No existing OAuth link — find or create user by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password_hash: null,
          role: 'user',
        },
      });
    }

    // Link OAuth account
    await prisma.oAuthAccount.create({
      data: {
        user_id: user.id,
        provider: 'google',
        provider_account_id: googleId,
      },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtAccessSecret,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwtRefreshSecret,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    console.error('[oauth] Google sign-in error:', err?.message || err);
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
});

export default router;
