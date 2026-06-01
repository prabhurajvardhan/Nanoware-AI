import { Resend } from 'resend';

// Initialize the Resend client only if the API key is present.
// We use a getter function to permit lazy initialization and fail gracefully
// if the key is missing.

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is missing.');
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}
