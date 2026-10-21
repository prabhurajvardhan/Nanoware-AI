import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, getFirebaseAdminApp } from '@/lib/firebase-admin';

const TOKEN_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const TOKEN_BYTES = 32;

export class EmailVerificationError extends Error {
  constructor(public readonly code: 'RATE_LIMITED' | 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'TOKEN_USED' | 'ACCOUNT_NOT_FOUND' | 'DELIVERY_UNAVAILABLE') {
    super(code);
    this.name = 'EmailVerificationError';
  }
}

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function issueEmailVerificationToken(input: { uid: string; email: string }) {
  const db = getAdminDb();
  const accountRef = db.collection('accounts').doc(input.uid);
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenRef = db.collection('email_verification_tokens').doc(hash(token));
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const account = await transaction.get(accountRef);
    if (account.exists && account.data()?.emailVerified === true) throw new EmailVerificationError('TOKEN_USED');
    const rateRef = db.collection('email_verification_rate').doc(input.uid);
    const rate = await transaction.get(rateRef);
    const lastSentAt = Number(rate.data()?.lastSentAt || 0);
    if (lastSentAt && now - lastSentAt < RESEND_COOLDOWN_MS) throw new EmailVerificationError('RATE_LIMITED');
    transaction.set(rateRef, { lastSentAt: now, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(accountRef, {
      uid: input.uid,
      email: input.email.toLowerCase(),
      emailVerified: false,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(tokenRef, {
      uid: input.uid,
      emailHash: hash(input.email.toLowerCase()),
      expiresAt: now + TOKEN_TTL_MS,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { token, expiresAt: now + TOKEN_TTL_MS };
}

export async function consumeEmailVerificationToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new EmailVerificationError('INVALID_TOKEN');
  const db = getAdminDb();
  const tokenRef = db.collection('email_verification_tokens').doc(hash(token));
  const tokenSnapshot = await tokenRef.get();
  const tokenData = tokenSnapshot.data();
  if (!tokenSnapshot.exists || !tokenData) throw new EmailVerificationError('INVALID_TOKEN');
  if (tokenData.used) throw new EmailVerificationError('TOKEN_USED');
  if (Number(tokenData.expiresAt || 0) <= Date.now()) throw new EmailVerificationError('TOKEN_EXPIRED');
  const uid = typeof tokenData.uid === 'string' ? tokenData.uid : '';
  if (!uid) throw new EmailVerificationError('INVALID_TOKEN');
  let currentEmail = '';

  try {
    const currentUser = await getAuth(getFirebaseAdminApp()).getUser(uid);
    currentEmail = currentUser.email?.toLowerCase() || '';
    if (!currentEmail || tokenData.emailHash !== hash(currentEmail) || currentUser.emailVerified === true) throw new EmailVerificationError('INVALID_TOKEN');
    await getAuth(getFirebaseAdminApp()).updateUser(uid, { emailVerified: true });
  } catch {
    if (currentEmail) throw new EmailVerificationError('INVALID_TOKEN');
    throw new EmailVerificationError('ACCOUNT_NOT_FOUND');
  }

  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(tokenRef);
    const currentData = current.data();
    if (!current.exists || !currentData || currentData.used || Number(currentData.expiresAt || 0) <= Date.now()) {
      throw new EmailVerificationError(currentData?.used ? 'TOKEN_USED' : 'TOKEN_EXPIRED');
    }
    transaction.update(tokenRef, { used: true, usedAt: FieldValue.serverTimestamp() });
    transaction.set(db.collection('accounts').doc(uid), {
      uid,
      emailVerified: true,
      emailVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  return { uid };
}

export async function invalidateEmailVerificationToken(token: string, uid: string) {
  const db = getAdminDb();
  await db.collection('email_verification_tokens').doc(hash(token)).delete().catch(() => undefined);
  await db.collection('email_verification_rate').doc(uid).delete().catch(() => undefined);
}

export async function isEmailVerified(uid: string) {
  try {
    const user = await getAuth(getFirebaseAdminApp()).getUser(uid);
    return user.emailVerified === true;
  } catch {
    return false;
  }
}
