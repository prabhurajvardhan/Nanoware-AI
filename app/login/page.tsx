'use client';

import { useState, Suspense } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { sendWelcomeEmail, sendWelcomeBackEmail } from '@/lib/email/actions';

function authMessage(error: unknown) {
  const code = (error as AuthError)?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Google sign-in was cancelled.';
  if (code === 'auth/account-exists-with-different-credential') return 'An account already exists with this email. Sign in with your existing method first, then link Google from account settings.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Invalid email or password.';
  return 'Authentication failed. Please try again.';
}

function errorMessage(error: unknown) {
  if (error instanceof Error && /^(Authentication service|Authentication failed|Unable to establish|Recent sign-in|Invalid request|Invalid session)/.test(error.message)) return error.message;
  return authMessage(error);
}

function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const redirectPath = safeRedirect(searchParams.get('redirect'));

  const finishAuth = async (idToken: string, isNewUser: boolean) => {
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!sessionResponse.ok) {
      const payload = await sessionResponse.json().catch(() => null) as { error?: unknown } | null;
      const serverMessage = typeof payload?.error === 'string' ? payload.error : '';
      if (serverMessage) throw new Error(serverMessage);
      if (sessionResponse.status === 503) throw new Error('Authentication service is temporarily unavailable. Please try again later.');
      throw new Error('Unable to establish a secure session. Please try again.');
    }
    setError('');
    if (isNewUser) {
      router.push('/businesses/onboarding');
      return;
    }
    const accessResponse = await fetch('/api/business/access', { cache: 'no-store' });
    if (accessResponse.ok) {
      const access = await accessResponse.json();
      router.push(access.onboardingRequired ? '/businesses/onboarding' : redirectPath);
    } else {
      router.push(redirectPath);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await finishAuth(await result.user.getIdToken(), getAdditionalUserInfo(result)?.isNewUser === true);
    } catch (cause) { setError(errorMessage(cause)); setLoading(false); }
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const userCredential = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      try {
        const emailResult = isLogin
          ? await sendWelcomeBackEmail(userCredential.user.email || email, email.split('@')[0])
          : await sendWelcomeEmail(userCredential.user.email || email, email.split('@')[0]);
        if (emailResult && !emailResult.success) console.error('Welcome email delivery failed:', emailResult.error);
      } catch (emailError) {
        console.error('Welcome email delivery failed:', emailError instanceof Error ? emailError.message : 'unknown');
      }
      await finishAuth(await userCredential.user.getIdToken(), !isLogin);
    } catch (cause) {
      setError(errorMessage(cause));
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm glass bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="mb-8 text-center"><h1 className="font-heading text-2xl font-medium text-brand-secondary mb-2">Client Portal</h1><p className="text-sm text-slate-500">{isLogin ? 'Sign in to access your portal.' : 'Create an account to access your portal.'}</p></div>
        {error && <div role="alert" className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
        <button type="button" onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white text-slate-700 py-3.5 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-70"><span className="font-bold text-lg">G</span>{loading ? 'Connecting…' : 'Continue with Google'}</button>
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px bg-slate-200 flex-1" /><span>OR</span><span className="h-px bg-slate-200 flex-1" /></div>
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50" placeholder="client@example.com" required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50" placeholder="••••••••" required /></div>
          <button type="submit" disabled={loading} className="mt-2 w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-70">{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}</button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-500">{isLogin ? <>Don&apos;t have an account? <button onClick={() => setIsLogin(false)} type="button" className="text-brand-accent hover:underline">Sign up</button></> : <>Already have an account? <button onClick={() => setIsLogin(true)} type="button" className="text-brand-accent hover:underline">Sign in</button></>}</div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() { return <Suspense fallback={<div className="flex-1 flex justify-center items-center py-24"><div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" /></div>}><LoginContent /></Suspense>; }
