import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createHmac } from 'node:crypto';
import { canUsePaidTools, mapRazorpaySubscriptionState } from '../lib/billing/policy.mjs';
import { verifyRazorpayWebhookSignature } from '../lib/billing/razorpay.mjs';

const loginSource = fs.readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const checkoutSource = fs.readFileSync(new URL('../app/api/billing/checkout/route.ts', import.meta.url), 'utf8');
const webhookSource = fs.readFileSync(new URL('../app/api/billing/webhook/route.ts', import.meta.url), 'utf8');
const cancellationSource = fs.readFileSync(new URL('../app/api/billing/portal/route.ts', import.meta.url), 'utf8');
const plansSource = fs.readFileSync(new URL('../app/api/billing/plans/route.ts', import.meta.url), 'utf8');
const configSource = fs.readFileSync(new URL('../lib/billing/config.ts', import.meta.url), 'utf8');
const envSource = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');

test('paid access is limited to webhook-verified active or explicit trial states', () => {
  assert.equal(canUsePaidTools('active'), true);
  assert.equal(canUsePaidTools('trialing'), true);
  for (const state of ['past_due', 'cancelled', 'expired', 'pending', 'forged']) assert.equal(canUsePaidTools(state), false);
});

test('Razorpay subscription states fail closed until the provider reports active', () => {
  assert.equal(mapRazorpaySubscriptionState('active'), 'active');
  assert.equal(mapRazorpaySubscriptionState('cancelled'), 'cancelled');
  assert.equal(mapRazorpaySubscriptionState('pending'), 'past_due');
  assert.equal(mapRazorpaySubscriptionState('halted'), 'past_due');
  assert.equal(mapRazorpaySubscriptionState('authenticated'), 'past_due');
  assert.equal(mapRazorpaySubscriptionState('created'), 'past_due');
  assert.equal(mapRazorpaySubscriptionState('completed'), 'expired');
  assert.equal(mapRazorpaySubscriptionState('unknown'), 'expired');
});

test('Razorpay webhook signatures use exact raw request bytes and reject mismatches', () => {
  const raw = '{"event":"subscription.activated","created_at":1771700000}';
  const secret = 'test-webhook-secret';
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  assert.equal(verifyRazorpayWebhookSignature(raw, signature, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(`${raw} `, signature, secret), false);
  assert.equal(verifyRazorpayWebhookSignature(raw, 'bad-signature', secret), false);
  assert.equal(verifyRazorpayWebhookSignature(raw, signature, ''), false);
});

test('Google registration routes through secure session and onboarding resolution', () => {
  assert.match(loginSource, /signInWithPopup/);
  assert.match(loginSource, /\/api\/auth\/session/);
  assert.match(loginSource, /\/api\/business\/access/);
  assert.match(loginSource, /\/businesses\/onboarding/);
  assert.match(loginSource, /account-exists-with-different-credential/);
});

test('Razorpay subscription checkout resolves business and plan server-side and remains explicitly gated', () => {
  assert.match(checkoutSource, /requireBusinessActor\(\['owner', 'admin'\], requestedBusinessId\)/);
  assert.match(checkoutSource, /getBillingPlan\(body\.planId\)/);
  assert.match(checkoutSource, /plan\.providerPlanId/);
  assert.match(checkoutSource, /checkoutEnabled/);
  assert.match(checkoutSource, /\/subscriptions/);
  assert.match(checkoutSource, /razorpay_checkout_locks/);
  assert.doesNotMatch(checkoutSource, /body\.(?:priceId|providerPlanId|amount|currency)/);
  assert.match(configSource, /RAZORPAY_DAKEN_PLAN_ID/);
  assert.match(configSource, /RAZORPAY_DAKEN_PLUS_PLAN_ID/);
  assert.match(configSource, /displayPrice: '\$9 USD \/ month'/);
  assert.match(configSource, /displayPrice: '\$19 USD \/ month'/);
  assert.match(plansSource, /providerPlanId && checkoutEnabled/);
  assert.match(plansSource, /customSales: Boolean\(customSales\)/);
  assert.doesNotMatch(plansSource, /providerPlanId:/);
  assert.match(envSource, /RAZORPAY_WEBHOOK_SECRET/);
  assert.doesNotMatch(envSource, /STRIPE_/);
});

test('Razorpay webhook verifies raw body, requires event ID, deduplicates and rejects stale subscriptions', () => {
  assert.match(webhookSource, /request\.text\(\)/);
  assert.match(webhookSource, /x-razorpay-signature/);
  assert.match(webhookSource, /x-razorpay-event-id/);
  assert.match(webhookSource, /verifyRazorpayWebhookSignature\(rawBody, signature, secret\)/);
  assert.match(webhookSource, /razorpay_events/);
  assert.match(webhookSource, /ignored_out_of_order/);
  assert.match(webhookSource, /stale_subscription/);
  assert.match(webhookSource, /provider: 'razorpay'/);
  assert.doesNotMatch(webhookSource, /stripe/i);
});

test('Razorpay cancellation authorizes workspace admins and schedules cancellation at cycle end', () => {
  assert.match(cancellationSource, /requireBusinessActor\(\['owner', 'admin'\], businessId\)/);
  assert.match(cancellationSource, /razorpaySubscriptionId/);
  assert.match(cancellationSource, /cancel_at_cycle_end: true/);
  assert.doesNotMatch(cancellationSource, /subscription: \{[^}]*state:/);
});
