import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { fetchPublicHtml } from '../security/safe-fetch';
import { normalizeEmail } from '../security/validation.mjs';
import { domainMatchesWebsite } from './domain-format';

export const VERIFICATION_STATUSES = ['not_started', 'pending_verification', 'pending_review', 'verified', 'more_information_required', 'rejected', 'suspended'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export class BusinessVerificationError extends Error {
  public readonly code: 'INVALID_BUSINESS_DETAILS' | 'FREE_EMAIL_NOT_ALLOWED' | 'BUSINESS_EMAIL_DOMAIN_MISMATCH' | 'REGISTRATION_ALREADY_USED' | 'REGISTRATION_REJECTED' | 'WEBSITE_OWNERSHIP_UNVERIFIED' | 'VERIFICATION_NOT_FOUND' | 'INVALID_VERIFICATION_ACTION' | 'VERIFICATION_CONFLICT';
  constructor(code: BusinessVerificationError['code']) {
    super(code);
    this.code = code;
    this.name = 'BusinessVerificationError';
  }
}

export type VerificationInput = {
  businessName: string;
  countryCode: string;
  country?: string;
  website: string;
  businessEmail: string;
  phone?: string;
  legalName?: string;
  tradeName?: string;
  businessType?: string;
  registrationType?: 'gstin' | 'udyam' | 'other';
  registrationNumber?: string;
  address?: string;
  expectedUse?: string;
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
    accountEmail: 'pending' | 'verified' | 'failed';
    phone: 'pending' | 'verified' | 'failed' | 'unavailable';
    websiteOwnership: 'pending' | 'verified' | 'failed';
    businessDomainEmail: 'not_provided' | 'pending' | 'verified' | 'failed';
    googleBusinessProfile: 'not_provided' | 'claimed' | 'verified' | 'failed';
  };
  evidence: Array<{ evidenceType: string; status: string; source: string; checkedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null }>;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
};

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'mail.com', 'gmx.com', 'rediffmail.com',
  'yandex.com', 'zoho.com',
]);
const SAFE_TEXT = /^[^<>\u0000-\u001f]+$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;
const WEBSITE_HOST = /^[a-z0-9.-]+$/i;

function clean(value: unknown, max: number, required = true) {
  const result = String(value ?? '').trim();
  if (required && !result) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  if (result.length > max || (result && !SAFE_TEXT.test(result))) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  return result;
}

export function isFreeBusinessEmail(email: string) {
  return FREE_EMAIL_DOMAINS.has(email.split('@')[1]?.toLowerCase() || '');
}

export function validateVerificationInput(raw: Partial<VerificationInput>, sessionEmail: string) {
  const businessName = clean(raw.businessName || raw.tradeName || raw.legalName, 160);
  const countryCode = String(raw.countryCode || raw.country || '').trim().toUpperCase();
  const website = clean(raw.website, 2048);
  const submittedEmail = String(raw.businessEmail || '').trim();
  if (!submittedEmail) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  const businessEmail = normalizeEmail(submittedEmail);
  if (!COUNTRY_CODE.test(countryCode)) throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  try {
    const parsed = new URL(website.startsWith('http') ? website : `https://${website}`);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || !WEBSITE_HOST.test(parsed.hostname)) throw new Error('invalid website');
  } catch {
    throw new BusinessVerificationError('INVALID_BUSINESS_DETAILS');
  }
  if (isFreeBusinessEmail(businessEmail)) throw new BusinessVerificationError('FREE_EMAIL_NOT_ALLOWED');
  if (!domainMatchesWebsite(businessEmail, website)) throw new BusinessVerificationError('BUSINESS_EMAIL_DOMAIN_MISMATCH');
  return {
    businessName,
    countryCode,
    website,
    businessEmail,
    phone: clean(raw.phone, 32, false),
    legalName: clean(raw.legalName || businessName, 160),
    tradeName: clean(raw.tradeName || businessName, 160),
    businessType: clean(raw.businessType || 'other', 64),
    registrationType: raw.registrationType,
    registrationNumber: clean(raw.registrationNumber, 64, false).toUpperCase().replace(/\s+/g, ''),
    address: clean(raw.address, 500, false),
    expectedUse: clean(raw.expectedUse, 1000, false),
    emailDomain: businessEmail.split('@')[1].toLowerCase(),
    emailDomainIsFree: isFreeBusinessEmail(businessEmail),
  };
}

export function registrationKey(country: string, registrationNumber: string) {
  return crypto.createHash('sha256').update(`${country}:${registrationNumber.toUpperCase()}`).digest('hex');
}

export function createWebsiteProof() {
  const token = crypto.randomBytes(24).toString('hex');
  return { token, dnsRecord: '_nanoware-verification', metaName: 'nanoware-verification' };
}

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function checkWebsiteOwnership(website: string, proof: { token: string; dnsRecord: string; metaName: string }) {
  const url = new URL(website.startsWith('http') ? website : `https://${website}`);
  try {
    const records = await dns.resolveTxt(`${proof.dnsRecord}.${url.hostname}`);
    if (records.flat().some((value) => constantTimeEqual(value.trim(), proof.token))) return { status: 'verified' as const, method: 'dns' as const };
  } catch {
    // Missing DNS proof is a failed signal, not an automatic fraud decision.
  }
  try {
    const response = await fetchPublicHtml(url.toString());
    const escapedToken = proof.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const meta = new RegExp(`<meta\\s+[^>]*name=["']${proof.metaName}["'][^>]*content=["']${escapedToken}["'][^>]*>`, 'i');
    const reverseMeta = new RegExp(`<meta\\s+[^>]*content=["']${escapedToken}["'][^>]*name=["']${proof.metaName}["'][^>]*>`, 'i');
    if (meta.test(response.html) || reverseMeta.test(response.html)) return { status: 'verified' as const, method: 'meta' as const };
  } catch {
    // Public site fetch failures remain an unavailable signal for manual review.
  }
  return { status: 'failed' as const, method: null };
}
