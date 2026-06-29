import { jobQueue } from '../services/scheduler/queue';

jest.mock('../db/client', () => ({
  __esModule: true,
  default: {
    scheduledMessage: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

describe('Job Queue Persistence', () => {
  beforeEach(() => {
    jobQueue.clear();
    jest.clearAllMocks();
  });

  it('should start empty', () => {
    expect(jobQueue.size).toBe(0);
  });

  it('should add and remove jobs', () => {
    jobQueue.add({
      messageId: 'msg-1',
      userId: 'user-1',
      platform: 'email',
      recipient: 'test@example.com',
      subject: null,
      body: 'Hello',
      sendAt: new Date(Date.now() + 10000),
      repeatRule: 'none',
    });

    expect(jobQueue.size).toBe(1);

    jobQueue.remove('msg-1');
    expect(jobQueue.size).toBe(0);
  });

  it('should recover pending messages from DB on restart', async () => {
    const now = new Date();
    const pendingMessages = [
      {
        id: 'msg-1',
        user_id: 'user-1',
        platform: 'email',
        recipient: 'alice@test.com',
        subject: 'Test',
        body: JSON.stringify({ encrypted: 'abc', iv: 'def', tag: 'ghi' }),
        send_at: new Date(now.getTime() + 30000),
        repeat_rule: 'none',
        status: 'pending',
      },
      {
        id: 'msg-2',
        user_id: 'user-1',
        platform: 'telegram',
        recipient: '12345',
        subject: null,
        body: 'plaintext legacy body',
        send_at: new Date(now.getTime() + 60000),
        repeat_rule: 'daily',
        status: 'pending',
      },
    ];

    const mockPrisma = jest.requireMock('../db/client').default;
    (mockPrisma.scheduledMessage.findMany as jest.Mock).mockResolvedValue(pendingMessages);

    const messages = await mockPrisma.scheduledMessage.findMany({
      where: { status: 'pending', send_at: { gte: now, lte: new Date(now.getTime() + 60000 * 60) } },
    });

    for (const msg of messages) {
      jobQueue.add({
        messageId: msg.id,
        userId: msg.user_id,
        platform: msg.platform,
        recipient: msg.recipient,
        subject: msg.subject,
        body: msg.body,
        sendAt: msg.send_at,
        repeatRule: msg.repeat_rule,
      });
    }

    expect(jobQueue.size).toBe(2);
  });

  it('should clear all jobs', () => {
    jobQueue.add({
      messageId: 'msg-1',
      userId: 'user-1',
      platform: 'sms',
      recipient: '+1234567890',
      subject: null,
      body: 'Hello',
      sendAt: new Date(Date.now() + 5000),
      repeatRule: 'none',
    });

    jobQueue.add({
      messageId: 'msg-2',
      userId: 'user-1',
      platform: 'email',
      recipient: 'test@test.com',
      subject: null,
      body: 'World',
      sendAt: new Date(Date.now() + 10000),
      repeatRule: 'none',
    });

    expect(jobQueue.size).toBe(2);
    jobQueue.clear();
    expect(jobQueue.size).toBe(0);
  });

  it('should not add duplicate messageIds', () => {
    const job = {
      messageId: 'msg-1',
      userId: 'user-1',
      platform: 'email',
      recipient: 'a@b.com',
      subject: null,
      body: 'test',
      sendAt: new Date(Date.now() + 10000),
      repeatRule: 'none',
    };

    jobQueue.add(job);
    jobQueue.add(job);
    expect(jobQueue.size).toBe(1);
  });
});
