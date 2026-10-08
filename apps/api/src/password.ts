import { randomBytes, timingSafeEqual } from 'node:crypto';
import { argon2idAsync } from '@noble/hashes/argon2.js';

// OWASP's Argon2id baseline: 19 MiB, two iterations, one lane.
const COST = { m: 19 * 1024, t: 2, p: 1, dkLen: 32 } as const;
const PHC = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;
const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64').replace(/=+$/, '');

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const digest = await argon2idAsync(password, salt, COST);
  return `$argon2id$v=19$m=${COST.m},t=${COST.t},p=${COST.p}$${base64(salt)}$${base64(digest)}`;
}

export async function verifyPassword(encoded: string, password: string) {
  const match = PHC.exec(encoded);
  if (!match) return false;
  const [, memory, iterations, lanes, saltText, digestText] = match;
  const m = Number(memory);
  const t = Number(iterations);
  const p = Number(lanes);
  const salt = Buffer.from(saltText, 'base64');
  const expected = Buffer.from(digestText, 'base64');
  if (
    !Number.isInteger(m) ||
    m < 8 ||
    m > 65_536 ||
    !Number.isInteger(t) ||
    t < 1 ||
    t > 10 ||
    !Number.isInteger(p) ||
    p < 1 ||
    p > 4 ||
    salt.length < 8 ||
    salt.length > 64 ||
    expected.length !== 32
  )
    return false;
  const actual = Buffer.from(await argon2idAsync(password, salt, { m, t, p, dkLen: 32 }));
  return timingSafeEqual(actual, expected);
}
