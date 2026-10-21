import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attemptVerificationEmail, sendEmailWithResend, validateEmailFrom } from '../lib/email/delivery.ts';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const actions = read('lib/email/actions.ts');
const accountRoute = read('app/api/auth/email/request/route.ts');
const accountVerifyRoute = read('app/api/auth/email/verify/route.ts');
const businessRoute = read('app/api/business/evidence/domain-email/request/route.ts');
const businessVerifyRoute = read('app/api/business/evidence/domain-email/verify/route.ts');
const solutionRoute = read('app/api/email/request-solution/route.ts');
const requestsRoute = read('app/api/requests/route.ts');
const adminActions = read('app/admin/actions.ts');
const accountTokens = read('lib/auth/email-verification.ts');
const businessTokens = read('lib/business/domain-email-verification.ts');
const adminOtp = read('app/admin/auth-actions.ts');
const validMessage = { to: 'user@example.com', subject: 'Verify', html: '<p>Verify</p>' };

test('EMAIL_FROM accepts plain mailbox and display-name forms without rewriting them', () => {
  assert.equal(validateEmailFrom('  hello@nanowareai.in  '), 'hello@nanowareai.in');
  assert.equal(validateEmailFrom('Nanoware AI <hello@nanowareai.in>'), 'Nanoware AI <hello@nanowareai.in>');
  assert.equal(validateEmailFrom('"Nanoware AI" <hello@nanowareai.in>'), '"Nanoware AI" <hello@nanowareai.in>');
  for (const invalid of [undefined, '', 'not-an-address', 'Name <bad>', 'a@b.c', 'Name <a@b.com> trailing', 'name\r\nBcc: x@y.com <a@b.com>']) {
    assert.throws(() => validateEmailFrom(invalid), /EMAIL_CONFIGURATION_INVALID/);
  }
});

test('a Resend response is successful only with no API error and a nonempty email ID', async () => {
  let sentPayload;
  const success = await sendEmailWithResend(async (payload) => {
    sentPayload = payload;
    return { data: { id: 'email_123', from: payload.from }, error: null };
  }, 'Nanoware AI <hello@nanowareai.in>', validMessage);
  assert.equal(success.success, true);
  assert.equal(success.emailId, 'email_123');
  assert.equal(sentPayload.from, 'Nanoware AI <hello@nanowareai.in>');
  assert.equal(sentPayload.to, validMessage.to);

  const errorAbsent = await sendEmailWithResend(async () => ({ data: { id: 'email_456' } }), 'hello@nanowareai.in', validMessage);
  assert.equal(errorAbsent.success, true);
  assert.equal(errorAbsent.emailId, 'email_456');
});

test('returned provider errors, thrown exceptions, nulls, and malformed responses fail safely', async () => {
  const originalError = console.error;
  const logs = [];
  console.error = (...values) => logs.push(values.map(String).join(' '));
  try {
    const results = await Promise.all([
      sendEmailWithResend(async () => ({ data: null, error: { message: 'private-recipient api-key-secret' } }), 'hello@nanowareai.in', validMessage),
      sendEmailWithResend(async () => { throw new Error('private-recipient token-secret api-key-secret'); }, 'hello@nanowareai.in', validMessage),
      sendEmailWithResend(async () => null, 'hello@nanowareai.in', validMessage),
      sendEmailWithResend(async () => ({ data: {} }), 'hello@nanowareai.in', validMessage),
      sendEmailWithResend(async () => ({ data: { id: '' }, error: null }), 'hello@nanowareai.in', validMessage),
    ]);
    assert.ok(results.every((result) => result.success === false && result.error === 'EMAIL_DELIVERY_UNCONFIRMED'));
    assert.ok(logs.length >= results.length);
    const joinedLogs = logs.join('\n');
    assert.doesNotMatch(joinedLogs, /private-recipient|token-secret|api-key-secret/);
  } finally {
    console.error = originalError;
  }
});

test('missing or malformed sender configuration fails before calling Resend', async () => {
  let calls = 0;
  const send = async () => { calls += 1; return { data: { id: 'should-not-send' }, error: null }; };
  for (const sender of [undefined, '', 'hello@invalid', 'Bad <sender>']) {
    const result = await sendEmailWithResend(send, sender, validMessage);
    assert.deepEqual(result, { success: false, error: 'EMAIL_CONFIGURATION_INVALID' });
  }
  assert.equal(calls, 0);
});

test('failed or thrown verification delivery invalidates its token; confirmed success preserves it', async () => {
  for (const [label, send] of [
    ['account email', async () => ({ success: false, error: 'EMAIL_DELIVERY_UNCONFIRMED' })],
    ['business-domain email', async () => { throw new Error('opaque provider failure'); }],
  ]) {
    let invalidated = 0;
    const result = await attemptVerificationEmail(send, async () => { invalidated += 1; return true; });
    assert.deepEqual(result, { success: false, tokenInvalidated: true }, `${label} should invalidate failed-send token`);
    assert.equal(invalidated, 1);
  }

  let invalidatedOnSuccess = false;
  const success = await attemptVerificationEmail(
    async () => ({ success: true, emailId: 'email_ok', data: { id: 'email_ok' } }),
    async () => { invalidatedOnSuccess = true; return true; },
  );
  assert.deepEqual(success, { success: true, tokenInvalidated: false });
  assert.equal(invalidatedOnSuccess, false);

  const malformedSuccess = await attemptVerificationEmail(
    async () => ({ success: true, emailId: '', data: { id: '' } }),
    async () => true,
  );
  assert.deepEqual(malformedSuccess, { success: false, tokenInvalidated: true });

  const cleanupFailure = await attemptVerificationEmail(
    async () => ({ success: false, error: 'EMAIL_DELIVERY_UNCONFIRMED' }),
    async () => false,
  );
  assert.deepEqual(cleanupFailure, { success: false, tokenInvalidated: false });
});

test('both verification routes return retryable 503 on unconfirmed email and invalidate issued tokens', () => {
  assert.match(accountRoute, /attemptVerificationEmail\([\s\S]*?sendAccountEmailVerificationEmail[\s\S]*?invalidateEmailVerificationToken/);
  assert.match(accountRoute, /if \(!attempt\.success\)[\s\S]*?status: 503/);
  assert.match(accountRoute, /return NextResponse\.json\(\{ success: true, expiresAt: issued\.expiresAt \}\)/);

  assert.match(businessRoute, /attemptVerificationEmail\([\s\S]*?sendBusinessDomainEmailVerificationEmail[\s\S]*?invalidateDomainEmailToken/);
  assert.match(businessRoute, /if \(!attempt\.success\)[\s\S]*?status: 503/);
  assert.match(businessRoute, /return NextResponse\.json\(\{ success: true, expiresAt: issued\.expiresAt \}\)/);

  assert.match(accountTokens, /export async function invalidateEmailVerificationToken[\s\S]*?tokenRef\.delete\(\)[\s\S]*?tokenRef\.update\(\{ used: true, expiresAt: Date\.now\(\) \}\)/);
  assert.match(businessTokens, /export async function invalidateDomainEmailToken[\s\S]*?tokenRef\.delete\(\)[\s\S]*?tokenRef\.update\(\{ used: true, expiresAt: Date\.now\(\) \}\)/);
});

test('admin OTP challenge is deleted when email delivery is not confirmed', () => {
  assert.match(adminOtp, /if \(!emailResult\.success\)\s*\{\s*try\s*\{\s*await challengeRef\.delete\(\);\s*\} catch\s*\{\s*await challengeRef\.update\(\{ consumed: true, expiresAt: Date\.now\(\) \}\)/);
});

test('every email helper uses the validated EMAIL_FROM and shared Resend acknowledgement check', () => {
  assert.match(actions, /sendEmailWithResend\([\s\S]*?process\.env\.EMAIL_FROM/);
  assert.equal((actions.match(/\.emails\.send\(/g) || []).length, 1);
  assert.match(actions, /getResendClient\(\)\.emails\.send\(payload\)/);
  assert.doesNotMatch(actions, /console\.error\([^\n]*(?:error\?|catch \(error|process\.env)/);
  for (const source of [accountRoute, accountVerifyRoute, businessRoute, businessVerifyRoute, solutionRoute, requestsRoute, adminActions, adminOtp]) {
    assert.doesNotMatch(source, /console\.error\([^\n]*(?:error\?|error\.message|\, error\)|unknown error)/);
  }
});
