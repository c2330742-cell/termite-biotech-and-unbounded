import { jobQueue } from '../services/scheduler/queue';

describe('Job Queue', () => {
  beforeEach(() => {
    jobQueue.clear();
  });

  it('should add and retrieve jobs', () => {
    const job = {
      messageId: 'msg-1',
      userId: 'user-1',
      platform: 'email',
      recipient: 'test@example.com',
      subject: null,
      body: 'Hello',
      sendAt: new Date(),
      repeatRule: 'none',
    };

    jobQueue.add(job);
    expect(jobQueue.size).toBe(1);

    const retrieved = jobQueue.get('msg-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.recipient).toBe('test@example.com');
  });

  it('should remove jobs', () => {
    const job = {
      messageId: 'msg-1',
      userId: 'user-1',
      platform: 'email',
      recipient: 'test@example.com',
      subject: null,
      body: 'Hello',
      sendAt: new Date(),
      repeatRule: 'none',
    };

    jobQueue.add(job);
    expect(jobQueue.size).toBe(1);

    jobQueue.remove('msg-1');
    expect(jobQueue.size).toBe(0);
    expect(jobQueue.get('msg-1')).toBeUndefined();
  });

  it('should handle multiple jobs', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      messageId: `msg-${i}`,
      userId: 'user-1',
      platform: 'email' as const,
      recipient: `test${i}@example.com`,
      subject: null,
      body: `Message ${i}`,
      sendAt: new Date(),
      repeatRule: 'none' as const,
    }));

    jobs.forEach((j) => jobQueue.add(j));
    expect(jobQueue.size).toBe(5);

    const all = jobQueue.getAll();
    expect(all).toHaveLength(5);
  });

  it('should clear all jobs', () => {
    const job = {
      messageId: 'msg-1',
      userId: 'user-1',
      platform: 'email',
      recipient: 'test@example.com',
      subject: null,
      body: 'Hello',
      sendAt: new Date(),
      repeatRule: 'none',
    };

    jobQueue.add(job);
    jobQueue.clear();
    expect(jobQueue.size).toBe(0);
  });
});
