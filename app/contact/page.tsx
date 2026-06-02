'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestoreDb } from '@/lib/firebase';
import { PageTransition } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, 
  Globe, Cpu, Palette, Layout, Blocks, 
  MessagesSquare, Cloud, Zap, Shield, Image as ImageIcon 
} from 'lucide-react';
import clsx from 'clsx';
import { sendSolutionRequestEmails } from '@/lib/email/actions';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type FlowType = 'web' | 'ai' | null;

export default function Contact() {
  const [flow, setFlow] = useState<FlowType>(null);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Store all responses
  const [data, setData] = useState<Record<string, any>>({
    projectName: '',
    webStack: '',
    webPrimaryFunction: '',
    webTargetAudience: '',
    webColors: '',
    webScopePages: '1-5',
    webScopeRevisions: 'standard',
    webScopeMaintenance: 'none',
    aiType: '',
    aiCapabilities: [] as string[],
    aiDeployment: '',
    aiComplexity: '',
    contactName: '',
    contactEmail: '',
    contactCompany: ''
  });

  const updateData = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const submitRequest = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const requestsRef = collection(firestoreDb, 'requests');
      
      let description = '';
      let budget = '';

      if (flow === 'web') {
        description = `Web Project: ${data.projectName}\nStack: ${data.webStack}\nFunction: ${data.webPrimaryFunction}\nAudience: ${data.webTargetAudience}\nColors: ${data.webColors}\nScope: ${data.webScopePages} pages, ${data.webScopeRevisions} revisions, maintenance: ${data.webScopeMaintenance}`;
        budget = data.webScopePages === '1-5' ? '<$10k' : data.webScopePages === '5-15' ? '$10k-$50k' : '$50k-$150k';
      } else {
        description = `AI Project Type: ${data.aiType}\nCapabilities: ${data.aiCapabilities.join(', ')}\nDeployment: ${data.aiDeployment}\nComplexity: ${data.aiComplexity}`;
        budget = data.aiComplexity === 'MVP' ? '<$10k' : data.aiComplexity === 'Advanced' ? '$10k-$50k' : '$50k-$150k';
      }

      const payload = {
        name: data.contactName,
        email: data.contactEmail,
        company: data.contactCompany || '',
        projectType: flow === 'web' ? 'Web Development' : 'AI Services',
        budget: budget,
        description: description,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(requestsRef, payload);
      
      // Attempt to send email notifications
      try {
        const emailResult = await sendSolutionRequestEmails(
          data.contactEmail,
          data.contactName,
          flow === 'web' ? 'Web Development' : 'AI Services',
          description
        );
        
        if (emailResult && !emailResult.success) {
          console.error('Email action failed:', emailResult.error);
          throw new Error(`Email delivery system failed: ${emailResult.error}`);
        }
      } catch (emailError: any) {
        console.error('Failed to send request emails:', emailError);
        throw emailError; // Re-throw to be caught by the outer catch
      }
      
      setSuccess(true);
    } catch (error) {
       console.error(error);
       setErrorMsg('Failed to submit request. Please try again.');
       try {
          handleFirestoreError(error, OperationType.CREATE, 'requests');
       } catch (e) {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="flex flex-col gap-8">
           <h2 className="text-3xl font-heading font-medium text-brand-secondary text-center mb-4">What are we building?</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => { setFlow('web'); setStep(1); }}
                className="group relative p-8 rounded-2xl glass border border-slate-200 hover:border-brand-accent/50 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                 <Globe className="w-10 h-10 text-brand-accent mb-6" />
                 <h3 className="text-xl font-heading font-medium text-brand-secondary mb-2">Web Services</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Full-stack web applications, sophisticated marketing sites, and scalable platforms.</p>
              </button>
              
              <button 
                onClick={() => { setFlow('ai'); setStep(1); }}
                className="group relative p-8 rounded-2xl glass border border-slate-200 hover:border-brand-accent/50 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                 <Cpu className="w-10 h-10 text-slate-700 mb-6" />
                 <h3 className="text-xl font-heading font-medium text-brand-secondary mb-2">AI Services</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Autonomous agentic systems, AI workflows, embedded LLMs, and research platforms.</p>
              </button>
           </div>
        </motion.div>
      );
    }

    if (flow === 'web') {
      switch(step) {
        case 1:
          return (
            <motion.div key="web-1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Project Identifier</h2>
               <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[200px]">
                 <input 
                   type="text"
                   value={data.projectName}
                   onChange={(e) => updateData('projectName', e.target.value)}
                   placeholder="Enter project name..."
                   className="text-center bg-transparent border-none outline-none font-heading text-4xl md:text-5xl text-brand-secondary placeholder:text-slate-300 w-full"
                   autoFocus
                 />
                 <div className="h-px w-24 bg-brand-accent/50 mt-4" />
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={() => {setStep(0); setFlow(null);}} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.projectName} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 2:
          const stacks = ['React / Next.js', 'Vue / Nuxt', 'SvelteKit', 'Suggest best stack'];
          return (
            <motion.div key="web-2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Technology Stack</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {stacks.map(stack => (
                   <button 
                     key={stack}
                     onClick={() => updateData('webStack', stack)}
                     className={clsx(
                       "p-6 rounded-2xl border text-left flex items-center justify-between transition-all",
                       data.webStack === stack ? "border-brand-accent bg-brand-accent/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                     )}
                   >
                     <span className="font-medium text-brand-secondary">{stack}</span>
                     {data.webStack === stack && <CheckCircle2 className="w-5 h-5 text-brand-accent" />}
                   </button>
                 ))}
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.webStack} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 3:
          return (
            <motion.div key="web-3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Guided Details</h2>
               <div className="flex flex-col gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Primary Function of the Platform</label>
                    <input 
                      type="text" 
                      value={data.webPrimaryFunction}
                      onChange={e => updateData('webPrimaryFunction', e.target.value)}
                      placeholder="e.g., SaaS dashboard, E-commerce, Corporate site"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Target Audience</label>
                    <input 
                      type="text" 
                      value={data.webTargetAudience}
                      onChange={e => updateData('webTargetAudience', e.target.value)}
                      placeholder="e.g., B2B Enterprise, Gen Z consumers, Researchers"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-sm"
                    />
                  </div>
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.webPrimaryFunction} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 4:
          const palettes = [
            { name: 'Monochrome Tech', colors: ['#0F172A', '#334155', '#94A3B8', '#F8FAFC'] },
            { name: 'Warm Innovation', colors: ['#451A03', '#B45309', '#FDE68A', '#FEF3C7'] },
            { name: 'Clinical Future', colors: ['#0C4A6E', '#0284C7', '#7DD3FC', '#F0F9FF'] },
            { name: 'Custom / Undecided', colors: [] }
          ];
          return (
            <motion.div key="web-4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Aesthetic Identity</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {palettes.map((p, idx) => (
                   <button 
                     key={idx}
                     onClick={() => updateData('webColors', p.name)}
                     className={clsx(
                       "p-6 rounded-2xl border text-left flex flex-col gap-4 transition-all",
                       data.webColors === p.name ? "border-brand-accent bg-brand-accent/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                     )}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-brand-secondary text-sm">{p.name}</span>
                       {data.webColors === p.name && <CheckCircle2 className="w-4 h-4 text-brand-accent" />}
                     </div>
                     {p.colors.length > 0 && (
                       <div className="flex h-8 w-full rounded-lg overflow-hidden">
                         {p.colors.map(c => <div key={c} style={{backgroundColor: c}} className="flex-1" />)}
                       </div>
                     )}
                   </button>
                 ))}
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.webColors} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 5:
           return (
            <motion.div key="web-5" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Visual Reference</h2>
               <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-brand-secondary">Upload UI References or Moodboards</p>
                    <p className="text-xs text-slate-500 mt-1">Optional. We will request files later if needed.</p>
                  </div>
                  <button onClick={nextStep} className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-accent border border-brand-accent/20 px-4 py-2 rounded-full hover:bg-brand-accent/5">
                    Skip for now
                  </button>
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 6:
          return (
            <motion.div key="web-6" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Project Scope</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Number of Core Pages/Views</label>
                     <select 
                      value={data.webScopePages} 
                      onChange={e => updateData('webScopePages', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-accent text-sm"
                    >
                      <option value="1-5">1 - 5 Pages</option>
                      <option value="5-15">5 - 15 Pages</option>
                      <option value="15+">15+ Pages / Complex Platform</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Maintenance Requirements</label>
                     <select 
                      value={data.webScopeMaintenance} 
                      onChange={e => updateData('webScopeMaintenance', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-accent text-sm"
                    >
                      <option value="none">Hand off only</option>
                      <option value="standard">Standard Support (Updates & Fixes)</option>
                      <option value="enterprise">Enterprise SLA</option>
                    </select>
                 </div>
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 transition-all">
                   Finalize <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
      }
    }

    if (flow === 'ai') {
      switch(step) {
        case 1:
          const types = [
            { id: 'AI Agent', icon: <MessagesSquare size={20}/>, desc: 'Autonomous conversational agents' },
            { id: 'Workflow', icon: <Blocks size={20}/>, desc: 'Automated multi-step processes' },
            { id: 'AI App', icon: <Layout size={20}/>, desc: 'Full AI-powered software' },
            { id: 'Research System', icon: <Cloud size={20}/>, desc: 'Experimental AI architecture' },
          ];
          return (
            <motion.div key="ai-1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">System Architecture Type</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {types.map(t => (
                   <button 
                     key={t.id}
                     onClick={() => updateData('aiType', t.id)}
                     className={clsx(
                       "p-6 rounded-2xl border text-left flex flex-col gap-2 transition-all",
                       data.aiType === t.id ? "border-brand-accent bg-brand-accent/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                     )}
                   >
                     <div className="flex items-center justify-between text-brand-secondary">
                        <div className="flex items-center gap-2">
                          {t.icon} <span className="font-medium">{t.id}</span>
                        </div>
                        {data.aiType === t.id && <CheckCircle2 className="w-4 h-4 text-brand-accent" />}
                     </div>
                     <p className="text-xs text-slate-500">{t.desc}</p>
                   </button>
                 ))}
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={() => {setStep(0); setFlow(null);}} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.aiType} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 2:
          const capabilities = ['Chat', 'Automation', 'Reasoning', 'Analysis'];
          return (
            <motion.div key="ai-2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Core Capabilities</h2>
               <p className="text-sm text-slate-500 -mt-4 mb-2">Select all that apply.</p>
               <div className="flex flex-wrap gap-3">
                 {capabilities.map(cap => {
                   const isSelected = data.aiCapabilities.includes(cap);
                   return (
                     <button 
                       key={cap}
                       onClick={() => {
                         if (isSelected) {
                           updateData('aiCapabilities', data.aiCapabilities.filter((c: string) => c !== cap));
                         } else {
                           updateData('aiCapabilities', [...data.aiCapabilities, cap]);
                         }
                       }}
                       className={clsx(
                         "px-5 py-3 rounded-full border text-sm transition-all flex items-center gap-2",
                         isSelected ? "border-brand-accent bg-brand-accent/10 text-brand-accent font-medium shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                       )}
                     >
                       {cap}
                     </button>
                   );
                 })}
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={data.aiCapabilities.length === 0} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 3:
          const deployments = ['Web', 'Mobile', 'API', 'Local'];
          return (
             <motion.div key="ai-3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Deployment Strategy</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {deployments.map(dep => (
                   <button 
                     key={dep}
                     onClick={() => updateData('aiDeployment', dep)}
                     className={clsx(
                       "p-5 rounded-2xl border text-left flex items-center justify-between transition-all",
                       data.aiDeployment === dep ? "border-brand-accent bg-brand-accent/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                     )}
                   >
                     <span className="font-medium text-sm text-brand-secondary">{dep}</span>
                     {data.aiDeployment === dep && <CheckCircle2 className="w-4 h-4 text-brand-accent" />}
                   </button>
                 ))}
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.aiDeployment} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Continue <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
        case 4:
          const complexes = [
            { id: 'MVP', desc: 'Proof of concept, basic integration.' },
            { id: 'Advanced', desc: 'Production-ready, custom fine-tuning.' },
            { id: 'Research', desc: 'Novel architecture, agentic swarms.' },
          ];
          return (
             <motion.div key="ai-4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
               <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">System Complexity</h2>
               <div className="flex flex-col gap-4">
                 {complexes.map(comp => (
                   <button 
                     key={comp.id}
                     onClick={() => updateData('aiComplexity', comp.id)}
                     className={clsx(
                       "p-6 rounded-2xl border text-left flex flex-col gap-1 transition-all",
                       data.aiComplexity === comp.id ? "border-brand-accent bg-brand-accent/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                     )}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-brand-secondary">{comp.id}</span>
                       {data.aiComplexity === comp.id && <CheckCircle2 className="w-5 h-5 text-brand-accent" />}
                     </div>
                     <span className="text-sm text-slate-500">{comp.desc}</span>
                   </button>
                 ))}
               </div>
               <div className="flex justify-between mt-4">
                 <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
                 <button disabled={!data.aiComplexity} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
                   Finalize <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          );
      }
    }

    // Final shared steps (Contact Info and Summary)
    const finalStepIndex = flow === 'web' ? 7 : 5;

    if (step === finalStepIndex) {
      return (
        <motion.div key="contact" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="flex flex-col gap-6">
           <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Your Details</h2>
           <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Full Name *</label>
                <input 
                  type="text" 
                  value={data.contactName}
                  onChange={e => updateData('contactName', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Work Email *</label>
                <input 
                  type="email" 
                  value={data.contactEmail}
                  onChange={e => updateData('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Company (Optional)</label>
                <input 
                  type="text" 
                  value={data.contactCompany}
                  onChange={e => updateData('contactCompany', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-sm"
                />
              </div>
           </div>
           <div className="flex justify-between mt-4">
             <button onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800">Back</button>
             <button disabled={!data.contactName || !data.contactEmail} onClick={nextStep} className="flex items-center gap-2 bg-brand-secondary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all">
               Review Summary <ArrowRight className="w-4 h-4" />
             </button>
           </div>
        </motion.div>
      );
    }

    if (step === finalStepIndex + 1) {
       const estimatedBudget = flow === 'web' 
        ? (data.webScopePages === '1-5' ? '$5k - $15k' : data.webScopePages === '5-15' ? '$15k - $30k' : '$30k+')
        : (data.aiComplexity === 'MVP' ? '$10k - $25k' : data.aiComplexity === 'Advanced' ? '$25k - $75k' : '$75k+');

       return (
        <motion.div key="summary" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="flex flex-col gap-6">
           <div className="text-center mb-4">
             <Shield className="w-10 h-10 text-brand-accent mx-auto mb-4" />
             <h2 className="text-2xl font-heading font-medium text-brand-secondary mb-2">Request Formulation Complete.</h2>
             <p className="text-slate-500 text-sm">Review your parameters before we ingest this into our system.</p>
           </div>
           
           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-medium text-brand-secondary">
                System Estimate
              </div>
              <div className="px-6 py-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                   <span className="text-slate-500">Service Category</span>
                   <span className="font-medium text-brand-secondary">{flow === 'web' ? 'Web Development' : 'AI Services'}</span>
                </div>
                {flow === 'web' && (
                  <>
                     <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <span className="text-slate-500">Project Name</span>
                       <span className="font-medium text-brand-secondary">{data.projectName}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <span className="text-slate-500">Selected Stack</span>
                       <span className="font-medium text-brand-secondary">{data.webStack}</span>
                     </div>
                  </>
                )}
                {flow === 'ai' && (
                  <>
                     <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <span className="text-slate-500">Architecture Type</span>
                       <span className="font-medium text-brand-secondary">{data.aiType}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                       <span className="text-slate-500">System Complexity</span>
                       <span className="font-medium text-brand-secondary">{data.aiComplexity}</span>
                     </div>
                  </>
                )}
                <div className="flex justify-between items-center bg-brand-accent/5 p-4 rounded-xl mt-2">
                   <span className="text-brand-secondary font-medium">Estimated Pricing Range</span>
                   <span className="font-heading font-bold text-brand-accent text-lg">{estimatedBudget}</span>
                </div>
              </div>
           </div>

           {errorMsg && <div className="text-red-500 text-sm text-center bg-red-50 py-3 rounded-lg">{errorMsg}</div>}

           <div className="flex justify-between mt-4">
             <button disabled={isSubmitting} onClick={prevStep} className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50">Back</button>
             <button disabled={isSubmitting} onClick={submitRequest} className="flex items-center gap-2 bg-brand-secondary text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-all shadow-lg hover:shadow-xl">
               {isSubmitting ? 'Transmitting...' : 'Initialize Request'}
               {!isSubmitting && <ArrowRight className="w-4 h-4" />}
             </button>
           </div>
        </motion.div>
      );
    }
  };

  return (
    <PageTransition>
      <div className="bg-slate-50 min-h-screen text-brand-secondary py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Abstract futuristic background decorations */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-brand-accent/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          
          <div className="mb-12 text-center">
             <div className="inline-flex items-center justify-center gap-3 mb-6">
                <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Interactive Formulator</span>
             </div>
             <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight mb-4">
               Request <span className="text-brand-accent italic font-serif">Solutions.</span>
             </h1>
          </div>

          <div className="glass p-8 md:p-12 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl relative min-h-[400px] flex flex-col justify-center">
             {success ? (
                <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading text-2xl font-medium mb-3">Transmission Successful</h3>
                  <p className="text-slate-500 mb-8">Your request has been logged into our systems. An engineer will reach out shortly.</p>
                  <button 
                     onClick={() => { setSuccess(false); setStep(0); setFlow(null); }}
                     className="text-sm font-medium text-brand-secondary hover:text-brand-accent transition-colors"
                  >
                    Formulate another request
                  </button>
                </motion.div>
             ) : (
                <AnimatePresence mode="wait">
                  {renderStep()}
                </AnimatePresence>
             )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
