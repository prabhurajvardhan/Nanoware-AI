import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const adminSource = fs.readFileSync(new URL('../lib/firebase-admin.ts', import.meta.url), 'utf8');
const sessionSource = fs.readFileSync(new URL('../app/api/auth/session/route.ts', import.meta.url), 'utf8');

test('production Firebase Admin initialization fails closed when the server credential is missing or mismatched', () => {
  assert.match(adminSource, /FIREBASE_SERVICE_ACCOUNT_JSON_MISSING/);
  assert.match(adminSource, /process\.env\.NODE_ENV === 'production'/);
  assert.match(adminSource, /FIREBASE_PROJECT_MISMATCH/);
  assert.match(adminSource, /firebaseConfig\.projectId/);
});

test('session failures distinguish invalid credentials from infrastructure failures and keep cookies HttpOnly', () => {
  assert.match(sessionSource, /Authentication failed\.' \}, 401/);
  assert.match(sessionSource, /temporarily unavailable\.' \}, 503/);
  assert.match(sessionSource, /httpOnly: true/);
  assert.match(sessionSource, /x-request-id/);
  assert.doesNotMatch(sessionSource, /console\.error\([^\n]*idToken/);
  assert.doesNotMatch(sessionSource, /return response\([^\n]*error\.message/);
});
