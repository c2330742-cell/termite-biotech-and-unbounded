import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '@chronosend/shared';

const BCRYPT_COST = 12;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// ─── Password hashing ────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Access tokens (short-lived, 15min) ──────────────────────────────────────
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    config.jwtAccessSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtAccessSecret) as jwt.JwtPayload;
  return {
    userId: decoded.userId as string,
    email: decoded.email as string,
    role: decoded.role as string,
  };
}

// ─── Refresh tokens (long-lived, 7d) ─────────────────────────────────────────
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    config.jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtRefreshSecret) as jwt.JwtPayload;
  return {
    userId: decoded.userId as string,
    email: decoded.email as string,
    role: decoded.role as string,
  };
}

// ─── Token hashing for DB storage ────────────────────────────────────────────
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
