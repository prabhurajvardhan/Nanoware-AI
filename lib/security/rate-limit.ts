import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { RateLimitError } from './concurrency.mjs';
export { acquireLocalConcurrency, RateLimitError, rateLimitResponse } from './concurrency.mjs';

export function trustedClientKey(request: NextRequest, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const trustedProxy = process.env.TRUSTED_PROXY_IP_HEADER === 'x-forwarded-for';
  const source = trustedProxy && forwarded ? forwarded.split(',')[0].trim() : 'untrusted-client';
  return `${scope}:${source || 'unknown'}`;
}

function digest(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function enforceRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const ref = getAdminDb().collection('security_rate_limits').doc(digest(`${key}:${bucket}`));
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const count = Number(snapshot.data()?.count || 0);
    if (count >= maxAttempts) throw new RateLimitError(Math.ceil(((bucket + 1) * windowMs - now) / 1000));
    transaction.set(ref, { count: count + 1, scopeHash: digest(key), bucket, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}
