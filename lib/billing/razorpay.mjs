import { createHmac, timingSafeEqual } from 'node:crypto';

export function mapRazorpaySubscriptionState(status) {
  if (status === 'active') return 'active';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed' || status === 'expired') return 'expired';
  if (status === 'authenticated' || status === 'created' || status === 'pending' || status === 'halted' || status === 'paused') return 'past_due';
  return 'expired';
}

export function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
  if (typeof rawBody !== 'string' || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature) || typeof secret !== 'string' || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** @param {string} path @param {{ method?: string, body?: unknown, fetchImpl?: typeof fetch }} options */
export async function razorpayRequest(path, { method = 'GET', body, fetchImpl = fetch } = {}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('RAZORPAY_NOT_CONFIGURED');
  const response = await fetchImpl(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('RAZORPAY_REQUEST_FAILED');
    error.status = response.status;
    throw error;
  }
  return result;
}
