import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

const TTL_MS = 30 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
function hash(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }

export class DomainEmailVerificationError extends Error {
  constructor(public readonly code: 'INVALID_EMAIL' | 'MISMATCH' | 'RATE_LIMITED' | 'INVALID_TOKEN' | 'EXPIRED' | 'USED') { super(code); this.name = 'DomainEmailVerificationError'; }
}

function hostFor(value: string) {
  try { return new URL(value.startsWith('http') ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

export function domainMatchesWebsite(email: string, website: string) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const host = hostFor(website);
  return !!domain && !!host && (domain === host || domain.endsWith(`.${host}`));
}

export async function issueDomainEmailToken(input: { uid: string; businessId: string; email: string; website: string }) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainEmailVerificationError('INVALID_EMAIL');
  if (!domainMatchesWebsite(email, input.website)) throw new DomainEmailVerificationError('MISMATCH');
  const token = crypto.randomBytes(32).toString('hex');
  const db = getAdminDb();
  const rateRef = db.collection('business_domain_email_rate').doc(input.uid);
  const tokenRef = db.collection('business_domain_email_tokens').doc(hash(token));
  const now = Date.now();
  await db.runTransaction(async (transaction) => {
    const rate = await transaction.get(rateRef);
    if (Number(rate.data()?.lastSentAt || 0) > now - COOLDOWN_MS) throw new DomainEmailVerificationError('RATE_LIMITED');
    transaction.set(rateRef, { lastSentAt: now, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(tokenRef, { uid: input.uid, businessId: input.businessId, emailHash: hash(email), expiresAt: now + TTL_MS, used: false, createdAt: FieldValue.serverTimestamp() });
  });
  return { token, email, expiresAt: now + TTL_MS };
}

export async function consumeDomainEmailToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new DomainEmailVerificationError('INVALID_TOKEN');
  const db = getAdminDb();
  const tokenRef = db.collection('business_domain_email_tokens').doc(hash(token));
  const snapshot = await tokenRef.get();
  const data = snapshot.data();
  if (!snapshot.exists || !data) throw new DomainEmailVerificationError('INVALID_TOKEN');
  if (data.used) throw new DomainEmailVerificationError('USED');
  if (Number(data.expiresAt || 0) <= Date.now()) throw new DomainEmailVerificationError('EXPIRED');
  const businessRef = db.collection('businesses').doc(String(data.businessId || ''));
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(tokenRef);
    const business = await transaction.get(businessRef);
    if (!current.exists || current.data()?.used || Number(current.data()?.expiresAt || 0) <= Date.now() || !business.exists) throw new DomainEmailVerificationError('INVALID_TOKEN');
    transaction.update(tokenRef, { used: true, usedAt: FieldValue.serverTimestamp() });
    transaction.update(businessRef, {
      'verification.checks.businessDomainEmail': 'verified',
      'verification.evidence': FieldValue.arrayUnion({ evidenceType: 'business_domain_email', status: 'verified', source: 'signed_email_link', checkedAt: new Date().toISOString() }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { businessId: String(data.businessId) };
}
