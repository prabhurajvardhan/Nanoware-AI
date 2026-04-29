import Link from 'next/link';
import NeuronNetwork from '@/components/NeuronNetwork';
import ProjectNetwork from '@/components/ProjectNetwork';
import { PageTransition } from '@/components/PageTransition';

export default function Home() {
  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-brand-primary">
         <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full z-0 bg-gradient-to-l from-brand-primary/0 to-brand-primary pointer-events-none" />
         <div className="absolute top-0 right-0 w-full lg:w-3/5 h-full z-0">
           <NeuronNetwork />
         </div>
         
         <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20 pt-10">
            <div className="flex flex-col gap-8 max-w-2xl">
              <div className="inline-flex items-center gap-3">
                 <span className="h-px w-8 bg-brand-accent"></span>
                 <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Nanoware AI</span>
              </div>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-[5rem] font-medium tracking-tight text-brand-secondary leading-[1.05]">
                Beyond Algorithms.<br />
                <span className="text-brand-accent italic font-serif">Toward Intelligence.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-sans leading-relaxed max-w-lg mt-2">
                We build self-evolving systems with novel neuron architectures, pushing the boundaries of what artificial intelligence can become.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                <Link 
                  href="/contact"
                  className="w-full sm:w-auto bg-brand-secondary text-white px-8 py-4 rounded-full text-sm tracking-wide font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.22)]"
                >
                  Request a Solution 
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 13L13 1M13 1H4.33333M13 1V9.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <Link 
                  href="/research"
                  className="w-full sm:w-auto bg-white border border-slate-200 text-brand-secondary px-8 py-4 rounded-full text-sm tracking-wide font-medium hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  Explore Research
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1v12M13 7l-6 6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-90 origin-center"/>
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:flex flex-col items-end justify-center pointer-events-none">
              <div className="glass p-8 rounded-2xl max-w-xs xl:mr-12 animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
                 <div className="w-8 h-8 flex items-center justify-center border border-brand-accent/30 rounded-md mb-6">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                 </div>
                 <h3 className="font-heading font-medium text-brand-secondary mb-2">Our Vision</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">To create intelligence that is autonomous, adaptive, and aligned with the real world.</p>
              </div>
            </div>
         </div>
         
         <div className="absolute bottom-10 left-6 md:left-12 flex items-center gap-4 text-xs font-heading tracking-widest text-slate-400 uppercase">
             <div className="w-4 h-6 border border-slate-300 rounded-full flex justify-center pt-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
             </div>
             Scroll to Explore
         </div>
      </section>

      {/* Projects Network Section */}
      <section className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 relative z-10">
           <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-brand-accent"></span>
              <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Active Network</span>
           </div>
           <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-brand-secondary">
             Ecosystem <span className="text-brand-accent italic font-serif">Topology.</span>
           </h2>
           <p className="text-slate-500 max-w-xl mt-4 font-sans text-sm md:text-base leading-relaxed">
             Our ventures form a cohesive digital nervous system. Interact with the nodes below to explore the current state of our intelligence deployment.
           </p>
        </div>
        
        <ProjectNetwork />
      </section>

      {/* Feature Section */}
      <section className="py-32 bg-brand-secondary text-white px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-brand-accent/20 pb-24">
            <div className="flex flex-col gap-4">
               <div className="text-brand-accent mb-2">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
               </div>
               <h3 className="font-heading font-medium text-xl shadow-sm tracking-tight text-white/90">Novel Neuron Architecture</h3>
               <p className="text-slate-400 text-sm leading-relaxed">Built from scratch in Rust. Efficient, scalable, and biologically inspired.</p>
            </div>
            <div className="flex flex-col gap-4">
               <div className="text-brand-accent mb-2">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
               </div>
               <h3 className="font-heading font-medium text-xl shadow-sm tracking-tight text-white/90">Intelligence System</h3>
               <p className="text-slate-400 text-sm leading-relaxed">Self-evolving system that learns, adapts, and improves autonomously.</p>
            </div>
            <div className="flex flex-col gap-4">
               <div className="text-brand-accent mb-2">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
               </div>
               <h3 className="font-heading font-medium text-xl shadow-sm tracking-tight text-white/90">Real World Impact</h3>
               <p className="text-slate-400 text-sm leading-relaxed">From experiments to deployments — creating measurable change.</p>
            </div>
            <div className="flex flex-col gap-4">
               <div className="text-brand-accent mb-2">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
               </div>
               <h3 className="font-heading font-medium text-xl shadow-sm tracking-tight text-white/90">AI Solutions & Services</h3>
               <p className="text-slate-400 text-sm leading-relaxed">Custom AI applications, web solutions, and intelligent automation.</p>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-24 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
           <div className="flex gap-16 flex-wrap">
              <div>
                 <p className="font-heading text-4xl lg:text-5xl font-medium mb-3 text-white/90">12+</p>
                 <p className="text-slate-400 text-sm tracking-widest uppercase">Projects</p>
              </div>
              <div>
                 <p className="font-heading text-4xl lg:text-5xl font-medium mb-3 text-white/90">3</p>
                 <p className="text-slate-400 text-sm tracking-widest uppercase">Core Systems</p>
              </div>
              <div>
                 <p className="font-heading text-4xl lg:text-5xl font-medium mb-3 text-white/90">10K+</p>
                 <p className="text-slate-400 text-sm tracking-widest uppercase">Experiments</p>
              </div>
              <div>
                 <p className="font-heading text-4xl lg:text-5xl font-medium mb-3 text-white/90">∞</p>
                 <p className="text-slate-400 text-sm tracking-widest uppercase">Possibilities</p>
              </div>
           </div>
           
           <Link href="/about" className="inline-flex items-center gap-3 text-sm tracking-wide font-medium text-white hover:text-brand-accent transition-colors border px-6 py-3 rounded-full border-slate-700 hover:border-brand-accent">
              View Achievements
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
           </Link>
        </div>
      </section>
    </PageTransition>
  );
}
