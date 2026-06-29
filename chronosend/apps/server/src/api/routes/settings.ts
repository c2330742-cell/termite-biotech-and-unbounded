import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authGuard } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { credentialsSchema, timezoneSchema, testPlatformSchema } from '@chronosend/shared';
import { encrypt } from '../../services/crypto';
import { sendTelegram, sendEmail, sendSms, sendWhatsApp, sendDiscord } from '../../services/senders';

const router = Router();

router.use(authGuard);

// Helper: return only last 4 chars for preview
function preview(value: string | null): string | null {
  if (!value || value.length < 4) return null;
  return '****' + value.slice(-4);
}

// GET /settings — return credentials with redacted sensitive fields
router.get('/', async (req: Request, res: Response) => {
  try {
    const creds = await prisma.userCredentials.findUnique({
      where: { user_id: req.user!.userId },
    });

    if (!creds) {
      res.json({
        success: true,
        data: {
          id: null,
          email_address: null,
          twilio_phone_number: null,
          twilio_whatsapp_number: null,
          whatsapp_method: 'twilio',
          timezone: 'UTC',
          updated_at: null,
          telegram_bot_token_preview: null,
          email_app_password_preview: null,
          twilio_account_sid_preview: null,
          twilio_auth_token_preview: null,
          discord_bot_token_preview: null,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: creds.id,
        email_address: creds.email_address,
        twilio_phone_number: creds.twilio_phone_number,
        twilio_whatsapp_number: creds.twilio_whatsapp_number,
        whatsapp_method: creds.whatsapp_method,
        timezone: creds.timezone,
        updated_at: creds.updated_at,
        telegram_bot_token_preview: preview(creds.telegram_bot_token_enc),
        email_app_password_preview: preview(creds.email_app_password_enc),
        twilio_account_sid_preview: preview(creds.twilio_account_sid_enc),
        twilio_auth_token_preview: preview(creds.twilio_auth_token_enc),
        discord_bot_token_preview: preview(creds.discord_bot_token_enc),
      },
    });
  } catch (err) {
    console.error('[settings/get]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /settings — save/update credentials (encrypt before storing)
router.put('/', validate(credentialsSchema), async (req: Request, res: Response) => {
  try {
    const data: Record<string, unknown> = {};

    if (req.body.telegram_bot_token) {
      data.telegram_bot_token_enc = JSON.stringify(encrypt(req.body.telegram_bot_token));
    }
    if (req.body.email_address) {
      data.email_address = req.body.email_address;
    }
    if (req.body.email_app_password) {
      data.email_app_password_enc = JSON.stringify(encrypt(req.body.email_app_password));
    }
    if (req.body.twilio_account_sid) {
      data.twilio_account_sid_enc = JSON.stringify(encrypt(req.body.twilio_account_sid));
    }
    if (req.body.twilio_auth_token) {
      data.twilio_auth_token_enc = JSON.stringify(encrypt(req.body.twilio_auth_token));
    }
    if (req.body.twilio_phone_number) {
      data.twilio_phone_number = req.body.twilio_phone_number;
    }
    if (req.body.twilio_whatsapp_number) {
      data.twilio_whatsapp_number = req.body.twilio_whatsapp_number;
    }
    if (req.body.whatsapp_method) {
      data.whatsapp_method = req.body.whatsapp_method;
    }
    if (req.body.discord_bot_token) {
      data.discord_bot_token_enc = JSON.stringify(encrypt(req.body.discord_bot_token));
    }

    const creds = await (prisma.userCredentials.upsert as any)({
      where: { user_id: req.user!.userId },
      update: data,
      create: {
        user_id: req.user!.userId,
        ...data,
      },
    });

    res.json({
      success: true,
      data: {
        id: creds.id,
        email_address: creds.email_address,
        twilio_phone_number: creds.twilio_phone_number,
        twilio_whatsapp_number: creds.twilio_whatsapp_number,
        whatsapp_method: creds.whatsapp_method,
        timezone: creds.timezone,
        updated_at: creds.updated_at,
      },
    });
  } catch (err) {
    console.error('[settings/update]', err);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// PUT /settings/timezone
router.put('/timezone', validate(timezoneSchema), async (req: Request, res: Response) => {
  try {
    const creds = await prisma.userCredentials.upsert({
      where: { user_id: req.user!.userId },
      update: { timezone: req.body.timezone },
      create: {
        user_id: req.user!.userId,
        timezone: req.body.timezone,
      },
    });

    res.json({ success: true, data: { timezone: creds.timezone } });
  } catch (err) {
    console.error('[settings/timezone]', err);
    res.status(500).json({ success: false, error: 'Failed to update timezone' });
  }
});

// POST /settings/test/:platform — send a test message to the user themselves
router.post('/test/:platform', validate(testPlatformSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = req.user!.userId;

    const creds = await prisma.userCredentials.findUnique({ where: { user_id: userId } });
    if (!creds) {
      res.status(400).json({ success: false, error: 'No credentials configured. Save settings first.' });
      return;
    }

    const testBody = `This is a test message from ChronoSend. Sent at ${new Date().toISOString()}`;
    let result: { ok: boolean; error?: string };

    switch (platform) {
      case 'telegram': {
        result = await sendTelegram({
          recipient: req.user!.userId, // Will use user's own ID as test
          body: testBody,
          credentials: { telegram_bot_token_enc: creds.telegram_bot_token_enc },
        });
        break;
      }
      case 'email': {
        if (!creds.email_address) {
          res.status(400).json({ success: false, error: 'Email address not configured' });
          return;
        }
        result = await sendEmail({
          recipient: creds.email_address,
          subject: 'ChronoSend Test Message',
          body: testBody,
          credentials: {
            email_address: creds.email_address,
            email_app_password_enc: creds.email_app_password_enc,
          },
        });
        break;
      }
      case 'sms': {
        if (!creds.twilio_phone_number) {
          res.status(400).json({ success: false, error: 'SMS phone number not configured' });
          return;
        }
        result = await sendSms({
          recipient: creds.twilio_phone_number,
          body: testBody,
          credentials: {
            twilio_account_sid_enc: creds.twilio_account_sid_enc,
            twilio_auth_token_enc: creds.twilio_auth_token_enc,
            twilio_phone_number: creds.twilio_phone_number,
          },
        });
        break;
      }
      case 'whatsapp': {
        const whatsappRecipient = creds.twilio_whatsapp_number || creds.twilio_phone_number;
        if (!whatsappRecipient) {
          res.status(400).json({ success: false, error: 'WhatsApp number not configured' });
          return;
        }
        result = await sendWhatsApp({
          recipient: whatsappRecipient,
          body: testBody,
          credentials: {
            twilio_account_sid_enc: creds.twilio_account_sid_enc,
            twilio_auth_token_enc: creds.twilio_auth_token_enc,
            twilio_whatsapp_number: creds.twilio_whatsapp_number,
            twilio_phone_number: creds.twilio_phone_number,
            whatsapp_method: creds.whatsapp_method || 'twilio',
          },
        });
        break;
      }
      case 'discord': {
        result = await sendDiscord({
          recipient: req.user!.userId,
          body: testBody,
          credentials: { discord_bot_token_enc: creds.discord_bot_token_enc },
        });
        break;
      }
      default:
        res.status(400).json({ success: false, error: `Unknown platform: ${platform}` });
        return;
    }

    if (result.ok) {
      res.json({ success: true, message: `Test ${platform} message sent successfully!` });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('[settings/test]', err);
    res.status(500).json({ success: false, error: 'Test failed' });
  }
});

export default router;
