import { getAdminDb } from '@/lib/firebase-admin';
import { canUsePaidTools } from '@/lib/billing/config';
import { requireBusinessActor } from '@/lib/tenant/server';
import { AuthBoundaryError } from '@/lib/auth/server';

export async function requirePaidBusinessTool() {
  const actor = await requireBusinessActor();
  if (!canUsePaidTools(actor.business.subscription?.state)) throw new AuthBoundaryError('FORBIDDEN');
  return actor;
}

export async function getBusinessBilling(businessId: string) {
  const snapshot = await getAdminDb().collection('businesses').doc(businessId).get();
  return snapshot.data()?.subscription || null;
}
