'use server';

import { sendRequestAcceptedEmail } from '@/lib/email/actions';

export async function sendAcceptedEmailAction(reqEmail: string, reqName: string, reqService: string) {
  try {
    // Send the email
    const result = await sendRequestAcceptedEmail(reqEmail, reqName, reqService);
    if (result && !result.success) {
      throw new Error(result.error as string);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending accepted email:', error);
    return { success: false, error: error.message };
  }
}
