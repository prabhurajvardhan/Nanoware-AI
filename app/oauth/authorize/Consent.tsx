'use client';

import { useState } from 'react';

type Props = {
  clientId: string;
  clientName: string;
  redirectUri: string;
  state: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  userEmail: string;
  balanceNanos: number;
};

export default function Consent(props: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const permissions = props.scope.split(' ').filter(Boolean);

  async function decide(action: 'authorize' | 'deny') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, client_id: props.clientId, redirect_uri: props.redirectUri, state: props.state, scope: props.scope, code_challenge: props.codeChallenge, code_challenge_method: props.codeChallengeMethod }),
      });
      const payload = await response.json() as { redirect_uri?: string; error?: string };
      if (!response.ok || !payload.redirect_uri) throw new Error(payload.error || 'Unable to complete connector authorization.');
      window.location.assign(payload.redirect_uri);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete connector authorization.');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:p-10">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-accent">Nanoware AI Connector Authorization</p>
        <h1 className="mt-3 font-heading text-3xl text-brand-secondary">Connect {props.clientName}</h1>
        <p className="mt-3 text-slate-600">You are signed in as <strong>{props.userEmail || 'your Nanoware AI account'}</strong>.</p>
        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-800">Requested permissions</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {permissions.includes('photon:patch') && <li>Run Photon code patches for the connected MCP client.</li>}
            {permissions.includes('nanos:spend') && <li>Deduct Nanos for usage: 1 Nano per input token and 3 Nanos per output token.</li>}
          </ul>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div><p className="text-sm font-medium text-slate-800">Current Nanos balance</p><p className="mt-1 text-2xl font-semibold text-brand-secondary">{props.balanceNanos.toLocaleString()} Nanos</p></div>
          <a href="/nanos/earn?source=photon" className="rounded-xl bg-brand-secondary px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent">Watch Ad (+100,000)</a>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="mt-8 flex gap-3">
          <button type="button" disabled={busy} onClick={() => void decide('deny')} className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Deny</button>
          <button type="button" disabled={busy} onClick={() => void decide('authorize')} className="flex-1 rounded-xl bg-brand-secondary px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-accent disabled:opacity-60">{busy ? 'Connecting…' : 'Authorize & Connect'}</button>
        </div>
      </section>
    </main>
  );
}
