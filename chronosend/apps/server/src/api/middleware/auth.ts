import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../../services/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or malformed authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    const message = (err as Error).name === 'TokenExpiredError'
      ? 'Access token expired'
      : 'Invalid access token';
    res.status(401).json({ success: false, error: message });
  }
}
