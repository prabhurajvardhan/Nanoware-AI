'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';

const businessTypes = [
  ['sole_proprietorship', 'Sole proprietorship'], ['partnership', 'Partnership'], ['private_limited', 'Private limited'],
  ['public_limited', 'Public limited'], ['llp', 'LLP'], ['trust', 'Trust'], ['society', 'Society'], ['other', 'Other'],
];

export default function BusinessOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ legalName: '', tradeName: '', businessType: 'private_limited', country: 'IN', website: '', businessEmail: '', phone: '', registrationType: 'gstin', registrationNumber: '', address: '', expectedUse: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ status: string; token?: string; dnsRecord?: string; metaName?: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?mode=signup&redirect=/businesses/onboarding');
  }, [loading, user, router]);

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/business/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit business verification.');
      setSubmitted({ status: payload.verification?.status || 'pending_review', ...payload.verification?.websiteProof });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit business verification.');
    } finally { setSaving(false); }
  }

  if (loading || !user) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-accent animate-spin" /></div>;
  if (submitted) return (
    <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10"><p className="text-sm font-medium text-brand-accent mb-3">Submission received</p><h1 className="font-heading text-3xl text-brand-secondary">Business verification is pending review</h1><p className="mt-4 text-slate-600">You may continue requesting Nanoware services. The operations workspace remains locked until an administrator verifies the business.</p>{submitted.token && <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">Optional website ownership proof</h2><p className="text-sm text-slate-600 mt-2">Add this TXT record, or add the meta tag to your homepage, then submit the form again to re-check it.</p><code className="block mt-4 text-xs break-all text-slate-700">{submitted.dnsRecord} = {submitted.token}</code><code className="block mt-2 text-xs break-all text-slate-700">&lt;meta name=&quot;{submitted.metaName}&quot; content=&quot;{submitted.token}&quot; /&gt;</code></div>}<button onClick={() => router.replace('/dashboard')} className="mt-8 bg-brand-secondary text-white px-5 py-3 rounded-xl text-sm font-medium">Continue</button></section></main>
  );

  return (
    <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10"><p className="text-sm font-medium text-brand-accent mb-3">Business verification</p><h1 className="font-heading text-3xl text-brand-secondary">Tell us about your business</h1><p className="mt-3 text-slate-600">Complete these details before we can enable business operations tools. Nanoware services remain available while your submission is reviewed.</p>{error && <div role="alert" className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}<form onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
      <Field label="Legal name" value={form.legalName} onChange={(v) => update('legalName', v)} required />
      <Field label="Trade name" value={form.tradeName} onChange={(v) => update('tradeName', v)} required />
      <label className="block text-sm font-medium text-slate-700">Business type<select value={form.businessType} onChange={(e) => update('businessType', e.target.value)} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">{businessTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <Field label="Country (ISO code)" value={form.country} onChange={(v) => update('country', v.toUpperCase())} maxLength={2} required />
      <Field label="Business website" value={form.website} onChange={(v) => update('website', v)} placeholder="https://example.com" required />
      <Field label="Business email" type="email" value={form.businessEmail} onChange={(v) => update('businessEmail', v)} required />
      <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} required />
      <label className="block text-sm font-medium text-slate-700">Registration type<select value={form.registrationType} onChange={(e) => update('registrationType', e.target.value)} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"><option value="gstin">GSTIN</option><option value="udyam">Udyam</option><option value="other">Other</option></select></label>
      <Field label="Registration number" value={form.registrationNumber} onChange={(v) => update('registrationNumber', v)} required />
      <label className="md:col-span-2 block text-sm font-medium text-slate-700">Business address<textarea value={form.address} onChange={(e) => update('address', e.target.value)} required rows={3} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label>
      <label className="md:col-span-2 block text-sm font-medium text-slate-700">Expected use of Nanoware AI<textarea value={form.expectedUse} onChange={(e) => update('expectedUse', e.target.value)} required rows={4} placeholder="Describe the customer-facing tools you plan to run." className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label>
      <button type="submit" disabled={saving} className="md:col-span-2 w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-70">{saving ? 'Submitting for review…' : 'Submit business verification'}</button>
    </form></section></main>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, maxLength, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; maxLength?: number; required?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} required={required} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label>;
}
