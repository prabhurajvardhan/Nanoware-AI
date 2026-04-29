'use client';

import { PageTransition } from '@/components/PageTransition';
import { projectsData } from '@/lib/projectsData';

export default function Projects() {
  return (
    <PageTransition>
      <div className="bg-brand-primary min-h-screen text-brand-secondary py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 relative z-10 pt-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-brand-accent"></span>
                <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Our Portfolio</span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-medium tracking-tight mb-6">
              Venture <span className="text-brand-accent italic font-serif">Projects.</span>
            </h1>
            <p className="text-lg text-slate-500 font-sans leading-relaxed">
              We are actively building and incubating a suite of next-generation AI platforms. These projects span education, news intelligence, entertainment, and social computing, leveraging our core architectures.
            </p>
          </div>

          <div className="flex flex-col gap-16 mt-8">
             {projectsData.map((project) => (
                <div key={project.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start border-t border-slate-200 pt-16">
                   <div className="lg:col-span-4 sticky top-32">
                     <div className="flex items-center gap-4 mb-4">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          project.status.includes('Ongoing') ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {project.status}
                        </span>
                     </div>
                     <h2 className="font-heading text-3xl font-medium text-brand-secondary mb-4">
                       {project.name}
                     </h2>
                     <p className="text-slate-500 leading-relaxed">
                       {project.description}
                     </p>
                   </div>
                   <div className="lg:col-span-8 grid grid-cols-1 gap-6">
                      {project.details.map((detail, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                           <h4 className="font-heading text-lg font-medium text-brand-secondary mb-4 flex items-center gap-3">
                             <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                             {detail.title}
                           </h4>
                           <p className="text-slate-600 leading-relaxed text-sm">
                             {detail.content}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
