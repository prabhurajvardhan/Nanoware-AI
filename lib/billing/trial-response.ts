import { NextResponse } from 'next/server';
import { TrialExpiredError } from './trial';

export function trialExpiredResponse(error: unknown) {
  if (!(error instanceof TrialExpiredError)) return null;
  return NextResponse.json({ error: 'TRIAL_EXPIRED', message: 'The seven-day Daken trial has expired. Upgrade your plan to restore workspace access; stored records are retained.' }, { status: 402 });
}
