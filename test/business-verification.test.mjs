import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePhone } from '../lib/auth/phone-format.ts';
import { domainMatchesWebsite } from '../lib/business/domain-format.ts';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('phone normalization applies selected country calling codes and national lengths', () => {
  assert.equal(normalizePhone('IN', '09876543210'), '+919876543210');
  assert.equal(normalizePhone('US', '(415) 555-2671'), '+14155552671');
  assert.equal(normalizePhone('GB', '07123 456789'), '+447123456789');
  assert.throws(() => normalizePhone('IN', '+14155552671'), /INVALID_PHONE/);
});

test('business-domain matching normalizes schemes, ports, www, and subdomains without suffix tricks', () => {
  assert.equal(domainMatchesWebsite('owner@example.com', 'https://WWW.Example.com:443/path'), true);
  assert.equal(domainMatchesWebsite('owner@shop.example.com', 'example.com'), true);
  assert.equal(domainMatchesWebsite('owner@example.com.evil', 'example.com'), false);
  assert.equal(domainMatchesWebsite('owner@notexample.com', 'example.com'), false);
});

test('onboarding requires a business-domain email and does not require SMS', () => {
  const verification = read('lib/business/verification.ts');
  const onboarding = read('app/businesses/onboarding/page.tsx');
  assert.match(verification, /businessName/);
  assert.match(verification, /countryCode/);
  assert.match(verification, /emailDomainIsFree/);
  assert.match(onboarding, /Verify business/);
  assert.match(onboarding, /Business name/);
  assert.match(onboarding, /Website/);
  assert.match(onboarding, /Business email/);
  assert.match(onboarding, /type="email"/);
  assert.match(onboarding, /Country/);
  assert.match(onboarding, /domainStatus/);
  assert.doesNotMatch(onboarding, /requestPhoneCode/);
  assert.doesNotMatch(onboarding, /phoneCountries/);
  assert.doesNotMatch(onboarding, /registrationNumber/);
  assert.match(verification, /FREE_EMAIL_NOT_ALLOWED/);
  assert.match(verification, /BUSINESS_EMAIL_DOMAIN_MISMATCH/);
});

test('approval requires authoritative account email and verified business-domain email', () => {
  const service = read('lib/business/verification-admin.ts');
  assert.match(service, /getAuth\(getFirebaseAdminApp\(\)\)\.getUser\(ownerId\)/);
  assert.doesNotMatch(service, /account\.emailVerified !== true/);
  assert.match(service, /verification\.checks\?\.businessDomainEmail !== 'verified'/);
  assert.doesNotMatch(service, /phoneVerification\?\.status !== 'verified'/);
  assert.match(service, /createAuditEvent/);
});

test('account email verification is single-use and delivery recovery is observable', () => {
  const email = read('lib/auth/email-verification.ts');
  const request = read('app/api/auth/email/request/route.ts');
  assert.match(email, /expiresAt/);
  assert.match(email, /used/);
  assert.match(email, /updateUser\(uid, \{ emailVerified: true \}/);
  assert.match(email, /if \(currentUser\.emailVerified !== true\)/);
  assert.match(request, /invalidateEmailVerificationToken/);
});

test('admin queue exposes review states and request-more-info remains available for resubmission', () => {
  const service = read('lib/business/verification-admin.ts');
  const queue = read('app/admin/VerificationQueue.tsx');
  assert.match(service, /more_information_required/);
  assert.match(queue, /request-more-info/);
  assert.match(queue, /review\.verificationStatus/);
});

test('phone verification fails closed when no provider is configured', () => {
  const phone = read('lib/auth/phone-verification.ts');
  assert.match(phone, /PROVIDER_UNAVAILABLE/);
  assert.match(phone, /SMS_PROVIDER === 'twilio'/);
  assert.match(phone, /verified_phone_keys/);
  assert.match(phone, /transaction\.update\(challengeRef, \{ attempts/);
  assert.match(phone, /return \{ ok: false/);
});

test('account verification checks current Firebase email before updating verification state', () => {
  const email = read('lib/auth/email-verification.ts');
  assert.match(email, /getUser\(uid\)/);
  assert.match(email, /tokenData\.emailHash !== hash\(currentEmail\)/);
  assert.doesNotMatch(email, /tokenClaim === true/);
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
