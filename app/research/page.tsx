'use client';

import { PageTransition } from '@/components/PageTransition';
import { researchExperiments } from '@/lib/researchData';
import Link from 'next/link';

export default function Research() {
  return (
    <PageTransition>
      <div className="bg-brand-primary min-h-screen text-brand-secondary py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-brand-accent"></span>
                <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Research Spotlight</span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-medium tracking-tight mb-6">
              Redefining the<br/>Building Blocks of <span className="text-brand-accent italic font-serif">Intelligence.</span>
            </h1>
            <p className="text-lg text-slate-500 font-sans leading-relaxed">
              Our latest neuron architecture brings us closer to systems that understand, reason, and evolve like living intelligence. Dive into our Rust-based environment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12 border-t border-slate-100 pt-16">
            <div className="lg:col-span-1 flex flex-col gap-6">
               <h2 className="font-heading text-2xl font-medium">Recent Experiments</h2>
               <p className="text-slate-500 text-sm leading-relaxed mb-4">
                 We constantly run large-scale computational simulations to optimize the weights and structure of our intelligent pipelines.
               </p>
               <button className="bg-brand-secondary text-white self-start px-6 py-3 rounded-full text-sm tracking-wide font-medium hover:bg-slate-800 transition-colors">
                 View All Reports
               </button>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
               {researchExperiments.map((exp, i) => (
                 <div key={exp.id} className="p-8 rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                       <span className="text-brand-accent font-heading font-medium tracking-widest text-xs uppercase">0{i+1}</span>
                       <span className={`text-xs px-2 py-1 rounded-full font-medium ${exp.status === 'Active' ? 'bg-green-100 text-green-700' : exp.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{exp.status}</span>
                    </div>
                    <h3 className="font-heading text-xl font-medium mb-3">{exp.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1">{exp.desc}</p>
                    <div className="pt-6 mt-6 border-t border-slate-50">
                       <Link href={`/research/${exp.id}`} className="inline-flex items-center gap-2 text-sm text-brand-secondary font-medium hover:text-brand-accent transition-colors">
                         Read Report <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7h12M7 1l6 6-6 6"/></svg>
                       </Link>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
