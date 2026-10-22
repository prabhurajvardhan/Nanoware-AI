import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTrialActive, DAKEN_TRIAL_MILLISECONDS, summarizeTrial } from '../lib/billing/trial.ts';

const now = Date.parse('2026-10-22T12:00:00.000Z');

test('Daken trial duration is exactly seven days and remaining time uses persisted timestamps', () => {
  assert.equal(DAKEN_TRIAL_MILLISECONDS, 7 * 24 * 60 * 60 * 1000);
  const start = new Date(now - 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + DAKEN_TRIAL_MILLISECONDS);
  const result = summarizeTrial({ planId: 'daken', state: 'trialing', trialStartedAt: start, trialEndsAt: end }, now);
  assert.equal(result.status, 'active');
  assert.equal(result.remainingSeconds, 6 * 24 * 60 * 60);
  assert.equal(assertTrialActive({ planId: 'daken', state: 'trialing', trialStartedAt: start, trialEndsAt: end }, now), true);
});

test('expired unpaid Daken trials fail closed while active paid subscriptions remain entitled', () => {
  const start = new Date(now - 8 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + DAKEN_TRIAL_MILLISECONDS);
  const trial = { planId: 'daken', state: 'trialing', trialStartedAt: start, trialEndsAt: end };
  assert.equal(summarizeTrial(trial, now).status, 'expired');
  assert.throws(() => assertTrialActive(trial, now), /TRIAL_EXPIRED/);
  assert.equal(assertTrialActive({ ...trial, state: 'active' }, now), true);
});
