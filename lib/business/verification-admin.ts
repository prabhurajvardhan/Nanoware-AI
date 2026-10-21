import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendBusinessVerificationStatusEmail } from '@/lib/email/actions';
import { createAuditEvent } from '@/lib/operations/audit-event.mjs';
import { BusinessVerificationError, type VerificationStatus } from './verification';

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
    businessName: data.name || verification.businessName || 'Unknown business',
    countryCode: verification.countryCode || verification.country || '',
    website: verification.website || '',
    accountEmail: verification.businessEmail || data.contactEmail || '',
    verificationStatus: data.verificationStatus || 'pending_verification',
    checks: verification.checks || {},
    evidence: verification.evidence || [],
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

export async function listBusinessVerificationReviews(statuses: VerificationStatus[] = ['pending_verification', 'pending_review', 'more_information_required']) {
  const snapshots = await Promise.all(statuses.map((status) => getAdminDb().collection('businesses').where('verificationStatus', '==', status).limit(100).get()));
  return snapshots.flatMap((snapshot) => snapshot.docs.map((doc) => safeReviewProjection(doc.id, doc.data())))
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export async function reviewBusinessVerification(input: {
  businessId: string;
  actorUid: string;
  action: VerificationReviewAction;
  reason: string;
}) {
  if (!SAFE_ID.test(input.businessId) || !SAFE_ID.test(input.actorUid) || !['approve', 'reject', 'request-more-info'].includes(input.action)) throw new BusinessVerificationError('INVALID_VERIFICATION_ACTION');
  const reason = cleanReason(input.reason);
  const db = getAdminDb();
  const businessRef = db.collection('businesses').doc(input.businessId);
  const result = await db.runTransaction(async (transaction) => {
    const businessSnapshot = await transaction.get(businessRef);
    if (!businessSnapshot.exists) throw new BusinessVerificationError('VERIFICATION_NOT_FOUND');
    const data = businessSnapshot.data() || {};
    const verification = data.verification || {};
    if (!['pending_verification', 'pending_review', 'more_information_required', 'rejected'].includes(data.verificationStatus)) throw new BusinessVerificationError('VERIFICATION_CONFLICT');
    const ownerId = typeof verification.submittedBy === 'string' ? verification.submittedBy : typeof data.ownerId === 'string' ? data.ownerId : '';
    const accountRef = ownerId ? db.collection('accounts').doc(ownerId) : null;
    const accountSnapshot = accountRef ? await transaction.get(accountRef) : null;
    const account = accountSnapshot?.data() || {};
    let nextStatus: VerificationStatus = 'pending_review';
    if (input.action === 'approve') {
      if (account.emailVerified !== true || verification.checks?.businessDomainEmail !== 'verified') throw new BusinessVerificationError('VERIFICATION_CONFLICT');
      nextStatus = 'verified';
    } else if (input.action === 'reject') {
      nextStatus = 'rejected';
    } else {
      nextStatus = 'more_information_required';
    }
    const now = FieldValue.serverTimestamp();
    transaction.update(businessRef, {
      verificationStatus: nextStatus,
      'verification.reviewReason': reason,
      'verification.reviewedBy': input.actorUid,
      'verification.reviewedAt': now,
      updatedAt: now,
    });
    const audit = createAuditEvent({
      environment: process.env.NODE_ENV || 'unknown',
      route: '/api/admin/business-verifications',
      correlationId: crypto.randomUUID(),
      actorClass: 'platform_admin',
      businessId: input.businessId,
      action: `business_verification.${input.action}`,
      result: 'success',
      details: { reason, nextStatus },
    });
    transaction.set(db.collection('auditEvents').doc(), audit);
    return {
      nextStatus,
      email: typeof verification.businessEmail === 'string' ? verification.businessEmail : '',
      name: typeof data.name === 'string' ? data.name : 'Business owner',
    };
  });

  if (result.email) await sendBusinessVerificationStatusEmail(result.email, result.name, result.nextStatus, reason);
  return { status: result.nextStatus, businessId: input.businessId };
}
