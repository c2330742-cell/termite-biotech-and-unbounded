import request from 'supertest';
import express from 'express';
import { API_BASE } from '@chronosend/shared';
import prisma from '../db/client';

const mockPrisma = prisma as any;

// Mock auth guard to inject test user
jest.mock('../api/middleware/auth', () => ({
  authGuard: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', email: 'test@test.com', role: 'user' };
    next();
  },
}));

const app = express();
app.use(express.json());
import messagesRoutes from '../api/routes/messages';
app.use(`${API_BASE}/messages`, messagesRoutes);

describe('Messages Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /messages', () => {
    it('should create a new scheduled message', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      mockPrisma.scheduledMessage.create.mockResolvedValueOnce({
        id: 'msg-1',
        user_id: 'user-1',
        platform: 'email',
        recipient: 'test@example.com',
        subject: 'Test',
        body: 'Hello!',
        send_at: new Date(futureDate),
        repeat_rule: 'none',
        status: 'pending',
        failure_reason: null,
        sent_at: null,
        next_run_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app)
        .post(`${API_BASE}/messages`)
        .send({
          platform: 'email',
          recipient: 'test@example.com',
          subject: 'Test',
          body: 'Hello!',
          send_at: futureDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.platform).toBe('email');
    });

    it('should reject invalid platform', async () => {
      const res = await request(app)
        .post(`${API_BASE}/messages`)
        .send({
          platform: 'invalid',
          recipient: 'test@example.com',
          body: 'Hello!',
          send_at: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /messages', () => {
    it('should list messages with pagination', async () => {
      mockPrisma.scheduledMessage.findMany.mockResolvedValueOnce([
        {
          id: 'msg-1',
          user_id: 'user-1',
          platform: 'email',
          recipient: 'test@example.com',
          subject: null,
          body: 'Hi',
          send_at: new Date(),
          repeat_rule: 'none',
          status: 'pending',
          failure_reason: null,
          sent_at: null,
          next_run_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      mockPrisma.scheduledMessage.count.mockResolvedValueOnce(1);

      const res = await request(app).get(`${API_BASE}/messages`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /messages/stats', () => {
    it('should return dashboard stats', async () => {
      mockPrisma.scheduledMessage.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(5) // sent
        .mockResolvedValueOnce(1) // failed
        .mockResolvedValueOnce(1) // cancelled
        .mockResolvedValueOnce(2) // sent today
        .mockResolvedValueOnce(0); // failed today
      mockPrisma.scheduledMessage.findFirst.mockResolvedValueOnce(null); // next scheduled
      mockPrisma.scheduledMessage.findMany.mockResolvedValueOnce([]); // recent
      // Platform counts
      mockPrisma.scheduledMessage.count
        .mockResolvedValueOnce(2) // telegram
        .mockResolvedValueOnce(4) // email
        .mockResolvedValueOnce(3) // sms
        .mockResolvedValueOnce(1) // whatsapp
        .mockResolvedValueOnce(0); // discord

      const res = await request(app).get(`${API_BASE}/messages/stats`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_pending).toBe(3);
    });
  });

  describe('DELETE /messages/:id', () => {
    it('should cancel a pending message', async () => {
      mockPrisma.scheduledMessage.findFirst.mockResolvedValueOnce({
        id: 'msg-1',
        user_id: 'user-1',
        status: 'pending',
      } as any);

      mockPrisma.scheduledMessage.update.mockResolvedValueOnce({
        id: 'msg-1',
        status: 'cancelled',
      } as any);

      const res = await request(app).delete(`${API_BASE}/messages/msg-1`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('should reject cancelling a sent message', async () => {
      mockPrisma.scheduledMessage.findFirst.mockResolvedValueOnce({
        id: 'msg-1',
        user_id: 'user-1',
        status: 'sent',
      } as any);

      const res = await request(app).delete(`${API_BASE}/messages/msg-1`);

      expect(res.status).toBe(400);
    });
  });
});
