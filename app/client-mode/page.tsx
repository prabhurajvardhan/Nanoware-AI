'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Loader2, Send, ClipboardList } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { clientServices } from '@/lib/client-services';

type ServiceRequest = { id: string; reference?: string; service?: string; status?: string; details?: string; createdAt?: unknown; updatedAt?: unknown; updates?: { message?: string; createdAt?: unknown }[] };
function displayDate(value: unknown) {
  const date = value && typeof value === 'object' && 'seconds' in value ? new Date(Number((value as { seconds: number }).seconds) * 1000) : new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? 'Just submitted' : date.toLocaleString();
}

export default function ClientModePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [serviceId, setServiceId] = useState<string>(clientServices[0].id);
  const [contactName, setContactName] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [message, setMessage] = useState('');

  const loadRequests = useCallback(async () => {
    const response = await fetch('/api/client-requests', { cache: 'no-store' });
    if (response.status === 401) { router.replace('/login?redirect=%2Fclient-mode'); return; }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load your requests.');
    setRequests(payload.requests || []);
  }, [router]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=%2Fclient-mode');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => loadRequests()).catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to load your requests.')).finally(() => setLoadingRequests(false));
  }, [user, loadRequests]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/client-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId, contactName: contactName || user?.displayName || '', details, idempotencyKey: crypto.randomUUID() }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit your request.');
      setDetails('');
      setMessage('Your service request has been submitted. You can follow its status below.');
      await loadRequests();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit your request.'); }
    finally { setBusy(false); }
  };

  if (loading || !user) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-brand-accent" /></main>;
  return (
    <main className="min-h-screen bg-slate-50 px-5 pb-20 pt-32 text-brand-secondary sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-5 border-b border-brand-accent/20 pb-8 sm:flex-row sm:items-end">
          <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Nanoware AI · Client Mode</p><h1 className="font-heading text-3xl sm:text-4xl">Services & projects</h1><p className="mt-3 max-w-xl text-slate-600">Explore our services, send a project brief, and follow request updates in one place.</p></div>
          <p className="text-sm text-slate-500">Signed in as {user.email}</p>
        </div>
        <section aria-labelledby="services-title" className="mb-12">
          <h2 id="services-title" className="mb-5 font-heading text-2xl">Service catalogue</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{clientServices.map((service) => <article key={service.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-semibold">{service.name}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{service.description}</p></article>)}</div>
          <p className="mt-4 text-xs text-slate-500">Pricing and delivery timelines are provided after reviewing each project brief; no fixed quote is shown here.</p>
        </section>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-2xl">Send a project brief</h2><p className="mt-2 text-sm text-slate-500">Describe what you need. Your request is separate from customer bookings in User Mode.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">Service<select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{clientServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
              <label className="block text-sm font-medium">Contact name<input required maxLength={100} value={contactName || user?.displayName || ''} onChange={(event) => setContactName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
              <label className="block text-sm font-medium">Project requirements<textarea required maxLength={4000} rows={6} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Tell us about your goals, requirements, and any useful context." className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3" /></label>
              <button disabled={busy || !details.trim() || !(contactName || user?.displayName || '').trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-secondary px-5 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit request</button>
            </form>
            {message && <p role="status" className="mt-4 text-sm text-slate-600">{message}</p>}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4"><div><h2 className="font-heading text-2xl">Your requests</h2><p className="mt-2 text-sm text-slate-500">Status and updates for requests submitted from this account.</p></div><ClipboardList className="h-6 w-6 text-brand-accent" /></div>
            {loadingRequests ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand-accent" /></div> : requests.length === 0 ? <p className="mt-8 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">No service requests yet.</p> : <div className="mt-6 space-y-4">{requests.map((request) => <article key={request.id} className="rounded-xl border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">{request.reference || 'Request'}</p><h3 className="mt-1 font-semibold">{request.service}</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{request.status || 'Submitted'}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{request.details}</p><p className="mt-3 text-xs text-slate-400">Submitted {displayDate(request.createdAt)}</p>{request.updates?.length ? <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Updates</p><ul className="mt-2 space-y-2">{request.updates.map((update, index) => <li key={index} className="text-sm text-slate-600"><span>{update.message}</span><span className="ml-2 text-xs text-slate-400">{displayDate(update.createdAt)}</span></li>)}</ul></div> : null}</article>)}</div>}
            <a href="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-accent hover:underline">View public service details <ArrowUpRight className="h-4 w-4" /></a>
          </section>
        </div>
      </div>
    </main>
  );
}
