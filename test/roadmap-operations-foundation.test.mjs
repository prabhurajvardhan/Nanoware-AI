import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardProjection, dashboardViewState, DashboardAuthorizationError } from '../lib/dashboard/view-model.mjs';
import { classifyUsageEvent, createUsageEvent, UsageEventError } from '../lib/usage/events.mjs';
import { acceptVerifiedSubscriptionEvent, SubscriptionEventError } from '../lib/billing/subscription.mjs';
import { createAuditEvent, AuditEventError } from '../lib/operations/audit-event.mjs';

test('dashboard projections enforce business scope and explicit view states', () => {
  const result = dashboardProjection([{ id: 'a', businessId: 'A', kind: 'booking', state: 'requested', privateNotes: 'x' }, { id: 'b', businessId: 'B', kind: 'booking' }], { businessId: 'A', role: 'member' });
  assert.deepEqual(result, [{ id: 'a', businessId: 'A', kind: 'booking', state: 'requested', createdAt: undefined, updatedAt: undefined }]);
  assert.equal(dashboardViewState({ items: [] }), 'empty');
  assert.equal(dashboardViewState({ forbidden: true }), 'forbidden');
  assert.throws(() => dashboardProjection([], { businessId: 'A', role: 'visitor' }), DashboardAuthorizationError);
});

test('usage events are business-scoped and replay classification is deterministic', () => {
  const event = createUsageEvent({ businessId: 'A', sourceRef: 'booking-1', eventKey: 'booking-123456', kind: 'booking.qualified', occurredAt: '2026-10-14T00:00:00Z', periodKey: '2026-W42' });
  assert.equal(event.eventKey, 'A:booking-123456');
  assert.equal(classifyUsageEvent(event.eventKey, new Set([event.eventKey])), 'duplicate');
  assert.equal(classifyUsageEvent(event.eventKey, new Set()), 'accepted');
  assert.throws(() => createUsageEvent({ businessId: 'A', sourceRef: 'x', eventKey: 'short', kind: 'bad', occurredAt: 'nope', periodKey: 'p' }), UsageEventError);
});

test('billing state accepts only verified, in-order provider events', () => {
  assert.throws(() => acceptVerifiedSubscriptionEvent(null, { businessId: 'A', state: 'active', eventId: 'event-0001', verified: false }), /UNVERIFIED_PROVIDER_EVENT/);
  const first = acceptVerifiedSubscriptionEvent(null, { businessId: 'A', state: 'active', eventId: 'event-0001', createdAt: '2026-10-14T00:00:00Z', verified: true });
  assert.equal(first.outcome, 'accepted');
  assert.equal(acceptVerifiedSubscriptionEvent(first, { businessId: 'A', state: 'active', eventId: 'event-0001', createdAt: '2026-10-14T00:00:00Z', verified: true }).outcome, 'duplicate');
  assert.equal(acceptVerifiedSubscriptionEvent(first, { businessId: 'A', state: 'cancelled', eventId: 'event-0002', createdAt: '2026-10-13T00:00:00Z', verified: true }).outcome, 'ignored_out_of_order');
  assert.throws(() => acceptVerifiedSubscriptionEvent(first, { businessId: 'B', state: 'active', eventId: 'event-0003', createdAt: '2026-10-15T00:00:00Z', verified: true }), SubscriptionEventError);
  assert.throws(() => acceptVerifiedSubscriptionEvent(first, { businessId: 'A', state: 'trialing', eventId: 'event-0004', createdAt: '2026-10-15T00:00:00Z', verified: true }), /INVALID_SUBSCRIPTION_TRANSITION/);
});

test('operational audit events redact sensitive keys and require attribution', () => {
  const event = createAuditEvent({ action: 'admin.accept', result: 'success', correlationId: 'req-12345678', actorClass: 'owner', details: { count: 1, token: 'secret', leaked: 'Bearer sk-live-not-a-real-secret', note: { private: true } } });
  assert.deepEqual(event.details, { count: '1' });
  assert.throws(() => createAuditEvent({ action: 'x' }), AuditEventError);
});
