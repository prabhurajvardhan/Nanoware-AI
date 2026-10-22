'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Plan = {
  id: string; name: string; description: string; displayPrice?: string; storageGb?: number | null;
  monthlyTokenAllowance?: number | null; bookingLimit?: number | null; features?: string[];
  customSales?: boolean; configured: boolean;
};
type Business = { businessId: string; businessName: string; role: 'owner' | 'admin' | 'member'; businessStatus: string; subscriptionState: string | null; subscriptionPlanId?: string | null };
type Billing = { state?: string; planId?: string } | null;

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [billing, setBilling] = useState<Billing>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const selectedBusiness = businesses.find((business) => business.businessId === selectedBusinessId);
  const canManage = selectedBusiness?.role === 'owner' || selectedBusiness?.role === 'admin';

  useEffect(() => {
    Promise.all([
      fetch('/api/billing/plans').then((response) => response.json()),
      fetch('/api/business/access', { cache: 'no-store' }).then(async (response) => {
        if (!response.ok) throw new Error('Unable to load business access.');
        return response.json();
      }),
    ]).then(([planPayload, accessPayload]) => {
      const available = (accessPayload.businesses || []) as Business[];
      setPlans(planPayload.plans || []);
      setBusinesses(available);
      setSelectedBusinessId(available[0]?.businessId || '');
      setBilling(available[0]?.subscriptionState ? { state: available[0].subscriptionState, planId: available[0].subscriptionPlanId || undefined } : null);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load billing.'));
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    fetch(`/api/business/access?businessId=${encodeURIComponent(selectedBusinessId)}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        const business = payload.businesses?.[0];
        setBilling(business?.subscriptionState ? { state: business.subscriptionState, planId: business.subscriptionPlanId || undefined } : null);
      })
      .catch(() => setBilling(null));
  }, [selectedBusinessId]);

  async function startCheckout(planId: string) {
    setLoading(planId); setError('');
    const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planId, businessId: selectedBusinessId }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'Unable to start checkout.'); setLoading(null); return; }
    window.location.assign(result.url);
  }

  async function openPortal() {
    setLoading('portal'); setError('');
    const response = await fetch('/api/billing/portal', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ businessId: selectedBusinessId }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'Unable to open billing portal.'); setLoading(null); return; }
    window.location.assign(result.url);
  }

  if (!selectedBusiness) return <main className="flex-1 p-12 text-center"><p className="text-slate-500">{error || 'Loading your business billing…'}</p></main>;
  return <main className="flex-1 bg-slate-50 px-6 py-12"><div className="mx-auto max-w-5xl">
    <button onClick={() => router.push('/workspace')} className="text-sm text-brand-accent hover:underline">← Back to User Mode</button>
    <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm uppercase tracking-widest text-brand-accent">Business billing</p><h1 className="mt-2 font-heading text-4xl text-brand-secondary">{selectedBusiness.businessName}</h1><p className="mt-2 text-slate-500">Subscription status: <strong>{billing?.state || 'not subscribed'}</strong>{billing?.planId ? ` · ${plans.find((plan) => plan.id === billing.planId)?.name || billing.planId}` : ''}</p></div>
      {businesses.length > 1 && <label className="text-sm text-slate-600">Workspace<select value={selectedBusinessId} onChange={(event) => setSelectedBusinessId(event.target.value)} className="ml-3 rounded-xl border border-slate-200 bg-white px-3 py-2">{businesses.map((business) => <option key={business.businessId} value={business.businessId}>{business.businessName}</option>)}</select></label>}
      {canManage && billing?.state && <button onClick={openPortal} disabled={loading === 'portal'} className="rounded-xl bg-brand-secondary px-5 py-3 text-white disabled:opacity-60">{loading === 'portal' ? 'Opening…' : 'Manage billing'}</button>}</div>
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><h2 className="font-heading text-2xl text-brand-secondary">{plan.name}</h2><p className="mt-1 text-lg font-semibold text-brand-accent">{plan.displayPrice}</p><p className="mt-3 min-h-12 text-slate-500">{plan.description}</p>
      {(plan.storageGb !== undefined || plan.monthlyTokenAllowance !== undefined) && <p className="mt-3 text-sm text-slate-600">{plan.storageGb === null ? 'Negotiated storage' : `${plan.storageGb} GB storage`} · {plan.monthlyTokenAllowance === null ? 'Negotiated token allowance' : `${plan.monthlyTokenAllowance?.toLocaleString()} tokens/month`}</p>}
      {plan.bookingLimit === null && plan.id !== 'daken-squared' && <p className="mt-1 text-xs text-slate-500">Bookings: no numerical plan quota.</p>}
      {plan.features?.length ? <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}
      {plan.customSales ? <a href="/client-mode" className="mt-7 block w-full rounded-xl border border-brand-accent px-4 py-3.5 text-center font-medium text-brand-accent hover:bg-brand-accent/5">Submit a Daken² sales enquiry</a> : !plan.configured ? <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Checkout is disabled until a matching Stripe Price ID and explicit server-side rollout flag are configured.</p> : canManage ? <button onClick={() => startCheckout(plan.id)} disabled={loading === plan.id} className="mt-7 w-full rounded-xl bg-brand-secondary py-3.5 text-white disabled:opacity-60">{loading === plan.id ? 'Opening checkout…' : `Choose ${plan.name}`}</button> : null}
    </article>)}</div>
    {!canManage && <p className="mt-8 text-sm text-slate-500">Only business owners and admins can start checkout or manage billing.</p>}
    <p className="mt-6 text-xs text-slate-400">Prices are proposed USD monthly prices from the plan configuration. Checkout remains disabled until the matching Stripe Price IDs are configured. Provider token and storage usage are shown only when actually metered.</p>
  </div></main>;
}
