'use client';

import { useState, Suspense } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get('redirect');
  const redirectPath = redirectParams || '/dashboard';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user data
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          createdAt: serverTimestamp(),
          role: 'client'
        });

        // Seed initial mock data for this user
        const projectRef = await addDoc(collection(db, 'projects'), {
          userId: userCred.user.uid,
          name: 'Nanoware Custom Integration',
          status: 'active',
          createdAt: serverTimestamp()
        });

        // Seed steps
        const steps = [
          { stepName: 'Request Received', description: 'Initial requirements gathered and reviewed by the architecture team.', status: 'completed', order: 1 },
          { stepName: 'Planning & Architecture', description: 'System blueprint mapped out. Core components defined.', status: 'completed', order: 2 },
          { stepName: 'Design & Prototyping', description: 'Figma mockups and structural models in progress.', status: 'in-progress', order: 3 },
          { stepName: 'Implementation', description: 'Live coding phase. View the active build below.', status: 'pending', previewLink: 'https://ais-dev.run.app/', order: 4 },
          { stepName: 'Deployment', description: 'Final sign-off and deployment to production environment.', status: 'pending', order: 5 },
        ];

        for (const step of steps) {
          await addDoc(collection(db, `projects/${projectRef.id}/steps`), {
            ...step,
            createdAt: serverTimestamp()
          });
        }
        
        // Seed Activity
        await addDoc(collection(db, `projects/${projectRef.id}/activities`), {
          projectId: projectRef.id,
          message: 'System architecture approved by lead engineer.',
          createdAt: serverTimestamp()
        });
      }
      
      // Allow a brief moment for the AuthProvider to set the cookie
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-medium text-brand-secondary mb-2">Client Portal</h1>
          <p className="text-sm text-slate-500">
            {isLogin ? 'Sign in to access your portal.' : 'Create an account to access your portal.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              placeholder="client@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-brand-secondary text-white py-3.5 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
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
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center items-center py-24"><div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
