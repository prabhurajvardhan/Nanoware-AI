export const SUBSCRIPTION_STATES = Object.freeze(['trialing', 'active', 'past_due', 'cancelled', 'expired']);
const EVENT_ID = /^[A-Za-z0-9._:-]{8,160}$/;
const TRANSITIONS = Object.freeze({
  trialing: ['active', 'past_due', 'cancelled', 'expired'],
  active: ['past_due', 'cancelled', 'expired'],
  past_due: ['active', 'cancelled', 'expired'],
  cancelled: [],
  expired: [],
});

export class SubscriptionEventError extends Error {
  constructor(code) {
    super(code);
    this.name = 'SubscriptionEventError';
    this.code = code;
  }
}

export function acceptVerifiedSubscriptionEvent(current, event) {
  if (!event || event.verified !== true) throw new SubscriptionEventError('UNVERIFIED_PROVIDER_EVENT');
  if (!SUBSCRIPTION_STATES.includes(event.state) || !EVENT_ID.test(event.eventId ?? '') || !event.businessId || typeof event.createdAt !== 'string') throw new SubscriptionEventError('INVALID_SUBSCRIPTION_EVENT');
  const createdAt = Date.parse(event.createdAt);
  if (!Number.isFinite(createdAt)) throw new SubscriptionEventError('INVALID_SUBSCRIPTION_EVENT');
  if (current && current.businessId !== event.businessId) throw new SubscriptionEventError('SUBSCRIPTION_TENANT_MISMATCH');
  if (current?.lastEventId === event.eventId) return { ...current, outcome: 'duplicate' };
  if (current?.state && !TRANSITIONS[current.state]?.includes(event.state)) throw new SubscriptionEventError('INVALID_SUBSCRIPTION_TRANSITION');
  if (current?.lastEventCreatedAt && createdAt < Date.parse(current.lastEventCreatedAt)) return { ...current, outcome: 'ignored_out_of_order' };
  return Object.freeze({
    businessId: event.businessId,
    state: event.state,
    provider: event.provider ?? 'unselected',
    providerSubscriptionId: event.providerSubscriptionId ?? null,
    lastEventId: event.eventId,
    lastEventCreatedAt: new Date(createdAt).toISOString(),
    outcome: 'accepted',
  });
}
