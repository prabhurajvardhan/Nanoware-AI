'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';
import { applyOnboardingCallback } from '@/lib/business/onboarding-state';

const countries = [['US', 'United States'], ['CA', 'Canada'], ['AU', 'Australia'], ['GB', 'United Kingdom'], ['IN', 'India'], ['OT', 'Other']];
type DomainStatus = 'pending' | 'sent' | 'verified' | 'expired' | 'failed';
type OnboardingProgress = {
  businessId: string;
  status: string;
  businessEmail: string;
  websiteDomain: string;
  domainEmailStatus: 'pending' | 'sent' | 'verified' | 'expired';
  websiteProof: { token: string; dnsRecord: string; metaName: string } | null;
  googleProfileClaimExists: boolean;
};

function detectedDomain(website: string) {
  try { return new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(/^www\./i, '').toLowerCase(); } catch { return ''; }
}

function cleanedCallbackUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('domainEmailVerified');
  url.searchParams.delete('domainEmailError');
  return `${url.pathname}${url.search}${url.hash}`;
}

export default function BusinessOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ businessName: '', website: '', countryCode: 'US', businessEmail: '' });
  const [error, setError] = useState('');
  const [progressError, setProgressError] = useState('');
  const [saving, setSaving] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [submitted, setSubmitted] = useState<OnboardingProgress | null>(null);
  const [domainEmail, setDomainEmail] = useState('');
  const [domainStatus, setDomainStatus] = useState<DomainStatus>('pending');
  const [domainMessage, setDomainMessage] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let cancelled = false;
    let hydrationComplete = false;
    const params = new URLSearchParams(window.location.search);
    const callbackVerified = params.get('domainEmailVerified') === '1';
    const callbackError = params.get('domainEmailError') === '1';

    void (async () => {
      try {
        const response = await fetch('/api/business/onboard', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) { router.replace('/login?redirect=/businesses/onboarding'); return; }
        if (response.status === 403 && payload.emailVerificationRequired) { router.replace('/verify-email'); return; }
        if (!response.ok) throw new Error(payload.error || 'Unable to load saved business verification.');
        if (cancelled) return;

        const progress = payload.progress as OnboardingProgress | null;
        hydrationComplete = true;
        if (progress) {
          setSubmitted(progress);
          setDomainEmail(progress.businessEmail);
          setDomainStatus(progress.domainEmailStatus);
          setForm((current) => ({
            ...current,
            businessEmail: progress.businessEmail,
            website: `https://${progress.websiteDomain}`,
          }));
          const callback = applyOnboardingCallback(progress.domainEmailStatus, { verified: callbackVerified, error: callbackError });
          setDomainStatus(callback.status);
          setDomainMessage(callback.message);
        }
      } catch (cause) {
        if (!cancelled) setProgressError(cause instanceof Error ? cause.message : 'Unable to load saved business verification.');
      } finally {
        if (!cancelled) {
          setProgressLoading(false);
          if (hydrationComplete && (callbackVerified || callbackError)) router.replace(cleanedCallbackUrl(), { scroll: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user, router]);

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/business/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (response.status === 403 && payload.emailVerificationRequired) { router.push('/verify-email'); return; }
      if (!response.ok) throw new Error(payload.error || 'Unable to submit business verification.');
      const progress: OnboardingProgress = {
        businessId: payload.business?.businessId || '',
        businessEmail: form.businessEmail,
        websiteDomain: detectedDomain(form.website),
        status: payload.verification?.status || 'pending_verification',
        domainEmailStatus: 'pending',
        websiteProof: payload.verification?.websiteProof || null,
        googleProfileClaimExists: false,
      };
      setDomainEmail(form.businessEmail);
      setDomainStatus('pending');
      setSubmitted(progress);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit business verification.'); }
    finally { setSaving(false); }
  }

  async function saveBusinessEmail() {
    if (!submitted) return;
    setSaving(true); setDomainMessage('');
    try {
      const response = await fetch('/api/business/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessEmail: form.businessEmail }) });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 403 && payload.emailVerificationRequired) { router.push('/verify-email'); return; }
      if (!response.ok) throw new Error(payload.error || 'Unable to update the business email.');
      setSubmitted((current) => current ? { ...current, businessEmail: form.businessEmail, domainEmailStatus: 'pending' } : current);
      setDomainEmail(form.businessEmail);
      setDomainStatus('pending');
      setDomainMessage('Business email updated. You can now request a verification link.');
    } catch (cause) {
      setDomainStatus('failed');
      setDomainMessage(cause instanceof Error ? cause.message : 'Unable to update the business email.');
    } finally { setSaving(false); }
  }

  async function requestDomainEmail(event: FormEvent) {
    event.preventDefault(); setDomainMessage('');
    const response = await fetch('/api/business/evidence/domain-email/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: submitted?.businessId, email: domainEmail }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setDomainStatus('failed'); setDomainMessage(payload.error || 'Unable to send the verification link.'); return; }
    setDomainStatus('sent');
    setSubmitted((current) => current ? { ...current, domainEmailStatus: 'sent' } : current);
    setDomainMessage('Verification link sent. It expires in 30 minutes.');
  }

  async function saveGoogleProfile(event: FormEvent) {
    event.preventDefault(); setGoogleMessage('');
    const response = await fetch('/api/business/evidence/google-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessId: submitted?.businessId, url: googleUrl }) });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) setSubmitted((current) => current ? { ...current, googleProfileClaimExists: true } : current);
    setGoogleMessage(response.ok ? 'Saved as an unverified public-profile claim for review.' : (payload.error || 'Unable to save the URL.'));
  }

  if (loading || (Boolean(user) && progressLoading)) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-accent animate-spin" /></div>;
  if (!user) return null;

  if (progressError) return <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8"><h1 className="font-heading text-2xl text-brand-secondary">Verification status unavailable</h1><p role="alert" className="mt-4 text-sm text-red-700">{progressError}</p><button onClick={() => window.location.reload()} className="mt-6 bg-brand-secondary text-white px-5 py-3 rounded-xl">Try again</button></section></main>;

  if (submitted) return <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10"><p className="text-sm font-medium text-brand-accent mb-3">Business verification progress</p><h1 className="font-heading text-3xl text-brand-secondary">Complete the short verification steps</h1><p className="mt-4 text-slate-600">Your business is {submitted.status === 'verified' ? 'verified' : submitted.status === 'rejected' ? 'rejected' : submitted.status === 'suspended' ? 'suspended' : submitted.status === 'more_information_required' ? 'awaiting more information' : submitted.status === 'pending_review' ? 'under review' : 'pending verification'}. Verify the business email before an administrator can approve the business.</p><div className="mt-8 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">1. Verify business email</h2><p className="text-sm text-slate-600 mt-2">We detected <strong>{submitted.websiteDomain || 'your website domain'}</strong>. The verification email must use that domain; account-email verification is a separate security check.</p><form onSubmit={requestDomainEmail} className="mt-4 grid gap-3"><label className="text-sm font-medium text-slate-700">Business email<input type="email" required readOnly={domainStatus === 'sent' || domainStatus === 'verified'} value={domainEmail} onChange={(event) => { setDomainEmail(event.target.value); update('businessEmail', event.target.value); }} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 read-only:opacity-70" /></label><div className="flex flex-wrap gap-3"><button type="submit" disabled={domainStatus === 'sent' || domainStatus === 'verified' || saving || form.businessEmail.trim().toLowerCase() !== submitted.businessEmail.trim().toLowerCase()} className="bg-brand-secondary text-white px-5 py-3 rounded-xl font-medium disabled:opacity-60">{domainStatus === 'sent' || domainStatus === 'verified' ? 'Verification email sent' : domainStatus === 'expired' ? 'Request a new verification link' : 'Send verification email'}</button>{form.businessEmail.trim().toLowerCase() !== submitted.businessEmail.trim().toLowerCase() && <button type="button" onClick={() => void saveBusinessEmail()} disabled={saving || domainStatus === 'sent' || domainStatus === 'verified'} className="border border-slate-200 px-5 py-3 rounded-xl font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save updated email'}</button>}</div></form>{domainStatus === 'verified' && <p className="mt-3 text-sm text-emerald-700">Business-domain email verified.</p>}{domainStatus === 'sent' && <p className="mt-3 text-sm text-slate-600">Check your inbox and spam folder, then open the link on this device.</p>}{domainStatus === 'expired' && <p className="mt-3 text-sm text-amber-700">The previous verification link expired. Request a new link.</p>}{domainStatus === 'failed' && <p className="mt-3 text-sm text-red-700">{domainMessage || 'Delivery failed or the link expired. Request a new link.'}</p>}{domainMessage && domainStatus !== 'failed' && domainStatus !== 'sent' && domainStatus !== 'verified' && <p className="mt-3 text-sm text-slate-600">{domainMessage}</p>}</div>{submitted.websiteProof && <div className="mt-5 bg-slate-50 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">2. Optional website ownership signal</h2><p className="text-sm text-slate-600 mt-2">Add this TXT record or meta tag to provide an additional signal. It is not required when you have verified the business email domain.</p><code className="block mt-4 text-xs break-all text-slate-700">{submitted.websiteProof.dnsRecord} = {submitted.websiteProof.token}</code><code className="block mt-2 text-xs break-all text-slate-700">&lt;meta name=&quot;{submitted.websiteProof.metaName}&quot; content=&quot;{submitted.websiteProof.token}&quot; /&gt;</code></div>}<div className="mt-5 border border-slate-200 rounded-2xl p-5"><h2 className="font-medium text-slate-800">3. Optional Google Business Profile</h2><p className="text-sm text-slate-600 mt-2">A public listing is a claim for review, not proof of email ownership. <a className="text-brand-accent underline" href="https://support.google.com/business/answer/7039811" target="_blank" rel="noreferrer">How to find your listing URL</a></p>{submitted.googleProfileClaimExists && <p className="mt-3 text-sm text-slate-600">A Google Business Profile claim is already saved.</p>}<form onSubmit={saveGoogleProfile} className="mt-4 flex gap-2"><input value={googleUrl} onChange={(event) => setGoogleUrl(event.target.value)} placeholder="Google Maps or Business Profile URL" className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /><button className="border border-slate-200 px-4 rounded-xl">Save</button></form>{googleMessage && <p className="mt-3 text-sm text-slate-600">{googleMessage}</p>}</div><button disabled={domainStatus !== 'verified'} onClick={() => router.replace('/dashboard')} className="mt-8 bg-brand-secondary text-white px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50">{domainStatus === 'verified' ? 'Continue' : 'Verify business email to continue'}</button></section></main>;

  return <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10"><p className="text-sm font-medium text-brand-accent mb-3">Business verification</p><h1 className="font-heading text-3xl text-brand-secondary">Tell us the essentials</h1><p className="mt-3 text-slate-600">Start with your business details and a business-domain email. We use additional signals only when available and never require a tax ID or Google profile.</p>{error && <div role="alert" className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}<form onSubmit={submit} className="mt-8 grid gap-5"><label className="block text-sm font-medium text-slate-700">Business name<input value={form.businessName} onChange={(event) => update('businessName', event.target.value)} required className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium text-slate-700">Website<input value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://example.com" required className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium text-slate-700">Business email<p className="mt-1 text-xs font-normal text-slate-500">Use an address on the website domain, such as you@example.com.</p><input type="email" value={form.businessEmail} onChange={(event) => update('businessEmail', event.target.value)} placeholder="you@example.com" required className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium text-slate-700">Country<select value={form.countryCode} onChange={(event) => update('countryCode', event.target.value)} className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">{countries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="submit" disabled={saving} className="w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium disabled:opacity-70">{saving ? 'Verifying…' : 'Verify business'}</button></form></section></main>;
}
