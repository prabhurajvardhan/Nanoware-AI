export const SUBSCRIPTION_STATES = Object.freeze(['trialing', 'active', 'past_due', 'cancelled', 'expired']);

export class SubscriptionEventError extends Error {
  constructor(code) {
    super(code);
    this.name = 'SubscriptionEventError';
    this.code = code;
  }
}

export function acceptVerifiedSubscriptionEvent(current, event) {
  if (!event || event.verified !== true) throw new SubscriptionEventError('UNVERIFIED_PROVIDER_EVENT');
  if (!SUBSCRIPTION_STATES.includes(event.state) || !event.eventId || !event.businessId) throw new SubscriptionEventError('INVALID_SUBSCRIPTION_EVENT');
  if (current && current.businessId !== event.businessId) throw new SubscriptionEventError('SUBSCRIPTION_TENANT_MISMATCH');
  if (current?.lastEventCreatedAt && event.createdAt < current.lastEventCreatedAt) return { ...current, outcome: 'ignored_out_of_order' };
  return Object.freeze({
    businessId: event.businessId,
    state: event.state,
    provider: event.provider ?? 'unselected',
    providerSubscriptionId: event.providerSubscriptionId ?? null,
    lastEventId: event.eventId,
    lastEventCreatedAt: event.createdAt ?? null,
    outcome: current?.lastEventId === event.eventId ? 'duplicate' : 'accepted',
  });
}
