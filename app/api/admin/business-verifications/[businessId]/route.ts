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
    const input = body as { action?: unknown; reason?: unknown };
    const result = await reviewBusinessVerification({
      businessId,
      actorUid: actor.uid,
      action: input.action as 'approve' | 'reject' | 'request-more-info',
      reason: typeof input.reason === 'string' ? input.reason : '',
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code === 'MFA_REQUIRED' ? 'Additional verification required.' : 'Unauthorized.' }, { status: error.code === 'MFA_REQUIRED' ? 403 : 401 });
    if (error instanceof BusinessVerificationError) {
      const status = error.code === 'VERIFICATION_NOT_FOUND' ? 404 : error.code === 'VERIFICATION_CONFLICT' ? 409 : 400;
      const messages: Record<string, string> = {
        VERIFICATION_CONFLICT: 'This review cannot be changed, or account email and mobile phone verification are incomplete.',
        INVALID_VERIFICATION_ACTION: 'Provide a valid action and review reason.',
        VERIFICATION_NOT_FOUND: 'Business verification not found.',
      };
      return NextResponse.json({ error: messages[error.code] || 'Unable to update verification.' }, { status });
    }
    console.error('Admin verification decision failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to update verification.' }, { status: 500 });
  }
}
