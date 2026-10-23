import crypto from 'node:crypto';
import { normalizeCustomerContact } from '../crm/customer.mjs';

const ID_TOKEN = /^[A-Za-z0-9._:-]{8,128}$/;

export function localDateTimeToUtc(localDateTime, timezone) {
  const match = typeof localDateTime === 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localDateTime);
  if (!match) throw new TypeError('INVALID_LOCAL_TIME');
  const [, y, m, d, h, min] = match.map((part, index) => index === 0 ? part : Number(part));
  const wall = Date.UTC(y, m - 1, d, h, min);
  const expected = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const candidates = new Set();
  for (let hours = -36; hours <= 36; hours += 3) {
    const sample = wall + hours * 3_600_000;
    const parts = Object.fromEntries(formatter.formatToParts(new Date(sample)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const offset = represented - sample;
    const candidate = wall - offset;
    const roundtrip = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const local = `${roundtrip.year}-${roundtrip.month}-${roundtrip.day}T${roundtrip.hour}:${roundtrip.minute}`;
    if (local === expected) candidates.add(candidate);
  }
  if (candidates.size === 0) throw new TypeError('INVALID_LOCAL_TIME');
  if (candidates.size > 1) throw new TypeError('AMBIGUOUS_LOCAL_TIME');
  return new Date([...candidates][0]);
}

export function customerDocumentId(businessId, contact) {
  const normalized = normalizeCustomerContact(contact);
  const identifier = normalized.email ?? normalized.phone;
  return crypto.createHash('sha256').update(`${businessId}\0${identifier}`).digest('hex');
}

export function validateCustomerInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('INVALID_CUSTOMER');
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (displayName.length < 1 || displayName.length > 100) throw new TypeError('INVALID_CUSTOMER_NAME');
  const contact = normalizeCustomerContact({ email: input.email, phone: input.phone });
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (notes.length > 2000) throw new TypeError('CUSTOMER_NOTES_TOO_LONG');
  const rawTags = input.tags ?? [];
  if (!Array.isArray(rawTags) || rawTags.length > 20 || rawTags.some((tag) => typeof tag !== 'string' || tag.trim().length < 1 || tag.trim().length > 32)) {
    throw new TypeError('INVALID_CUSTOMER_TAGS');
  }
  return Object.freeze({ displayName, contact, notes, tags: [...new Set(rawTags.map((tag) => tag.trim()))] });
}

export function validateBookingInput(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('INVALID_BOOKING');
  const service = typeof input.service === 'string' ? input.service.trim() : '';
  if (service.length < 1 || service.length > 100) throw new TypeError('INVALID_BOOKING_SERVICE');
  const timezone = typeof input.timezone === 'string' ? input.timezone : '';
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date(now)); } catch { throw new TypeError('INVALID_TIMEZONE'); }
  const startDate = input.localStartAt ? localDateTimeToUtc(input.localStartAt, input.timezone) : typeof input.startAt === 'string' ? new Date(input.startAt) : null;
  const start = startDate instanceof Date ? startDate.getTime() : NaN;
  if (!Number.isFinite(start) || (input.startAt && new Date(start).toISOString() !== input.startAt) || start < now + 5 * 60_000) throw new TypeError('INVALID_BOOKING_START');
  const durationMinutes = Number(input.durationMinutes);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240 || durationMinutes % 15 !== 0) throw new TypeError('INVALID_BOOKING_DURATION');
  const customerId = typeof input.customerId === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(input.customerId) ? input.customerId : null;
  const idempotencyKey = typeof input.idempotencyKey === 'string' && ID_TOKEN.test(input.idempotencyKey) ? input.idempotencyKey : '';
  if (!idempotencyKey) throw new TypeError('INVALID_IDEMPOTENCY_KEY');
  return Object.freeze({ service, startAt: new Date(start), endAt: new Date(start + durationMinutes * 60_000), durationMinutes, timezone, customerId, idempotencyKey });
}

export function bookingSlotIds(businessId, startAt, endAt) {
  const start = startAt instanceof Date ? startAt.getTime() : Date.parse(startAt);
  const end = endAt instanceof Date ? endAt.getTime() : Date.parse(endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new TypeError('INVALID_BOOKING_INTERVAL');
  const first = Math.floor(start / 900_000);
  const last = Math.ceil(end / 900_000);
  if (last - first > 17) throw new TypeError('BOOKING_INTERVAL_TOO_LONG');
  return Array.from({ length: last - first }, (_, offset) => crypto.createHash('sha256').update(`${businessId}:${first + offset}`).digest('hex'));
}

function localParts(date, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function assertWithinBusinessHours({ startAt, endAt, timezone, weeklyHours }) {
  const start = localParts(startAt, timezone);
  const end = localParts(new Date(endAt.getTime() - 1), timezone);
  const weekday = new Date(Date.UTC(start.year, start.month - 1, start.day)).getUTCDay();
  const endWeekday = new Date(Date.UTC(end.year, end.month - 1, end.day)).getUTCDay();
  if (weekday !== endWeekday) throw new TypeError('BOOKING_OUTSIDE_BUSINESS_HOURS');
  const hours = weeklyHours?.[String(weekday)];
  if (!hours || !/^\d{2}:\d{2}$/.test(hours.start) || !/^\d{2}:\d{2}$/.test(hours.end)) throw new TypeError('BUSINESS_AVAILABILITY_NOT_CONFIGURED');
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute + 1;
  const opening = Number(hours.start.slice(0, 2)) * 60 + Number(hours.start.slice(3));
  const closing = Number(hours.end.slice(0, 2)) * 60 + Number(hours.end.slice(3));
  if (opening >= closing || startMinutes < opening || endMinutes > closing) throw new TypeError('BOOKING_OUTSIDE_BUSINESS_HOURS');
  return true;
}
