import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  console.log('[seed] Starting database seed...');

  // ─── Admin user ───────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chronosend.app' },
    update: {},
    create: {
      email: 'admin@chronosend.app',
      password_hash: adminPasswordHash,
      role: 'admin',
    },
  });
  console.log(`[seed] Admin user: ${admin.email} (role: ${admin.role})`);

  // ─── Demo user ────────────────────────────────────────────────────────────
  const userPasswordHash = await bcrypt.hash('User1234!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@chronosend.app' },
    update: {},
    create: {
      email: 'demo@chronosend.app',
      password_hash: userPasswordHash,
      role: 'user',
    },
  });
  console.log(`[seed] Demo user: ${demoUser.email} (role: ${demoUser.role})`);

  // ─── Demo credentials for demo user ───────────────────────────────────────
  await prisma.userCredentials.upsert({
    where: { user_id: demoUser.id },
    update: {},
    create: {
      user_id: demoUser.id,
      telegram_bot_token_enc: null,
      email_address: 'demo@gmail.com',
      email_app_password_enc: null,
      timezone: 'America/New_York',
    },
  });
  console.log('[seed] Demo credentials created');

  // ─── Sample scheduled messages ────────────────────────────────────────────
  const now = new Date();
  const sampleMessages = [
    {
      user_id: demoUser.id,
      platform: 'email',
      recipient: 'friend@example.com',
      subject: 'Happy Birthday!',
      body: 'Wishing you the best birthday ever! Hope you have a fantastic day.',
      send_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      repeat_rule: 'none',
      status: 'pending',
    },
    {
      user_id: demoUser.id,
      platform: 'telegram',
      recipient: '@johndoe',
      body: 'Reminder: Team standup in 30 minutes!',
      send_at: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      repeat_rule: 'daily',
      status: 'pending',
    },
    {
      user_id: demoUser.id,
      platform: 'sms',
      recipient: '+15551234567',
      body: 'Your appointment is confirmed for tomorrow at 2 PM.',
      send_at: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 2 days
      repeat_rule: 'none',
      status: 'pending',
    },
    {
      user_id: demoUser.id,
      platform: 'whatsapp',
      recipient: '+15559876543',
      body: 'Dinner at 7pm at the Italian place?',
      send_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago (already past)
      repeat_rule: 'none',
      status: 'pending',
    },
  ];

  for (const msg of sampleMessages) {
    const created = await prisma.scheduledMessage.create({ data: msg });
    console.log(`[seed] Created message: ${created.platform} → ${created.recipient} [${created.status}]`);
  }

  // ─── Sample delivery logs ─────────────────────────────────────────────────
  const sentMessages = await prisma.scheduledMessage.findMany({
    where: { user_id: demoUser.id, status: 'pending' },
    take: 2,
  });

  for (const msg of sentMessages) {
    await prisma.deliveryLog.create({
      data: {
        message_id: msg.id,
        user_id: demoUser.id,
        attempt: 1,
        status: 'sent',
        attempted_at: new Date(),
      },
    });
  }

  // ─── Mark the past message as sent for demo ───────────────────────────────
  const pastMessage = await prisma.scheduledMessage.findFirst({
    where: { user_id: demoUser.id, status: 'pending' },
    orderBy: { send_at: 'asc' },
  });

  if (pastMessage) {
    await prisma.scheduledMessage.update({
      where: { id: pastMessage.id },
      data: {
        status: 'sent',
        sent_at: new Date(),
      },
    });
    console.log(`[seed] Marked message ${pastMessage.id} as sent`);
  }

  console.log('[seed] Seed complete!');
  console.log('');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │  Admin: admin@chronosend.app / Admin123! │');
  console.log('  │  Demo:  demo@chronosend.app / User1234!  │');
  console.log('  └──────────────────────────────────────────┘');
  console.log('');

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
