import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = config.credentialEncryptionKey;
  if (!key || key.length < 64) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be at least 64 hex characters (32 bytes)');
  }
  return Buffer.from(key.slice(0, 64), 'hex');
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getKey();
  const iv = Buffer.from(data.iv, 'hex');
  const tag = Buffer.from(data.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function encryptJson(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj);
  const result = encrypt(json);
  return JSON.stringify(result);
}

export function decryptToJson<T = Record<string, unknown>>(encoded: string): T {
  const data: EncryptedData = JSON.parse(encoded);
  const json = decrypt(data);
  return JSON.parse(json) as T;
}
