'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import DashboardContent from './DashboardContent';
import { Loader2 } from 'lucide-react';
import { OperationType, handleFirestoreError } from '@/lib/firestore-errors';

type Business = { businessId: string; businessName: string; role: 'owner' | 'admin' | 'member'; businessStatus: string; verificationStatus: 'not_started' | 'pending_review' | 'verified' | 'rejected' | 'suspended' };

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/business/access', { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (response.status === 401) { router.replace('/login?redirect=/dashboard'); return null; }
        if (!response.ok) throw new Error(payload.error || 'Unable to load business access.');
        return payload;
      })
      .then(payload => {
        if (cancelled || !payload) return;
        const available = payload.businesses as Business[];
        setBusinesses(available);
        if (available.length === 0) router.replace('/businesses/onboarding');
        else if (available.length === 1 && available[0].verificationStatus === 'verified') { setProjectLoading(true); setSelectedBusinessId(available[0].businessId); }
        else setSelectedBusinessId(null);
      })
      .catch(error => { if (!cancelled) setAccessError(error instanceof Error ? error.message : 'Unable to load business access.'); })
      .finally(() => { if (!cancelled) setAccessLoading(false); });
    return () => { cancelled = true; };
  }, [user, router]);

  useEffect(() => {
    if (!user || !selectedBusinessId) return;
    let cancelled = false;
    let unsubscribe = () => {};
    fetch(`/api/business/access?businessId=${encodeURIComponent(selectedBusinessId)}`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Business access could not be verified.');
        const payload = await response.json();
        if (payload.selectedBusinessId !== selectedBusinessId) throw new Error('Business access could not be verified.');
        const projectsQuery = query(collection(db, 'projects'), where('businessId', '==', selectedBusinessId));
        unsubscribe = onSnapshot(projectsQuery, snapshot => {
          if (cancelled) return;
          setProject(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          setProjectLoading(false);
        }, error => {
          if (cancelled) return;
          handleFirestoreError(error, OperationType.LIST, `projects:${selectedBusinessId}`);
          setProjectLoading(false);
        });
      })
      .catch(error => {
        if (!cancelled) { setAccessError(error instanceof Error ? error.message : 'Business access could not be verified.'); setProjectLoading(false); }
      });
    return () => { cancelled = true; unsubscribe(); };
  }, [user, selectedBusinessId]);

  if (loading || accessLoading || projectLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-accent animate-spin" /></div>;
  if (!user) return null;
  if (accessError) return <div className="flex-1 flex items-center justify-center px-6"><div className="text-center"><h2 className="text-2xl font-heading text-brand-secondary">Workspace unavailable</h2><p className="text-slate-500 mt-2">{accessError}</p></div></div>;
  if (businesses.length === 1 && businesses[0].verificationStatus !== 'verified') return (
    <main className="flex-1 bg-slate-50 min-h-screen px-6 py-16"><div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"><p className="text-sm font-medium text-brand-accent">Business verification</p><h1 className="font-heading text-3xl text-brand-secondary mt-2">Your business is under review</h1><p className="mt-4 text-slate-600">{businesses[0].verificationStatus === 'rejected' ? 'This registration was rejected. Contact support for next steps.' : 'You can request Nanoware services while we review your business details. Operations tools become available after approval.'}</p><div className="mt-6 flex gap-4"><button onClick={() => router.push('/contact')} className="bg-brand-secondary text-white px-5 py-3 rounded-xl text-sm font-medium">Request a service</button><button onClick={() => router.push('/businesses/onboarding')} className="border border-slate-200 px-5 py-3 rounded-xl text-sm font-medium text-slate-700">View submission</button></div></div></main>
  );
  if (businesses.length > 1 && !selectedBusinessId) return (
    <main className="flex-1 bg-slate-50 min-h-screen px-6 py-16"><div className="max-w-3xl mx-auto"><p className="text-sm font-medium text-brand-accent">Business workspaces</p><h1 className="font-heading text-3xl text-brand-secondary mt-2">Choose a workspace</h1><div className="grid gap-4 mt-8 md:grid-cols-2">{businesses.map(business => <button key={business.businessId} onClick={() => { setProjectLoading(true); setSelectedBusinessId(business.businessId); }} className="text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-brand-accent"><span className="font-medium text-lg text-brand-secondary">{business.businessName}</span><span className="block mt-2 text-sm text-slate-500 capitalize">{business.role} access</span></button>)}</div></div></main>
  );

  return <div className="flex-1 bg-slate-50 relative min-h-screen"><div className="mx-auto max-w-7xl px-6 pt-6 text-right"><button onClick={() => router.push('/billing')} className="text-sm font-medium text-brand-accent hover:underline">Billing & subscriptions</button></div>{project ? <DashboardContent project={project} /> : <div className="flex-1 flex items-center justify-center h-[60vh]"><div className="text-center"><h2 className="text-2xl font-heading text-brand-secondary">No Active Projects</h2><p className="text-slate-500 mt-2">Your dashboard will populate once your business workspace has an active project.</p>{businesses.length > 1 && <button onClick={() => setSelectedBusinessId(null)} className="mt-5 text-brand-accent hover:underline">Switch workspace</button>}</div></div>}</div>;
}
