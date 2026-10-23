import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('CRM APIs derive tenant access through the server membership boundary', () => {
  const listCreate = read('app/api/workspace/customers/route.ts');
  const update = read('app/api/workspace/customers/[customerId]/route.ts');
  const history = read('app/api/workspace/customers/[customerId]/history/route.ts');
  assert.match(listCreate, /requireBusinessActor\(\['owner', 'admin', 'member'\]/);
  assert.match(listCreate, /requireBusinessActor\(\['owner', 'admin'\], body\.businessId\)/);
  assert.match(listCreate, /where\('businessId', '==', actor\.businessId\)/);
  assert.match(update, /requireBusinessActor\(\['owner', 'admin'\]/);
  assert.match(history, /requireBusinessActor\(\['owner', 'admin', 'member'\]/);
  assert.match(update, /existing\.data\(\)\?\.businessId !== actor\.businessId/);
  assert.match(update, /archivedAt: FieldValue\.serverTimestamp\(\)/);
});

test('booking API checks workspace ownership, idempotency, availability and transactional slot locks', () => {
  const create = read('app/api/workspace/bookings/route.ts');
  const update = read('app/api/workspace/bookings/[bookingId]/route.ts');
  assert.match(create, /requireBusinessActor\(\['owner', 'admin'\]/);
  assert.match(create, /booking_idempotency/);
  assert.match(create, /booking_slot_locks/);
  assert.match(create, /runTransaction/);
  assert.match(create, /assertWithinBusinessHours/);
  assert.match(update, /requireBusinessActor\(\['owner', 'admin'\]/);
  assert.match(update, /canTransitionBooking/);
  assert.match(update, /reschedule/);
});

test('Client Mode service requests are separate from booking records and private to the verified requester', () => {
  const api = read('app/api/client-requests/route.ts');
  assert.match(api, /requireEmailVerifiedSession/);
  assert.match(api, /collection\('serviceRequests'\)/);
  assert.match(api, /where\('userId', '==', session\.uid\)/);
  assert.doesNotMatch(api, /collection\('bookingRequests'\)/);
  assert.match(api, /service_request_idempotency/);
});

test('admin status changes require MFA and validate the declared service-request lifecycle', () => {
  const update = read('app/api/admin/service-requests/[requestId]/route.ts');
  assert.match(update, /requireAdminActor\(\{ requireMfa: true \}\)/);
  assert.match(update, /INVALID_STATUS_TRANSITION/);
  assert.match(update, /FieldValue\.arrayUnion/);
});

test('WhatsApp UI cannot claim connection or activation without verified provider state', () => {
  const api = read('app/api/workspace/agent-settings/route.ts');
  assert.match(api, /webhookVerified === true/);
  assert.match(api, /whatsappConnections/);
  assert.match(api, /status !== 'connected'/);
});

test('Daken tiers use the specified pricing, allowances, unlimited bookings, and custom sales enquiry', () => {
  const config = read('lib/billing/config.ts');
  const plans = read('app/api/billing/plans/route.ts');
  const checkout = read('app/api/billing/checkout/route.ts');
  assert.match(config, /displayPrice: '\$9 USD \/ month'/);
  assert.match(config, /displayPrice: '\$19 USD \/ month'/);
  assert.match(config, /monthlyTokenAllowance: 2_000_000/);
  assert.match(config, /monthlyTokenAllowance: 5_000_000/);
  assert.match(config, /bookingLimit: null/);
  assert.match(config, /name: 'Daken²'/);
  assert.match(plans, /customSales: Boolean\(customSales\)/);
  assert.match(checkout, /custom sales enquiry and has no fixed-price checkout/);
});

test('trial start is server-side, one-time across owned workspaces, and records fixed expiry', () => {
  const route = read('app/api/business/trial/route.ts');
  const guard = read('lib/billing/trial.ts');
  assert.match(route, /requireBusinessMembership\(session\.uid, businessId, \['owner'\]\)/);
  assert.match(route, /TRIAL_USED_ON_OTHER_WORKSPACE/);
  assert.match(route, /trialUsedAt: start/);
  assert.match(route, /DAKEN_TRIAL_MILLISECONDS/);
  assert.match(guard, /now >= expiresAt/);
});
