import { NextRequest, NextResponse } from 'next/server';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, createInitialBusiness } from '@/lib/business/access';
import { enforceRateLimit, rateLimitResponse, trustedClientKey } from '@/lib/security/rate-limit';

const MAX_BODY_BYTES = 8_000;

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

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession();
    await enforceRateLimit(`business-onboard:${trustedClientKey(request, session.uid)}`, 5, 15 * 60 * 1000);
    const body: unknown = JSON.parse(await readBody(request));
    const name = body && typeof body === 'object' && 'name' in body && typeof body.name === 'string' ? body.name : '';
    const timezone = body && typeof body === 'object' && 'timezone' in body && typeof body.timezone === 'string' ? body.timezone : '';
    if (name.trim().length < 2 || name.trim().length > 100 || timezone.length > 64) {
      return NextResponse.json({ error: 'Enter a valid business name and timezone.' }, { status: 400 });
    }
    const business = await createInitialBusiness({
      userId: session.uid,
      email: session.email || '',
      name,
      timezone,
    });
    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE') return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (error instanceof BusinessAccessError) return NextResponse.json({ error: 'Unable to create the business workspace.' }, { status: 400 });
    console.error('Business onboarding failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to create the business workspace.' }, { status: 500 });
  }
}
