import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('signup no longer creates browser-owned projects and routes through onboarding', () => {
  const login = read('app/login/page.tsx');
  assert.doesNotMatch(login, /addDoc\(collection\(db, ['"]projects/);
  assert.doesNotMatch(login, /setDoc\(doc\(db, ['"]users/);
  assert.match(login, /\/api\/auth\/session/);
  assert.match(login, /\/businesses\/onboarding/);
});

test('dashboard resolves business membership before businessId-scoped Firestore reads', () => {
  const dashboard = read('app/dashboard/page.tsx');
  assert.match(dashboard, /\/api\/business\/access/);
  assert.match(dashboard, /where\('businessId', '==', selectedBusinessId\)/);
  assert.match(dashboard, /Choose a workspace/);
  assert.doesNotMatch(dashboard, /where\('userId', '==', user\.uid\)/);
});

test('server onboarding is idempotent and creates the owner membership', () => {
  const access = read('lib/business/access.ts');
  const route = read('app/api/business/onboard/route.ts');
  assert.match(access, /runTransaction/);
  assert.match(access, /role: 'owner'/);
  assert.match(access, /businessId/);
  assert.match(route, /getVerifiedSession/);
});

test('Firestore rules deny membership writes and require active tenant membership', () => {
  const rules = read('firestore.rules');
  assert.match(rules, /match \/memberships\/\{membershipId\}/);
  assert.match(rules, /allow read, write: if false;/);
  assert.match(rules, /data\.status == 'active'/);
  assert.match(rules, /\['owner', 'admin'\]/);
  assert.match(rules, /hasBusinessMembership\(resource\.data\.businessId\)/);
});

test('member feedback uses a verified server route rather than direct activity writes', () => {
  const dashboard = read('app/dashboard/DashboardContent.tsx');
  const route = read('app/api/business/projects/[projectId]/feedback/route.ts');
  assert.match(dashboard, /\/api\/business\/projects/);
  assert.doesNotMatch(dashboard, /addDoc\(collection\(db, `projects\/\$\{project\.id\}\/activities`/);
  assert.match(route, /requireBusinessMembership/);
});
