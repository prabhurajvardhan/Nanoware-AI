import { NextRequest, NextResponse } from 'next/server';
import { sendSolutionRequestEmails } from '@/lib/email/actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, service, details, estimatedLoss } = body;
    
    if (!name || !email || !service || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const result = await sendSolutionRequestEmails(email, name, service, details, estimatedLoss);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to dispatch emails.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Emails dispatched successfully' });
  } catch {
    console.error('Email API request failed.');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
