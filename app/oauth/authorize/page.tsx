import { redirect } from 'next/navigation';
import { AuthBoundaryError, getVerifiedSession } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getClient, normalizeScope } from '@/lib/oauth/server';
import Consent from './Consent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const clientId = one(params.client_id);
  const redirectUri = one(params.redirect_uri);
  const state = one(params.state);
  const scope = normalizeScope(one(params.scope));
  const codeChallenge = one(params.code_challenge);
  const codeChallengeMethod = one(params.code_challenge_method);
  const client = await getClient(clientId);
  if (!client) return <main className="p-10">Invalid OAuth client.</main>;

  let session;
  try {
    session = await getVerifiedSession();
  } catch (error) {
    if (error instanceof AuthBoundaryError && error.code === 'UNAUTHENTICATED') {
      const continuation = `/oauth/authorize?${new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: one(params.response_type) || 'code', scope, state, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }).toString()}`;
      redirect(`/login?redirect=${encodeURIComponent(continuation)}`);
    }
    throw error;
  }

  const ledger = await getAdminDb().collection('user_nanos_ledger').doc(session.uid).get();
  const balanceNanos = Number(ledger.data()?.balance_nanos ?? 25_000);
  return <Consent clientId={clientId} clientName={client.client_name} redirectUri={redirectUri} state={state} scope={scope} codeChallenge={codeChallenge} codeChallengeMethod={codeChallengeMethod} userEmail={session.email || ''} balanceNanos={Number.isFinite(balanceNanos) ? balanceNanos : 25_000} />;
}
