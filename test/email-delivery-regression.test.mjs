import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attemptVerificationEmail, sendEmailWithTransport, validateEmailFrom } from '../lib/email/delivery.ts';
import { readSmtpConfiguration } from '../lib/email/smtp-config.ts';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const actions = read('lib/email/actions.ts');
const transportSource = read('lib/email/transport.ts');
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
const validMessage = { to: 'recipient@example.com', subject: 'Verify', html: '<p>Verify</p>' };
const sender = 'Nanoware AI <hello@nanowareai.in>';
const authenticatedUser = 'smtp-user@nanowareai.in';

function mockedTransport(result) {
  const calls = [];
  return {
    calls,
    sendMail: async (message) => {
      calls.push(message);
      if (typeof result === 'function') return result(message);
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

function captureLogs() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const lines = [];
  console.error = (...values) => lines.push(values.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' '));
  console.warn = (...values) => lines.push(values.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' '));
  return { lines, restore() { console.error = originalError; console.warn = originalWarn; } };
}

test('EMAIL_FROM accepts plain mailbox and display-name forms without rewriting them', () => {
  assert.equal(validateEmailFrom('  hello@nanowareai.in  '), 'hello@nanowareai.in');
  assert.equal(validateEmailFrom(sender), sender);
  assert.equal(validateEmailFrom('"Nanoware AI" <hello@nanowareai.in>'), '"Nanoware AI" <hello@nanowareai.in>');
  for (const invalid of [undefined, '', 'not-an-address', 'Name <bad>', 'a@b.c', 'Name <a@b.com> trailing', 'name\r\nBcc: x@y.com <a@b.com>']) {
    assert.throws(() => validateEmailFrom(invalid), /EMAIL_CONFIGURATION_INVALID/);
  }
});

test('SMTP defaults to the configured Zoho India host, SSL 465, and non-pooled bounded connections', () => {
  const config = readSmtpConfiguration({ SMTP_USER: authenticatedUser, SMTP_PASS: 'not-logged-secret' });
  assert.deepEqual(config, {
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    user: authenticatedUser,
    pass: 'not-logged-secret',
  });
  assert.deepEqual(readSmtpConfiguration({ SMTP_HOST: 'smtp.example.net', SMTP_PORT: '587', SMTP_USER: authenticatedUser, SMTP_PASS: 'x' }), {
    host: 'smtp.example.net', port: 587, secure: false, user: authenticatedUser, pass: 'x',
  });
  assert.deepEqual(readSmtpConfiguration({ SMTP_PORT: '587', SMTP_SECURE: 'true', SMTP_USER: authenticatedUser, SMTP_PASS: 'x' }), {
    host: 'smtp.zoho.in', port: 587, secure: true, user: authenticatedUser, pass: 'x',
  });
  assert.equal(readSmtpConfiguration({ SMTP_USER: authenticatedUser }), null);
  assert.equal(readSmtpConfiguration({ SMTP_USER: authenticatedUser, SMTP_PASS: 'x', SMTP_PORT: 'nope' }), null);
  assert.match(transportSource, /pool:\s*false/);
  assert.match(transportSource, /connectionTimeout:\s*10_000/);
  assert.match(transportSource, /greetingTimeout:\s*10_000/);
  assert.match(transportSource, /socketTimeout:\s*15_000/);
  assert.match(transportSource, /import ['"]server-only['"]/);
});

test('SMTP success requires messageId, recipient acceptance, and an empty rejected list', async () => {
  let transport = mockedTransport({ messageId: '<smtp-123@zoho.in>', accepted: ['recipient@example.com'], rejected: [] });
  const success = await sendEmailWithTransport(transport, sender, authenticatedUser, validMessage);
  assert.equal(success.success, true);
  assert.equal(success.emailId, '<smtp-123@zoho.in>');
  assert.equal(transport.calls.length, 1);
  assert.equal(transport.calls[0].from, sender);
  assert.equal(transport.calls[0].to, validMessage.to);

  transport = mockedTransport({ messageId: 'smtp-456', accepted: [{ address: 'recipient@example.com' }], rejected: [] });
  assert.equal((await sendEmailWithTransport(transport, 'hello@nanowareai.in', 'hello@nanowareai.in', validMessage)).success, true);
});

test('a rejected or unaccepted recipient is not reported as successful', async () => {
  const results = await Promise.all([
    sendEmailWithTransport(mockedTransport({ messageId: 'smtp-1', accepted: [], rejected: ['recipient@example.com'] }), sender, authenticatedUser, validMessage),
    sendEmailWithTransport(mockedTransport({ messageId: 'smtp-2', accepted: ['other@example.com'], rejected: [] }), sender, authenticatedUser, validMessage),
    sendEmailWithTransport(mockedTransport({ messageId: 'smtp-3', accepted: ['recipient@example.com'], rejected: ['other@example.com'] }), sender, authenticatedUser, validMessage),
    sendEmailWithTransport(mockedTransport({ messageId: 'smtp-4', accepted: ['recipient@example.com'] }), sender, authenticatedUser, validMessage),
    sendEmailWithTransport(mockedTransport({ accepted: ['recipient@example.com'], rejected: [] }), sender, authenticatedUser, validMessage),
  ]);
  assert.ok(results.every((result) => result.success === false && result.error === 'EMAIL_DELIVERY_UNCONFIRMED'));
});

test('missing or malformed SMTP config and sender fail before sending', async () => {
  let calls = 0;
  const transport = { sendMail: async () => { calls += 1; return { messageId: 'should-not-send', accepted: [validMessage.to], rejected: [] }; } };
  const missing = await sendEmailWithTransport(null, sender, undefined, validMessage);
  assert.deepEqual(missing, { success: false, error: 'EMAIL_CONFIGURATION_INVALID' });
  for (const from of [undefined, '', 'hello@invalid', 'Bad <sender>']) {
    const result = await sendEmailWithTransport(transport, from, authenticatedUser, validMessage);
    assert.deepEqual(result, { success: false, error: 'EMAIL_CONFIGURATION_INVALID' });
  }
  assert.equal(calls, 0);
});

test('SMTP authentication failure returns a distinct safe code; timeout remains retryable failure', async () => {
  const auth = new Error('private smtp-user recipient SMTP_PASS');
  auth.code = 'EAUTH';
  auth.responseCode = 535;
  auth.response = 'password=private SMTP_USER';
  const timeout = new Error('private recipient SMTP_PASS token');
  timeout.code = 'ETIMEDOUT';
  timeout.responseCode = 0;
  const capture = captureLogs();
  try {
    const authResult = await sendEmailWithTransport(mockedTransport(auth), sender, authenticatedUser, validMessage);
    const timeoutResult = await sendEmailWithTransport(mockedTransport(timeout), sender, authenticatedUser, validMessage);
    assert.deepEqual(authResult, { success: false, error: 'EMAIL_AUTH_FAILED' });
    assert.deepEqual(timeoutResult, { success: false, error: 'EMAIL_DELIVERY_UNCONFIRMED' });
    const logs = capture.lines.join('\n');
    assert.match(logs, /EAUTH/);
    assert.match(logs, /ETIMEDOUT/);
    assert.match(logs, /535/);
    assert.doesNotMatch(logs, /recipient@example\.com|smtp-user@nanowareai\.in|SMTP_PASS|private|password=/i);
  } finally {
    capture.restore();
  }
});

test('mismatched From is warned with a fixed code only and may pass when it is an accepted alias', async () => {
  const capture = captureLogs();
  try {
    const result = await sendEmailWithTransport(
      mockedTransport({ messageId: 'smtp-alias', accepted: [validMessage.to], rejected: [] }),
      sender,
      authenticatedUser,
      validMessage,
    );
    assert.equal(result.success, true);
    assert.ok(capture.lines.some((line) => line.includes('EMAIL_FROM_DIFFERS_FROM_SMTP_USER')));
    const logs = capture.lines.join('\n');
    assert.doesNotMatch(logs, /recipient@example\.com|smtp-user@nanowareai\.in|hello@nanowareai\.in/);
  } finally {
    capture.restore();
  }
});

test('provider failures and malformed responses never log secrets, recipients, or message content', async () => {
  const errors = [
    Object.assign(new Error('secret SMTP_PASS recipient@example.com body=secret-body'), { code: 'ECONNECTION', responseCode: 421 }),
    Object.assign(new Error('smtp user recipient@example.com'), { code: 'EENVELOPE', responseCode: 550 }),
  ];
  const capture = captureLogs();
  try {
    for (const error of errors) {
      const result = await sendEmailWithTransport(mockedTransport(error), sender, authenticatedUser, { ...validMessage, html: 'secret-body' });
      assert.deepEqual(result, { success: false, error: 'EMAIL_DELIVERY_UNCONFIRMED' });
    }
    const joined = capture.lines.join('\n');
    assert.doesNotMatch(joined, /recipient@example\.com|smtp-user@nanowareai\.in|SMTP_PASS|secret-body|password=/i);
    assert.match(joined, /ECONNECTION/);
    assert.match(joined, /EENVELOPE/);
    assert.match(joined, /421/);
    assert.match(joined, /550/);
  } finally {
    capture.restore();
  }
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
    async () => ({ success: true, emailId: 'email_ok', data: { messageId: 'email_ok' } }),
    async () => { invalidatedOnSuccess = true; return true; },
  );
  assert.deepEqual(success, { success: true, tokenInvalidated: false });
  assert.equal(invalidatedOnSuccess, false);
  const malformedSuccess = await attemptVerificationEmail(
    async () => ({ success: true, emailId: '', data: { messageId: '' } }),
    async () => true,
  );
  assert.deepEqual(malformedSuccess, { success: false, tokenInvalidated: true });
});

test('both verification routes return retryable 503 on unconfirmed email and invalidate issued tokens', () => {
  assert.match(accountRoute, /attemptVerificationEmail\([\s\S]*?sendAccountEmailVerificationEmail[\s\S]*?invalidateEmailVerificationToken/);
  assert.match(accountRoute, /if \(!attempt\.success\)[\s\S]*?status: 503/);
  assert.match(businessRoute, /attemptVerificationEmail\([\s\S]*?sendBusinessDomainEmailVerificationEmail[\s\S]*?invalidateDomainEmailToken/);
  assert.match(businessRoute, /if \(!attempt\.success\)[\s\S]*?status: 503/);
  assert.match(accountTokens, /export async function invalidateEmailVerificationToken[\s\S]*?tokenRef\.delete\(\)[\s\S]*?tokenRef\.update\(\{ used: true, expiresAt: Date\.now\(\) \}\)/);
  assert.match(businessTokens, /export async function invalidateDomainEmailToken[\s\S]*?tokenRef\.delete\(\)[\s\S]*?tokenRef\.update\(\{ used: true, expiresAt: Date\.now\(\) \}\)/);
});

test('admin OTP challenge is deleted when email delivery is not confirmed', () => {
  assert.match(adminOtp, /if \(!emailResult\.success\)\s*\{\s*try\s*\{\s*await challengeRef\.delete\(\);\s*\} catch\s*\{\s*await challengeRef\.update\(\{ consumed: true, expiresAt: Date\.now\(\) \}\)/);
});

test('every email helper uses the shared SMTP transport and safe logging', () => {
  assert.match(actions, /sendEmailWithTransport\([\s\S]*?getSmtpTransport\(\)[\s\S]*?process\.env\.EMAIL_FROM/);
  assert.doesNotMatch(actions, /resend|\.emails\.send\(/i);
  assert.match(transportSource, /nodemailer\.createTransport/);
  assert.match(transportSource, /auth:\s*\{ user: configuration\.user, pass: configuration\.pass \}/);
  assert.doesNotMatch(actions, /console\.error\([^\n]*(?:error\?|catch \(error|process\.env)/);
  for (const source of [accountRoute, accountVerifyRoute, businessRoute, businessVerifyRoute, solutionRoute, requestsRoute, adminActions, adminOtp]) {
    assert.doesNotMatch(source, /console\.error\([^\n]*(?:error\?|error\.message|\, error\)|unknown error)/);
  }
});
