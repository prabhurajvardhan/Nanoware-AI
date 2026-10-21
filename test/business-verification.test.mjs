import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const verification = read('lib/business/verification.ts');

test('business verification contains India registration formats and normalization rules', () => {
  assert.match(verification, /String\(raw\.country.*toUpperCase\(\)/);
  assert.match(verification, /clean\(raw\.registrationNumber.*toUpperCase\(\)/);
  assert.match(verification, /\^\[0-9\]\{2\}\[A-Z0-9\]\{13\}\$/);
  assert.match(verification, /UDYAM-/);
});

test('free-mail business submissions remain pending until an explicit admin override', () => {
  assert.match(verification, /emailDomainIsFree/);
  assert.match(read('lib/business/access.ts'), /businessEmailAccepted: !verification\.emailDomainIsFree/);
  assert.match(read('lib/business/verification-admin.ts'), /allowFreeEmail !== true/);
});

test('verification API and review service keep authorization on the server', () => {
  const route = read('app/api/admin/business-verifications/[businessId]/route.ts');
  const service = read('lib/business/verification-admin.ts');
  assert.match(route, /requireAdminActor\(\{ requireMfa: true \}\)/);
  assert.match(route, /allowFreeEmail/);
  assert.match(service, /createAuditEvent/);
  assert.match(service, /transaction\.set\(db\.collection\('auditEvents'\)/);
  assert.match(service, /websiteOwnership !== 'verified'/);
});

test('operations business access requires verified status while list access exposes only safe status fields', () => {
  const route = read('app/api/business/access/route.ts');
  const access = read('lib/business/access.ts');
  assert.match(route, /requireVerifiedBusinessMembership/);
  assert.match(access, /verificationStatus/);
  assert.match(access, /BUSINESS_PENDING_VERIFICATION/);
  assert.doesNotMatch(route, /getAdminDb\(\).*verification/);
});
