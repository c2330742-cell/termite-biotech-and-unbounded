import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

function readSecret(envVar: string, fileEnvVar: string, fallback: string): string {
  if (process.env[fileEnvVar]) {
    try {
      return readFileSync(process.env[fileEnvVar]!, 'utf-8').trim();
    } catch {
      console.warn(`[config] Failed to read secret file: ${process.env[fileEnvVar]}`);
    }
  }
  return process.env[envVar] || fallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://chronosend:chronosend@localhost:5432/chronosend',
  jwtAccessSecret: readSecret('JWT_ACCESS_SECRET', 'JWT_ACCESS_SECRET_FILE', 'dev_access_secret_change_in_production'),
  jwtRefreshSecret: readSecret('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET_FILE', 'dev_refresh_secret_change_in_production'),
  credentialEncryptionKey: readSecret('CREDENTIAL_ENCRYPTION_KEY', 'CREDENTIAL_ENCRYPTION_KEY_FILE', ''),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  googleClientId: readSecret('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID_FILE', ''),
  logLevel: process.env.LOG_LEVEL || 'info',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
};

export type Config = typeof config;
