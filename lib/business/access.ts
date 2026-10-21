import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  BusinessVerificationError,
  checkWebsiteOwnership,
  createWebsiteProof,
  registrationKey,
  type VerificationInput,
  type VerificationStatus,
  validateVerificationInput,
} from './verification';
import { invalidateDomainEmailTokens } from './domain-email-verification';

export const BUSINESS_ROLES = ['owner', 'admin', 'member'] as const;
export type BusinessRole = (typeof BUSINESS_ROLES)[number];

function isBusinessRole(value: unknown): value is BusinessRole {
  return typeof value === 'string' && (BUSINESS_ROLES as readonly string[]).includes(value);
}

export class BusinessAccessError extends Error {
  constructor(public readonly code: 'BUSINESS_FORBIDDEN' | 'BUSINESS_NOT_FOUND' | 'INVALID_BUSINESS_PROFILE' | 'BUSINESS_ALREADY_OWNED' | 'BUSINESS_PENDING_VERIFICATION') {
    super(code);
    this.name = 'BusinessAccessError';
  }
}

export type BusinessMembership = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: BusinessRole;
  status: 'active';
  businessName: string;
  businessStatus: string;
  verificationStatus: VerificationStatus;
  subscriptionState: string | null;
};

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function membershipId(businessId: string, userId: string) {
  if (!SAFE_ID.test(businessId) || !SAFE_ID.test(userId)) throw new BusinessAccessError('BUSINESS_FORBIDDEN');
  return `${businessId}__${userId}`;
}

function verificationStatus(data: FirebaseFirestore.DocumentData): VerificationStatus {
  if (['not_started', 'pending_verification', 'pending_review', 'verified', 'more_information_required', 'rejected', 'suspended'].includes(data.verificationStatus)) return data.verificationStatus;
  // Missing verification is intentionally not trusted; a later migration may write an explicit decision.
  return 'pending_verification';
}

function businessSummary(businessId: string, data: FirebaseFirestore.DocumentData, membership: FirebaseFirestore.DocumentData): BusinessMembership {
  if (!isBusinessRole(membership.role)) throw new BusinessAccessError('BUSINESS_FORBIDDEN');
  return {
    membershipId: membership.id,
    businessId,
    userId: membership.userId,
    role: membership.role,
    status: 'active',
    businessName: typeof data.name === 'string' ? data.name : 'Business',
    businessStatus: typeof data.status === 'string' ? data.status : 'active',
    verificationStatus: verificationStatus(data),
    subscriptionState: typeof data.subscription?.state === 'string' ? data.subscription.state : null,
  };
}

export async function listBusinessMemberships(userId: string): Promise<BusinessMembership[]> {
  const db = getAdminDb();
  const snapshot = await db.collection('memberships').where('userId', '==', userId).where('status', '==', 'active').get();
  if (snapshot.empty) return [];

  const businesses = await Promise.all(snapshot.docs.map(async (membershipDoc) => {
    const membership = membershipDoc.data();
    const businessDoc = await db.collection('businesses').doc(membership.businessId).get();
    if (!businessDoc.exists || businessDoc.data()?.status === 'suspended') return null;
    return businessSummary(businessDoc.id, businessDoc.data()!, { ...membership, id: membershipDoc.id });
  }));
  return businesses.filter((business): business is BusinessMembership => business !== null);
}

export async function requireBusinessMembership(userId: string, businessId: string, roles?: readonly BusinessRole[]) {
  const db = getAdminDb();
  const membershipDoc = await db.collection('memberships').doc(membershipId(businessId, userId)).get();
  const membership = membershipDoc.data();
  if (!membershipDoc.exists || membership?.userId !== userId || membership.status !== 'active' || !isBusinessRole(membership.role)) {
    throw new BusinessAccessError('BUSINESS_FORBIDDEN');
  }
  if (roles && !roles.includes(membership.role)) throw new BusinessAccessError('BUSINESS_FORBIDDEN');
  const businessDoc = await db.collection('businesses').doc(businessId).get();
  if (!businessDoc.exists || businessDoc.data()?.status === 'suspended') throw new BusinessAccessError('BUSINESS_NOT_FOUND');
  return businessSummary(businessId, businessDoc.data()!, { ...membership, id: membershipDoc.id });
}

export async function requireVerifiedBusinessMembership(userId: string, businessId: string, roles?: readonly BusinessRole[]) {
  const business = await requireBusinessMembership(userId, businessId, roles);
  if (business.verificationStatus !== 'verified') throw new BusinessAccessError('BUSINESS_PENDING_VERIFICATION');
  return business;
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, sixtyFour());
}

function sixtyFour() { return 64; }

export async function createInitialBusiness(input: { userId: string; email: string } & Partial<VerificationInput>) {
  const verification = validateVerificationInput(input, input.email);
  const db = getAdminDb();
  const businessId = `business_${input.userId}`;
  const membership = membershipId(businessId, input.userId);
  const businessRef = db.collection('businesses').doc(businessId);
  const membershipRef = db.collection('memberships').doc(membership);
  const registrationRef = verification.registrationNumber
    ? db.collection('business_registration_keys').doc(registrationKey(verification.countryCode, verification.registrationNumber))
    : null;

  const existingBusiness = await businessRef.get();
  if (existingBusiness.exists && existingBusiness.data()?.ownerId !== input.userId) throw new BusinessAccessError('BUSINESS_ALREADY_OWNED');
  if (existingBusiness.exists && existingBusiness.data()?.verificationStatus === 'rejected') throw new BusinessVerificationError('REGISTRATION_REJECTED');
  if (existingBusiness.exists && existingBusiness.data()?.verification && ['pending_verification', 'pending_review', 'more_information_required'].includes(existingBusiness.data()?.verificationStatus)) {
    const existingVerification = existingBusiness.data()?.verification;
    if (String(existingVerification?.businessEmail || '').toLowerCase() !== verification.businessEmail.toLowerCase()) {
      await invalidateDomainEmailTokens(input.userId, businessId);
      await businessRef.update({
        contactEmail: verification.businessEmail,
        'verification.businessEmail': verification.businessEmail,
        'verification.emailDomain': verification.emailDomain,
        'verification.emailDomainIsFree': verification.emailDomainIsFree,
        'verification.checks.businessDomainEmail': 'pending',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const existingProof = existingVerification?.websiteProof;
    if (existingProof?.token && existingVerification?.website) {
      const refreshedCheck = await checkWebsiteOwnership(existingVerification.website, existingProof);
      if (refreshedCheck.status === 'verified' && existingVerification.checks?.websiteOwnership !== 'verified') {
        await businessRef.update({
          'verification.websiteProof.status': refreshedCheck.status,
          'verification.websiteProof.method': refreshedCheck.method,
          'verification.websiteProof.checkedAt': FieldValue.serverTimestamp(),
          'verification.checks.websiteOwnership': refreshedCheck.status,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    return requireBusinessMembership(input.userId, businessId);
  }

  const proof = createWebsiteProof();
  const websiteCheck = await checkWebsiteOwnership(verification.website, proof);

  await db.runTransaction(async (transaction) => {
    const [businessDoc, membershipDoc, legacyProjects] = await Promise.all([
      transaction.get(businessRef),
      transaction.get(membershipRef),
      transaction.get(db.collection('projects').where('userId', '==', input.userId)),
    ]);
    const registrationDoc = registrationRef ? await transaction.get(registrationRef) : null;

    const existingBusinessData = businessDoc.data();
    const existingVerification = existingBusinessData?.verification;
    const currentStatus = existingBusinessData?.verificationStatus;
    if (businessDoc.exists && existingBusinessData?.ownerId !== input.userId) throw new BusinessAccessError('BUSINESS_ALREADY_OWNED');
    if (currentStatus === 'rejected') throw new BusinessVerificationError('REGISTRATION_REJECTED');
    const isPendingOrTerminal = ['pending_verification', 'pending_review', 'verified', 'more_information_required', 'rejected', 'suspended'].includes(currentStatus);
    if (membershipDoc.exists && businessDoc.exists && existingVerification && isPendingOrTerminal) {
      return;
    }
    const registration = registrationDoc?.data();
    if (registrationDoc?.exists && registration?.businessId !== businessId) {
      if (registration?.status === 'rejected') throw new BusinessVerificationError('REGISTRATION_REJECTED');
      throw new BusinessVerificationError('REGISTRATION_ALREADY_USED');
    }
    const isLegacySubmission = businessDoc.exists && currentStatus == null;
    if (isLegacySubmission && (!membershipDoc.exists || membershipDoc.data()?.userId !== input.userId || membershipDoc.data()?.role !== 'owner' || membershipDoc.data()?.status !== 'active')) {
      throw new BusinessAccessError('BUSINESS_FORBIDDEN');
    }

    const now = FieldValue.serverTimestamp();
    const businessData: FirebaseFirestore.DocumentData = {
      ...(businessDoc.exists ? {} : {
        name: verification.tradeName,
        slug: slugify(verification.tradeName),
        ownerId: input.userId,
        status: 'active',
        timezone: verification.countryCode === 'IN' ? 'Asia/Kolkata' : 'UTC',
        createdAt: now,
      }),
      verificationStatus: 'pending_verification',
      contactEmail: verification.businessEmail,
      verification: {
        ...verification,
        submittedBy: input.userId,
        websiteProof: { ...proof, status: websiteCheck.status, method: websiteCheck.method, checkedAt: now },
        checks: {
          accountEmail: 'verified',
          phone: 'pending',
          websiteOwnership: websiteCheck.status,
          businessDomainEmail: 'pending',
          googleBusinessProfile: 'not_provided',
        },
        evidence: [{ evidenceType: 'website_ownership', status: websiteCheck.status, source: websiteCheck.method || 'unavailable', checkedAt: now }],
        reviewReason: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      updatedAt: now,
    };
    transaction.set(businessRef, businessData, { merge: true });
    if (!businessDoc.exists) transaction.set(membershipRef, {
      businessId,
      userId: input.userId,
      role: 'owner',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    if (registrationRef) transaction.set(registrationRef, {
      businessId,
      userId: input.userId,
      country: verification.countryCode,
      registrationType: verification.registrationType,
      status: 'pending_review',
      createdAt: registrationDoc?.exists ? registration?.createdAt : now,
      updatedAt: now,
    }, { merge: true });

    if (!businessDoc.exists) {
      for (const project of legacyProjects.docs) {
        if (!project.data().businessId) transaction.update(project.ref, { businessId, updatedAt: now });
      }
    }
  });

  return requireBusinessMembership(input.userId, businessId);
}
