import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const BUSINESS_ROLES = ['owner', 'admin', 'member'] as const;
export type BusinessRole = (typeof BUSINESS_ROLES)[number];

function isBusinessRole(value: unknown): value is BusinessRole {
  return typeof value === 'string' && (BUSINESS_ROLES as readonly string[]).includes(value);
}

export class BusinessAccessError extends Error {
  constructor(public readonly code: 'BUSINESS_FORBIDDEN' | 'BUSINESS_NOT_FOUND' | 'INVALID_BUSINESS_PROFILE' | 'BUSINESS_ALREADY_OWNED') {
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
};

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function membershipId(businessId: string, userId: string) {
  if (!SAFE_ID.test(businessId) || !SAFE_ID.test(userId)) throw new BusinessAccessError('BUSINESS_FORBIDDEN');
  return `${businessId}__${userId}`;
}

function businessSummary(businessId: string, data: FirebaseFirestore.DocumentData, membership: FirebaseFirestore.DocumentData): BusinessMembership {
  if (!isBusinessRole(membership.role)) throw new BusinessAccessError('BUSINESS_FORBIDDEN');
  return {
    membershipId: membership.id,
    businessId,
    userId: membership.userId,
    role: membership.role,
    status: 'active',
    businessName: data.name,
    businessStatus: data.status,
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

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,  sixtyFour());
}

function sixtyFour() { return 64; }

export async function createInitialBusiness(input: { userId: string; email: string; name: string; timezone: string }) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100 || input.timezone.length > 64) {
    throw new BusinessAccessError('INVALID_BUSINESS_PROFILE');
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: input.timezone }).format();
  } catch {
    throw new BusinessAccessError('INVALID_BUSINESS_PROFILE');
  }

  const db = getAdminDb();
  const businessId = `business_${input.userId}`;
  const membership = membershipId(businessId, input.userId);
  const businessRef = db.collection('businesses').doc(businessId);
  const membershipRef = db.collection('memberships').doc(membership);

  await db.runTransaction(async (transaction) => {
    const [businessDoc, membershipDoc, legacyProjects] = await Promise.all([
      transaction.get(businessRef),
      transaction.get(membershipRef),
      transaction.get(db.collection('projects').where('userId', '==', input.userId)),
    ]);

    if (membershipDoc.exists) return;
    if (businessDoc.exists && businessDoc.data()?.ownerId !== input.userId) {
      throw new BusinessAccessError('BUSINESS_ALREADY_OWNED');
    }

    const now = FieldValue.serverTimestamp();
    transaction.set(businessRef, {
      name,
      slug: slugify(name),
      ownerId: input.userId,
      status: 'active',
      timezone: input.timezone,
      contactEmail: input.email,
      createdAt: businessDoc.exists ? businessDoc.data()?.createdAt : now,
      updatedAt: now,
    }, { merge: true });
    transaction.set(membershipRef, {
      businessId,
      userId: input.userId,
      role: 'owner',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    for (const project of legacyProjects.docs) {
      if (!project.data().businessId) transaction.update(project.ref, { businessId, updatedAt: now });
    }
  });

  return requireBusinessMembership(input.userId, businessId);
}
