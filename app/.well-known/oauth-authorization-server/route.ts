import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const issuer = process.env.OAUTH_ISSUER || 'https://mcp.nanowareai.in';
  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['photon:patch', 'nanos:spend'],
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
