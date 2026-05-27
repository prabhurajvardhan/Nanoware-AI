'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import clsx from 'clsx';
import { CheckCircle2, Circle, Clock, ExternalLink, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardContent({ project }: { project: any }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!project?.id) return;
    
    // Fetch steps
    const stepsQ = query(collection(db, `projects/${project.id}/steps`), orderBy('order', 'asc'));
    const unsubSteps = onSnapshot(stepsQ, (snapshot) => {
      const dbSteps = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setSteps(dbSteps);
      if (dbSteps.length > 0 && !activeStep) {
        // Set first active step based on status
        const current = dbSteps.find((s: any) => s.status === 'in-progress') || dbSteps[dbSteps.length - 1];
        setActiveStep(current);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `projects/${project.id}/steps`));

    // Fetch activities
    const actQ = query(collection(db, `projects/${project.id}/activities`), orderBy('createdAt', 'desc'));
    const unsubAct = onSnapshot(actQ, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `projects/${project.id}/activities`));

    return () => {
      unsubSteps();
      unsubAct();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || loadingMsg) return;
    
    setLoadingMsg(true);
    try {
      await addDoc(collection(db, `projects/${project.id}/activities`), {
        projectId: project.id,
        message: `Client Feedback: ${feedback}`,
        createdAt: serverTimestamp()
      });
      setFeedback('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${project.id}/activities`);
    } finally {
      setLoadingMsg(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 lg:py-24 space-y-12 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-brand-accent/20">
        <div>
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-brand-accent"></span>
            <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Active Project</span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-medium text-brand-secondary">{project.name}</h1>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <span className={clsx("w-2 h-2 rounded-full", project.status === 'completed' ? 'bg-green-500' : 'bg-brand-accent animate-pulse')}></span>
          <span className="text-sm font-medium uppercase tracking-wider text-brand-secondary">
            {project.status === 'completed' ? 'Completed' : 'In Progress'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
        
        {/* Left Col: Timeline */}
        <div className="lg:col-span-1 space-y-8">
          <h2 className="font-heading text-xl text-brand-secondary border-b border-slate-100 pb-4">Project Map</h2>
          
          <div className="relative border-l border-slate-200 ml-4 space-y-8 pb-4">
            {steps.length === 0 ? (
              <p className="text-sm text-slate-400 pl-6">Timeline is being generated...</p>
            ) : null}

            {steps.map((step, idx) => {
              const isActive = activeStep?.id === step.id;
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in-progress';
              
              return (
                <button 
                  key={step.id} 
                  onClick={() => setActiveStep(step)}
                  className="relative w-full text-left flex items-start pl-8 group"
                >
                  <div className="absolute -left-[1.06rem] top-1 bg-slate-50 p-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-brand-accent" />
                    ) : isInProgress ? (
                      <Circle className="w-6 h-6 text-brand-secondary fill-brand-secondary" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  
                  <div className={clsx(
                    "p-4 rounded-2xl border transition-all duration-300 w-full",
                    isActive 
                      ? "bg-white border-brand-accent/30 shadow-[0_8px_30px_rgba(15,23,42,0.06)]" 
                      : "bg-transparent border-transparent hover:bg-white hover:border-slate-100"
                  )}>
                    <h3 className={clsx("font-heading font-medium text-lg", isActive ? "text-brand-secondary" : "text-slate-600")}>
                      {step.stepName}
                    </h3>
                    <p className={clsx("text-sm mt-1 line-clamp-2", isActive ? "text-slate-500" : "text-slate-400")}>
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Col: Step Details */}
        <div className="lg:col-span-1 border border-slate-100 rounded-3xl bg-white p-8 shadow-sm flex flex-col min-h-[500px]">
          <h2 className="font-heading text-xl text-brand-secondary border-b border-slate-100 pb-4 mb-6">Stage Details</h2>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep?.id || 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              {activeStep ? (
                <>
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                      activeStep.status === 'completed' ? "bg-green-50 text-green-700 border border-green-200" :
                      activeStep.status === 'in-progress' ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {activeStep.status}
                    </span>
                  </div>
                  
                  <h3 className="font-heading text-2xl font-medium text-brand-secondary mb-4">{activeStep.stepName}</h3>
                  <div className="prose prose-slate prose-sm text-slate-600 mb-8 max-w-none">
                    <p>{activeStep.description}</p>
                  </div>

                  {activeStep.previewLink && (
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <p className="text-xs uppercase tracking-widest font-heading font-medium text-slate-400 mb-4">Deliverables</p>
                      <a 
                        href={activeStep.previewLink}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="group flex items-center justify-between bg-slate-900 text-white p-5 rounded-2xl hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-medium tracking-wide">View Live Build</span>
                        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  Select a stage to view details
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Col: Activity Feed & Comm */}
        <div className="lg:col-span-1 space-y-8 flex flex-col min-h-[500px]">
          <div className="border border-slate-100 rounded-3xl bg-white p-6 shadow-sm flex-1 flex flex-col h-full max-h-[70vh]">
            <h2 className="font-heading text-xl text-brand-secondary border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-accent" />
              Activity Feed
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[250px]">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 text-center mt-10">No activities yet.</p>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-700">
                    <p className={clsx("mb-2", act.message.startsWith('Client Feedback:') && "font-medium")}>
                      {act.message.replace('Client Feedback:', '')}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {act.createdAt?.toDate ? new Date(act.createdAt.toDate()).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendFeedback} className="mt-4 border-t border-slate-100 pt-4 flex gap-2">
              <input 
                type="text" 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Send feedback or message..."
                className="flex-1 bg-slate-50 border border-slate-200 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                disabled={loadingMsg}
              />
              <button 
                type="submit" 
                disabled={loadingMsg || !feedback.trim()}
                className="bg-brand-secondary text-white p-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
