import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { API_BASE } from '@chronosend/shared';

// We'll test the auth route handlers directly via supertest
// Prisma is mocked in setup.ts

const app = express();
app.use(express.json());
app.use(cookieParser());

// Import routes after setting up app
import authRoutes from '../api/routes/auth';
app.use(`${API_BASE}/auth`, authRoutes);

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn().mockImplementation((pw: string) => Promise.resolve(pw === 'Correct1!')),
}));

// Mock the auth service
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'mock-jwt-token') {
      return { userId: 'user-1', email: 'test@test.com', role: 'user' };
    }
    if (token === 'admin-jwt-token') {
      return { userId: 'admin-1', email: 'admin@test.com', role: 'admin' };
    }
    if (token === 'expired-token') {
      throw new Error('TokenExpiredError');
    }
    throw new Error('Invalid token');
  }),
}));

// Import the mocked prisma
import prisma from '../db/client';
const mockPrisma = prisma as any;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-1',
        email: 'new@test.com',
        role: 'user',
        password_hash: '$2b$12$hashedpassword',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      });
      mockPrisma.refreshToken.create.mockResolvedValueOnce({
        id: 'rt-1',
        user_id: 'user-1',
        token_hash: 'hashed',
        expires_at: new Date(),
        created_at: new Date(),
      });

      const res = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send({ email: 'new@test.com', password: 'NewUser1!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock-jwt-token');
      expect(res.body.data.user.email).toBe('new@test.com');
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing',
        email: 'existing@test.com',
        role: 'user',
      });

      const res = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send({ email: 'existing@test.com', password: 'NewUser1!' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send({ email: 'notanemail', password: 'NewUser1!' });

      expect(res.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send({ email: 'test@test.com', password: 'weak' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@test.com',
        password_hash: '$2b$12$hashed',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValueOnce({
        id: 'rt-1',
        user_id: 'user-1',
        token_hash: 'hashed',
        expires_at: new Date(),
        created_at: new Date(),
      });

      const res = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({ email: 'test@test.com', password: 'Correct1!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@test.com',
        password_hash: '$2b$12$hashed',
        role: 'user',
      });

      const res = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({ email: 'test@test.com', password: 'WrongPass1!' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({ email: 'nobody@test.com', password: 'Correct1!' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile with valid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@test.com',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test@test.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get(`${API_BASE}/auth/me`);
      expect(res.status).toBe(401);
    });

    it('should reject expired token', async () => {
      const res = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', 'Bearer expired-token');

      expect(res.status).toBe(401);
    });
  });
});
