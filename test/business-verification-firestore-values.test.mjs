import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const accessSource = read('lib/business/access.ts');
const verificationSource = read('lib/business/verification.ts');

function getAccessSanitizer() {
  const match = accessSource.match(/export function stripUndefinedFirestoreValues[\s\S]*?\n}/);
  assert.ok(match, 'access.ts must define the Firestore undefined-value sanitizer');
  const javascript = ts.transpile(match[0].replace(/^export\s+/, ''), {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
  });
  return new Function(`${javascript}; return stripUndefinedFirestoreValues;`)();
}

function containsUndefined(value) {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(containsUndefined);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value).some(containsUndefined);
  }
  return false;
}

const stripUndefined = getAccessSanitizer();

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
const validateVerificationInput = getValidator();

test('minimal onboarding input has only defined validation fields and Firestore payloads', () => {
  const verification = validateVerificationInput({
    businessName: 'Northstar Studio',
    website: 'https://northstar.example',
    businessEmail: 'owner@northstar.example',
    countryCode: 'US',
  }, 'account@example.net');

  assert.equal(Object.hasOwn(verification, 'registrationType'), false);
  assert.equal(containsUndefined(verification), false);

  for (const isLegacyBusiness of [false, true]) {
    const now = { timestampSentinel: true };
    const rawBusinessWrite = {
      ...(isLegacyBusiness ? {} : {
        name: verification.tradeName,
        slug: 'northstar-studio',
        ownerId: 'user_1',
        status: 'active',
        timezone: 'UTC',
        createdAt: now,
      }),
      verificationStatus: 'pending_verification',
      contactEmail: verification.businessEmail,
      verification: {
        ...verification,
        registrationType: undefined,
        submittedBy: 'user_1',
        websiteProof: { token: 'proof', status: 'failed', method: null, checkedAt: now },
        checks: {
          accountEmail: 'verified',
          phone: 'pending',
          websiteOwnership: 'failed',
          businessDomainEmail: 'pending',
          googleBusinessProfile: 'not_provided',
        },
        evidence: [{ evidenceType: 'website_ownership', status: 'failed', source: 'unavailable', checkedAt: now }],
        reviewReason: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      updatedAt: now,
    };
    const businessWrite = stripUndefined(rawBusinessWrite);
    assert.equal(containsUndefined(businessWrite), false, `${isLegacyBusiness ? 'legacy' : 'new'} business payload contains undefined`);
    assert.equal(Object.hasOwn(businessWrite.verification, 'registrationType'), false);

    if (!isLegacyBusiness) {
      const membershipWrite = stripUndefined({ businessId: 'business_user_1', userId: 'user_1', role: 'owner', status: 'active', createdAt: now, updatedAt: now });
      assert.equal(containsUndefined(membershipWrite), false, 'new-business membership payload contains undefined');
    }
  }
});

test('all createInitialBusiness transaction writes sanitize the data passed to Firestore', () => {
  assert.match(accessSource, /transaction\.set\(businessRef,\s*stripUndefinedFirestoreValues\(businessData\)/);
  assert.match(accessSource, /transaction\.set\(membershipRef,\s*stripUndefinedFirestoreValues\(\{/);
  assert.match(accessSource, /transaction\.set\(registrationRef,\s*stripUndefinedFirestoreValues\(\{/);
  assert.match(accessSource, /transaction\.update\(project\.ref,\s*stripUndefinedFirestoreValues\(\{/);
});
