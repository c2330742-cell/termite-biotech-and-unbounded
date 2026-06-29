import type {
  Platform,
  RepeatRule,
  MessageStatus,
  DeliveryStatus,
  UserRole,
  WhatsAppMethod,
} from './constants';

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

// ─── Refresh Token ───────────────────────────────────────────────────────────
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// ─── User Credentials ────────────────────────────────────────────────────────
export interface UserCredentials {
  id: string;
  user_id: string;
  telegram_bot_token_enc: string | null;
  email_address: string | null;
  email_app_password_enc: string | null;
  twilio_account_sid_enc: string | null;
  twilio_auth_token_enc: string | null;
  twilio_phone_number: string | null;
  twilio_whatsapp_number: string | null;
  whatsapp_method: WhatsAppMethod;
  discord_bot_token_enc: string | null;
  timezone: string;
  updated_at: string;
}

// Credentials input from user (plain text, before encryption)
export interface CredentialsInput {
  telegram_bot_token?: string;
  email_address?: string;
  email_app_password?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  twilio_whatsapp_number?: string;
  whatsapp_method?: WhatsAppMethod;
  discord_bot_token?: string;
  timezone?: string;
}

// Credentials response (sensitive fields redacted)
export interface CredentialsResponse {
  id: string;
  email_address: string | null;
  twilio_phone_number: string | null;
  twilio_whatsapp_number: string | null;
  whatsapp_method: WhatsAppMethod;
  timezone: string;
  updated_at: string;
  telegram_bot_token_preview: string | null;
  email_app_password_preview: string | null;
  twilio_account_sid_preview: string | null;
  twilio_auth_token_preview: string | null;
  discord_bot_token_preview: string | null;
}

// ─── Scheduled Message ───────────────────────────────────────────────────────
export interface ScheduledMessage {
  id: string;
  user_id: string;
  platform: Platform;
  recipient: string;
  subject: string | null;
  body: string;
  send_at: string;
  repeat_rule: RepeatRule;
  status: MessageStatus;
  failure_reason: string | null;
  sent_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageInput {
  platform: Platform;
  recipient: string;
  subject?: string;
  body: string;
  send_at: string;
  repeat_rule?: RepeatRule;
}

export interface UpdateMessageInput {
  platform?: Platform;
  recipient?: string;
  subject?: string;
  body?: string;
  send_at?: string;
  repeat_rule?: RepeatRule;
}

// ─── Delivery Log ────────────────────────────────────────────────────────────
export interface DeliveryLog {
  id: string;
  message_id: string;
  user_id: string;
  attempt: number;
  status: DeliveryStatus;
  failure_reason: string | null;
  attempted_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessageStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
  by_platform: Record<Platform, number>;
}

export interface DashboardStats {
  total_pending: number;
  sent_today: number;
  failed_today: number;
  next_scheduled: ScheduledMessage | null;
  recent: ScheduledMessage[];
}

// ─── Health ──────────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  database: string;
}

export interface AdminHealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  database: string;
  scheduler_queue_depth: number;
  memory_usage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  total_users: number;
  total_messages: number;
}

// ─── WebSocket ───────────────────────────────────────────────────────────────
export interface WsAuthMessage {
  type: 'auth';
  token: string;
}

export interface WsEventMessage {
  type: string;
  [key: string]: unknown;
}

export interface WsMessageSentEvent {
  type: 'message:sent';
  messageId: string;
  platform: Platform;
  recipient: string;
  sentAt: string;
}

export interface WsMessageFailedEvent {
  type: 'message:failed';
  messageId: string;
  platform: Platform;
  reason: string;
}

export interface WsMessageMissedEvent {
  type: 'message:missed';
  messageId: string;
  scheduledAt: string;
}

export interface WsQueueUpdatedEvent {
  type: 'queue:updated';
  pending: number;
}

// ─── Admin ──────────────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  total_messages: number;
  pending_messages: number;
  sent_messages: number;
  failed_messages: number;
}

export interface AdminMessageRow extends ScheduledMessage {
  user_email: string;
}
