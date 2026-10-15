import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const adminSource = fs.readFileSync(new URL('../lib/firebase-admin.ts', import.meta.url), 'utf8');
const sessionSource = fs.readFileSync(new URL('../app/api/auth/session/route.ts', import.meta.url), 'utf8');
const providerSource = fs.readFileSync(new URL('../components/AuthProvider.tsx', import.meta.url), 'utf8');
const loginSource = fs.readFileSync(new URL('../app/login/page.tsx', import.meta.url), 'utf8');
const firebaseConfig = JSON.parse(fs.readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
const { sanitizeSessionDiagnostic, sessionErrorDetails } = await import('../lib/auth/session-diagnostics.ts');

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
  assert.match(sessionSource, /function trustedClientKey\(request: NextRequest, scope: string, clientProof: string\)/);
  assert.match(sessionSource, /crypto\.createHash\('sha256'\)\.update\(clientProof\)/);
  assert.doesNotMatch(sessionSource, /'untrusted-client'/);
  assert.match(sessionSource, /trustedClientKey\(request, 'session', idToken\)/);
  assert.match(sessionSource, /auth_time/);
  assert.match(sessionSource, /Authentication failed\.' \}, 401/);
  assert.match(sessionSource, /temporarily unavailable\.' \}, 503/);
  assert.match(sessionSource, /httpOnly: true/);
  assert.match(sessionSource, /x-request-id/);
  assert.match(sessionSource, /stage = 'verify-id-token'/);
  assert.match(sessionSource, /stage = 'create-session-cookie'/);
  assert.match(sessionSource, /console\.error\('Session provider failure', \{/);
  assert.match(sessionSource, /\.\.\.sessionErrorDetails\(error\)/);
  assert.doesNotMatch(sessionSource, /console\.error\([^\n]*idToken/);
  assert.doesNotMatch(sessionSource, /return response\([^\n]*error\.message/);
});

test('session diagnostics redact tokens, credentials, keys, and email addresses', () => {
  const diagnostic = sanitizeSessionDiagnostic('Bearer abc.def token=eyJabcdefghijk.abcdefghijk.x FIREBASE_SERVICE_ACCOUNT_JSON={"private_key":"secret"} user@example.com');
  assert.doesNotMatch(diagnostic, /abc\.def|eyJabcdefghijk|secret|user@example\.com/);
  assert.match(diagnostic, /Bearer \[REDACTED\]/);
  assert.match(diagnostic, /token=\[REDACTED(?: TOKEN)?\]/);
  const details = sessionErrorDetails(Object.assign(new Error('failed for user@example.com'), { code: 'auth/internal-error' }));
  assert.equal(details.errorName, 'Error');
  assert.equal(details.errorCode, 'auth/internal-error');
  assert.doesNotMatch(details.errorMessage, /user@example\.com/);
  assert.match(details.errorStack, /Error: failed/);
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

// Import-boundary regression: the session route must not load Firebase Admin while its module is evaluated.
// Firebase Admin is allowed only behind dynamic import() inside the POST request boundary.
const ROOT_URL = new URL('../', import.meta.url);
const ROOT_PATH = fileURLToPath(ROOT_URL);
const constantsSource = fs.readFileSync(new URL('../lib/auth/constants.ts', import.meta.url), 'utf8');
const serverAuthSource = fs.readFileSync(new URL('../lib/auth/server.ts', import.meta.url), 'utf8');
const SOURCE_EXTENSIONS = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx', '/index.mjs', '/index.js'];

function resolveLocal(basePath) {
  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// Collects module specifiers from static import/export-from declarations only (type-only declarations are erased).
function staticSpecifiers(source) {
  const specifiers = [];
  const withBindings = /^\s*(import|export)\s+(type\s+)?([^;'"`]*?)\bfrom\s*['"]([^'"\n]+)['"]/gm;
  const sideEffect = /^\s*import\s*['"]([^'"\n]+)['"]/gm;
  for (const match of source.matchAll(withBindings)) if (!match[2]) specifiers.push(match[4]);
  for (const match of source.matchAll(sideEffect)) specifiers.push(match[1]);
  return specifiers;
}

function staticImportGraph(entryRelativePath) {
  const entry = path.join(ROOT_PATH, entryRelativePath);
  const files = new Set();
  const packages = new Set();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop();
    if (files.has(file)) continue;
    files.add(file);
    for (const specifier of staticSpecifiers(fs.readFileSync(file, 'utf8'))) {
      let target = null;
      if (specifier.startsWith('@/')) target = resolveLocal(path.join(ROOT_PATH, specifier.slice(2)));
      else if (specifier.startsWith('.')) target = resolveLocal(path.resolve(path.dirname(file), specifier));
      else { packages.add(specifier); continue; }
      assert.ok(target, `unresolved static import '${specifier}' in ${path.relative(ROOT_PATH, file)}`);
      queue.push(target);
    }
  }
  return {
    files: [...files].map((file) => path.relative(ROOT_PATH, file).split(path.sep).join('/')),
    packages: [...packages],
  };
}

test('auth session constants live in a dependency-free module with unchanged values', async () => {
  assert.doesNotMatch(constantsSource, /^\s*import\b/m);
  const constants = await import('../lib/auth/constants.ts');
  assert.equal(constants.SESSION_COOKIE, '__session');
  assert.equal(constants.MFA_COOKIE, '__admin_mfa');
  assert.equal(constants.SESSION_MAX_AGE_SECONDS, 60 * 60 * 24 * 5);
  assert.equal(constants.SESSION_MAX_AGE_SECONDS, 432000);
  assert.equal(constants.MFA_MAX_AGE_SECONDS, 60 * 60 * 12);
  assert.equal(constants.MFA_MAX_AGE_SECONDS, 43200);
});

test('lib/auth/server re-exports the constants unchanged for existing importers', () => {
  for (const name of ['SESSION_COOKIE', 'MFA_COOKIE', 'SESSION_MAX_AGE_SECONDS', 'MFA_MAX_AGE_SECONDS']) {
    assert.doesNotMatch(serverAuthSource, new RegExp(`export const ${name}\\b`));
  }
  assert.match(serverAuthSource, /export \{[^}]*SESSION_COOKIE[^}]*\} from '\.\/constants'/);
  assert.match(serverAuthSource, /export \{[^}]*MFA_MAX_AGE_SECONDS[^}]*\} from '\.\/constants'/);
  for (const name of ['AuthBoundaryError', 'getVerifiedSession', 'requireAdminActor', 'createMfaToken', 'hash', 'authErrorResponse']) {
    assert.match(serverAuthSource, new RegExp(`export (async )?(function|class) ${name}\\b`));
  }
});

test('session route imports its cookie constants from the dependency-free constants module', () => {
  assert.match(sessionSource, /import \{ MFA_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS \} from '@\/lib\/auth\/constants';/);
  assert.doesNotMatch(sessionSource, /from '@\/lib\/auth\/server'/);
});

test('session route static import graph does not load Firebase Admin during module initialization', () => {
  const graph = staticImportGraph('app/api/auth/session/route.ts');
  const firebasePackages = graph.packages.filter((name) => /^firebase(-admin)?(\/|$)/.test(name) || /^@google-cloud\//.test(name));
  assert.deepEqual(firebasePackages, [], `Firebase packages statically imported: ${firebasePackages.join(', ')}`);
  for (const forbidden of ['lib/firebase-admin.ts', 'lib/auth/server.ts', 'lib/security/rate-limit.ts']) {
    assert.ok(!graph.files.includes(forbidden), `${forbidden} is statically reachable from the session route`);
  }
  assert.ok(graph.files.includes('lib/auth/constants.ts'));
});

test('Firebase Admin remains loaded only inside the session POST request boundary', () => {
  const postStart = sessionSource.indexOf('export async function POST');
  const deleteStart = sessionSource.indexOf('export async function DELETE');
  assert.ok(postStart > 0 && deleteStart > postStart);
  const postBody = sessionSource.slice(postStart, deleteStart);
  assert.match(postBody, /import\('firebase-admin\/auth'\)/);
  assert.match(postBody, /import\('@\/lib\/firebase-admin'\)/);
  assert.match(postBody, /await import\('@\/lib\/security\/rate-limit'\)/);
  assert.match(postBody, /verifyIdToken\(idToken, true\)/);
  assert.match(postBody, /createSessionCookie/);
  assert.doesNotMatch(sessionSource.slice(0, postStart), /firebase-admin/);
});
