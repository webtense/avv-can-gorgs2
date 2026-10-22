import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const KEY_LENGTH = 64;

/**
 * Genera un hash de contrasenya amb scrypt i una sal aleatòria.
 * Format emmagatzemat: "salt_hex:hash_hex".
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derivedKey = (await scrypt(password, salt, expected.length)) as Buffer;
  if (derivedKey.length !== expected.length) return false;
  return timingSafeEqual(derivedKey, expected);
}

export function isPasswordValid(password: string): boolean {
  return typeof password === 'string' && password.length >= 10 && password.length <= 200;
}
