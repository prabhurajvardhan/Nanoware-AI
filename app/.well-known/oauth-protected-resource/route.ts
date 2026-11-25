import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const issuer = process.env.OAUTH_ISSUER || 'https://mcp.nanowareai.in';
  return NextResponse.json({
    resource: 'https://mcp.nanowareai.in/photon',
    authorization_servers: [issuer],
    scopes_supported: ['photon:patch', 'nanos:spend'],
    bearer_methods_supported: ['header'],
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
