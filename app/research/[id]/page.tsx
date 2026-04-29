import { researchExperiments } from '@/lib/researchData';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';

export function generateStaticParams() {
  return researchExperiments.map((exp) => ({
    id: exp.id,
  }));
}

export default async function ResearchReport({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const experiment = researchExperiments.find((e) => e.id === id);

  if (!experiment) {
    notFound();
  }

  return (
    <PageTransition>
      <div className="bg-slate-50 min-h-screen text-brand-secondary py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-12">
            <Link 
              href="/research" 
              className="inline-flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-brand-accent transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 7H1M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Research
            </Link>
          </div>

          {/* Header */}
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-6">
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${experiment.status === 'Active' ? 'bg-green-100 text-green-700' : experiment.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                   Status: {experiment.status}
                </span>
                <span className="text-slate-400 text-sm tracking-wider uppercase font-heading">
                   Report ID: {experiment.id.substring(0, 8).toUpperCase()}-XX
                </span>
             </div>
             <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight mb-6 leading-tight">
               {experiment.title}
             </h1>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-12">
            {/* Abstract Section */}
            <section>
               <h2 className="font-heading text-xl font-medium tracking-tight border-b border-slate-100 pb-3 mb-6 text-brand-secondary flex items-center gap-3">
                 <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                 Abstract
               </h2>
               <p className="text-slate-600 leading-relaxed">
                 {experiment.abstract}
               </p>
            </section>

            {/* Key Idea Section */}
            <section>
               <h2 className="font-heading text-xl font-medium tracking-tight border-b border-slate-100 pb-3 mb-6 text-brand-secondary flex items-center gap-3">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                 Key Concept & Implementation
               </h2>
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {experiment.keyIdea}
                  </p>
               </div>
            </section>

            {/* Future Work Section */}
            <section>
               <h2 className="font-heading text-xl font-medium tracking-tight border-b border-slate-100 pb-3 mb-6 text-brand-secondary flex items-center gap-3">
                 <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full" />
                 Future Direction
               </h2>
               <p className="text-slate-600 leading-relaxed italic">
                 {experiment.futureWork}
               </p>
            </section>
            
            <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400">
               <span>Nanoware AI / Research Lab</span>
               <span>Confidential Output</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
