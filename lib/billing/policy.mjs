export const PAID_ACCESS_STATES = Object.freeze(['active', 'trialing']);

export function canUsePaidTools(state) {
  return PAID_ACCESS_STATES.includes(state);
}

export function mapStripeSubscriptionState(status) {
  if (status === 'active' || status === 'trialing') return status;
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  if (status === 'canceled') return 'cancelled';
  return 'expired';
}
