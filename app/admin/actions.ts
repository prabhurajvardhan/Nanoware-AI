'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { sendRequestAcceptedEmail } from '@/lib/email/actions';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdminActor } from '@/lib/auth/server';

export async function sendAcceptedEmailAction(requestId: string) {
  try {
    const actor = await requireAdminActor({ requireMfa: true });
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(requestId)) return { success: false, error: 'Invalid request.' };

    const requestRef = getAdminDb().collection('requests').doc(requestId);
    const claim = await getAdminDb().runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestRef);
      if (!requestSnapshot.exists) return { state: 'missing' as const };
      const data = requestSnapshot.data() || {};
      if (data.status === 'accepted' || data.acceptanceState === 'sent') return { state: 'complete' as const };
      if (data.acceptanceState === 'sending' && Number(data.acceptanceClaimedAt || 0) > Date.now() - 5 * 60 * 1000) {
        return { state: 'processing' as const };
      }
      transaction.update(requestRef, {
        acceptanceState: 'sending',
        acceptanceClaimedAt: Date.now(),
        acceptanceClaimedBy: actor.uid,
      });
      return { state: 'send' as const, data };
    });
    if (claim.state === 'missing') return { success: false, error: 'Request not found.' };
    if (claim.state === 'complete') return { success: true };
    if (claim.state === 'processing') return { success: false, error: 'This request is already being processed.' };
    const data = claim.data;

    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const service = typeof data.projectType === 'string' ? data.projectType.trim() : 'Custom Solution';
    if (!email || !name || email.length > 254 || name.length > 120 || service.length > 80) {
      return { success: false, error: 'Request data is invalid.' };
    }

    const result = await sendRequestAcceptedEmail(email, name, service);
    if (!result?.success) {
      await requestRef.update({ acceptanceState: 'failed', acceptanceClaimedAt: null }).catch(() => undefined);
      return { success: false, error: 'Unable to send the acceptance email.' };
    }

    await requestRef.update({ status: 'accepted', acceptanceState: 'sent', acceptedAt: FieldValue.serverTimestamp(), acceptedBy: actor.uid, acceptanceClaimedAt: null });
    return { success: true };
  } catch {
    console.error('Accepted request action failed.');
    return { success: false, error: 'Unable to process the request.' };
  }
}
