'use server';

import crypto from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { sendAdminOtpEmail } from '@/lib/email/actions';
import { requireAdminActor } from '@/lib/auth/server';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { cookies } from 'next/headers';
import { createMfaToken, hash as hashMfa, MFA_COOKIE, MFA_MAX_AGE_SECONDS } from '@/lib/auth/server';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function requestAdminOtpAction(email: string) {
  try {
    const actor = await requireAdminActor();
    const requestedEmail = normalizeEmail(email);
    if (!requestedEmail || requestedEmail !== normalizeEmail(actor.email || '')) {
      return { success: false, error: 'Unable to start verification.' };
    }
    await enforceRateLimit(`admin-otp:${actor.uid}`, 3, 15 * 60 * 1000);

    const db = getFirestore(getFirebaseAdminApp());
    const otp = createOtp();
    const challengeId = crypto.randomBytes(24).toString('hex');
    const challengeRef = db.collection('admin_otp_challenges').doc(challengeId);
    const rateRef = db.collection('admin_otp_rate').doc(hash(requestedEmail));
    const now = Date.now();

    await db.runTransaction(async (transaction) => {
      const rateDoc = await transaction.get(rateRef);
      const lastSentAt = Number(rateDoc.data()?.lastSentAt || 0);
      if (lastSentAt && now - lastSentAt < RESEND_WINDOW_MS) throw new Error('RATE_LIMITED');
      transaction.set(rateRef, { lastSentAt: now, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      transaction.set(challengeRef, {
        emailHash: hash(requestedEmail),
        otpHash: hash(otp),
        expiresAt: now + OTP_TTL_MS,
        attempts: 0,
        consumed: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    const emailResult = await sendAdminOtpEmail(requestedEmail, otp);
    if (!emailResult.success) {
      try {
        await challengeRef.delete();
      } catch {
        await challengeRef.update({ consumed: true, expiresAt: Date.now() }).catch(() => undefined);
      }
      throw new Error('EMAIL_DELIVERY_FAILED');
    }

    return { success: true, challengeId };
  } catch {
    console.error('Admin OTP request failed.');
    return { success: false, error: 'Unable to start verification. Please try again later.' };
  }
}

export async function verifyAdminOtpAction(challengeId: string, code: string) {
  try {
    const actor = await requireAdminActor();
    if (!/^[a-f0-9]{48}$/.test(challengeId) || !/^\d{6}$/.test(code)) {
      return { success: false, error: 'Invalid verification code.' };
    }

    const db = getFirestore(getFirebaseAdminApp());
    const challengeRef = db.collection('admin_otp_challenges').doc(challengeId);
    const now = Date.now();
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(challengeRef);
      const data = snapshot.data();
      if (!snapshot.exists || !data || data.consumed || Number(data.expiresAt) < now) {
        if (snapshot.exists) transaction.delete(challengeRef);
        return false;
      }
      if (data.emailHash !== hash(normalizeEmail(actor.email || ''))) {
        transaction.delete(challengeRef);
        return false;
      }
      const attempts = Number(data.attempts || 0) + 1;
      if (attempts > MAX_ATTEMPTS) {
        transaction.delete(challengeRef);
        return false;
      }
      if (data.otpHash !== hash(code)) {
        transaction.update(challengeRef, { attempts });
        return false;
      }
      transaction.delete(challengeRef);
      return true;
    });

    if (!result) return { success: false, error: 'Invalid or expired verification code.' };

    const token = createMfaToken();
    await db.collection('admin_mfa_sessions').doc(hashMfa(token)).set({
      uid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Date.now() + MFA_MAX_AGE_SECONDS * 1000,
    });
    const cookieStore = await cookies();
    cookieStore.set(MFA_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MFA_MAX_AGE_SECONDS,
    });
    return { success: true };
  } catch {
    console.error('Admin OTP verification failed.');
    return { success: false, error: 'Unable to verify the code. Please try again later.' };
  }
}
