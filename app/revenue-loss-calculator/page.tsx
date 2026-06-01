import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';

export const metadata = {
  title: 'Revenue Loss Analysis - Nanoware AI',
  description: 'Detailed revenue loss report and AI automation recommendations.',
};

export default function RevenueLossCalculatorPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-secondary transition-colors mb-8 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Home
            </Link>
            
            <div className="inline-flex items-center gap-3 mb-4">
               <span className="h-px w-8 bg-brand-accent"></span>
               <span className="text-brand-accent font-heading font-medium tracking-widest text-xs uppercase">Your Detailed Report</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-brand-secondary leading-tight">
              Business Impact <span className="text-brand-accent italic font-serif">Analysis</span>
            </h1>
            <p className="text-slate-500 mt-4 text-lg">
              Based on industry averages and modern AI capabilities, here is how intelligent automations can recover your hidden revenue leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
               <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
               </div>
               <h3 className="text-xl font-heading font-medium text-brand-secondary mb-2">Revenue Leakage</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-6">
                 Without automated systems, businesses lose up to 40% of inbound leads due to follow-up delays and manual tracking errors.
               </p>
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Missed Opportunities</span>
                   <span className="text-xs text-slate-800 font-bold">~40%</span>
                 </div>
                 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 w-[40%]" />
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
               </div>
               <h3 className="text-xl font-heading font-medium text-brand-secondary mb-2">AI Recovery Potential</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-6">
                 Implementing rapid-response AI agents typically recovers up to 75% of your lost pipeline by engaging instantly 24/7.
               </p>
               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recovery Rate</span>
                   <span className="text-xs text-slate-800 font-bold">75%</span>
                 </div>
                 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[75%]" />
                 </div>
               </div>
            </div>

          </div>

          <div className="bg-brand-secondary text-white rounded-3xl p-8 md:p-12 mb-12 shadow-xl">
            <h3 className="text-2xl font-heading font-medium mb-8">Recommended AI Automations</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center shrink-0 text-brand-accent">
                  1
                </div>
                <div>
                  <h4 className="text-lg font-heading font-medium mb-1">Instant Response Agent</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Deploy an AI agent that responds to inbound inquiries across email and SMS within 30 seconds. Captures intent and books meetings automatically.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center shrink-0 text-brand-accent">
                  2
                </div>
                <div>
                  <h4 className="text-lg font-heading font-medium mb-1">Smart CRM Routing</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Automatically qualify leads based on initial conversation and push them directly into your CRM. Notify the relevant team member immediately.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center shrink-0 text-brand-accent">
                  3
                </div>
                <div>
                  <h4 className="text-lg font-heading font-medium mb-1">Re-engagement Workflows</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Detect &quot;sleeping&quot; prospects (no reply in 72h) and trigger personalized, context-aware follow-ups to revive the deal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-white border border-brand-accent/20 rounded-3xl gap-8 relative overflow-hidden">
             
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
             
             <div className="max-w-md z-10">
               <h3 className="text-2xl font-heading font-medium text-brand-secondary mb-3">Stop losing revenue today.</h3>
               <p className="text-slate-500 text-sm leading-relaxed">
                 Book a discovery call to get a custom roadmap for implementing these intelligent systems in your specific workflow.
               </p>
             </div>
             
             <div className="w-full md:w-auto shrink-0 z-10">
               <Link 
                 href="/contact" 
                 className="block text-center w-full bg-brand-secondary text-white px-8 py-4 rounded-xl text-sm font-medium tracking-wide shadow-lg hover:bg-brand-accent transition-colors hover:text-brand-secondary"
               >
                 Request Solution
               </Link>
             </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
