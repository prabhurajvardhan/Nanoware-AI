'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, Clock3, Loader2, MessageCircle, Plus, Search, Users, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { CustomerHistoryPanel } from '@/components/CustomerHistoryPanel';

type Business = { businessId: string; businessName: string; role: 'owner' | 'admin' | 'member'; verificationStatus: string; subscriptionState: string | null; timezone?: string };
type Customer = { id: string; displayName: string; contact: { email?: string | null; phone?: string | null }; notes?: string; tags?: string[]; archivedAt?: unknown };
type Booking = { id: string; customerId?: string | null; service: string; startAt: unknown; endAt?: unknown; durationMinutes: number; timezone: string; status: string; origin: string };
type Tab = 'overview' | 'customers' | 'bookings' | 'whatsapp' | 'settings';
type Analytics = { customers: { total: number }; bookings: { total: number; requested: number; confirmed: number; cancelled: number; completed: number; upcoming: number; byOrigin: { manual: number; whatsapp: number } }; tokenUsage: { available: boolean; reason?: string }; storageUsage: { available: boolean; reason?: string } };
type AgentSettings = { language: string; tone: string; workingHours: string; escalationContact: string; supportedServices: string[]; faqs: { question: string; answer: string }[]; active?: boolean };
type WeeklyHours = Record<string, { start: string; end: string }>;
type TrialStatus = { status: string; startedAt: string | null; expiresAt: string | null; remainingSeconds: number | null };
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const tabs: { id: Tab; label: string }[] = [{ id: 'overview', label: 'Overview' }, { id: 'customers', label: 'CRM' }, { id: 'bookings', label: 'Bookings' }, { id: 'whatsapp', label: 'WhatsApp AI' }, { id: 'settings', label: 'Settings & usage' }];
function dateValue(value: unknown) {
  if (value && typeof value === 'object' && 'seconds' in value) return new Date(Number((value as { seconds: number }).seconds) * 1000);
  const result = new Date(String(value || ''));
  return Number.isNaN(result.getTime()) ? null : result;
}
function showDate(value: unknown, timezone?: string) {
  const date = dateValue(value);
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone || 'UTC' }).format(date) : '—';
}

export default function WorkspacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({ language: 'English', tone: 'Professional and helpful', workingHours: '', escalationContact: '', supportedServices: [], faqs: [] });
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>({});
  const [trial, setTrial] = useState<{ trial: TrialStatus; canStart: boolean; durationDays: number } | null>(null);
  const [trialBusy, setTrialBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchText, setSearchText] = useState('');
  const [customerForm, setCustomerForm] = useState({ displayName: '', email: '', phone: '', notes: '', tags: '' });
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({ service: '', localStartAt: '', durationMinutes: '30', customerId: '' });
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const business = businesses.find((item) => item.businessId === businessId);
  const canManage = business?.role === 'owner' || business?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?redirect=%2Fworkspace');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/business/access', { cache: 'no-store' }).then(async (response) => {
      const payload = await response.json();
      if (response.status === 401) { router.replace('/login?redirect=%2Fworkspace'); return []; }
      if (!response.ok) throw new Error(payload.error || 'Unable to load business access.');
      return payload.businesses as Business[];
    }).then((available) => {
      if (cancelled || !available) return;
      setBusinesses(available);
      const saved = window.localStorage.getItem(`nanoware-workspace:${user.uid}`);
      const selected = available.some((item) => item.businessId === saved) ? saved! : available.length === 1 ? available[0].businessId : '';
      if (selected) setBusinessId(selected);
      if (available.length === 0) router.replace('/businesses/onboarding');
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load workspace.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, router]);

  const loadWorkspace = useCallback(async (id: string) => {
    setDataLoading(true); setError('');
    try {
      const url = `businessId=${encodeURIComponent(id)}`;
      const [customerResponse, bookingResponse, analyticsResponse, settingsResponse, availabilityResponse] = await Promise.all([
        fetch(`/api/workspace/customers?${url}`, { cache: 'no-store' }),
        fetch(`/api/workspace/bookings?${url}`, { cache: 'no-store' }),
        fetch(`/api/workspace/analytics?${url}`, { cache: 'no-store' }),
        fetch(`/api/workspace/agent-settings?${url}`, { cache: 'no-store' }),
        fetch(`/api/workspace/availability?${url}`, { cache: 'no-store' }),
      ]);
      const payloads = await Promise.all([customerResponse, bookingResponse, analyticsResponse, settingsResponse, availabilityResponse].map((response) => response.json().then((payload) => ({ response, payload }))));
      const rejected = payloads.find(({ response }) => !response.ok);
      if (rejected) throw new Error(rejected.payload.error || 'Unable to load workspace data.');
      setCustomers(payloads[0].payload.customers || []);
      setBookings(payloads[1].payload.bookings || []);
      setAnalytics(payloads[2].payload);
      setAgentSettings(payloads[3].payload.settings);
      setWhatsappConnected(payloads[3].payload.connection?.connected === true);
      setWeeklyHours(payloads[4].payload.weeklyHours || {});
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load workspace data.'); }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => {
    if (!businessId || !business || business.verificationStatus !== 'verified') return;
    if (user) window.localStorage.setItem(`nanoware-workspace:${user.uid}`, businessId);
    void Promise.resolve().then(() => loadWorkspace(businessId));
  }, [businessId, business, user, loadWorkspace]);

  useEffect(() => {
    if (!businessId || !user) return;
    fetch(`/api/business/trial?businessId=${encodeURIComponent(businessId)}`, { cache: 'no-store' }).then((response) => response.json()).then((payload) => { if (payload.trial) setTrial(payload); }).catch(() => {});
  }, [businessId, user]);

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => customer.displayName?.toLowerCase().includes(query) || customer.contact?.email?.toLowerCase().includes(query) || customer.contact?.phone?.includes(query) || customer.tags?.some((tag) => tag.toLowerCase().includes(query)));
  }, [customers, searchText]);

  async function responseJson(response: Response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Request failed.');
    return payload;
  }

  async function saveCustomer(event: FormEvent) {
    event.preventDefault(); if (!businessId || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const data = { businessId, ...customerForm, tags: customerForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean) };
      await responseJson(await fetch(editingCustomer ? `/api/workspace/customers/${encodeURIComponent(editingCustomer)}` : '/api/workspace/customers', { method: editingCustomer ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
      setCustomerForm({ displayName: '', email: '', phone: '', notes: '', tags: '' }); setEditingCustomer(null); setNotice(editingCustomer ? 'Customer updated.' : 'Customer saved.'); await loadWorkspace(businessId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save customer.'); }
    finally { setBusy(false); }
  }

  async function archiveCustomer(customer: Customer) {
    if (!businessId || !window.confirm(`Archive ${customer.displayName}? Their history is retained.`)) return;
    try { await responseJson(await fetch(`/api/workspace/customers/${encodeURIComponent(customer.id)}?businessId=${encodeURIComponent(businessId)}`, { method: 'DELETE' })); setNotice('Customer archived.'); await loadWorkspace(businessId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to archive customer.'); }
  }

  async function createBooking(event: FormEvent) {
    event.preventDefault(); if (!businessId || !business || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await responseJson(await fetch('/api/workspace/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, service: bookingForm.service, localStartAt: bookingForm.localStartAt, durationMinutes: Number(bookingForm.durationMinutes), timezone: business.timezone || 'UTC', customerId: bookingForm.customerId || null, idempotencyKey: crypto.randomUUID() }) }));
      setBookingForm({ service: '', localStartAt: '', durationMinutes: '30', customerId: '' }); setNotice('Booking created and reserved.'); await loadWorkspace(businessId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create the booking.'); }
    finally { setBusy(false); }
  }

  async function bookingAction(bookingId: string, status: string) {
    if (!businessId) return;
    try { await responseJson(await fetch(`/api/workspace/bookings/${encodeURIComponent(bookingId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, status }) })); setNotice(`Booking marked ${status}.`); await loadWorkspace(businessId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update booking.'); }
  }

  async function rescheduleBooking(event: FormEvent) {
    event.preventDefault(); if (!businessId || !business || !rescheduleId) return;
    try { await responseJson(await fetch(`/api/workspace/bookings/${encodeURIComponent(rescheduleId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, reschedule: true, localStartAt: rescheduleTime, idempotencyKey: crypto.randomUUID() }) })); setNotice('Booking rescheduled.'); setRescheduleId(null); setRescheduleTime(''); await loadWorkspace(businessId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to reschedule booking.'); }
  }

  async function saveAgentSettings(event: FormEvent) {
    event.preventDefault(); if (!businessId) return;
    try { await responseJson(await fetch('/api/workspace/agent-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, ...agentSettings }) })); setNotice('Agent settings saved. They will not respond to messages until WhatsApp is connected and verified.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save agent settings.'); }
  }

  async function activateAgent() {
    if (!businessId) return;
    try { await responseJson(await fetch('/api/workspace/agent-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, activate: true }) })); setNotice('Agent activation confirmed.'); await loadWorkspace(businessId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to activate the agent.'); }
  }

  async function saveAvailability(event: FormEvent) {
    event.preventDefault(); if (!businessId) return;
    try { await responseJson(await fetch('/api/workspace/availability', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId, weeklyHours }) })); setNotice('Weekly availability saved. New bookings will be checked against these hours.'); await loadWorkspace(businessId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save availability.'); }
  }

  async function startTrial() {
    if (!businessId || trialBusy) return;
    setTrialBusy(true); setError('');
    try {
      await responseJson(await fetch('/api/business/trial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId }) }));
      const response = await fetch(`/api/business/trial?businessId=${encodeURIComponent(businessId)}`, { cache: 'no-store' });
      setTrial(await responseJson(response)); setNotice('Your seven-day Daken trial has started. Workspace access remains subject to business verification.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to start the trial.'); }
    finally { setTrialBusy(false); }
  }

  if (authLoading || loading) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-brand-accent" /></main>;
  if (!user) return null;
  if (businesses.length > 1 && !businessId) return <main className="min-h-screen bg-slate-50 px-6 pb-16 pt-32"><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">User Mode</p><h1 className="mt-2 font-heading text-3xl">Choose a business workspace</h1><div className="mt-7 grid gap-4 sm:grid-cols-2">{businesses.map((item) => <button key={item.businessId} onClick={() => setBusinessId(item.businessId)} className="rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-brand-accent"><span className="font-semibold">{item.businessName}</span><span className="mt-2 block text-sm capitalize text-slate-500">{item.role} · {item.verificationStatus.replaceAll('_', ' ')}</span></button>)}</div></div></main>;
  if (!business) return <main className="min-h-screen bg-slate-50 px-6 pb-16 pt-32"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8"><p className="text-sm text-slate-500">No verified business workspace is selected.</p><h1 className="mt-2 font-heading text-2xl">Finish business setup</h1><p className="mt-3 text-slate-600">CRM and booking tools become available after your business passes the existing verification review.</p><button onClick={() => router.push('/businesses/onboarding')} className="mt-5 rounded-xl bg-brand-secondary px-5 py-3 text-white">Continue verification</button></div></main>;
  if (business.verificationStatus !== 'verified') return <main className="min-h-screen bg-slate-50 px-6 pb-16 pt-32"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8"><p className="text-sm font-semibold text-brand-accent">Business verification</p><h1 className="mt-2 font-heading text-2xl">Workspace operations are not available yet</h1><p className="mt-3 text-slate-600">Your business is {business.verificationStatus.replaceAll('_', ' ')}. Existing verification gates remain in effect.</p>{trial && <section className="mt-5 rounded-xl border border-brand-accent/20 bg-slate-50 p-5"><p className="font-semibold text-brand-secondary">Daken · 7-day trial</p>{trial.trial.status === 'active' ? <p className="mt-1 text-sm text-slate-600">Trial active · {Math.ceil((trial.trial.remainingSeconds || 0) / 86400)} day(s) remaining. Business approval is still required before workspace operations.</p> : trial.trial.status === 'expired' ? <p className="mt-1 text-sm text-slate-600">Trial expired. Records are retained; upgrade after verification to restore access.</p> : trial.canStart ? <p className="mt-1 text-sm text-slate-600">Start your one-time trial now. Workspace operations remain gated until business verification is complete.</p> : <p className="mt-1 text-sm text-slate-600">No new trial is available for this workspace owner.</p>}{trial.canStart && <button disabled={trialBusy} onClick={startTrial} className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm text-white disabled:opacity-50">{trialBusy ? 'Starting…' : 'Start 7-day trial'}</button>}{trial.trial.status === 'expired' && <button onClick={() => router.push('/billing')} className="mt-3 rounded-xl bg-brand-secondary px-4 py-2 text-sm text-white">Billing</button>}</section>}<button onClick={() => router.push('/businesses/onboarding')} className="mt-5 rounded-xl bg-brand-secondary px-5 py-3 text-white">Continue verification</button></div></main>;

  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 text-brand-secondary sm:px-6">
    <div className="mx-auto max-w-7xl">
      {trial && <section aria-live="polite" className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-brand-accent/20 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">Daken plan · 7-day trial</p>{trial.trial.status === 'active' ? <p className="mt-1 text-sm">Trial active · {Math.ceil((trial.trial.remainingSeconds || 0) / 86400)} day(s) remaining · ends {trial.trial.expiresAt ? new Date(trial.trial.expiresAt).toLocaleString() : 'soon'}</p> : trial.trial.status === 'expired' ? <p className="mt-1 text-sm">Trial expired. Your workspace records are retained; upgrade to restore access.</p> : <p className="mt-1 text-sm">{trial.canStart ? 'Start your one-time, no-payment-details seven-day Daken trial.' : 'No new trial is available for this workspace owner.'}</p>}</div>{trial.canStart ? <button disabled={trialBusy} onClick={startTrial} className="rounded-xl bg-brand-secondary px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{trialBusy ? 'Starting…' : 'Start 7-day trial'}</button> : trial.trial.status === 'expired' ? <button onClick={() => router.push('/billing')} className="rounded-xl bg-brand-secondary px-4 py-3 text-sm font-medium text-white">Upgrade plan</button> : null}</section>}
      <div className="flex flex-col justify-between gap-5 border-b border-brand-accent/20 pb-7 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">User Mode · {business.role}</p><h1 className="mt-2 font-heading text-3xl sm:text-4xl">{business.businessName}</h1><p className="mt-2 text-sm text-slate-500">Business timezone: {business.timezone || 'UTC'}</p></div><div className="flex flex-wrap items-center gap-3"><label className="text-sm text-slate-500">Workspace<select value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2">{businesses.filter((item) => item.verificationStatus === 'verified').map((item) => <option key={item.businessId} value={item.businessId}>{item.businessName}</option>)}</select></label><button onClick={() => router.push('/billing')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium">Billing</button></div></div>
      <div role="tablist" aria-label="Workspace sections" className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">{tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${tab === item.id ? 'bg-brand-secondary text-white' : 'text-slate-600 hover:bg-white'}`}>{item.label}</button>)}</div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button onClick={() => setError('')} className="ml-3 underline">Dismiss</button></div>}{notice && <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}<button onClick={() => setNotice('')} className="ml-3 underline">Dismiss</button></div>}
      {dataLoading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-brand-accent" /></div>}

      {tab === 'settings' && <form onSubmit={saveAvailability} className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-xl">Booking availability</h2><p className="mt-2 text-sm text-slate-500">Set weekly hours in {business.timezone || 'UTC'}. New bookings and reschedules outside these hours are rejected server-side.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{weekdays.map((day, index) => <div key={day} className="rounded-xl border border-slate-100 p-4">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(weeklyHours[String(index)])} onChange={(event) => { const next = { ...weeklyHours }; if (event.target.checked) next[String(index)] = { start: '09:00', end: '17:00' }; else delete next[String(index)]; setWeeklyHours(next); }} />{day}</label>
          {weeklyHours[String(index)] && <div className="mt-3 flex items-center gap-2"><input aria-label={`${day} opening time`} type="time" value={weeklyHours[String(index)].start} onChange={(event) => setWeeklyHours({ ...weeklyHours, [String(index)]: { ...weeklyHours[String(index)], start: event.target.value } })} className="min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm" /><span className="text-xs text-slate-400">to</span><input aria-label={`${day} closing time`} type="time" value={weeklyHours[String(index)].end} onChange={(event) => setWeeklyHours({ ...weeklyHours, [String(index)]: { ...weeklyHours[String(index)], end: event.target.value } })} className="min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm" /></div>}
        </div>)}</div><button disabled={!canManage} className="mt-5 rounded-xl bg-brand-secondary px-5 py-3 text-sm font-medium text-white disabled:opacity-50">Save weekly hours</button>
      </form>}

      {tab === 'overview' && <section className="mt-7"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Customers', analytics?.customers.total ?? customers.length, 'Active CRM records'], ['Bookings', analytics?.bookings.total ?? bookings.length, 'All recorded bookings'], ['Upcoming', analytics?.bookings.upcoming ?? 0, 'Requested or confirmed'], ['Confirmed', analytics?.bookings.confirmed ?? 0, 'Current confirmed bookings']
      ].map(([label, value, hint]) => <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 font-heading text-3xl">{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></article>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-heading text-xl">Booking activity</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p>Manual origin <strong className="float-right">{analytics?.bookings.byOrigin.manual ?? 0}</strong></p><p>WhatsApp origin <strong className="float-right">{analytics?.bookings.byOrigin.whatsapp ?? 0}</strong></p><p>Requested <strong className="float-right">{analytics?.bookings.requested ?? 0}</strong></p><p>Cancelled <strong className="float-right">{analytics?.bookings.cancelled ?? 0}</strong></p></div></article><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-heading text-xl">Usage metering</h2><p className="mt-3 text-sm text-slate-600">AI tokens: <strong>{analytics?.tokenUsage.available ? 'metered' : 'Not tracked'}</strong></p><p className="mt-1 text-xs text-slate-500">{analytics?.tokenUsage.reason}</p><p className="mt-4 text-sm text-slate-600">CRM storage: <strong>{analytics?.storageUsage.available ? 'metered' : 'Not tracked'}</strong></p><p className="mt-1 text-xs text-slate-500">{analytics?.storageUsage.reason}</p><p className="mt-4 text-xs text-slate-400">Metrics above are calculated from records persisted for this business.</p></article></div><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => setTab('customers')} className="inline-flex items-center gap-2 rounded-xl bg-brand-secondary px-4 py-3 text-sm font-medium text-white"><Users className="h-4 w-4" />Open CRM</button><button onClick={() => setTab('bookings')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"><CalendarDays className="h-4 w-4" />Manage bookings</button></div></section>}

      {tab === 'customers' && <section className="mt-7 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={saveCustomer} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-heading text-xl">{editingCustomer ? 'Edit customer' : 'Add customer'}</h2><p className="mt-2 text-sm text-slate-500">Contact values are normalized and unique within this business. Matching names alone never merge records.</p><div className="mt-5 space-y-3"><input required maxLength={100} value={customerForm.displayName} onChange={(e) => setCustomerForm({ ...customerForm, displayName: e.target.value })} placeholder="Customer name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="Phone number" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><input value={customerForm.tags} onChange={(e) => setCustomerForm({ ...customerForm, tags: e.target.value })} placeholder="Tags (comma-separated)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><textarea maxLength={2000} rows={4} value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} placeholder="Private customer notes" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><div className="flex gap-2"><button disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-secondary px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingCustomer ? 'Save changes' : 'Add customer'}</button>{editingCustomer && <button type="button" onClick={() => { setEditingCustomer(null); setCustomerForm({ displayName: '', email: '', phone: '', notes: '', tags: '' }); }} className="rounded-xl border border-slate-200 px-4"><X className="h-4 w-4" /></button>}</div></div></form><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-heading text-xl">Customers</h2><p className="mt-1 text-sm text-slate-500">{customers.length} active records</p></div><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search customers or tags" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm sm:w-64" /></label></div>{filteredCustomers.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">No matching customers yet.</p> : <div className="mt-5 space-y-3">{filteredCustomers.map((customer) => <article key={customer.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h3 className="font-semibold">{customer.displayName}</h3><p className="mt-1 text-sm text-slate-500">{customer.contact?.email || customer.contact?.phone || 'No contact details'}</p><p className="mt-1 text-xs text-slate-400">{bookings.filter((booking) => booking.customerId === customer.id).length} booking history item(s)</p>{customer.tags?.length ? <div className="mt-2 flex flex-wrap gap-1">{customer.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{tag}</span>)}</div> : null}{customer.notes && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{customer.notes}</p>}</div><div className="flex shrink-0 gap-2"><button onClick={() => { setEditingCustomer(customer.id); setCustomerForm({ displayName: customer.displayName, email: customer.contact?.email || '', phone: customer.contact?.phone || '', notes: customer.notes || '', tags: (customer.tags || []).join(', ') }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium">Edit</button><CustomerHistoryPanel customerId={customer.id} businessId={businessId} />{canManage && <button onClick={() => archiveCustomer(customer)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500">Archive</button>}</div></div></article>)}</div>}</div></section>}

      {tab === 'bookings' && <section className="mt-7 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={createBooking} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-heading text-xl">Create manual booking</h2><p className="mt-2 text-sm text-slate-500">Times are interpreted in {business.timezone || 'UTC'}. Conflicting reservations are checked atomically across this business calendar.</p><div className="mt-5 space-y-3"><input required maxLength={100} value={bookingForm.service} onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })} placeholder="Service" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><label className="block text-sm">Date and time<input required type="datetime-local" value={bookingForm.localStartAt} onChange={(e) => setBookingForm({ ...bookingForm, localStartAt: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label><label className="block text-sm">Duration<select value={bookingForm.durationMinutes} onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">{[15,30,45,60,75,90,120,150,180,240].map((n) => <option key={n} value={n}>{n} minutes</option>)}</select></label><label className="block text-sm">Customer<select value={bookingForm.customerId} onChange={(e) => setBookingForm({ ...bookingForm, customerId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option value="">No customer linked</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}</select></label><button disabled={busy || !canManage} className="w-full rounded-xl bg-brand-secondary px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Saving…' : 'Create & reserve booking'}</button>{!canManage && <p className="text-xs text-slate-500">Only workspace owners and admins can create or change bookings.</p>}</div></form><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-heading text-xl">Bookings</h2><p className="mt-1 text-sm text-slate-500">Most recent records first.</p></div><Clock3 className="h-5 w-5 text-brand-accent" /></div>{bookings.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">No bookings yet.</p> : <div className="mt-5 space-y-3">{bookings.map((booking) => <article key={booking.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{booking.service}</h3><p className="mt-1 text-sm text-slate-500">{showDate(booking.startAt, business.timezone)} · {booking.durationMinutes} min</p><p className="mt-1 text-xs text-slate-400">{booking.origin || 'unknown'} origin{booking.customerId ? ` · ${customers.find((item) => item.id === booking.customerId)?.displayName || 'Linked customer'}` : ''}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">{booking.status}</span></div>{canManage && booking.status === 'confirmed' && <div className="mt-3 flex flex-wrap gap-2">{rescheduleId === booking.id ? <form onSubmit={rescheduleBooking} className="flex flex-wrap gap-2"><input required type="datetime-local" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /><button className="rounded-lg bg-brand-secondary px-3 py-2 text-xs text-white">Save time</button><button type="button" onClick={() => setRescheduleId(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">Cancel</button></form> : <button onClick={() => { setRescheduleId(booking.id); setRescheduleTime(''); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">Reschedule</button>}<button onClick={() => bookingAction(booking.id, 'cancelled')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">Cancel booking</button><button onClick={() => bookingAction(booking.id, 'completed')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">Mark completed</button></div>}</article>)}</div>}</div></section>}

      {tab === 'whatsapp' && <section className="mt-7 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]"><article className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-accent/10 p-3 text-brand-accent"><MessageCircle className="h-5 w-5" /></span><div><h2 className="font-heading text-xl">WhatsApp AI agent</h2><p className="text-sm text-slate-500">Connection status</p></div></div><p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{whatsappConnected ? 'WhatsApp is connected and webhook-verified.' : 'Not connected. No WhatsApp authorization or phone number is recorded for this workspace.'}</p><p className="mt-4 text-sm text-slate-600">Connection requires Meta Business authorization through the supported Embedded Signup flow, a verified business phone number, approved webhook configuration, and server-side credential storage. A phone number alone cannot connect the account.</p><button disabled={!whatsappConnected || !canManage || !agentSettings.supportedServices.length} onClick={activateAgent} className="mt-5 w-full rounded-xl bg-brand-secondary px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40">{agentSettings.active ? 'Agent active' : 'Activate agent'}</button>{!whatsappConnected && <p className="mt-2 text-xs text-slate-500">Connect is unavailable until Meta app credentials and onboarding approval are configured in the server environment.</p>}</article><form onSubmit={saveAgentSettings} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-heading text-xl">Agent configuration</h2><p className="mt-2 text-sm text-slate-500">These settings are stored in this business workspace. Saving them does not connect or activate WhatsApp.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Language<input value={agentSettings.language} onChange={(e) => setAgentSettings({ ...agentSettings, language: e.target.value })} maxLength={40} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-sm">Tone<input value={agentSettings.tone} onChange={(e) => setAgentSettings({ ...agentSettings, tone: e.target.value })} maxLength={80} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-sm sm:col-span-2">Supported services (one per line)<textarea rows={4} value={agentSettings.supportedServices.join('\n')} onChange={(e) => setAgentSettings({ ...agentSettings, supportedServices: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-sm sm:col-span-2">Working hours and timezone<textarea rows={3} value={agentSettings.workingHours} onChange={(e) => setAgentSettings({ ...agentSettings, workingHours: e.target.value })} maxLength={500} placeholder="Describe configured business hours; the agent will not promise slots until availability is connected." className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-sm sm:col-span-2">Human escalation contact<input value={agentSettings.escalationContact} onChange={(e) => setAgentSettings({ ...agentSettings, escalationContact: e.target.value })} maxLength={160} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" /></label></div><div className="mt-5 border-t border-slate-100 pt-5"><h3 className="font-semibold">Frequently asked questions</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} maxLength={250} placeholder="Question" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" /><input value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} maxLength={1000} placeholder="Answer" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" /></div><button type="button" onClick={() => { if (faqQuestion.trim() && faqAnswer.trim()) { setAgentSettings({ ...agentSettings, faqs: [...agentSettings.faqs, { question: faqQuestion.trim(), answer: faqAnswer.trim() }].slice(0, 30) }); setFaqQuestion(''); setFaqAnswer(''); } }} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs">Add FAQ</button><ul className="mt-3 space-y-2">{agentSettings.faqs.map((faq, index) => <li key={`${faq.question}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span><strong>{faq.question}</strong><span className="block text-slate-500">{faq.answer}</span></span><button type="button" aria-label="Remove FAQ" onClick={() => setAgentSettings({ ...agentSettings, faqs: agentSettings.faqs.filter((_, i) => i !== index) })} className="text-slate-400 hover:text-red-600"><X className="h-4 w-4" /></button></li>)}</ul></div><button disabled={!canManage} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-secondary px-5 py-3 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />Save settings</button></form></section>}

      {tab === 'settings' && <section className="mt-7 grid gap-5 md:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-heading text-xl">Business workspace</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">Business</dt><dd className="font-medium">{business.businessName}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Verification</dt><dd className="font-medium capitalize">{business.verificationStatus.replaceAll('_', ' ')}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Subscription state</dt><dd className="font-medium">{business.subscriptionState || 'Not subscribed'}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Timezone</dt><dd className="font-medium">{business.timezone || 'UTC'}</dd></div></dl><p className="mt-4 text-xs text-slate-500">No trial dates, plan allowances, or prices are shown unless backed by persisted configuration.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-heading text-xl">Integrations & billing</h2><p className="mt-3 text-sm text-slate-600">Manage plan checkout and subscription cancellation through Razorpay. WhatsApp remains not connected until Meta authorization and webhook verification succeed.</p><button onClick={() => router.push('/billing')} className="mt-5 rounded-xl bg-brand-secondary px-4 py-3 text-sm font-medium text-white">Open billing settings</button></article></section>}
    </div>
  </main>;
}
