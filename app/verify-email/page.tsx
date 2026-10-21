'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/auth/email/request', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to send the verification email.');
      setMessage('Verification email sent. The link expires in 30 minutes.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to send the verification email.'); }
    finally { setLoading(false); }
  }

  return <main className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-16"><section className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 text-center"><p className="text-sm font-medium text-brand-accent">Account security</p><h1 className="font-heading text-3xl text-brand-secondary mt-2">Verify your email</h1><p className="mt-4 text-slate-600">We sent a one-time verification link to <strong>{user?.email || 'your account email'}</strong>. Business onboarding stays paused until the server confirms it.</p>{message && <p role="status" className="mt-5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-3 text-sm">{message}</p>}{error && <p role="alert" className="mt-5 bg-red-50 text-red-700 border border-red-100 rounded-xl p-3 text-sm">{error}</p>}<button onClick={() => void resend()} disabled={loading} className="mt-7 w-full bg-brand-secondary text-white py-3 rounded-xl font-medium disabled:opacity-60">{loading ? 'Sending…' : 'Resend verification email'}</button><button onClick={() => router.push('/login')} className="mt-4 text-sm text-slate-500 hover:text-brand-accent">Use a different account</button><button onClick={() => void logout()} className="block mx-auto mt-3 text-sm text-slate-400 hover:text-slate-700">Sign out</button></section></main>;
}
