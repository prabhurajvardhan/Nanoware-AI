import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, requireAdminActor } from '@/lib/auth/server';
import { reviewBusinessVerification } from '@/lib/business/verification-admin';
import { BusinessVerificationError } from '@/lib/business/verification';

export async function POST(request: NextRequest, context: { params: Promise<{ businessId: string }> }) {
  try {
    const actor = await requireAdminActor({ requireMfa: true });
    const { businessId } = await context.params;
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const input = body as { action?: unknown; reason?: unknown; allowFreeEmail?: unknown };
    const result = await reviewBusinessVerification({
      businessId,
      actorUid: actor.uid,
      action: input.action as 'approve' | 'reject' | 'request-more-info',
      reason: typeof input.reason === 'string' ? input.reason : '',
      allowFreeEmail: input.allowFreeEmail === true,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'MFA_REQUIRED' ? 'Additional verification required.' : 'Unauthorized.' }, { status: error.code === 'MFA_REQUIRED' ? 403 : 401 });
    if (error instanceof BusinessVerificationError) {
      const status = ['VERIFICATION_NOT_FOUND', 'VERIFICATION_CONFLICT'].includes(error.code) ? 404 : 400;
      const messages: Record<string, string> = {
        FREE_EMAIL_NOT_ALLOWED: 'Approval requires an explicit free-mail override.',
        WEBSITE_OWNERSHIP_UNVERIFIED: 'Website ownership must be verified before approval.',
        INVALID_VERIFICATION_ACTION: 'Provide a valid action and review reason.',
        VERIFICATION_CONFLICT: 'This review has already been decided.',
        VERIFICATION_NOT_FOUND: 'Business verification not found.',
      };
      return NextResponse.json({ error: messages[error.code] || 'Unable to update verification.' }, { status });
    }
    console.error('Admin verification decision failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to update verification.' }, { status: 500 });
  }
}
