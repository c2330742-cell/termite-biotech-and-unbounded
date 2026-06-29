import prisma from '../../db/client';

export async function persistJobState(): Promise<void> {
  try {
    const now = new Date();
    const staleJobs = await prisma.scheduledMessage.findMany({
      where: {
        status: 'sending',
        send_at: { lte: now },
      },
    });

    for (const job of staleJobs) {
      await prisma.scheduledMessage.update({
        where: { id: job.id },
        data: { status: 'pending', failure_reason: 'Reset after restart' },
      });
    }

    if (staleJobs.length > 0) {
      console.log(`[scheduler] Reset ${staleJobs.length} stale jobs after restart`);
    }
  } catch (err) {
    console.error('[scheduler] Failed to persist job state:', err);
  }
}

export async function getPendingJobCount(): Promise<number> {
  return prisma.scheduledMessage.count({
    where: { status: 'pending', send_at: { lte: new Date() } },
  });
}
