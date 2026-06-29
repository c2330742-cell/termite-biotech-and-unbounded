import { Router, Request, Response } from 'express';
import prisma from '../../db/client';
import { authGuard } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { jobQueue } from '../../services/scheduler/queue';
import { getWsManager } from '../../services/websocket';

const router = Router();

// All admin routes require auth + admin role
router.use(authGuard);
router.use(requireRole('admin'));

// GET /admin/users — list all users with message counts
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        _count: {
          select: {
            scheduled_messages: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Add status counts per user
    const result = await Promise.all(
      users.map(async (user) => {
        const [pending, sent, failed] = await Promise.all([
          prisma.scheduledMessage.count({ where: { user_id: user.id, status: 'pending' } }),
          prisma.scheduledMessage.count({ where: { user_id: user.id, status: 'sent' } }),
          prisma.scheduledMessage.count({ where: { user_id: user.id, status: 'failed' } }),
        ]);
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          total_messages: user._count.scheduled_messages,
          pending_messages: pending,
          sent_messages: sent,
          failed_messages: failed,
        };
      }),
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// GET /admin/messages — list all messages across all users
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.scheduledMessage.findMany({
        include: {
          user: { select: { email: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.scheduledMessage.count(),
    ]);

    const mapped = items.map((item) => ({
      ...item,
      user_email: item.user.email,
      user: undefined,
    }));

    res.json({
      success: true,
      data: {
        items: mapped,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[admin/messages]', err);
    res.status(500).json({ success: false, error: 'Failed to list messages' });
  }
});

// GET /admin/health — system health
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // DB check
    await prisma.$queryRaw`SELECT 1`;

    const [totalUsers, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.scheduledMessage.count(),
    ]);

    const memUsage = process.memoryUsage();
    const wsManager = getWsManager();

    res.json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected',
        scheduler_queue_depth: jobQueue.size,
        websocket_clients: wsManager.connectedClients,
        memory_usage: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
        total_users: totalUsers,
        total_messages: totalMessages,
      },
    });
  } catch (err) {
    res.status(503).json({
      success: true,
      data: {
        status: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        scheduler_queue_depth: jobQueue.size,
      },
    });
  }
});

// DELETE /admin/users/:id — delete a user and all their data
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.id === req.user!.userId) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (err) {
    console.error('[admin/delete-user]', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;
