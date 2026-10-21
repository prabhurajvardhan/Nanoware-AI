import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendBusinessVerificationStatusEmail } from '@/lib/email/actions';
import { createAuditEvent } from '@/lib/operations/audit-event.mjs';
import { BusinessVerificationError, registrationKey, type VerificationStatus } from './verification';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const MAX_REASON = 1000;

export type VerificationReviewAction = 'approve' | 'reject' | 'request-more-info';

function cleanReason(reason: unknown) {
  const value = String(reason ?? '').trim();
  if (value.length < 3 || value.length > MAX_REASON || /[<>\u0000-\u001f]/.test(value)) throw new BusinessVerificationError('INVALID_VERIFICATION_ACTION');
  return value;
}

function safeReviewProjection(id: string, data: FirebaseFirestore.DocumentData) {
  const verification = data.verification || {};
  return {
    id,
    businessId: id,
    legalName: verification.legalName || data.name || 'Unknown business',
    tradeName: verification.tradeName || data.name || 'Unknown business',
    businessType: verification.businessType || 'other',
    country: verification.country || '',
    website: verification.website || '',
    businessEmail: verification.businessEmail || data.contactEmail || '',
    phone: verification.phone || '',
    registrationType: verification.registrationType || 'other',
    registrationNumber: verification.registrationNumber || '',
    address: verification.address || '',
    expectedUse: verification.expectedUse || '',
    verificationStatus: data.verificationStatus || 'not_started',
    checks: verification.checks || {},
    websiteProof: verification.websiteProof ? {
      dnsRecord: verification.websiteProof.dnsRecord || '',
      metaName: verification.websiteProof.metaName || '',
      status: verification.websiteProof.status || 'pending',
      method: verification.websiteProof.method || null,
    } : null,
    reviewReason: verification.reviewReason || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export async function listBusinessVerificationReviews(status: VerificationStatus = 'pending_review') {
  const snapshot = await getAdminDb().collection('businesses').where('verificationStatus', '==', status).limit(100).get();
  return snapshot.docs
    .map((doc) => safeReviewProjection(doc.id, doc.data()))
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export async function reviewBusinessVerification(input: {
  businessId: string;
  actorUid: string;
  action: VerificationReviewAction;
  reason: string;
  allowFreeEmail?: boolean;
}) {
  if (!SAFE_ID.test(input.businessId) || !SAFE_ID.test(input.actorUid) || !['approve', 'reject', 'request-more-info'].includes(input.action)) {
    throw new BusinessVerificationError('INVALID_VERIFICATION_ACTION');
  }
  const reason = cleanReason(input.reason);
  const db = getAdminDb();
  const businessRef = db.collection('businesses').doc(input.businessId);
  const result = await db.runTransaction(async (transaction) => {
    const businessSnapshot = await transaction.get(businessRef);
    if (!businessSnapshot.exists) throw new BusinessVerificationError('VERIFICATION_NOT_FOUND');
    const data = businessSnapshot.data() || {};
    const verification = data.verification || {};
    if (!['pending_review', 'rejected'].includes(data.verificationStatus)) throw new BusinessVerificationError('VERIFICATION_CONFLICT');
    const registrationNumber = typeof verification.registrationNumber === 'string' ? verification.registrationNumber : '';
    const country = typeof verification.country === 'string' ? verification.country : '';
    const registrationRef = registrationNumber && country
      ? db.collection('business_registration_keys').doc(registrationKey(country, registrationNumber))
      : null;
    const now = FieldValue.serverTimestamp();
    let nextStatus: VerificationStatus = 'pending_review';
    if (input.action === 'approve') {
      if (verification.emailDomainIsFree && input.allowFreeEmail !== true) throw new BusinessVerificationError('FREE_EMAIL_NOT_ALLOWED');
      if (verification.checks?.registrationFormatValid !== true || verification.checks?.websiteOwnership !== 'verified') {
        throw new BusinessVerificationError('WEBSITE_OWNERSHIP_UNVERIFIED');
      }
      nextStatus = 'verified';
    } else if (input.action === 'reject') {
      nextStatus = 'rejected';
    }
    transaction.update(businessRef, {
      verificationStatus: nextStatus,
      'verification.reviewReason': reason,
      'verification.reviewedBy': input.actorUid,
      'verification.reviewedAt': now,
      updatedAt: now,
    });
    if (registrationRef) transaction.set(registrationRef, { status: nextStatus, updatedAt: now }, { merge: true });
    const audit = createAuditEvent({
      environment: process.env.NODE_ENV || 'unknown',
      route: '/api/admin/business-verifications',
      correlationId: crypto.randomUUID(),
      actorClass: 'platform_admin',
      businessId: input.businessId,
      action: `business_verification.${input.action}`,
      result: 'success',
      details: { reason, nextStatus, freeEmailOverride: input.allowFreeEmail === true },
    });
    transaction.set(db.collection('auditEvents').doc(), audit);
    return { nextStatus, email: typeof verification.businessEmail === 'string' ? verification.businessEmail : '', name: typeof verification.tradeName === 'string' ? verification.tradeName : data.name || 'Business owner' };
  });

  if (result.email) {
    await sendBusinessVerificationStatusEmail(result.email, result.name, result.nextStatus === 'pending_review' ? 'pending_review' : result.nextStatus, reason);
  }
  return { status: result.nextStatus, businessId: input.businessId };
}
