import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const adminSource = fs.readFileSync(new URL('../lib/firebase-admin.ts', import.meta.url), 'utf8');
const sessionSource = fs.readFileSync(new URL('../app/api/auth/session/route.ts', import.meta.url), 'utf8');
const providerSource = fs.readFileSync(new URL('../components/AuthProvider.tsx', import.meta.url), 'utf8');
const loginSource = fs.readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const firebaseConfig = JSON.parse(fs.readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));

test('Firebase client and Admin configuration target nanoware-ai consistently', () => {
  assert.equal(firebaseConfig.apiKey, 'AIzaSyB4g6xngu9X70kcQFic8rAeUvcQkk6iSUg');
  assert.equal(firebaseConfig.projectId, 'nanoware-ai');
  assert.equal(firebaseConfig.authDomain, 'nanoware-ai.firebaseapp.com');
  assert.equal(firebaseConfig.storageBucket, 'nanoware-ai.firebasestorage.app');
  assert.equal(firebaseConfig.messagingSenderId, '424269053050');
  assert.equal(firebaseConfig.appId, '1:424269053050:web:5987eae5cfe5972d268fc3');
  assert.equal(firebaseConfig.measurementId, 'G-B5Y0GETQ8E');
  assert.match(adminSource, /firebaseConfig\.projectId/);
});

test('production Firebase Admin initialization fails closed when the server credential is missing or mismatched', () => {
  assert.match(adminSource, /FIREBASE_SERVICE_ACCOUNT_JSON_MISSING/);
  assert.match(adminSource, /process\.env\.NODE_ENV === 'production'/);
  assert.match(adminSource, /FIREBASE_PROJECT_MISMATCH/);
  assert.match(adminSource, /firebaseConfig\.projectId/);
});

test('session failures distinguish invalid credentials from infrastructure failures and keep cookies HttpOnly', () => {
  assert.match(sessionSource, /runtime = 'nodejs'/);
  assert.match(sessionSource, /dynamic = 'force-dynamic'/);
  assert.match(sessionSource, /import\('firebase-admin\/auth'\)/);
  assert.match(sessionSource, /import\('\@\/lib\/firebase-admin'\)/);
  assert.match(sessionSource, /await import\('\@\/lib\/security\/rate-limit'\)/);
  assert.match(sessionSource, /isSameOrigin/);
  assert.match(sessionSource, /auth_time/);
  assert.match(sessionSource, /Authentication failed\.' \}, 401/);
  assert.match(sessionSource, /temporarily unavailable\.' \}, 503/);
  assert.match(sessionSource, /httpOnly: true/);
  assert.match(sessionSource, /x-request-id/);
  assert.doesNotMatch(sessionSource, /console\.error\([^\n]*idToken/);
  assert.doesNotMatch(sessionSource, /return response\([^\n]*error\.message/);
});

test('auth state observation does not create duplicate sessions from stale Firebase tokens', () => {
  assert.doesNotMatch(providerSource, /method: 'POST'/);
  assert.match(providerSource, /onAuthStateChanged\(auth, \(u\)/);
});
test('Google login clears stale errors, preserves session failures, and routes only after session creation', () => {
  assert.match(loginSource, /setLoading\(true\); setError\('\'\)/);
  assert.match(loginSource, /await sessionResponse\.json\(\)/);
  assert.match(loginSource, /if \(serverMessage\) throw new Error\(serverMessage\)/);
  assert.match(loginSource, /setError\('\'\);\s*if \(isNewUser\)/);
  assert.match(loginSource, /router\.push\(access\.onboardingRequired \? '\/businesses\/onboarding' : redirectPath\)/);
});
