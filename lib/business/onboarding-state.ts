export type OnboardingDomainEmailStatus = 'pending' | 'sent' | 'verified' | 'expired';

export function applyOnboardingCallback(
  serverStatus: OnboardingDomainEmailStatus,
  callback: { verified: boolean; error: boolean },
) {
  if (serverStatus === 'verified') return { status: 'verified' as const, message: 'Business-domain email verified.' };
  if (callback.error) return { status: serverStatus, message: 'This verification link is expired or invalid. Request a new link.' };
  if (callback.verified) return { status: serverStatus, message: 'The link was opened. Refresh the verification status before continuing.' };
  return { status: serverStatus, message: '' };
}
