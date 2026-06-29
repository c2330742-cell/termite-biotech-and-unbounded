// Platform identifiers
export const PLATFORMS = ['telegram', 'email', 'sms', 'whatsapp', 'discord'] as const;
export type Platform = (typeof PLATFORMS)[number];

// Repeat rules
export const REPEAT_RULES = ['none', 'daily', 'weekly', 'monthly'] as const;
export type RepeatRule = (typeof REPEAT_RULES)[number];

// Message statuses
export const MESSAGE_STATUSES = [
  'pending',
  'sending',
  'sent',
  'failed',
  'cancelled',
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

// Delivery log statuses
export const DELIVERY_STATUSES = ['sent', 'failed'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

// User roles
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// WhatsApp methods
export const WHATSAPP_METHODS = ['twilio', 'baileys'] as const;
export type WhatsAppMethod = (typeof WHATSAPP_METHODS)[number];

// API base path
export const API_BASE = '/api/v1';

// Default email subject
export const EMAIL_SUBJECT_DEFAULT = 'Scheduled Message';

// Token expiry times (seconds)
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// Timezone defaults
export const DEFAULT_TIMEZONE = 'UTC';

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

// WebSocket event types
export const WS_EVENTS = {
  MESSAGE_SENT: 'message:sent',
  MESSAGE_FAILED: 'message:failed',
  MESSAGE_MISSED: 'message:missed',
  QUEUE_UPDATED: 'queue:updated',
} as const;

// Rate limiting
export const RATE_LIMIT_AUTH_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_AUTH_MAX = 10;
export const RATE_LIMIT_DEFAULT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_DEFAULT_MAX = 60;

// Scheduler
export const SCHEDULER_CRON_INTERVAL = '*/30 * * * * *'; // every 30 seconds
export const SCHEDULER_LOOKAHEAD_SECONDS = 60;

// Default SMTP settings (customizable per user)
export const DEFAULT_SMTP_PORT = 587;
export const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
