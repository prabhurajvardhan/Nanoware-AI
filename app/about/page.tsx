'use client';

import { PageTransition } from '@/components/PageTransition';

export default function About() {
  return (
    <PageTransition>
      <div className="bg-brand-secondary min-h-screen text-white pt-24 pb-32 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10">
          <div className="max-w-4xl">
            <h1 className="font-heading text-5xl md:text-6xl font-medium tracking-tight mb-6">
              Founded by Researchers.<br/>Built for <span className="text-brand-accent italic font-serif">Impact.</span>
            </h1>
            <p className="text-lg text-slate-400 font-sans leading-relaxed mt-6 mb-12">
              We are an independent deep-tech lab. Our mission is to fundamentally rethink the way AI architectures are built, moving away from brute-force compute scaling toward efficient, adaptable, and generalized intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-slate-800">
            <div>
              <h2 className="font-heading text-3xl font-medium mb-6">Our Achievements</h2>
              <div className="border-l border-slate-800 ml-3 space-y-12">
                 <div className="pl-8 relative text-sm">
                    <div className="absolute w-3 h-3 bg-brand-accent rounded-full -left-[6.5px] top-1"></div>
                    <p className="text-brand-accent font-heading font-medium tracking-widest uppercase mb-1">Q3 2025</p>
                    <h4 className="text-white text-lg font-medium mb-2">Alpha Release of NanoCore</h4>
                    <p className="text-slate-400 leading-relaxed">Deployed our first autonomous agentic system in a live enterprise environment, processing over 1M events without supervision.</p>
                 </div>
                 <div className="pl-8 relative text-sm">
                    <div className="absolute w-3 h-3 bg-slate-700 rounded-full -left-[6.5px] top-1"></div>
                    <p className="text-slate-500 font-heading font-medium tracking-widest uppercase mb-1">Q1 2025</p>
                    <h4 className="text-white text-lg font-medium mb-2">Seed Funding Secured</h4>
                    <p className="text-slate-400 leading-relaxed">$5M seed round led by visionary investors wanting to push past the Transformer paradigm.</p>
                 </div>
              </div>
            </div>
            
            <div>
               <div className="glass-dark p-10 rounded-3xl border border-slate-800">
                  <h3 className="font-heading text-2xl font-medium mb-8">What our Partners Say</h3>
                  <div className="space-y-8">
                     <div className="border-b border-slate-800 pb-8">
                        <p className="italic text-slate-300 leading-relaxed mb-4">"Nanoware AI isn't just implementing AI, they are fundamentally altering how we perceive system architecture. Their deployments are staggeringly efficient."</p>
                        <p className="text-sm font-medium text-white">Dr. Aris Thorne</p>
                        <p className="text-xs text-slate-500">Director of Research, TechNova Group</p>
                     </div>
                     <div>
                        <p className="italic text-slate-300 leading-relaxed mb-4">"The reliability of their multi-agent testing system reduced our deployment hallucinations by 98%."</p>
                        <p className="text-sm font-medium text-white">Elena Rostova</p>
                        <p className="text-xs text-slate-500">CTO, IntelliCore Systems</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
