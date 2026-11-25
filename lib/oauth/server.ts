import crypto from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export const OAUTH_ISSUER = process.env.OAUTH_ISSUER || 'https://mcp.nanowareai.in';
export const OAUTH_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const OAUTH_REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
export const OAUTH_CODE_TTL_SECONDS = 5 * 60;
export const OAUTH_SCOPES = ['photon:patch', 'nanos:spend'] as const;

type OAuthClient = {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  created_at: number;
};

type OAuthCode = {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  expiresAt: number;
  createdAt: number;
  usedAt?: number;
};

function secret() {
  const value = process.env.OAUTH_JWT_SECRET || process.env.PHOTON_OAUTH_JWT_SECRET;
  if (!value || value.length < 32) throw new Error('OAUTH_JWT_SECRET_MISSING_OR_WEAK');
  return value;
}

export function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function pkceChallenge(verifier: string) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function signAccessToken(input: { userId: string; clientId: string; scope: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    iss: OAUTH_ISSUER,
    sub: input.userId,
    aud: 'photon',
    client_id: input.clientId,
    scope: input.scope,
    iat: now,
    exp: now + OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    jti: randomToken(16),
  });
  const signingInput = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', secret()).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

export function validateRedirectUri(redirectUri: string, registeredUris: string[]) {
  return registeredUris.includes(redirectUri);
}

export function normalizeScope(value: string | null | undefined) {
  const requested = (value || '').split(/\s+/).filter(Boolean);
  const scopes = requested.length ? requested : ['photon:patch', 'nanos:spend'];
  if (scopes.some((scope) => !(OAUTH_SCOPES as readonly string[]).includes(scope))) throw new Error('INVALID_SCOPE');
  return [...new Set(scopes)].join(' ');
}

export async function registerClient(input: { clientName: string; redirectUris: string[]; grantTypes?: string[]; responseTypes?: string[]; tokenEndpointAuthMethod?: string }) {
  if (!input.clientName || input.clientName.length > 200 || input.redirectUris.length === 0 || input.redirectUris.length > 20) throw new Error('INVALID_CLIENT_METADATA');
  for (const redirectUri of input.redirectUris) {
    const parsed = new URL(redirectUri);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') throw new Error('INVALID_REDIRECT_URI');
  }
  const clientId = `mcp_${randomToken(18)}`;
  const client: OAuthClient = {
    client_id: clientId,
    client_name: input.clientName,
    redirect_uris: input.redirectUris,
    grant_types: input.grantTypes || ['authorization_code', 'refresh_token'],
    response_types: input.responseTypes || ['code'],
    token_endpoint_auth_method: input.tokenEndpointAuthMethod || 'none',
    created_at: Date.now(),
  };
  await getAdminDb().collection('oauth_clients').doc(clientId).set(client);
  return client;
}

export async function getClient(clientId: string) {
  const snapshot = await getAdminDb().collection('oauth_clients').doc(clientId).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as OAuthClient;
}

export async function createAuthorizationCode(input: { clientId: string; userId: string; redirectUri: string; scope: string; codeChallenge: string; codeChallengeMethod: string }) {
  if (input.codeChallengeMethod !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(input.codeChallenge)) throw new Error('INVALID_PKCE');
  const client = await getClient(input.clientId);
  if (!client || !validateRedirectUri(input.redirectUri, client.redirect_uris)) throw new Error('INVALID_REDIRECT_URI');
  const code = randomToken(32);
  await getAdminDb().collection('oauth_authorization_codes').doc(hash(code)).set({
    clientId: input.clientId,
    userId: input.userId,
    redirectUri: input.redirectUri,
    scope: normalizeScope(input.scope),
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: 'S256',
    expiresAt: Date.now() + OAUTH_CODE_TTL_SECONDS * 1000,
    createdAt: Date.now(),
  } satisfies OAuthCode);
  return code;
}

export async function exchangeAuthorizationCode(input: { code: string; clientId: string; redirectUri: string; codeVerifier: string }) {
  const db = getAdminDb();
  const ref = db.collection('oauth_authorization_codes').doc(hash(input.code));
  const now = Date.now();
  const code = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('INVALID_GRANT');
    const value = snapshot.data() as OAuthCode;
    if (value.usedAt || value.expiresAt <= now || value.clientId !== input.clientId || value.redirectUri !== input.redirectUri || pkceChallenge(input.codeVerifier) !== value.codeChallenge) throw new Error('INVALID_GRANT');
    transaction.update(ref, { usedAt: now });
    return value;
  });
  const accessToken = signAccessToken({ userId: code.userId, clientId: code.clientId, scope: code.scope });
  const refreshToken = randomToken(48);
  await db.collection('oauth_refresh_tokens').doc(hash(refreshToken)).set({ userId: code.userId, clientId: code.clientId, scope: code.scope, expiresAt: now + OAUTH_REFRESH_TOKEN_TTL_SECONDS * 1000, revokedAt: null, createdAt: now });
  return { access_token: accessToken, token_type: 'Bearer', expires_in: OAUTH_ACCESS_TOKEN_TTL_SECONDS, refresh_token: refreshToken, scope: code.scope };
}

export async function refreshAccessToken(input: { refreshToken: string; clientId: string }) {
  const db = getAdminDb();
  const ref = db.collection('oauth_refresh_tokens').doc(hash(input.refreshToken));
  const now = Date.now();
  const record = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('INVALID_GRANT');
    const value = snapshot.data() as { userId: string; clientId: string; scope: string; expiresAt: number; revokedAt?: number | null };
    if (value.revokedAt || value.expiresAt <= now || value.clientId !== input.clientId) throw new Error('INVALID_GRANT');
    transaction.update(ref, { revokedAt: now });
    return value;
  });
  const refreshToken = randomToken(48);
  await db.collection('oauth_refresh_tokens').doc(hash(refreshToken)).set({ ...record, expiresAt: now + OAUTH_REFRESH_TOKEN_TTL_SECONDS * 1000, revokedAt: null, rotatedFrom: hash(input.refreshToken), createdAt: now });
  return { access_token: signAccessToken({ userId: record.userId, clientId: record.clientId, scope: record.scope }), token_type: 'Bearer', expires_in: OAUTH_ACCESS_TOKEN_TTL_SECONDS, refresh_token: refreshToken, scope: record.scope };
}

export async function revokeRefreshToken(token: string) {
  await getAdminDb().collection('oauth_refresh_tokens').doc(hash(token)).set({ revokedAt: Date.now() }, { merge: true });
}
