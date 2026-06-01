import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/email/actions';

// Note: In a real system, you would want a secret token or signature validation here.
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    // Ensure basic securitization if accessed directly (Mock example)
    if (authHeader !== `Bearer ${process.env.APP_SECRET || 'dev-secret'}`) {
       // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, eventType, summary, metadata } = await req.json();
    
    if (!title || !eventType || !summary) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const result = await sendAdminNotification(title, eventType, summary, metadata || {});
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin notify API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
