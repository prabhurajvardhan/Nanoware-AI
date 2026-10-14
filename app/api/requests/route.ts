import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendSolutionRequestEmails } from '@/lib/email/actions';
import { validatePublicRequest } from '@/lib/security/validation.mjs';
import { acquireLocalConcurrency, enforceRateLimit, rateLimitResponse, trustedClientKey } from '@/lib/security/rate-limit';

function keyHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

const CLAIM_TTL_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  const release = acquireLocalConcurrency();
  try {
    await enforceRateLimit(trustedClientKey(request, 'public-request'), 5, 60 * 60 * 1000);
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const idempotencyKey = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) return NextResponse.json({ error: 'A valid idempotency key is required.' }, { status: 400 });
    const data = validatePublicRequest({
      name: input.name,
      email: input.email,
      company: input.company,
      service: input.service,
      details: input.details,
    });
    const fingerprint = keyHash(JSON.stringify(data));
    const db = getAdminDb();
    const idempotencyRef = db.collection('request_idempotency').doc(keyHash(idempotencyKey));
    const requestRef = db.collection('requests').doc();

    const reservation = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(idempotencyRef);
      if (existing.exists) {
        const previous = existing.data() || {};
        if (previous.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_CONFLICT');
        if (previous.emailSent) return { requestId: String(previous.requestId), state: 'complete' as const };
        const claimedAt = Number(previous.emailClaimedAt || 0);
        if (claimedAt && Date.now() - claimedAt < CLAIM_TTL_MS) {
          return { requestId: String(previous.requestId), state: 'processing' as const };
        }
        transaction.update(idempotencyRef, { emailClaimedAt: Date.now() });
        return { requestId: String(previous.requestId), state: 'send' as const };
      }
      transaction.set(requestRef, {
        name: data.name,
        email: data.email,
        company: data.company,
        projectType: data.service,
        description: data.details,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.create(idempotencyRef, {
        requestId: requestRef.id,
        fingerprint,
        emailSent: false,
        emailClaimedAt: Date.now(),
        createdAt: FieldValue.serverTimestamp(),
      });
      return { requestId: requestRef.id, state: 'send' as const };
    });

    if (reservation.state === 'processing') {
      return NextResponse.json({ success: true, requestId: reservation.requestId, status: 'processing' }, { status: 202 });
    }
    if (reservation.state === 'send') {
      const emailResult = await sendSolutionRequestEmails(data.email, data.name, data.service, data.details);
      if (!emailResult.success) {
        await idempotencyRef.update({ emailClaimedAt: null }).catch(() => undefined);
        return NextResponse.json({ error: 'Request received, but notification delivery is temporarily unavailable.' }, { status: 202 });
      }
      await idempotencyRef.update({ emailSent: true, emailSentAt: FieldValue.serverTimestamp(), emailClaimedAt: null });
    }

    return NextResponse.json({ success: true, requestId: reservation.requestId, status: 'received' }, { status: reservation.state === 'complete' ? 200 : 201 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT') {
      return NextResponse.json({ error: 'Idempotency key was already used for different request data.' }, { status: 409 });
    }
    console.error('Public request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to submit the request.' }, { status: 400 });
  } finally {
    release();
  }
}
