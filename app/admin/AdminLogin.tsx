import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { requestAdminOtpAction, verifyAdminOtpAction } from './auth-actions';

interface AdminLoginProps {
  onComplete: () => void;
  currentUser: any;
}

export default function AdminLogin({ onComplete, currentUser }: AdminLoginProps) {
  const [step, setStep] = useState<'password' | 'otp'>(currentUser ? 'otp' : 'password');
  
  // Password Step State
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // OTP Step State
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Triggers sending OTP on mount if we start at OTP step
  useEffect(() => {
    if (currentUser && currentUser.email && step === 'otp') {
      handleRequestOtp(currentUser.email);
    }
  }, [currentUser, step]);

  const handleRequestOtp = async (targetEmail: string) => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await requestAdminOtpAction(targetEmail);
      if (!res.success) {
        setOtpError(res.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setOtpError('Failed to trigger 2FA email: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    
    try {
      if (!email.endsWith('@nanoware.ai') && !email.endsWith('@nanowareai.in') && email !== 'prabhurajvardhan@gmail.com') {
          // Warning but allow for testing
          console.warn('Non-admin email attempting to login');
      }
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Success, move to OTP step
      setStep('otp');
      // trigger OTP email
      await handleRequestOtp(cred.user.email!);
    } catch (err: any) {
      console.error('Login failed:', err);
      // Make error more user friendly
      if (err.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(err.message || 'Validation failed.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit code.');
      return;
    }
    
    setOtpError('');
    setOtpLoading(true);
    
    try {
      const targetEmail = currentUser?.email || email;
      const res = await verifyAdminOtpAction(targetEmail, otp);
      if (res.success) {
        onComplete();
      } else {
        setOtpError(res.error || 'Incorrect verification code.');
      }
    } catch (err: any) {
      console.error('OTP Check failed:', err);
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    setStep('password');
    setEmail('');
    setPassword('');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-heading font-medium tracking-tight text-slate-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            {step === 'password' ? 'Sign in to access the CRM & ERP dashboard.' : '2-Step Verification required.'}
          </p>
        </div>
        
        {step === 'password' ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="sr-only" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent sm:text-sm transition-shadow"
                  placeholder="Admin Email address"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent sm:text-sm transition-shadow"
                  placeholder="Password"
                />
              </div>
            </div>

            {authError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {authError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-accent hover:bg-brand-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 transition-all"
              >
                {authLoading ? 'Verifying...' : 'Continue to 2-Step'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
             <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4">
                <p className="text-sm text-slate-600 text-center">
                  A 6-digit confirmation code was sent to <br/>
                  <span className="font-medium text-slate-800">{currentUser?.email || email}</span>
                </p>
             </div>
             
             <div>
                <label className="sr-only" htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-slate-200 placeholder-slate-400 text-slate-900 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent sm:text-sm transition-shadow"
                  placeholder="000000"
                />
              </div>
              
              {otpError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {otpError}
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-accent hover:bg-brand-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 transition-all mb-4"
                >
                  {otpLoading ? 'Verifying Code...' : 'Verify & Login'}
                </button>
                
                <div className="flex justify-between items-center px-1">
                   <button 
                     type="button" 
                     onClick={() => handleRequestOtp(currentUser?.email || email)}
                     className="text-xs text-brand-accent hover:underline focus:outline-none"
                     disabled={otpLoading}
                   >
                     Resend Code
                   </button>
                   
                   <button 
                     type="button" 
                     onClick={handleLogout}
                     className="text-xs text-slate-500 hover:text-slate-800 hover:underline focus:outline-none"
                   >
                     Sign in with a different account
                   </button>
                </div>
              </div>
          </form>
        )}
      </div>
    </div>
  );
}
