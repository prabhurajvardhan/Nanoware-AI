export type OnboardingDomainEmailStatus = 'pending' | 'sent' | 'verified' | 'expired';

export type OnboardingProgress = {
  businessId: string;
  status: string;
  businessEmail: string;
  websiteDomain: string;
  domainEmailStatus: OnboardingDomainEmailStatus;
  websiteProof: { token: string; dnsRecord: string; metaName: string } | null;
  googleProfileClaimExists: boolean;
};

type DomainEmailToken = { businessId?: unknown; used?: unknown; expiresAt?: unknown };

function progressWebsiteDomain(website: string) {
  try {
    const parsed = new URL(website.startsWith('http://') || website.startsWith('https://') ? website : `https://${website}`);
    if (parsed.username || parsed.password || !parsed.hostname) return '';
    return parsed.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function domainEmailStatus(
  checkStatus: unknown,
  tokens: DomainEmailToken[],
  businessId: string,
  now = Date.now(),
): OnboardingDomainEmailStatus {
  if (checkStatus === 'verified') return 'verified';
  const matchingTokens = tokens.filter((token) => token.businessId === businessId);
  if (matchingTokens.some((token) => token.used !== true && Number(token.expiresAt || 0) > now)) return 'sent';
  if (checkStatus === 'failed' || matchingTokens.some((token) => Number(token.expiresAt || 0) <= now)) return 'expired';
  return 'pending';
}

export function projectOnboardingProgress(input: {
  userId: string;
  businessId: string;
  ownerId: unknown;
  membershipUserId: unknown;
  membershipRole: unknown;
  membershipStatus: unknown;
  business: Record<string, unknown>;
  domainEmailTokens: DomainEmailToken[];
  now?: number;
} | null): OnboardingProgress | null {
  if (!input) return null;
  if (input.ownerId !== input.userId
    || input.membershipUserId !== input.userId
    || input.membershipRole !== 'owner'
    || input.membershipStatus !== 'active') return null;

  const verification = input.business.verification;
  if (!verification || typeof verification !== 'object' || Array.isArray(verification)) return null;
  const details = verification as Record<string, unknown>;
  if (details.submittedBy && details.submittedBy !== input.userId) return null;
  const checks = details.checks && typeof details.checks === 'object'
    ? details.checks as Record<string, unknown>
    : {};
  const proof = details.websiteProof && typeof details.websiteProof === 'object'
    ? details.websiteProof as Record<string, unknown>
    : {};
  const businessEmail = typeof details.businessEmail === 'string' ? details.businessEmail : '';
  const website = typeof details.website === 'string' ? details.website : '';
  const resolvedWebsiteDomain = progressWebsiteDomain(website);
  if (!businessEmail || !resolvedWebsiteDomain) return null;

  const status = typeof input.business.verificationStatus === 'string'
    ? input.business.verificationStatus
    : 'pending_verification';
  const websiteProof = typeof proof.token === 'string'
    && typeof proof.dnsRecord === 'string'
    && typeof proof.metaName === 'string'
    ? { token: proof.token, dnsRecord: proof.dnsRecord, metaName: proof.metaName }
    : null;
  const googleUrl = details.googleBusinessProfileUrl;
  const googleCheck = checks.googleBusinessProfile;

  return {
    businessId: input.businessId,
    status,
    businessEmail,
    websiteDomain: resolvedWebsiteDomain,
    domainEmailStatus: domainEmailStatus(checks.businessDomainEmail, input.domainEmailTokens, input.businessId, input.now),
    websiteProof,
    googleProfileClaimExists: typeof googleUrl === 'string' && googleUrl.length > 0
      || googleCheck === 'claimed'
      || googleCheck === 'verified',
  };
}
