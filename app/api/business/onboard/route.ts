import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, requireEmailVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, createInitialBusiness, getBusinessOnboardingProgress, requireBusinessMembership } from '@/lib/business/access';
import { BusinessVerificationError } from '@/lib/business/verification';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendBusinessVerificationStatusEmail } from '@/lib/email/actions';
import { enforceRateLimit, rateLimitResponse, trustedClientKey } from '@/lib/security/rate-limit';

const MAX_BODY_BYTES = 16_000;

async function readBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function errorResponse(error: unknown) {
  if (error instanceof AuthBoundaryError) {
    if (error.code === 'EMAIL_VERIFICATION_REQUIRED') return NextResponse.json({ error: 'Verify your account email before submitting business details.', emailVerificationRequired: true }, { status: 403 });
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (error instanceof BusinessVerificationError) {
    const messages: Record<string, string> = {
      INVALID_BUSINESS_DETAILS: 'Enter valid business details.',
      FREE_EMAIL_NOT_ALLOWED: 'Use an email address on your business website domain; public email providers cannot verify business ownership.',
      BUSINESS_EMAIL_DOMAIN_MISMATCH: 'Use an email on the website domain or one of its subdomains, such as you@example.com for example.com.',
      INVALID_REGISTRATION_NUMBER: 'Enter a valid business registration number.',
      REGISTRATION_ALREADY_USED: 'That registration number is already associated with another business.',
      REGISTRATION_REJECTED: 'This registration number cannot be submitted again.',
    };
    return NextResponse.json({ error: messages[error.code] || 'Business verification could not be submitted.' }, { status: 400 });
  }
  if (error instanceof BusinessAccessError) return NextResponse.json({ error: 'Unable to create the business profile.' }, { status: 400 });
  if (error instanceof Error && error.message === 'BODY_TOO_LARGE') return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  console.error('Business verification submission failed:', error instanceof Error ? error.message : 'unknown');
  return NextResponse.json({ error: 'Unable to submit business verification.' }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmailVerifiedSession();
    await enforceRateLimit(`business-verification:${trustedClientKey(request, session.uid)}`, 3, 15 * 60 * 1000);
    const body: unknown = JSON.parse(await readBody(request));
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    let profile = body as Record<string, unknown>;
    if (Object.keys(profile).length === 1 && typeof profile.businessEmail === 'string') {
      const businessId = `business_${session.uid}`;
      await requireBusinessMembership(session.uid, businessId, ['owner']);
      const existing = await getAdminDb().collection('businesses').doc(businessId).get();
      const data = existing.data() || {};
      const verification = data.verification && typeof data.verification === 'object' ? data.verification : {};
      if (!existing.exists || data.ownerId !== session.uid || typeof verification.website !== 'string' || typeof verification.countryCode !== 'string') {
        throw new BusinessAccessError('BUSINESS_FORBIDDEN');
      }
      profile = {
        businessName: verification.tradeName || verification.businessName || data.name,
        website: verification.website,
        countryCode: verification.countryCode,
        businessEmail: profile.businessEmail,
      };
    }
    const business = await createInitialBusiness({ userId: session.uid, email: session.email || '', ...profile });
    const snapshot = await getAdminDb().collection('businesses').doc(business.businessId).get();
    const verification = snapshot.data()?.verification;
    const email = typeof verification?.businessEmail === 'string' ? verification.businessEmail : session.email || '';
    if (email) await sendBusinessVerificationStatusEmail(email, business.businessName, 'pending_verification');
    return NextResponse.json({
      business,
      verification: {
        status: business.verificationStatus,
        websiteProof: verification?.websiteProof ? {
          token: verification.websiteProof.token,
          dnsRecord: verification.websiteProof.dnsRecord,
          metaName: verification.websiteProof.metaName,
          status: verification.websiteProof.status,
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const session = await requireEmailVerifiedSession();
    const progress = await getBusinessOnboardingProgress(session.uid);
    return NextResponse.json({ progress }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
