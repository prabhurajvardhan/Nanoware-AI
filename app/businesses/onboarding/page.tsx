'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';

const countries = [['US', 'United States'], ['CA', 'Canada'], ['AU', 'Australia'], ['GB', 'United Kingdom'], ['IN', 'India'], ['OT', 'Other']];

export default function BusinessOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ businessName: '', website: '', countryCode: 'US' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ businessId: string; status: string; token?: string; dnsRecord?: string; metaName?: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');
  const [domainEmail, setDomainEmail] = useState('');
  const [domainMessage, setDomainMessage] = useState('');

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/business/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (response.status === 403 && payload.emailVerificationRequired) { router.push('/verify-email'); return; }
      if (!response.ok) throw new Error(payload.error || 'Unable to submit business verification.');
      setSubmitted({ businessId: payload.business?.businessId || '', status: payload.verification?.status || 'pending_verification', ...payload.verification?.websiteProof });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit business verification.'); }
    finally { setSaving(false); }
  }

  async function requestPhoneCode() {
    setPhoneMessage('');
    const response = await fetch('/api/auth/phone/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countryCode: form.countryCode, phone }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setPhoneMessage(payload.error || 'Unable to send the code.'); return; }
    setPhoneSent(true); setPhoneMessage(`Code sent to ${payload.phone}.`);
  }

  async function verifyPhoneCode() {
    const response = await fetch('/api/auth/phone/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: phoneCode }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setPhoneMessage(payload.error || 'Unable to verify the code.'); return; }
    setPhoneVerified(true); setPhoneMessage('Mobile number verified.');
  }

  async function saveGoogleProfile(event: FormEvent) {
    event.preventDefault(); setGoogleMessage('');
    const response = await fetch('/api/business/evidence/google-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: submitted?.businessId, url: googleUrl }) });
    const payload = await response.json().catch(() => ({}));
    setGoogleMessage(response.ok ? 'Saved as an unverified public-profile claim for review.' : (payload.error || 'Unable to save the URL.'));
  }

  async function requestDomainEmail(event: FormEvent) {
    event.preventDefault(); setDomainMessage('');
    const response = await fetch('/api/business/evidence/domain-email/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: submitted?.businessId, email: domainEmail }) });
    const payload = await response.json().catch(() => ({}));
    setDomainMessage(response.ok ? 'Verification link sent. It expires in 30 minutes.' : (payload.error || 'Unable to send the link.'));
  }

  if (loading || !user) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-accent animate-spin" /></div>;
  if (submitted) return <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10"><p className="text-sm font-medium text-brand-accent mb-3">Business verification started</p><h1 className="font-heading text-3xl text-brand-secondary">Complete the short verification steps</h1><p className="mt-4 text-slate-600">Your business is pending verification. Account email was verified before submission; a mobile OTP is required before an administrator can approve the business.</p><div className="mt-8 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">1. Verify mobile number</h2>{phoneVerified ? <p className="mt-3 text-sm text-emerald-700">Mobile number verified.</p> : <div className="mt-4 flex flex-col gap-3"><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Mobile number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /><button onClick={() => void requestPhoneCode()} className="bg-brand-secondary text-white py-3 rounded-xl font-medium">{phoneSent ? 'Resend code' : 'Send SMS code'}</button>{phoneSent && <div className="flex gap-2"><input value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit code" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /><button onClick={() => void verifyPhoneCode()} className="border border-slate-200 px-4 rounded-xl">Verify</button></div>}{phoneMessage && <p className="text-sm text-slate-600">{phoneMessage}</p>}</div>}</div><div className="mt-5 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">2. Optional business-domain email</h2><p className="text-sm text-slate-600 mt-2">If you have an email on your website domain, verify it as an additional signal. Local businesses without one can continue.</p><form onSubmit={requestDomainEmail} className="mt-4 flex gap-2"><input type="email" required value={domainEmail} onChange={(event) => setDomainEmail(event.target.value)} placeholder="you@your-business-domain.com" className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /><button className="border border-slate-200 px-4 rounded-xl">Send link</button></form>{domainMessage && <p className="mt-3 text-sm text-slate-600">{domainMessage}</p>}</div>{submitted.token && <div className="mt-5 bg-slate-50 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">3. Optional website ownership signal</h2><p className="text-sm text-slate-600 mt-2">Add this TXT record or meta tag to provide an additional signal. It is not the only way a legitimate local business can be reviewed.</p><code className="block mt-4 text-xs break-all text-slate-700">{submitted.dnsRecord} = {submitted.token}</code><code className="block mt-2 text-xs break-all text-slate-700">&lt;meta name=&quot;{submitted.metaName}&quot; content=&quot;{submitted.token}&quot; /&gt;</code></div>}<div className="mt-5 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">4. Optional Google Business Profile</h2><p className="text-sm text-slate-600 mt-2">A public listing is a claim for review, not automatic proof. <a className="text-brand-accent underline" href="https://support.google.com/business/answer/7039811" target="_blank" rel="noreferrer">How to find your listing URL</a></p><form onSubmit={saveGoogleProfile} className="mt-4 flex gap-2"><input value={googleUrl} onChange={(event) => setGoogleUrl(event.target.value)} placeholder="Google Maps or Business Profile URL" className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /><button className="border border-slate-200 px-4 rounded-xl">Save</button></form>{googleMessage && <p className="mt-3 text-sm text-slate-600">{googleMessage}</p>}</div><button onClick={() => router.replace('/dashboard')} className="mt-8 bg-brand-secondary text-white px-5 py-3 rounded-xl text-sm font-medium">Continue</button></section></main>;

  return <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10"><p className="text-sm font-medium text-brand-accent mb-3">Business verification</p><h1 className="font-heading text-3xl text-brand-secondary">Tell us the essentials</h1><p className="mt-3 text-slate-600">Start with three simple details. We use additional signals only when available and never require every business to have a tax ID, custom domain, or Google profile.</p>{error && <div role="alert" className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}<form onSubmit={submit} className="mt-8 grid gap-5"><label className="block text-sm font-medium text-slate-700">Business name<input value={form.businessName} onChange={(event) => update('businessName', event.target.value)} required className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium text-slate-700">Website<input value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://example.com" required className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium text-slate-700">Country<select value={form.countryCode} onChange={(event) => update('countryCode', event.target.value)} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">{countries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="submit" disabled={saving} className="w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium disabled:opacity-70">{saving ? 'Verifying…' : 'Verify business'}</button></form></section></main>;
}
