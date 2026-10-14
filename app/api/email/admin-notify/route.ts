import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/email/actions';
import { requireAdminActor } from '@/lib/auth/server';
import { enforceRateLimit, rateLimitResponse, trustedClientKey } from '@/lib/security/rate-limit';

function validText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

async function authorized() {
  try {
    await requireAdminActor({ requireMfa: true });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    await enforceRateLimit(trustedClientKey(req, 'admin-notify'), 30, 60 * 60 * 1000);

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    const { title, eventType, summary, metadata } = body as Record<string, unknown>;
    if (!validText(title, 160) || !validText(eventType, 80) || !validText(summary, 2000)) {
      return NextResponse.json({ error: 'Invalid notification payload.' }, { status: 400 });
    }
    const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {};
    if (Object.keys(safeMetadata).length > 20 || Object.entries(safeMetadata).some(([key, value]) => key.length > 80 || !validText(value, 500))) {
      return NextResponse.json({ error: 'Invalid notification metadata.' }, { status: 400 });
    }

    const result = await sendAdminNotification(title as string, eventType as string, summary as string, safeMetadata as Record<string, string>);
    return NextResponse.json({ success: Boolean(result?.success) });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    console.error('Admin notify API error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to send notification.' }, { status: 502 });
  }
}
