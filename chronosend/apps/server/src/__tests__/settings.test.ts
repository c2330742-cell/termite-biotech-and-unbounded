import request from 'supertest';
import express from 'express';
import { API_BASE } from '@chronosend/shared';
import prisma from '../db/client';

const mockPrisma = prisma as any;

// Mock auth guard
jest.mock('../api/middleware/auth', () => ({
  authGuard: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', email: 'test@test.com', role: 'user' };
    next();
  },
}));

const app = express();
app.use(express.json());
import settingsRoutes from '../api/routes/settings';
app.use(`${API_BASE}/settings`, settingsRoutes);

describe('Settings Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /settings', () => {
    it('should return empty settings when none exist', async () => {
      mockPrisma.userCredentials.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).get(`${API_BASE}/settings`);

      expect(res.status).toBe(200);
      expect(res.body.data.email_address).toBeNull();
    });

    it('should return redacted credentials', async () => {
      mockPrisma.userCredentials.findUnique.mockResolvedValueOnce({
        id: 'creds-1',
        user_id: 'user-1',
        telegram_bot_token_enc: JSON.stringify({ encrypted: 'abc', iv: 'def', tag: 'ghi' }),
        email_address: 'test@gmail.com',
        email_app_password_enc: null,
        smtp_host: null,
        smtp_port: null,
        smtp_secure: null,
        twilio_account_sid_enc: null,
        twilio_auth_token_enc: null,
        twilio_phone_number: '+1234567890',
        twilio_whatsapp_number: null,
        whatsapp_method: 'twilio',
        timezone: 'UTC',
        updated_at: new Date(),
      });

      const res = await request(app).get(`${API_BASE}/settings`);

      expect(res.status).toBe(200);
      expect(res.body.data.email_address).toBe('test@gmail.com');
      expect(res.body.data.telegram_bot_token_preview).toBe('****hi"}');
    });
  });

  describe('PUT /settings', () => {
    it('should save credentials', async () => {
      mockPrisma.userCredentials.upsert.mockResolvedValueOnce({
        id: 'creds-1',
        user_id: 'user-1',
        email_address: 'test@gmail.com',
        twilio_phone_number: null,
        twilio_whatsapp_number: null,
        whatsapp_method: 'twilio',
        timezone: 'UTC',
        updated_at: new Date(),
        telegram_bot_token_enc: null,
        email_app_password_enc: null,
        twilio_account_sid_enc: null,
        twilio_auth_token_enc: null,
      });

      const res = await request(app)
        .put(`${API_BASE}/settings`)
        .send({ telegram_bot_token: '123:abc' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /settings/timezone', () => {
    it('should update timezone', async () => {
      mockPrisma.userCredentials.upsert.mockResolvedValueOnce({
        id: 'creds-1',
        user_id: 'user-1',
        timezone: 'America/New_York',
        email_address: null,
        twilio_phone_number: null,
        twilio_whatsapp_number: null,
        whatsapp_method: 'twilio',
        updated_at: new Date(),
        telegram_bot_token_enc: null,
        email_app_password_enc: null,
        twilio_account_sid_enc: null,
        twilio_auth_token_enc: null,
      });

      const res = await request(app)
        .put(`${API_BASE}/settings/timezone`)
        .send({ timezone: 'America/New_York' });

      expect(res.status).toBe(200);
      expect(res.body.data.timezone).toBe('America/New_York');
    });
  });
});
