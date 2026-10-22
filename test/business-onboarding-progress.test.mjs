import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyOnboardingCallback } from '../lib/business/onboarding-state.ts';
import { projectOnboardingProgress } from '../lib/business/onboarding-progress.ts';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const page = read('app/businesses/onboarding/page.tsx');
const route = read('app/api/business/onboard/route.ts');
const access = read('lib/business/access.ts');
const dashboard = read('app/dashboard/page.tsx');

function businessFixture(overrides = {}) {
  return {
    userId: 'user-1',
    businessId: 'business_user-1',
    ownerId: 'user-1',
    membershipUserId: 'user-1',
    membershipRole: 'owner',
    membershipStatus: 'active',
    business: {
      ownerId: 'user-1',
      verificationStatus: 'pending_verification',
      verification: {
        submittedBy: 'user-1',
        businessEmail: 'owner@example.com',
        website: 'https://www.example.com/about',
        checks: { businessDomainEmail: 'pending', googleBusinessProfile: 'not_provided' },
        websiteProof: { token: 'proof-token', dnsRecord: '_nanoware-verification', metaName: 'nanoware-verification' },
      },
    },
    domainEmailTokens: [],
    now: 1000,
    ...overrides,
  };
}

test('pending business hydrates only the saved onboarding progress fields', () => {
  const progress = projectOnboardingProgress(businessFixture({
    domainEmailTokens: [{ businessId: 'business_user-1', used: false, expiresAt: 2000 }],
  }));
  assert.deepEqual(progress, {
    businessId: 'business_user-1',
    status: 'pending_verification',
    businessEmail: 'owner@example.com',
    websiteDomain: 'example.com',
    domainEmailStatus: 'sent',
    websiteProof: { token: 'proof-token', dnsRecord: '_nanoware-verification', metaName: 'nanoware-verification' },
    googleProfileClaimExists: false,
  });
  assert.deepEqual(Object.keys(progress).sort(), [
    'businessId', 'status', 'businessEmail', 'websiteDomain', 'domainEmailStatus', 'websiteProof', 'googleProfileClaimExists',
  ].sort());
});

test('a verified callback after a fresh load keeps the server-verified state and displays success', () => {
  const progress = projectOnboardingProgress(businessFixture({
    business: {
      ...businessFixture().business,
      verification: { ...businessFixture().business.verification, checks: { businessDomainEmail: 'verified' } },
    },
  }));
  assert.equal(progress.domainEmailStatus, 'verified');
  assert.deepEqual(applyOnboardingCallback(progress.domainEmailStatus, { verified: true, error: false }), {
    status: 'verified', message: 'Business-domain email verified.',
  });
  assert.deepEqual(applyOnboardingCallback('pending', { verified: true, error: false }), {
    status: 'pending', message: 'The link was opened. Refresh the verification status before continuing.',
  });
  assert.match(page, /applyOnboardingCallback\(progress\.domainEmailStatus/);
  assert.match(page, /domainStatus === 'verified' \? 'Continue'/);
  assert.match(page, /router\.replace\('\/dashboard'\)/);
});

test('a caller with no authorized saved progress remains on the new-business form', () => {
  assert.equal(projectOnboardingProgress(null), null);
  assert.match(route, /return NextResponse\.json\(\{ progress \}/);
  assert.match(page, /if \(submitted\) return/);
  assert.match(page, /Tell us the essentials/);
  assert.match(page, /progressLoading/);
  assert.match(page, /fetch\('\/api\/business\/onboard', \{ cache: 'no-store' \}\)/);
});

test('progress endpoint derives only the signed-in owner business and never accepts another businessId', () => {
  assert.equal(projectOnboardingProgress(businessFixture({ ownerId: 'other-user' })), null);
  assert.equal(projectOnboardingProgress(businessFixture({ membershipUserId: 'other-user' })), null);
  assert.equal(projectOnboardingProgress(businessFixture({ membershipRole: 'member' })), null);
  assert.match(access, /const businessId = `business_\$\{userId\}`/);
  assert.match(route, /const session = await requireEmailVerifiedSession\(\);[\s\S]*?getBusinessOnboardingProgress\(session\.uid\)/);
  assert.doesNotMatch(route.slice(route.indexOf('export async function GET')), /searchParams\.get\(['"]businessId/);
  assert.match(dashboard, /router\.push\('\/businesses\/onboarding'\)/);
});

test('callback query flags are removed after hydration, while server state remains authoritative', () => {
  assert.match(page, /params\.get\('domainEmailVerified'\) === '1'/);
  assert.match(page, /params\.get\('domainEmailError'\) === '1'/);
  assert.match(page, /router\.replace\(cleanedCallbackUrl\(\), \{ scroll: false \}\)/);
  assert.match(page, /url\.searchParams\.delete\('domainEmailVerified'\)/);
  assert.match(page, /url\.searchParams\.delete\('domainEmailError'\)/);
});
