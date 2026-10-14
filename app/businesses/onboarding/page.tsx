'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function BusinessOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?mode=signup&redirect=/businesses/onboarding');
  }, [loading, user, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/business/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, timezone }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to create your workspace.');
      router.replace('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your workspace.');
      setSaving(false);
    }
  }

  if (loading || !user) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-accent animate-spin" /></div>;

  return (
    <main className="flex-1 flex items-center justify-center bg-slate-50 py-16 px-6">
      <section className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-10">
        <p className="text-sm font-medium text-brand-accent mb-3">Business workspace setup</p>
        <h1 className="font-heading text-3xl text-brand-secondary">Set up your business</h1>
        <p className="mt-3 text-slate-600">Create the workspace that will hold your team, projects, and business tools. You will be its initial Owner.</p>
        {error && <div role="alert" className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="business-name" className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
            <input id="business-name" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} required className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50" placeholder="Acme Studio" />
          </div>
          <div>
            <label htmlFor="business-timezone" className="block text-sm font-medium text-slate-700 mb-1.5">Business timezone</label>
            <input id="business-timezone" value={timezone} onChange={event => setTimezone(event.target.value)} required className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-70">
            {saving ? 'Creating workspace…' : 'Create business workspace'}
          </button>
        </form>
      </section>
    </main>
  );
}
