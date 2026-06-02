'use server';

import { sendRequestAcceptedEmail } from '@/lib/email/actions';

export async function sendAcceptedEmailAction(reqEmail: string, reqName: string, reqService: string) {
  try {
    // Send the email
    await sendRequestAcceptedEmail(reqEmail, reqName, reqService);

    return { success: true };
  } catch (error: any) {
    console.error('Error sending accepted email:', error);
    return { success: false, error: error.message };
  }
}
