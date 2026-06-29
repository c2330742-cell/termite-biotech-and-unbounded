import { execSync } from 'child_process';
import path from 'path';
import { runSetupSql } from './runSetupSql';

// Migration runner — applies pending Prisma migrations and runs
// any supplementary SQL (e.g., the v_message_stats view).

const SERVER_DIR = path.resolve(__dirname, '../..');

async function migrate(): Promise<void> {
  const env = process.env.NODE_ENV || 'development';
  console.log(`[migrate] Environment: ${env}`);

  try {
    if (env === 'production' || env === 'test') {
      // In production/test, just deploy what's in the migrations folder
      execSync('npx prisma migrate deploy', {
        cwd: SERVER_DIR,
        stdio: 'inherit',
        env: { ...process.env },
      });
    } else {
      // In development, create the initial migration if it doesn't exist
      try {
        execSync('npx prisma migrate dev --name init', {
          cwd: SERVER_DIR,
          stdio: 'inherit',
          env: { ...process.env },
        });
      } catch {
        // Migration may already exist; try deploy
        execSync('npx prisma migrate deploy', {
          cwd: SERVER_DIR,
          stdio: 'inherit',
          env: { ...process.env },
        });
      }
    }

    console.log('[migrate] Prisma migrations applied.');

    // Apply supplementary SQL (views, extensions)
    await runSetupSql();

    console.log('[migrate] All migrations applied successfully.');
  } catch (err) {
    console.error('[migrate] Migration failed:', err);
    process.exit(1);
  }
}

migrate();
