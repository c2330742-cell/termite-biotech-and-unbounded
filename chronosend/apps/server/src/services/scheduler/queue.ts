// In-memory job queue for the scheduler
// Active jobs are tracked to prevent double-sends

export interface QueueJob {
  messageId: string;
  userId: string;
  platform: string;
  recipient: string;
  subject: string | null;
  body: string;
  sendAt: Date;
  repeatRule: string;
}

export class JobQueue {
  private jobs: Map<string, QueueJob> = new Map();

  add(job: QueueJob): void {
    this.jobs.set(job.messageId, job);
  }

  get(messageId: string): QueueJob | undefined {
    return this.jobs.get(messageId);
  }

  remove(messageId: string): void {
    this.jobs.delete(messageId);
  }

  get size(): number {
    return this.jobs.size;
  }

  getAll(): QueueJob[] {
    return Array.from(this.jobs.values());
  }

  clear(): void {
    this.jobs.clear();
  }
}

export const jobQueue = new JobQueue();
