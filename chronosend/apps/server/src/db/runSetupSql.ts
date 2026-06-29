import { readFileSync } from 'fs';
import { resolve } from 'path';
import prisma from './client';

// Runs supplementary SQL (views, extensions) after Prisma migrations.
// Called once on server startup.

const SERVER_ROOT = resolve(__dirname, '../..');
const SETUP_SQL_PATH = resolve(SERVER_ROOT, 'src/db/setup.sql');

export async function runSetupSql(): Promise<void> {
  try {
    const sql = readFileSync(SETUP_SQL_PATH, 'utf-8');
    // Split on semicolons and execute each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement + ';');
    }
    console.log('[setup] Supplementary SQL applied successfully.');
  } catch (err) {
    // View may already exist — not a fatal error
    console.warn('[setup] Supplementary SQL warning:', (err as Error).message);
  }
}
