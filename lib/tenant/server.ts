import { getAdminDb } from '@/lib/firebase-admin';
import { requireEmailVerifiedSession, AuthBoundaryError } from '@/lib/auth/server';

export type BusinessRole = 'owner' | 'admin' | 'member' | 'operator';
export type BusinessActor = { uid: string; businessId: string; role: BusinessRole; business: FirebaseFirestore.DocumentData };

export async function requireBusinessActor(allowedRoles: BusinessRole[] = ['owner', 'admin', 'member', 'operator'], requestedBusinessId?: string): Promise<BusinessActor> {
  const session = await requireEmailVerifiedSession();
  const db = getAdminDb();
  const memberships = requestedBusinessId
    ? [await db.collection('memberships').doc(`${requestedBusinessId}__${session.uid}`).get()]
    : (await db.collection('memberships').where('userId', '==', session.uid).where('status', '==', 'active').limit(20).get()).docs;
  const membership = memberships.find((doc) => doc.exists && doc.data()?.userId === session.uid && doc.data()?.status === 'active' && allowedRoles.includes(doc.data()?.role));
  if (!membership) throw new AuthBoundaryError('FORBIDDEN');
  const membershipData = membership.data()!;
  const businessId = String(membershipData.businessId || '');
  const business = await db.collection('businesses').doc(businessId).get();
  if (!business.exists || business.data()?.status === 'suspended' || business.data()?.verificationStatus !== 'verified') throw new AuthBoundaryError('FORBIDDEN');
  return { uid: session.uid, businessId, role: membershipData.role as BusinessRole, business: business.data() || {} };
}

export function canManageBilling(role: BusinessRole) {
  return role === 'owner' || role === 'admin';
}
