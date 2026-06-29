import request from 'supertest';
import express from 'express';
import { API_BASE } from '@chronosend/shared';
import prisma from '../db/client';

const mockPrisma = prisma as any;

// Mock WebSocket manager
jest.mock('../services/websocket', () => ({
  getWsManager: jest.fn().mockReturnValue({
    connectedClients: 0,
  }),
}));

jest.mock('../services/scheduler/queue', () => ({
  jobQueue: { size: 0 },
}));

// Mock auth guard to inject admin user
jest.mock('../api/middleware/auth', () => ({
  authGuard: (req: any, _res: any, next: any) => {
    req.user = { userId: 'admin-1', email: 'admin@test.com', role: 'admin' };
    next();
  },
}));

jest.mock('../api/middleware/rbac', () => ({
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
import adminRoutes from '../api/routes/admin';
app.use(`${API_BASE}/admin`, adminRoutes);

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/users', () => {
    it('should list users with message counts', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'user@test.com',
          role: 'user',
          created_at: new Date(),
          _count: { scheduled_messages: 5 },
        },
        {
          id: 'admin-1',
          email: 'admin@test.com',
          role: 'admin',
          created_at: new Date(),
          _count: { scheduled_messages: 10 },
        },
      ] as any[]);

      // Mock the individual status counts
      mockPrisma.scheduledMessage.count
        .mockResolvedValueOnce(2) // user pending
        .mockResolvedValueOnce(2) // user sent
        .mockResolvedValueOnce(1) // user failed
        .mockResolvedValueOnce(5) // admin pending
        .mockResolvedValueOnce(3) // admin sent
        .mockResolvedValueOnce(2); // admin failed

      const res = await request(app).get(`${API_BASE}/admin/users`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /admin/health', () => {
    it('should return system health', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([[{ 1: 1 }]] as any);
      mockPrisma.user.count.mockResolvedValueOnce(5);
      mockPrisma.scheduledMessage.count.mockResolvedValueOnce(100);

      const res = await request(app).get(`${API_BASE}/admin/health`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.total_users).toBe(5);
      expect(res.body.data.total_messages).toBe(100);
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
      } as any);
      mockPrisma.user.delete.mockResolvedValueOnce({} as any);

      const res = await request(app).delete(`${API_BASE}/admin/users/user-1`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject deleting own account', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
      } as any);

      const res = await request(app).delete(`${API_BASE}/admin/users/admin-1`);

      expect(res.status).toBe(400);
    });
  });
});
