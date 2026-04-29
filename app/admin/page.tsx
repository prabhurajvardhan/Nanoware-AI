'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';
import { PageTransition } from '@/components/PageTransition';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(
          collection(firestoreDb, 'requests'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequests(fetched);
      } catch (err: any) {
        console.error(err);
        setErrorDetails(err.message || "Insufficient permissions or network issue.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <PageTransition>
      <div className="bg-slate-50 min-h-screen text-brand-secondary py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12 border-b border-slate-200 pb-6">
             <div>
               <h1 className="font-heading text-3xl font-medium tracking-tight mb-2">Request Portal</h1>
               <p className="text-slate-500 text-sm">Administrative view of all incoming formulated requests.</p>
             </div>
             <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm text-slate-500 font-medium">
               Secure Environment
             </div>
          </div>

          {loading ? (
             <div className="flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
             </div>
          ) : errorDetails ? (
             <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <h3 className="text-red-600 font-medium mb-2">Access Denied / Error</h3>
                <p className="text-red-500 text-sm">{errorDetails}</p>
             </div>
          ) : requests.length === 0 ? (
             <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm">
                <p className="text-slate-400">No requests found in the system yet.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 gap-6">
                {requests.map(req => (
                   <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-8">
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                             <h3 className="font-heading text-lg font-medium">{req.name}</h3>
                             <span className="text-xs text-slate-400">&middot;</span>
                             <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{req.company || 'No Company'}</span>
                             <span className="text-xs text-slate-400">&middot;</span>
                             <span className={`text-xs px-2 py-1 rounded-full font-medium ${req.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                {req.status === 'pending' ? 'Pending Review' : req.status}
                             </span>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-sm">
                             <div>
                               <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Email</p>
                               <p className="font-medium text-slate-700">{req.email}</p>
                             </div>
                             <div>
                               <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Project Type</p>
                               <p className="font-medium text-slate-700">{req.projectType}</p>
                             </div>
                             <div>
                               <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Budget</p>
                               <p className="font-medium text-slate-700">{req.budget}</p>
                             </div>
                             <div>
                               <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Date</p>
                               <p className="font-medium text-slate-700">
                                 {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'Just now'}
                               </p>
                             </div>
                          </div>
                          
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <p className="text-sm text-slate-600 whitespace-pre-wrap">{req.description}</p>
                          </div>
                       </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
