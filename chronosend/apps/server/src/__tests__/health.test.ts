import request from 'supertest';
import express from 'express';
import prisma from '../db/client';

const mockPrisma = prisma as any;

const app = express();
import healthRoutes from '../api/routes/health';
app.use('/api', healthRoutes);

describe('Health Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return ok when DB is connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([[{ 1: 1 }]]);

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
    });

    it('should return error when DB is disconnected', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.database).toBe('disconnected');
    });
  });
});
