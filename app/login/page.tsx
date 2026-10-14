'use client';

import { useState, Suspense } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { sendWelcomeEmail, sendWelcomeBackEmail } from '@/lib/email/actions';

async function establishSession(idToken: string) {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error('Unable to establish a secure session. Please try again.');
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const redirectParams = searchParams.get('redirect');
  const redirectPath = redirectParams && redirectParams.startsWith('/') && !redirectParams.startsWith('//') ? redirectParams : '/dashboard';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCred = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      await establishSession(await userCred.user.getIdToken());

      try {
        const emailResult = isLogin
          ? await sendWelcomeBackEmail(userCred.user.email || email, email.split('@')[0])
          : await sendWelcomeEmail(userCred.user.email || email, email.split('@')[0]);
        if (emailResult && !emailResult.success) console.error('Welcome email delivery failed:', emailResult.error);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      router.push(isLogin ? redirectPath : '/businesses/onboarding');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm glass bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-medium text-brand-secondary mb-2">Client Portal</h1>
          <p className="text-sm text-slate-500">{isLogin ? 'Sign in to access your portal.' : 'Create an account to access your portal.'}</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="client@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="mt-2 w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? (
            <>Don&apos;t have an account? <button onClick={() => setIsLogin(false)} type="button" className="text-brand-accent hover:underline">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => setIsLogin(true)} type="button" className="text-brand-accent hover:underline">Sign in</button></>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="flex-1 flex justify-center items-center py-24"><div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div></div>}><LoginContent /></Suspense>;
}
