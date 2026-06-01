'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { sendRevenueReportEmail } from '@/lib/email/actions';

export default function RevenueLossCalculator() {
  const [leads, setLeads] = useState<number>(300);
  const [missedLeadsPercent, setMissedLeadsPercent] = useState<number>(20);
  const [clientValue, setClientValue] = useState<number>(1500);
  const [responseDelay, setResponseDelay] = useState<number>(12); // hours
  const [teamSize, setTeamSize] = useState<number>(5);

  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sentStatus, setSentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    startTransition(async () => {
      const res = await sendRevenueReportEmail(email, 'Visitor', revenueLoss, recoverable);
      if (res.success) {
        setSentStatus('success');
      } else {
        setSentStatus('error');
      }
    });
  };

  const { finalLoss: revenueLoss, calculatedRecoverable: recoverable, aiScore } = useMemo(() => {
    const totalPotential = leads * clientValue;
    const missedValue = (leads * (missedLeadsPercent / 100)) * clientValue;
    const delayPenalty = Math.max(0, responseDelay - 1) * 0.02 * totalPotential;
    const teamPenalty = (leads / teamSize > 50) ? ((leads / teamSize) - 50) * 10 * (clientValue * 0.01) : 0;
    
    const calculatedLoss = missedValue + delayPenalty + teamPenalty;
    const finalLoss = Math.min(totalPotential, calculatedLoss);
    const calculatedRecoverable = finalLoss * 0.75;
    const score = Math.max(0, Math.min(100, 100 - (finalLoss / (totalPotential || 1)) * 100));
    
    return { finalLoss, calculatedRecoverable, aiScore: Math.round(score) };
  }, [leads, missedLeadsPercent, clientValue, responseDelay, teamSize]);

  // Animated Number component (simple implementation using standard React)
  return (
    <section className="py-24 bg-brand-secondary text-white relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-brand-accent blur-[120px]" />
         <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-white blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Content */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-3 mb-2">
               <span className="h-px w-8 bg-brand-accent"></span>
               <span className="text-brand-accent font-heading font-medium tracking-widest text-xs uppercase">Business Intelligence</span>
            </div>
            
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-tight">
              Calculate Your <span className="text-brand-accent italic font-serif">Hidden Revenue</span> Loss
            </h2>
            
            <p className="text-slate-300 text-lg md:text-xl font-sans leading-relaxed max-w-lg mt-2">
              Most businesses lose clients before they even reply. Discover how much revenue operational delays, missed leads, and manual workflows are costing you every month.
            </p>
            
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1 font-heading">The Speed Penalty</h4>
                  <p className="text-sm text-slate-400">Leads contacted within 5 minutes are 100x more likely to convert. AI eliminates delay.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mt-2">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1 font-heading">Automated Follow-ups</h4>
                  <p className="text-sm text-slate-400">Stop relying on manual memory. Re-engage sleeping prospects on autopilot.</p>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Side: Interactive Widget */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/20 to-white/5 rounded-3xl blur-xl" />
            <div className="relative bg-white text-[#0f172a] border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
              
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-heading text-[#0f172a] font-medium border-b border-brand-accent/30 pb-2 inline-block">Monthly Operations</h3>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-brand-accent/10 text-brand-accent rounded-full border border-brand-accent/20">Live Sync</span>
                </div>
              </div>

              <div className="space-y-6">
                
                {/* Inputs */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs tracking-wide text-slate-500 uppercase">Monthly Lead Volume</label>
                    <span className="text-[#0f172a] font-mono text-sm">{leads}</span>
                  </div>
                  <input 
                    type="range" min="10" max="5000" value={leads} onChange={e => setLeads(Number(e.target.value))}
                    className="w-full accent-brand-accent h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                     <label className="text-xs tracking-wide text-slate-500 uppercase">Avg. Client Value ($)</label>
                     <span className="text-[#0f172a] font-mono text-sm">${clientValue.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="100" max="25000" step="100" value={clientValue} onChange={e => setClientValue(Number(e.target.value))}
                    className="w-full accent-brand-accent h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                     <label className="text-xs tracking-wide text-slate-500 uppercase">Avg. Response Delay (Hours)</label>
                     <span className="text-[#0f172a] font-mono text-sm">{responseDelay}h</span>
                  </div>
                  <input 
                    type="range" min="0" max="72" value={responseDelay} onChange={e => setResponseDelay(Number(e.target.value))}
                    className="w-full accent-brand-accent h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Insights Display */}
                <div className="mt-10 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Est. Revenue Loss</h4>
                      <AnimatedNumber value={revenueLoss} prefix="$" className="font-heading text-2xl md:text-3xl text-red-500 font-medium tracking-tight" />
                      <p className="text-[10px] text-slate-500 mt-1">Per Month</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">AI Recoverable</h4>
                      <AnimatedNumber value={recoverable} prefix="+$" className="font-heading text-2xl md:text-3xl text-emerald-500 font-medium tracking-tight" />
                      <p className="text-[10px] text-slate-500 mt-1">Potential Uplift</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 tracking-wide uppercase">Operational Efficiency</span>
                      <span className="text-xs text-brand-accent font-mono">{aiScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-brand-accent"
                         initial={{ width: 0 }}
                         animate={{ width: `${aiScore}%` }}
                         transition={{ duration: 0.5, ease: "easeOut" }}
                       />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4">
                  {sentStatus === 'success' ? (
                    <div className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 font-heading">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                       Report sent to your inbox
                    </div>
                  ) : (
                    <form onSubmit={handleSendReport} className="flex flex-col gap-2">
                       <div className="flex bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent/50 transition-all border border-slate-200 shadow-sm p-1">
                         <input 
                           type="email" 
                           placeholder="Enter your email" 
                           required 
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-transparent px-4 py-2 text-sm focus:outline-none text-[#0f172a] placeholder:text-slate-400"
                         />
                         <button 
                           type="submit" 
                           disabled={isPending}
                           className="bg-brand-secondary text-white px-5 rounded-lg text-sm font-medium disabled:opacity-70 hover:bg-brand-accent hover:text-brand-secondary transition-colors whitespace-nowrap"
                         >
                           {isPending ? 'Sending...' : 'Send Report'}
                         </button>
                       </div>
                       {sentStatus === 'error' && <p className="text-red-500 text-xs text-center mt-1">Failed to send report.</p>}
                    </form>
                  )}
                  
                  <div className="mt-4 text-center">
                    <Link href="/revenue-loss-calculator" className="text-xs text-slate-500 hover:text-brand-accent transition-colors uppercase tracking-widest font-medium group inline-flex items-center gap-1">
                      View report online
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

// Helper component for animating numbers smoothly
function AnimatedNumber({ value, prefix = "", className = "" }: { value: number, prefix?: string, className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    // Simple fast interval up/down counter for effect
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 800; // ms
    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const current = start + (end - start) * easeProgress;
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };
    
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={className}>
      {prefix}{Math.round(displayValue).toLocaleString()}
    </div>
  );
}
