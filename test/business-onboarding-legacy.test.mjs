import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const access = read('lib/business/access.ts');
const payloadBuilder = read('lib/business/firestore-values.ts');
const onboardPage = read('app/businesses/onboarding/page.tsx');
const domainEmailRoute = read('app/api/business/evidence/domain-email/request/route.ts');

test('submitting an owner-owned legacy business writes the verification block and pending status', () => {
  assert.match(access, /const isLegacySubmission = businessDoc\.exists && currentStatus == null/);
  assert.match(access, /isLegacySubmission && \(!membershipDoc\.exists[\s\S]*?role !== 'owner'[\s\S]*?status !== 'active'/);
  assert.match(payloadBuilder, /verificationStatus: 'pending_verification'/);
  assert.match(payloadBuilder, /contactEmail: input\.businessEmail/);
  assert.match(payloadBuilder, /verification: \{[\s\S]*?\.\.\.input\.verification,[\s\S]*?businessDomainEmail: 'pending'/);
  assert.match(access, /transaction\.set\(businessRef, writePayloads\.business, \{ merge: true \}\)/);
});

test('a resubmitted business profile can proceed to a domain-email request', () => {
  assert.match(onboardPage, /fetch\('\/api\/business\/onboard'[\s\S]*?JSON\.stringify\(form\)/);
  assert.match(onboardPage, /Save updated email/);
  assert.match(domainEmailRoute, /if \(!submittedEmail\)[\s\S]*?status: 409/);
  assert.match(domainEmailRoute, /email\.trim\(\)\.toLowerCase\(\) !== submittedEmail/);
  assert.match(domainEmailRoute, /issueDomainEmailToken\(\{ uid: session\.uid, businessId, email, website \}\)/);
  assert.match(domainEmailRoute, /sendBusinessDomainEmailVerificationEmail\(issued\.email/);
  assert.match(domainEmailRoute, /return NextResponse\.json\(\{ success: true, expiresAt: issued\.expiresAt \}\)/);
});

test('a different user cannot write to an existing business', () => {
  const ownerGuard = access.indexOf("existingBusinessData?.ownerId !== input.userId");
  const write = access.indexOf('transaction.set(businessRef, writePayloads.business');
  assert.notEqual(ownerGuard, -1);
  assert.ok(ownerGuard < write, 'the owner check must run before writing the business document');
  assert.match(access, /throw new BusinessAccessError\('BUSINESS_ALREADY_OWNED'\)/);
});

test('legacy repair leaves existing membership and project documents unchanged', () => {
  const repairStart = access.indexOf('const isLegacySubmission =');
  const repairEnd = access.indexOf('if (registrationRef && writePayloads.registration)', repairStart);
  const repair = access.slice(repairStart, repairEnd);
  assert.match(payloadBuilder, /input\.businessExists \? null : stripUndefinedFirestoreValues/);
  assert.match(access, /if \(writePayloads\.membership\) transaction\.set\(membershipRef/);
  assert.match(access, /if \(!businessDoc\.exists\) \{\s*for \(const project of legacyProjects\.docs\)/);
  assert.doesNotMatch(repair, /transaction\.update\(project\.ref/);
});
