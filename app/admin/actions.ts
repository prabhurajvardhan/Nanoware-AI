'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { sendRequestAcceptedEmail } from '@/lib/email/actions';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdminActor } from '@/lib/auth/server';

export async function sendAcceptedEmailAction(requestId: string) {
  try {
    const actor = await requireAdminActor();
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(requestId)) return { success: false, error: 'Invalid request.' };

    const requestRef = getAdminDb().collection('requests').doc(requestId);
    const requestSnapshot = await requestRef.get();
    if (!requestSnapshot.exists) return { success: false, error: 'Request not found.' };
    const data = requestSnapshot.data() || {};
    if (data.status === 'accepted') return { success: true };

    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const service = typeof data.projectType === 'string' ? data.projectType.trim() : 'Custom Solution';
    if (!email || !name || email.length > 254 || name.length > 120 || service.length > 80) {
      return { success: false, error: 'Request data is invalid.' };
    }

    const result = await sendRequestAcceptedEmail(email, name, service);
    if (!result?.success) return { success: false, error: 'Unable to send the acceptance email.' };

    await requestRef.update({ status: 'accepted', acceptedAt: FieldValue.serverTimestamp(), acceptedBy: actor.uid });
    return { success: true };
  } catch (error) {
    console.error('Accepted request action failed:', error instanceof Error ? error.message : 'unknown error');
    return { success: false, error: 'Unable to process the request.' };
  }
}
