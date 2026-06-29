import cron from 'node-cron';
import prisma from '../../db/client';
import { getWsManager } from '../websocket';
import { sendTelegram, sendEmail, sendSms, sendWhatsApp, sendDiscord } from '../senders';
import { getCredentials } from './credentials';
import { jobQueue } from './queue';
import { SCHEDULER_CRON_INTERVAL, REPEAT_RULES } from '@chronosend/shared';

// Track which message IDs are currently being processed (prevents double-sends)
const processing = new Set<string>();

// ─── Dispatcher — routes to the correct sender ───────────────────────────────
async function dispatch(
  message: {
    id: string;
    user_id: string;
    platform: string;
    recipient: string;
    subject: string | null;
    body: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const credentials = await getCredentials(message.user_id);
  if (!credentials) {
    return { ok: false, error: 'User credentials not found' };
  }

  switch (message.platform) {
    case 'telegram':
      return sendTelegram({
        recipient: message.recipient,
        body: message.body,
        credentials: {
          telegram_bot_token_enc: credentials.telegram_bot_token_enc,
        },
      });

    case 'email':
      return sendEmail({
        recipient: message.recipient,
        subject: message.subject || undefined,
        body: message.body,
        credentials: {
          email_address: credentials.email_address,
          email_app_password_enc: credentials.email_app_password_enc,
        },
      });

    case 'sms':
      return sendSms({
        recipient: message.recipient,
        body: message.body,
        credentials: {
          twilio_account_sid_enc: credentials.twilio_account_sid_enc,
          twilio_auth_token_enc: credentials.twilio_auth_token_enc,
          twilio_phone_number: credentials.twilio_phone_number,
        },
      });

    case 'whatsapp':
      return sendWhatsApp({
        recipient: message.recipient,
        body: message.body,
        credentials: {
          twilio_account_sid_enc: credentials.twilio_account_sid_enc,
          twilio_auth_token_enc: credentials.twilio_auth_token_enc,
          twilio_whatsapp_number: credentials.twilio_whatsapp_number,
          twilio_phone_number: credentials.twilio_phone_number,
          whatsapp_method: credentials.whatsapp_method || 'twilio',
        },
      });

    case 'discord':
      return sendDiscord({
        recipient: message.recipient,
        body: message.body,
        credentials: {
          discord_bot_token_enc: credentials.discord_bot_token_enc,
        },
      });

    default:
      return { ok: false, error: `Unknown platform: ${message.platform}` };
  }
}

// ─── Calculate next run time for repeating messages ──────────────────────────
function calculateNextRun(sendAt: Date, repeatRule: string): Date | null {
  const next = new Date(sendAt);
  switch (repeatRule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      return null;
  }
  // Ensure next run is in the future
  if (next.getTime() <= Date.now()) {
    return calculateNextRun(next, repeatRule);
  }
  return next;
}

// ─── Process a single message ────────────────────────────────────────────────
async function processMessage(message: {
  id: string;
  user_id: string;
  platform: string;
  recipient: string;
  subject: string | null;
  body: string;
  send_at: Date;
  repeat_rule: string;
}): Promise<void> {
  if (processing.has(message.id)) return;
  processing.add(message.id);

  try {
    // Mark as sending
    await prisma.scheduledMessage.update({
      where: { id: message.id },
      data: { status: 'sending' },
    });

    // Dispatch to sender
    const result = await dispatch(message);
    const ws = getWsManager();

    if (result.ok) {
      const now = new Date();
      const nextRun = calculateNextRun(message.send_at, message.repeat_rule);

      // Mark as sent
      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: 'sent',
          sent_at: now,
          next_run_at: nextRun,
        },
      });

      // Log delivery
      await prisma.deliveryLog.create({
        data: {
          message_id: message.id,
          user_id: message.user_id,
          attempt: 1,
          status: 'sent',
          attempted_at: now,
        },
      });

      // Emit WebSocket event
      ws.sendMessageSent(message.user_id, message.id, message.platform, message.recipient);

      // For recurring messages, create the next occurrence
      if (nextRun && message.repeat_rule !== 'none') {
        const nextMessage = await prisma.scheduledMessage.create({
          data: {
            user_id: message.user_id,
            platform: message.platform,
            recipient: message.recipient,
            subject: message.subject,
            body: message.body,
            send_at: nextRun,
            repeat_rule: message.repeat_rule,
            status: 'pending',
          },
        });
        jobQueue.add({
          messageId: nextMessage.id,
          userId: nextMessage.user_id,
          platform: nextMessage.platform,
          recipient: nextMessage.recipient,
          subject: nextMessage.subject,
          body: nextMessage.body,
          sendAt: nextRun,
          repeatRule: nextMessage.repeat_rule,
        });
      }

      // Update queue count
      const pendingCount = await prisma.scheduledMessage.count({
        where: { user_id: message.user_id, status: 'pending' },
      });
      ws.sendQueueUpdated(message.user_id, pendingCount);
    } else {
      // Mark as failed
      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          failure_reason: result.error,
        },
      });

      // Log failure
      await prisma.deliveryLog.create({
        data: {
          message_id: message.id,
          user_id: message.user_id,
          attempt: 1,
          status: 'failed',
          failure_reason: result.error,
          attempted_at: new Date(),
        },
      });

      // Emit WebSocket event
      ws.sendMessageFailed(message.user_id, message.id, message.platform, result.error || 'Unknown error');
    }
  } catch (err) {
    console.error(`[scheduler] Error processing message ${message.id}:`, err);
  } finally {
    processing.delete(message.id);
    jobQueue.remove(message.id);
  }
}

// ─── Cron job: poll for due messages every 30 seconds ────────────────────────
function startPolling(): void {
  cron.schedule(SCHEDULER_CRON_INTERVAL, async () => {
    try {
      const now = new Date();
      const dueMessages = await prisma.scheduledMessage.findMany({
        where: {
          status: 'pending',
          send_at: { lte: now },
        },
        orderBy: { send_at: 'asc' },
        take: 50,
      });

      for (const msg of dueMessages) {
        processMessage(msg);
      }
    } catch (err) {
      console.error('[scheduler] Polling error:', err);
    }
  });
}

// ─── On startup: alert users about messages missed while offline ─────────────
async function notifyMissedMessages(): Promise<void> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const missedMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'sending',
        send_at: { gte: fiveMinutesAgo, lte: now },
      },
    });

    if (missedMessages.length > 0) {
      console.log(`[scheduler] Found ${missedMessages.length} messages that may have been missed during downtime`);
      const ws = getWsManager();
      for (const msg of missedMessages) {
        ws.sendMessageMissed(msg.user_id, msg.id, msg.send_at.toISOString());
      }
    }
  } catch (err) {
    console.error('[scheduler] Error notifying missed messages:', err);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function startScheduler(): void {
  console.log('[scheduler] Starting scheduler...');
  notifyMissedMessages();
  startPolling();
  console.log('[scheduler] Scheduler running (polling every 30s)');
}

export { jobQueue, processing };
