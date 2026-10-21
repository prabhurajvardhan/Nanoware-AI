import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { fetchPublicHtml } from '../security/safe-fetch';
import { normalizeEmail } from '../security/validation.mjs';

export const VERIFICATION_STATUSES = ['not_started', 'pending_review', 'verified', 'rejected', 'suspended'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const BUSINESS_TYPES = ['sole_proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp', 'trust', 'society', 'other'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export class BusinessVerificationError extends Error {
  public readonly code: 'INVALID_BUSINESS_DETAILS' | 'FREE_EMAIL_NOT_ALLOWED' | 'INVALID_REGISTRATION_NUMBER' | 'REGISTRATION_ALREADY_USED' | 'REGISTRATION_REJECTED' | 'WEBSITE_OWNERSHIP_UNVERIFIED' | 'VERIFICATION_NOT_FOUND' | 'INVALID_VERIFICATION_ACTION' | 'VERIFICATION_CONFLICT';
  constructor(code:
    | 'INVALID_BUSINESS_DETAILS'
    | 'FREE_EMAIL_NOT_ALLOWED'
    | 'INVALID_REGISTRATION_NUMBER'
    | 'REGISTRATION_ALREADY_USED'
    | 'REGISTRATION_REJECTED'
    | 'WEBSITE_OWNERSHIP_UNVERIFIED'
    | 'VERIFICATION_NOT_FOUND'
    | 'INVALID_VERIFICATION_ACTION'
    | 'VERIFICATION_CONFLICT') {
    super(code);
    this.code = code;
    this.name = 'BusinessVerificationError';
  }
}

export type VerificationInput = {
  legalName: string;
  tradeName: string;
  businessType: BusinessType;
  country: string;
  website: string;
  businessEmail: string;
  phone: string;
  registrationType: 'gstin' | 'udyam' | 'other';
  registrationNumber: string;
  address: string;
  expectedUse: string;
};

export type BusinessVerification = VerificationInput & {
  submittedBy: string;
  emailDomain: string;
  emailDomainIsFree: boolean;
  websiteProof: {
    token: string;
    dnsRecord: string;
    metaName: string;
    status: 'pending' | 'verified' | 'failed';
    method: 'dns' | 'meta' | null;
    checkedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  };
  checks: {
    registrationFormatValid: boolean;
    businessEmailAccepted: boolean;
    websiteOwnership: 'pending' | 'verified' | 'failed';
  };
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
};

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
  'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
  'mail.com', 'gmx.com', 'rediffmail.com', 'yandex.com', 'zoho.com',
]);
const SAFE_TEXT = /^[^<>\u0000-\u001f]+$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;
const PHONE = /^\+?[1-9][0-9 ()-]{6,19}$/;
const WEBSITE_HOST = /^[a-z0-9.-]+$/i;

function clean(value: unknown, max: number) {
  const result = String(value ?? '').trim();
  if (!result || result.length > max || !SAFE_TEXT.test(result)) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  return result;
}

function registrationIsValid(type: VerificationInput['registrationType'], value: string, country: string) {
  const normalized = value.toUpperCase().replace(/\s+/g, '');
  if (country === 'IN' && type === 'gstin') return /^[0-9]{2}[A-Z0-9]{13}$/.test(normalized);
  if (country === 'IN' && type === 'udyam') return /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(normalized);
  return /^[A-Z0-9][A-Z0-9./_-]{2,63}$/.test(normalized);
}

export function isFreeBusinessEmail(email: string) {
  return FREE_EMAIL_DOMAINS.has(email.split('@')[1]?.toLowerCase() || '');
}

export function validateVerificationInput(raw: Partial<VerificationInput>, sessionEmail: string): VerificationInput & { emailDomain: string; emailDomainIsFree: boolean } {
  const legalName = clean(raw.legalName, 120);
  const tradeName = clean(raw.tradeName || raw.legalName, 120);
  const businessType = raw.businessType;
  const country = String(raw.country || '').trim().toUpperCase();
  const website = clean(raw.website, 2048);
  const businessEmail = normalizeEmail(raw.businessEmail || sessionEmail);
  const phone = clean(raw.phone, 32);
  const registrationType = raw.registrationType;
  const registrationNumber = clean(raw.registrationNumber, 64).toUpperCase().replace(/\s+/g, '');
  const address = clean(raw.address, 500);
  const expectedUse = clean(raw.expectedUse, 1000);

  if (!BUSINESS_TYPES.includes(businessType as BusinessType) || !COUNTRY_CODE.test(country) || !PHONE.test(phone)) {
    throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  }
  if (!['gstin', 'udyam', 'other'].includes(registrationType || '') || !registrationIsValid(registrationType!, registrationNumber, country)) {
    throw new BusinessVerificationError('INVALID_REGISTRATION_NUMBER');
  }
  try {
    const parsed = new URL(website.startsWith('http') ? website : `https://${website}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || !WEBSITE_HOST.test(parsed.hostname)) {
      throw new Error('invalid website');
    }
  } catch {
    throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  }

  const emailDomain = businessEmail.split('@')[1].toLowerCase();
  const emailDomainIsFree = isFreeBusinessEmail(businessEmail);
  return { legalName, tradeName, businessType: businessType as BusinessType, country, website, businessEmail, phone, registrationType: registrationType!, registrationNumber, address, expectedUse, emailDomain, emailDomainIsFree };
}

export function registrationKey(country: string, registrationNumber: string) {
  return crypto.createHash('sha256').update(`${country}:${registrationNumber.toUpperCase()}`).digest('hex');
}

export function createWebsiteProof() {
  const token = crypto.randomBytes(24).toString('hex');
  return { token, dnsRecord: `_nanoware-verification`, metaName: 'nanoware-verification' };
}

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function checkWebsiteOwnership(website: string, proof: { token: string; dnsRecord: string; metaName: string }) {
  if (!website) return { status: 'pending' as const, method: null };
  const url = new URL(website.startsWith('http') ? website : `https://${website}`);
  const dnsName = `${proof.dnsRecord}.${url.hostname}`;
  try {
    const records = await dns.resolveTxt(dnsName);
    if (records.flat().some((value) => constantTimeEqual(value.trim(), proof.token))) return { status: 'verified' as const, method: 'dns' as const };
  } catch {
    // A missing record is an expected pending state, not an infrastructure error.
  }
  try {
    const response = await fetchPublicHtml(url.toString());
    const escapedToken = proof.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const meta = new RegExp(`<meta\\s+[^>]*name=["']${proof.metaName}["'][^>]*content=["']${escapedToken}["'][^>]*>`, 'i');
    const reverseMeta = new RegExp(`<meta\\s+[^>]*content=["']${escapedToken}["'][^>]*name=["']${proof.metaName}["'][^>]*>`, 'i');
    if (meta.test(response.html) || reverseMeta.test(response.html)) return { status: 'verified' as const, method: 'meta' as const };
  } catch {
    // Website checks are retried by a later submission or admin review.
  }
  return { status: 'failed' as const, method: null };
}
