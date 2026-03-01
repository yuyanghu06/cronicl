import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  // Always compute scrypt to prevent timing oracle on malformed hashes
  const dummySalt = salt || '0000000000000000';
  const derived = (await scryptAsync(password, dummySalt, 64)) as Buffer;
  if (!salt || !hash) return false;
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), derived);
  } catch {
    // Buffer length mismatch (corrupted hash) — reject without leaking info
    return false;
  }
}
