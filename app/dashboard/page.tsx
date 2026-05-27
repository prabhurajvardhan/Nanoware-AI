'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import DashboardContent from './DashboardContent';
import { Loader2 } from 'lucide-react';
import { OperationType, handleFirestoreError } from '@/lib/firestore-errors';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isDBLoading, setDBLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to projects for this user
    const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Just take the first project for now
        setProject({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setProject(null);
      }
      setDBLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
      setDBLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || isDBLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 bg-slate-50 relative min-h-screen">
      {project ? (
        <DashboardContent project={project} />
      ) : (
        <div className="flex-1 flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-heading text-brand-secondary">No Active Projects</h2>
            <p className="text-slate-500 mt-2">Your dashboard will populate once your proposal is accepted.</p>
          </div>
        </div>
      )}
    </div>
  );
}
