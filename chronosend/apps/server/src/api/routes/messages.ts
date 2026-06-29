import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authGuard } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createMessageSchema,
  updateMessageSchema,
  messageQuerySchema,
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from '@chronosend/shared';
import { jobQueue } from '../../services/scheduler/queue';
import { encrypt, decrypt } from '../../services/crypto';

const router = Router();

// All message routes require authentication
router.use(authGuard);

// GET /messages — list messages with filtering and pagination
router.get('/', validate(messageQuerySchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { status, platform, date_from, date_to, page, limit, sort, order } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || DEFAULT_PAGE);
    const limitNum = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(limit) || DEFAULT_PAGE_LIMIT));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { user_id: req.user!.userId };
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (date_from || date_to) {
      where.send_at = {};
      if (date_from) (where.send_at as Record<string, unknown>).gte = new Date(date_from);
      if (date_to) (where.send_at as Record<string, unknown>).lte = new Date(date_to);
    }

    const orderBy = { [sort || 'send_at']: order || 'asc' };

    let items = await prisma.scheduledMessage.findMany({
      where: where as Record<string, unknown>,
      orderBy,
      skip,
      take: limitNum,
    });
    const total = await prisma.scheduledMessage.count({ where: where as Record<string, unknown> });

    // Decrypt bodies on read
    items = items.map((item) => {
      try {
        const parsed = JSON.parse(item.body);
        if (parsed.encrypted && parsed.iv && parsed.tag) {
          item.body = decrypt(parsed);
        }
      } catch {
        // Legacy plaintext body
      }
      return item;
    }) as typeof items;

    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[messages/list]', err);
    res.status(500).json({ success: false, error: 'Failed to list messages' });
  }
});

// POST /messages — create a new scheduled message
router.post('/', validate(createMessageSchema), async (req: Request, res: Response) => {
  try {
    const { platform, recipient, subject, body, send_at, repeat_rule } = req.body;

    const encryptedBody = JSON.stringify(encrypt(body));

    const message = await prisma.scheduledMessage.create({
      data: {
        user_id: req.user!.userId,
        platform,
        recipient,
        subject: subject || null,
        body: encryptedBody,
        send_at: new Date(send_at),
        repeat_rule: repeat_rule || 'none',
        status: 'pending',
      },
    });

    const decryptedBody = decrypt(JSON.parse(encryptedBody));

    // Add to job queue if send_at is within the next minute
    const now = Date.now();
    const sendTime = new Date(send_at).getTime();
    if (sendTime > now && sendTime <= now + 60000) {
      jobQueue.add({
        messageId: message.id,
        userId: message.user_id,
        platform: message.platform,
        recipient: message.recipient,
        subject: message.subject,
        body: decryptedBody,
        sendAt: new Date(send_at),
        repeatRule: repeat_rule || 'none',
      });
    }

    res.status(201).json({
      success: true,
      data: { ...message, body: decryptedBody },
    });
  } catch (err) {
    console.error('[messages/create]', err);
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

// GET /messages/stats — aggregate statistics for dashboard
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, pending, sent, failed, cancelled, sentToday, failedToday, nextScheduled, rawRecent] = await Promise.all([
      prisma.scheduledMessage.count({ where: { user_id: userId } }),
      prisma.scheduledMessage.count({ where: { user_id: userId, status: 'pending' } }),
      prisma.scheduledMessage.count({ where: { user_id: userId, status: 'sent' } }),
      prisma.scheduledMessage.count({ where: { user_id: userId, status: 'failed' } }),
      prisma.scheduledMessage.count({ where: { user_id: userId, status: 'cancelled' } }),
      prisma.scheduledMessage.count({
        where: { user_id: userId, status: 'sent', sent_at: { gte: todayStart } },
      }),
      prisma.scheduledMessage.count({
        where: { user_id: userId, status: 'failed', send_at: { gte: todayStart } },
      }),
      prisma.scheduledMessage.findFirst({
        where: { user_id: userId, status: 'pending' },
        orderBy: { send_at: 'asc' },
      }),
      prisma.scheduledMessage.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

    const recent = rawRecent.map((msg: Record<string, unknown>) => {
      try {
        const parsed = JSON.parse(msg.body as string);
        if (parsed.encrypted && parsed.iv && parsed.tag) {
          msg.body = decrypt(parsed);
        }
      } catch {
        // Legacy plaintext body
      }
      return msg;
    });

    // By-platform breakdown
    const platforms = ['telegram', 'email', 'sms', 'whatsapp', 'discord'] as const;
    const byPlatform: Record<string, number> = {};
    for (const p of platforms) {
      byPlatform[p] = await prisma.scheduledMessage.count({
        where: { user_id: userId, platform: p },
      });
    }

    res.json({
      success: true,
      data: {
        total_pending: pending,
        sent_today: sentToday,
        failed_today: failedToday,
        next_scheduled: nextScheduled,
        recent,
        stats: { total, pending, sent, failed, cancelled, by_platform: byPlatform },
      },
    });
  } catch (err) {
    console.error('[messages/stats]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// GET /messages/:id — get single message
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const message = await prisma.scheduledMessage.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: { delivery_logs: { orderBy: { attempted_at: 'desc' } } },
    });

    if (!message) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    // Decrypt body
    let decryptedBody = message.body;
    try {
      const parsed = JSON.parse(message.body);
      if (parsed.encrypted && parsed.iv && parsed.tag) {
        decryptedBody = decrypt(parsed);
      }
    } catch {
      // Legacy plaintext body
    }

    res.json({ success: true, data: { ...message, body: decryptedBody } });
  } catch (err) {
    console.error('[messages/get]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch message' });
  }
});

// PATCH /messages/:id — edit a pending message
router.patch('/:id', validate(updateMessageSchema), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.scheduledMessage.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    if (existing.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Only pending messages can be edited' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    const { platform, recipient, subject, body, send_at, repeat_rule } = req.body;
    if (platform) updateData.platform = platform;
    if (recipient) updateData.recipient = recipient;
    if (subject !== undefined) updateData.subject = subject;
    if (body) updateData.body = JSON.stringify(encrypt(body));
    if (send_at) updateData.send_at = new Date(send_at);
    if (repeat_rule) updateData.repeat_rule = repeat_rule;

    const updated = await prisma.scheduledMessage.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Return decrypted body
    res.json({ success: true, data: { ...updated, body } });
  } catch (err) {
    console.error('[messages/update]', err);
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// DELETE /messages/:id — cancel a message
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.scheduledMessage.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    if (existing.status === 'sent') {
      res.status(400).json({ success: false, error: 'Cannot cancel a sent message' });
      return;
    }

    const updated = await prisma.scheduledMessage.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });

    jobQueue.remove(req.params.id);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[messages/delete]', err);
    res.status(500).json({ success: false, error: 'Failed to cancel message' });
  }
});

export default router;
