const KIND = /^[a-z][a-z0-9_.-]{1,63}$/;
const KEY = /^[A-Za-z0-9._:-]{8,160}$/;

export class UsageEventError extends Error {
  constructor(code) {
    super(code);
    this.name = 'UsageEventError';
    this.code = code;
  }
}

export function createUsageEvent({ businessId, sourceRef, eventKey, kind, occurredAt, periodKey }) {
  if (![businessId, sourceRef, eventKey, occurredAt, periodKey].every((value) => typeof value === 'string' && value.length > 0)) throw new UsageEventError('USAGE_FIELDS_REQUIRED');
  if (!KIND.test(kind) || !KEY.test(eventKey)) throw new UsageEventError('USAGE_KEY_INVALID');
  const timestamp = Date.parse(occurredAt);
  if (!Number.isFinite(timestamp)) throw new UsageEventError('USAGE_TIME_INVALID');
  return Object.freeze({ businessId, sourceRef, eventKey: `${businessId}:${eventKey}`, kind, occurredAt: new Date(timestamp).toISOString(), periodKey });
}

export function classifyUsageEvent(eventKey, existingKeys) {
  if (!(existingKeys instanceof Set)) throw new UsageEventError('USAGE_INDEX_REQUIRED');
  return existingKeys.has(eventKey) ? 'duplicate' : 'accepted';
}
