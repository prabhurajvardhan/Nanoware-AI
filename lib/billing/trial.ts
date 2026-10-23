export const DAKEN_TRIAL_DAYS = 7;
export const DAKEN_TRIAL_MILLISECONDS = DAKEN_TRIAL_DAYS * 24 * 60 * 60 * 1000;

export class TrialExpiredError extends Error {
  constructor() { super('TRIAL_EXPIRED'); this.name = 'TrialExpiredError'; }
}

function millis(value: unknown): number | null {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function assertTrialActive(subscription: Record<string, unknown> | undefined, now = Date.now()) {
  if (subscription?.planId !== 'daken' || !subscription.trialStartedAt || subscription.state === 'active') return true;
  const expiresAt = millis(subscription.trialEndsAt);
  if (!expiresAt || now >= expiresAt) throw new TrialExpiredError();
  return true;
}

export function summarizeTrial(subscription: Record<string, unknown> | undefined, now = Date.now()) {
  if (subscription?.state === 'active') return { status: 'subscribed', startedAt: null, expiresAt: null, remainingSeconds: null };
  if (!subscription?.trialStartedAt || subscription.planId !== 'daken') return { status: subscription?.state === 'active' ? 'subscribed' : 'not_started', startedAt: null, expiresAt: null, remainingSeconds: null };
  const started = millis(subscription.trialStartedAt);
  const expires = millis(subscription.trialEndsAt);
  if (!started || !expires) return { status: 'expired', startedAt: null, expiresAt: null, remainingSeconds: 0 };
  const remainingSeconds = Math.max(0, Math.floor((expires - now) / 1000));
  return { status: remainingSeconds > 0 ? 'active' : 'expired', startedAt: new Date(started).toISOString(), expiresAt: new Date(expires).toISOString(), remainingSeconds };
}
