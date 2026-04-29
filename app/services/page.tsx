'use client';

import { PageTransition } from '@/components/PageTransition';

const services = [
  {
    title: 'AI Native Web Development',
    problem: 'Traditional websites are static and fail to capture intelligent context.',
    solution: 'We build web platforms where AI is deeply integrated into the UX, enabling dynamic generation, personalization, and task execution.',
    benefits: ['Sub-second latency', 'Dynamic UI generation', 'Vector-search ready']
  },
  {
    title: 'Custom Agentic Systems',
    problem: 'Companies need workers, not just wrappers around language models.',
    solution: 'We construct multi-agent frameworks using our proprietary Rust-based intelligence routing to do complex autonomous work.',
    benefits: ['Self-healing code', 'Task delegation', 'State persistence']
  },
  {
    title: 'AI Testing & Evaluation',
    problem: 'Models hallucinate or regress wildly without deep automated testing.',
    solution: 'Our agentic testing system continuously stress-tests your LLM deployments using red-teaming and prompt-injection simulations.',
    benefits: ['Automated Red-teaming', 'CI/CD Integration', 'Drift Monitoring']
  }
];

export default function Services() {
  return (
    <PageTransition>
      <div className="bg-brand-secondary min-h-screen text-white pt-24 pb-32 px-6 md:px-12 relative overflow-hidden">
        
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-brand-accent"></span>
                <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Capabilities</span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-medium tracking-tight mb-6">
              Engineering Intelligence.<br/>For a <span className="text-brand-accent italic font-serif">Smarter Future.</span>
            </h1>
            <p className="text-lg text-slate-400 font-sans leading-relaxed">
              We translate our deep-tech findings into robust, highly-scalable software solutions for select partners.
            </p>
          </div>

          <div className="flex flex-col gap-12 mt-8 border-t border-slate-800 pt-16">
             {services.map((svc, i) => (
                <div key={svc.title} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start group">
                   <div className="md:col-span-4">
                     <h2 className="font-heading text-2xl font-medium text-white group-hover:text-brand-accent transition-colors">
                       {svc.title}
                     </h2>
                     <div className="mt-6 flex flex-wrap gap-2">
                        {svc.benefits.map(b => (
                          <span key={b} className="text-xs px-3 py-1.5 rounded-full border border-slate-800 text-slate-300 bg-slate-900/50 block">
                            {b}
                          </span>
                        ))}
                     </div>
                   </div>
                   <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="glass-dark p-6 rounded-2xl border border-slate-800">
                         <h4 className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-3">The Problem</h4>
                         <p className="text-slate-300 leading-relaxed text-sm">{svc.problem}</p>
                      </div>
                      <div className="glass-dark p-6 rounded-2xl border border-brand-accent/20 relative overflow-hidden">
                         <div className="absolute inset-0 bg-brand-accent/5" />
                         <h4 className="text-brand-accent text-xs font-semibold tracking-wider uppercase mb-3 relative z-10">Our Solution</h4>
                         <p className="text-white leading-relaxed text-sm relative z-10">{svc.solution}</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
