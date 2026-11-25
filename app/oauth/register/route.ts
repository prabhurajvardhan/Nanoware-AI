import { NextRequest, NextResponse } from 'next/server';
import { registerClient } from '@/lib/oauth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { client_name?: string; redirect_uris?: string[]; grant_types?: string[]; response_types?: string[]; token_endpoint_auth_method?: string };
    const client = await registerClient({
      clientName: body.client_name || '',
      redirectUris: Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((value): value is string => typeof value === 'string') : [],
      grantTypes: body.grant_types,
      responseTypes: body.response_types,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method,
    });
    return NextResponse.json(client, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'invalid_client_metadata', error_description: error instanceof Error ? error.message : 'Invalid client metadata.' }, { status: 400 });
  }
}
