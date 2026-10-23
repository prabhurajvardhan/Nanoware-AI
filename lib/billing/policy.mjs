export const PAID_ACCESS_STATES = Object.freeze(['active', 'trialing']);

export function canUsePaidTools(state) {
  return PAID_ACCESS_STATES.includes(state);
}

export { mapRazorpaySubscriptionState } from './razorpay.mjs';
