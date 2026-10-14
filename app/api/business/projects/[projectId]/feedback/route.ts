import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { BusinessAccessError, requireBusinessMembership } from '@/lib/business/access';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getVerifiedSession();
    const { projectId } = await params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) return NextResponse.json({ error: 'Invalid project.' }, { status: 400 });
    const body = await request.json() as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 500) return NextResponse.json({ error: 'Message must be between 1 and 500 characters.' }, { status: 400 });

    const project = await getAdminDb().collection('projects').doc(projectId).get();
    const businessId = project.data()?.businessId;
    if (!project.exists || typeof businessId !== 'string') return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    await requireBusinessMembership(session.uid, businessId);
    await getAdminDb().collection(`projects/${projectId}/activities`).add({
      projectId,
      message: `Client Feedback: ${message}`,
      authorId: session.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (error instanceof BusinessAccessError) return NextResponse.json({ error: 'Business access denied.' }, { status: 403 });
    console.error('Business feedback failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to send feedback.' }, { status: 500 });
  }
}
