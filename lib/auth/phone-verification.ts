import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const COUNTRY_CALLING_CODES: Record<string, string> = { US: '1', CA: '1', AU: '61', GB: '44', IN: '91' };

export class PhoneVerificationError extends Error {
  constructor(public readonly code: 'INVALID_PHONE' | 'PROVIDER_UNAVAILABLE' | 'RATE_LIMITED' | 'INVALID_CODE' | 'EXPIRED' | 'ATTEMPTS_EXCEEDED' | 'PHONE_REUSED' | 'SEND_FAILED') {
    super(code);
    this.name = 'PhoneVerificationError';
  }
}

function hash(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }

export function normalizePhone(countryCode: string, raw: string) {
  const value = String(raw || '').trim();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new PhoneVerificationError('INVALID_PHONE');
  const digits = value.replace(/[()\s-]/g, '');
  const withCountry = digits.startsWith('+') ? digits.slice(1) : `${COUNTRY_CALLING_CODES[countryCode] || ''}${digits.replace(/^0+/, '')}`;
  if (!/^\d{8,15}$/.test(withCountry) || withCountry.startsWith('0')) throw new PhoneVerificationError('INVALID_PHONE');
  return `+${withCountry}`;
}

function providerConfigured() {
  return process.env.SMS_PROVIDER === 'twilio' && !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_FROM_NUMBER;
}

async function sendSms(to: string, code: string) {
  if (!providerConfigured()) throw new PhoneVerificationError('PROVIDER_UNAVAILABLE');
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER!, Body: `Nanoware AI verification code: ${code}. It expires in 10 minutes.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID!)}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new PhoneVerificationError('SEND_FAILED');
}

export async function issuePhoneOtp(input: { uid: string; countryCode: string; phone: string }) {
  const normalizedPhone = normalizePhone(input.countryCode, input.phone);
  if (!providerConfigured()) throw new PhoneVerificationError('PROVIDER_UNAVAILABLE');
  const db = getAdminDb();
  const challengeRef = db.collection('phone_verification_challenges').doc(input.uid);
  const now = Date.now();
  const code = crypto.randomInt(100000, 1000000).toString();
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(challengeRef);
    const lastSentAt = Number(current.data()?.sentAt || 0);
    if (lastSentAt && now - lastSentAt < RESEND_COOLDOWN_MS) throw new PhoneVerificationError('RATE_LIMITED');
    transaction.set(challengeRef, { uid: input.uid, phoneHash: hash(normalizedPhone), codeHash: hash(code), expiresAt: now + OTP_TTL_MS, sentAt: now, attempts: 0, consumed: false, updatedAt: FieldValue.serverTimestamp() });
  });
  try {
    await sendSms(normalizedPhone, code);
  } catch (error) {
    await challengeRef.delete().catch(() => undefined);
    throw error;
  }
  return { expiresAt: now + OTP_TTL_MS, phone: normalizedPhone.slice(0, 4) + '••••' + normalizedPhone.slice(-2) };
}

export async function consumePhoneOtp(input: { uid: string; code: string }) {
  if (!/^\d{6}$/.test(input.code)) throw new PhoneVerificationError('INVALID_CODE');
  const db = getAdminDb();
  const challengeRef = db.collection('phone_verification_challenges').doc(input.uid);
  const result = await db.runTransaction(async (transaction) => {
    const challenge = await transaction.get(challengeRef);
    const data = challenge.data();
    if (!challenge.exists || !data || data.consumed || Number(data.expiresAt || 0) <= Date.now()) throw new PhoneVerificationError('EXPIRED');
    const attempts = Number(data.attempts || 0) + 1;
    if (attempts > MAX_ATTEMPTS) throw new PhoneVerificationError('ATTEMPTS_EXCEEDED');
    if (data.codeHash !== hash(input.code)) {
      transaction.update(challengeRef, { attempts, updatedAt: FieldValue.serverTimestamp() });
      throw new PhoneVerificationError('INVALID_CODE');
    }
    const phoneKeyRef = db.collection('verified_phone_keys').doc(data.phoneHash);
    const phoneKey = await transaction.get(phoneKeyRef);
    if (phoneKey.exists && phoneKey.data()?.uid !== input.uid) throw new PhoneVerificationError('PHONE_REUSED');
    transaction.update(challengeRef, { consumed: true, verifiedAt: FieldValue.serverTimestamp() });
    transaction.set(phoneKeyRef, { uid: input.uid, verifiedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(db.collection('accounts').doc(input.uid), { phoneVerification: { status: 'verified', phoneHash: data.phoneHash, verifiedAt: FieldValue.serverTimestamp() }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
  await db.collection('businesses').doc(`business_${input.uid}`).update({
    'verification.checks.phone': 'verified',
    updatedAt: FieldValue.serverTimestamp(),
  }).catch(() => undefined);
  return result;
}
