import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { buildInitialBusinessWritePayloads, stripUndefinedFirestoreValues } from '../lib/business/firestore-values.ts';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const accessSource = read('lib/business/access.ts');
const verificationSource = read('lib/business/verification.ts');

function getValidator() {
  const match = verificationSource.match(/export function validateVerificationInput[\s\S]*?\n}/);
  assert.ok(match, 'verification.ts must define validateVerificationInput');
  const javascript = ts.transpile(match[0].replace(/^export\s+/, ''), {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
  });
  const BusinessVerificationError = class extends Error {};
  const clean = (value, max, required = true) => {
    const result = String(value ?? '').trim();
    if (required && !result) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
    if (result.length > max || (result && /[<>\u0000-\u001f]/.test(result))) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
    return result;
  };
  const normalizeEmail = (value) => value.trim().toLowerCase();
  const isFreeBusinessEmail = () => false;
  const domainMatchesWebsite = (email, website) => {
    const hostname = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.toLowerCase();
    const domain = email.split('@')[1].toLowerCase();
    return hostname === domain || hostname.endsWith(`.${domain}`);
  };
  return new Function('BusinessVerificationError', 'clean', 'normalizeEmail', 'COUNTRY_CODE', 'WEBSITE_HOST', 'isFreeBusinessEmail', 'domainMatchesWebsite', `${javascript}; return validateVerificationInput;`)(
    BusinessVerificationError,
    clean,
    normalizeEmail,
    /^[A-Z]{2}$/,
    /^[a-z0-9.-]+$/i,
    isFreeBusinessEmail,
    domainMatchesWebsite,
  );
}

function assertNoUndefinedOrArraySentinels(value, path = 'payload', insideArray = false) {
  assert.notEqual(value, undefined, `undefined found at ${path}`);
  if (value instanceof FieldValue) {
    assert.equal(insideArray, false, `FieldValue sentinel found inside array at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) assertNoUndefinedOrArraySentinels(item, `${path}[${index}]`, true);
    return;
  }
  if (value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    for (const [key, item] of Object.entries(value)) assertNoUndefinedOrArraySentinels(item, `${path}.${key}`, insideArray);
  }
}

const validateVerificationInput = getValidator();

test('minimal onboarding payload builds Firestore-safe new and legacy business write payloads', () => {
  const verification = validateVerificationInput({
    businessName: 'Northstar Studio',
    website: 'https://northstar.example',
    businessEmail: 'owner@northstar.example',
    countryCode: 'US',
  }, 'account@example.net');
  assert.equal(Object.hasOwn(verification, 'registrationType'), false);

  for (const businessExists of [false, true]) {
    const writes = buildInitialBusinessWritePayloads({
      businessExists,
      businessId: 'business_user_1',
      userId: 'user_1',
      tradeName: verification.tradeName,
      slug: 'northstar-studio',
      countryCode: verification.countryCode,
      businessEmail: verification.businessEmail,
      registrationNumber: verification.registrationNumber,
      registrationType: verification.registrationType,
      verification,
      proof: { token: 'proof-token', dnsRecord: '_nanoware-verification', metaName: 'nanoware-verification' },
      websiteCheck: { status: 'failed', method: null },
      now: FieldValue.serverTimestamp(),
    });

    assertNoUndefinedOrArraySentinels(writes);
    assert.equal(Object.hasOwn(writes.business.verification, 'registrationType'), false);
    assert.ok(writes.business.verification.evidence[0].checkedAt instanceof Timestamp);
    assert.equal(writes.business.verification.evidence[0].checkedAt instanceof FieldValue, false);
    assert.equal(writes.membership === null, businessExists);
    assert.equal(writes.registration, null);
  }
});

test('the sanitizer rejects a FieldValue transform nested inside an array', () => {
  assert.throws(() => stripUndefinedFirestoreValues({ evidence: [{ checkedAt: FieldValue.serverTimestamp() }] }), /cannot be used inside arrays/i);
  assert.deepEqual(stripUndefinedFirestoreValues({ evidence: [undefined] }), { evidence: [] });
});

test('createInitialBusiness writes the tested builder payloads directly to Firestore', () => {
  assert.match(accessSource, /buildInitialBusinessWritePayloads\(/);
  assert.match(accessSource, /transaction\.set\(businessRef, writePayloads\.business/);
  assert.match(accessSource, /transaction\.set\(membershipRef, writePayloads\.membership/);
  assert.match(accessSource, /transaction\.set\(registrationRef, writePayloads\.registration/);
});
