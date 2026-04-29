'use client';

import { PageTransition } from '@/components/PageTransition';

const updates = [
  {
    date: 'April 2026',
    title: 'The Shift from Compute to Efficiency',
    snippet: 'Why the next paradigm of AI isn\'t about adding more parameters, but reorganizing the connective tissue of neural architectures.'
  },
  {
    date: 'February 2026',
    title: 'Benchmarking the NanoCore Framework',
    snippet: 'Our latest results show a 40x reduction in memory allocation for autonomous persistence loops compared to standard python runtimes.'
  },
  {
    date: 'January 2026',
    title: 'Nanoware AI Launches New Web Division',
    snippet: 'Applying our deep-tech insights into commercially viable web architectures for next-generation platforms.'
  }
];

export default function Updates() {
  return (
    <PageTransition>
      <div className="bg-slate-50 min-h-screen text-brand-secondary py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-brand-accent"></span>
                <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Log</span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-medium tracking-tight mb-6">
              Updates & <span className="text-brand-accent italic font-serif">Thoughts.</span>
            </h1>
          </div>

          <div className="flex flex-col gap-4">
             {updates.map((post, i) => (
                <div key={i} className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                   <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-3">{post.date}</p>
                   <h3 className="font-heading text-2xl font-medium mb-3 group-hover:text-brand-accent transition-colors">{post.title}</h3>
                   <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{post.snippet}</p>
                </div>
             ))}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
