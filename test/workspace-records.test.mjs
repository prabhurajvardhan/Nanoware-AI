import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertWithinBusinessHours,
  bookingSlotIds,
  customerDocumentId,
  localDateTimeToUtc,
  validateBookingInput,
  validateCustomerInput,
} from '../lib/workspace/records.mjs';

const businessHours = { 1: { start: '09:00', end: '17:00' } };

test('customer input is normalized, bounded and stable within a business', () => {
  const customer = validateCustomerInput({ displayName: '  Ada Example ', email: ' Ada@Example.com ', phone: '+1 (555) 555-0100', notes: ' context ', tags: ['new', ' new ', 'priority'] });
  assert.equal(customer.displayName, 'Ada Example');
  assert.equal(customer.contact.email, 'ada@example.com');
  assert.equal(customer.contact.phone, '+15555550100');
  assert.deepEqual(customer.tags, ['new', 'priority']);
  assert.equal(customerDocumentId('biz_a', customer.contact), customerDocumentId('biz_a', { email: 'ADA@example.com', phone: '+15555550100' }));
  assert.notEqual(customerDocumentId('biz_a', customer.contact), customerDocumentId('biz_b', customer.contact));
  assert.throws(() => validateCustomerInput({ displayName: 'Ada' }), /CONTACT_REQUIRED/);
  assert.throws(() => validateCustomerInput({ displayName: 'x'.repeat(101), email: 'ada@example.com' }), /INVALID_CUSTOMER_NAME/);
});

test('business-local datetime converts to UTC and rejects DST gaps and repeated times', () => {
  assert.equal(localDateTimeToUtc('2026-11-02T10:00', 'America/New_York').toISOString(), '2026-11-02T15:00:00.000Z');
  assert.throws(() => localDateTimeToUtc('2026-03-08T02:30', 'America/New_York'), /INVALID_LOCAL_TIME/);
  assert.throws(() => localDateTimeToUtc('2026-11-01T01:30', 'America/New_York'), /AMBIGUOUS_LOCAL_TIME/);
});

test('booking validation checks duration, time zone and idempotency key', () => {
  const input = validateBookingInput({ service: 'Consultation', localStartAt: '2027-01-11T10:00', durationMinutes: 30, timezone: 'America/New_York', customerId: 'customer_abcdefghijkl', idempotencyKey: 'request:12345678' }, Date.parse('2026-01-01T00:00:00.000Z'));
  assert.equal(input.startAt.toISOString(), '2027-01-11T15:00:00.000Z');
  assert.equal(input.endAt.toISOString(), '2027-01-11T15:30:00.000Z');
  assert.throws(() => validateBookingInput({ service: 'Consultation', startAt: '2027-01-11T15:00:00.000Z', durationMinutes: 20, timezone: 'UTC', idempotencyKey: 'request:12345678' }, Date.parse('2026-01-01T00:00:00.000Z')), /INVALID_BOOKING_DURATION/);
  assert.throws(() => validateBookingInput({ service: 'Consultation', localStartAt: '2027-01-11T10:00', durationMinutes: 30, timezone: 'UTC', idempotencyKey: 'short' }, Date.parse('2026-01-01T00:00:00.000Z')), /INVALID_IDEMPOTENCY_KEY/);
});

test('booking reservation requires configured business hours and rejects out-of-hours slots', () => {
  const startAt = new Date('2027-01-11T10:00:00.000Z');
  const endAt = new Date('2027-01-11T10:30:00.000Z');
  assert.equal(assertWithinBusinessHours({ startAt, endAt, timezone: 'UTC', weeklyHours: businessHours }), true);
  assert.throws(() => assertWithinBusinessHours({ startAt, endAt, timezone: 'UTC', weeklyHours: {} }), /BUSINESS_AVAILABILITY_NOT_CONFIGURED/);
  assert.throws(() => assertWithinBusinessHours({ startAt: new Date('2027-01-11T08:00:00.000Z'), endAt: new Date('2027-01-11T08:30:00.000Z'), timezone: 'UTC', weeklyHours: businessHours }), /BOOKING_OUTSIDE_BUSINESS_HOURS/);
});

test('slot reservation keys overlap for conflicting times and are tenant-scoped', () => {
  const first = bookingSlotIds('biz_a', new Date('2027-01-11T10:00:00.000Z'), new Date('2027-01-11T10:30:00.000Z'));
  const overlap = bookingSlotIds('biz_a', new Date('2027-01-11T10:15:00.000Z'), new Date('2027-01-11T10:45:00.000Z'));
  const otherTenant = bookingSlotIds('biz_b', new Date('2027-01-11T10:00:00.000Z'), new Date('2027-01-11T10:30:00.000Z'));
  assert.ok(first.some((slot) => overlap.includes(slot)));
  assert.ok(first.every((slot) => !otherTenant.includes(slot)));
});
