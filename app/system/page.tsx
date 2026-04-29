'use client';

import { PageTransition } from '@/components/PageTransition';
import NeuronNetwork from '@/components/NeuronNetwork';

export default function System() {
  return (
    <PageTransition>
      <div className="bg-brand-primary min-h-screen text-brand-secondary py-24 px-6 md:px-12 relative overflow-hidden">
        
        <div className="absolute inset-0 opacity-40 z-0 pointer-events-none mix-blend-multiply">
           <NeuronNetwork />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10 pt-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-brand-accent"></span>
                <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Architecture overview</span>
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-medium tracking-tight mb-6">
              The <span className="text-brand-accent italic font-serif">Engine</span> behind the intelligence.
            </h1>
            <p className="text-lg text-slate-500 font-sans leading-relaxed">
              We ditched standard Python wrappers. Our intelligence system is a stateful, continuous-learning engine built entirely in Rust. It doesn't just predict next tokens—it reasons, delegates, and iterates autonomously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
             <div className="p-8 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200">
                <h3 className="font-heading text-xl font-medium mb-3">Memory Management</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Continuous episodic and semantic memory storage utilizing highly dense vector topologies.</p>
             </div>
             <div className="p-8 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200">
                <h3 className="font-heading text-xl font-medium mb-3">Goal Decomposition</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Dynamic breaking of high-level directives into hierarchical sub-tasks evaluated by reward models.</p>
             </div>
             <div className="p-8 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200">
                <h3 className="font-heading text-xl font-medium mb-3">Tool Orchestration</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Native synthesis of APIs enabling the system to act on its environment flawlessly.</p>
             </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
