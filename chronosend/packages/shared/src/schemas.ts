import { z } from 'zod';
import {
  PLATFORMS,
  REPEAT_RULES,
  MESSAGE_STATUSES,
  USER_ROLES,
  WHATSAPP_METHODS,
} from './constants';

// ─── Auth Schemas ────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number',
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

// ─── Message Schemas ─────────────────────────────────────────────────────────
export const createMessageSchema = z.object({
  platform: z.enum(PLATFORMS),
  recipient: z
    .string()
    .min(1, 'Recipient is required')
    .max(500, 'Recipient too long'),
  subject: z.string().max(500, 'Subject too long').optional(),
  body: z
    .string()
    .min(1, 'Message body is required')
    .max(10000, 'Message body too long'),
  send_at: z.string().refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getTime() > Date.now() - 60000;
    },
    { message: 'send_at must be a valid future date/time' },
  ),
  repeat_rule: z.enum(REPEAT_RULES).default('none'),
});

export const updateMessageSchema = z.object({
  platform: z.enum(PLATFORMS).optional(),
  recipient: z.string().min(1).max(500).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).max(10000).optional(),
  send_at: z
    .string()
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d.getTime() > Date.now() - 60000;
      },
      { message: 'send_at must be a valid future date/time' },
    )
    .optional(),
  repeat_rule: z.enum(REPEAT_RULES).optional(),
});

export const messageQuerySchema = z.object({
  status: z.enum(MESSAGE_STATUSES).optional(),
  platform: z.enum(PLATFORMS).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['send_at', 'created_at', 'status']).default('send_at'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// ─── Settings Schemas ────────────────────────────────────────────────────────
export const credentialsSchema = z.object({
  telegram_bot_token: z.string().min(1, 'Bot token required').optional(),
  email_address: z.string().email('Invalid email').optional(),
  email_app_password: z.string().min(1, 'App password required').optional(),
  twilio_account_sid: z.string().min(1, 'Account SID required').optional(),
  twilio_auth_token: z.string().min(1, 'Auth token required').optional(),
  twilio_phone_number: z.string().min(1, 'Phone number required').optional(),
  twilio_whatsapp_number: z.string().min(1, 'WhatsApp number required').optional(),
  whatsapp_method: z.enum(WHATSAPP_METHODS).optional(),
  discord_bot_token: z.string().min(1, 'Bot token required').optional(),
});

export const timezoneSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
});

export const testPlatformSchema = z.object({
  platform: z.enum(PLATFORMS),
});
