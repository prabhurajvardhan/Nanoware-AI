import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { canUsePaidTools, mapStripeSubscriptionState } from '../lib/billing/policy.mjs';

const loginSource = fs.readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const checkoutSource = fs.readFileSync(new URL('../app/api/billing/checkout/route.ts', import.meta.url), 'utf8');
const webhookSource = fs.readFileSync(new URL('../app/api/billing/webhook/route.ts', import.meta.url), 'utf8');

test('paid access is limited to provider-verified active and trialing states', () => {
  assert.equal(canUsePaidTools('active'), true);
  assert.equal(canUsePaidTools('trialing'), true);
  for (const state of ['past_due', 'cancelled', 'expired', 'forged']) assert.equal(canUsePaidTools(state), false);
});

test('Stripe subscription states map failed and cancelled states closed by default', () => {
  assert.equal(mapStripeSubscriptionState('active'), 'active');
  assert.equal(mapStripeSubscriptionState('trialing'), 'trialing');
  assert.equal(mapStripeSubscriptionState('past_due'), 'past_due');
  assert.equal(mapStripeSubscriptionState('canceled'), 'cancelled');
  assert.equal(mapStripeSubscriptionState('incomplete'), 'expired');
});

test('Google registration routes through secure session and onboarding resolution', () => {
  assert.match(loginSource, /signInWithPopup/);
  assert.match(loginSource, /\/api\/auth\/session/);
  assert.match(loginSource, /\/api\/business\/access/);
  assert.match(loginSource, /\/businesses\/onboarding/);
  assert.match(loginSource, /account-exists-with-different-credential/);
});

test('checkout resolves the business and plan server-side', () => {
  assert.match(checkoutSource, /requireBusinessActor\(\['owner', 'admin'\], requestedBusinessId\)/);
  assert.match(checkoutSource, /getBillingPlan\(planId\)/);
  assert.doesNotMatch(checkoutSource, /body\.priceId/);
});

test('webhook requires raw-body signature verification and records duplicate events', () => {
  assert.match(webhookSource, /request\.text\(\)/);
  assert.match(webhookSource, /constructEvent\(rawBody, signature, secret\)/);
  assert.match(webhookSource, /stripe_events/);
  assert.match(webhookSource, /ignored_out_of_order/);
});
