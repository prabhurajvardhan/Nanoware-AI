import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

 test('universal onboarding uses country-neutral business signals', () => {
  const verification = read('lib/business/verification.ts');
  const onboarding = read('app/businesses/onboarding/page.tsx');
  assert.match(verification, /businessName/);
  assert.match(verification, /countryCode/);
  assert.match(verification, /emailDomainIsFree/);
  assert.match(onboarding, /Verify business/);
  assert.match(onboarding, /Business name/);
  assert.match(onboarding, /Website/);
  assert.match(onboarding, /Country/);
  assert.doesNotMatch(onboarding, /registrationNumber/);
});

test('approval requires authoritative account email and phone verification', () => {
  const service = read('lib/business/verification-admin.ts');
  assert.match(service, /account\.emailVerified !== true/);
  assert.match(service, /account\.phoneVerification\?\.status !== 'verified'/);
  assert.match(service, /createAuditEvent/);
});

test('account email verification is single-use and delivery recovery is observable', () => {
  const email = read('lib/auth/email-verification.ts');
  const request = read('app/api/auth/email/request/route.ts');
  assert.match(email, /expiresAt/);
  assert.match(email, /used/);
  assert.match(email, /updateUser\(uid, \{ emailVerified: true \}/);
  assert.match(request, /invalidateEmailVerificationToken/);
});

test('phone verification fails closed when no provider is configured', () => {
  const phone = read('lib/auth/phone-verification.ts');
  assert.match(phone, /PROVIDER_UNAVAILABLE/);
  assert.match(phone, /SMS_PROVIDER === 'twilio'/);
  assert.match(phone, /verified_phone_keys/);
});

test('operations and Firestore access require explicit verified business status', () => {
  const route = read('app/api/business/access/route.ts');
  const feedback = read('app/api/business/projects/[projectId]/feedback/route.ts');
  const rules = read('firestore.rules');
  assert.match(route, /requireVerifiedBusinessMembership/);
  assert.match(feedback, /requireVerifiedBusinessMembership/);
  assert.match(rules, /isVerifiedBusiness/);
  assert.match(rules, /verificationStatus == 'verified'/);
});
