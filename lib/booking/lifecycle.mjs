export const BOOKING_STATES = Object.freeze(['requested', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show']);
const TRANSITIONS = Object.freeze({
  requested: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled', 'completed', 'no_show'],
  rejected: [],
  cancelled: [],
  completed: [],
  no_show: [],
});

export class BookingTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid booking transition: ${from} -> ${to}`);
    this.name = 'BookingTransitionError';
    this.code = 'INVALID_BOOKING_TRANSITION';
  }
}

export function canTransitionBooking(from, to) {
  return BOOKING_STATES.includes(from) && TRANSITIONS[from]?.includes(to) === true;
}

export function transitionBooking(from, to) {
  if (!canTransitionBooking(from, to)) throw new BookingTransitionError(from, to);
  return { from, to };
}

export function bookingSlotKey({ businessId, serviceId, startUtc, endUtc }) {
  if (![businessId, serviceId, startUtc, endUtc].every((value) => typeof value === 'string' && value.length > 0)) {
    throw new TypeError('BOOKING_SLOT_FIELDS_REQUIRED');
  }
  return `${businessId}:${serviceId}:${startUtc}:${endUtc}`;
}

export function idempotencyKey(businessId, clientKey) {
  if (typeof businessId !== 'string' || !businessId || typeof clientKey !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(clientKey)) {
    throw new TypeError('INVALID_IDEMPOTENCY_KEY');
  }
  return `${businessId}:${clientKey}`;
}
