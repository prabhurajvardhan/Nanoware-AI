import Link from 'next/link';
import NeuronNetwork from '@/components/NeuronNetwork';
import ProjectNetwork from '@/components/ProjectNetwork';
import ServiceChain from '@/components/ServiceChain';
import { PageTransition } from '@/components/PageTransition';
import RevenueLossCalculator from '@/components/RevenueLossCalculator';
import NORAWrapper from '@/components/ai-consultant/NORAWrapper';

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
              <h1 className="font-heading text-4xl md:text-6xl lg:text-[5rem] font-medium tracking-tight text-brand-secondary leading-[1.05]">
                Build • Automate •<br />
                <span className="text-brand-accent italic font-serif">Launch Faster</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-sans leading-relaxed max-w-lg mt-2">
                We create websites, intelligent automations, AI workflows and digital systems that help businesses and creators move faster with less manual work.
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
                  href="/projects"
                  className="w-full sm:w-auto bg-white border border-slate-200 text-brand-secondary px-8 py-4 rounded-full text-sm tracking-wide font-medium hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  Explore Our Work
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
                 <h3 className="font-heading font-medium text-brand-secondary mb-2">Our Mission</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">To engineer digital systems and intelligent automations that accelerate business growth and reduce operational friction.</p>
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

      {/* AI Growth Opportunity Audit Section */}
      <NORAWrapper />

      {/* Revenue Loss Calculator Section */}
      <RevenueLossCalculator />

      {/* Projects Network Section */}
      <section className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 relative z-10">
           <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-brand-accent"></span>
              <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Active Network</span>
           </div>
           <h2 className="font-heading text-3xl md:text-5xl font-medium tracking-tight text-brand-secondary">
             Test Our <span className="text-brand-accent italic font-serif">Work.</span>
           </h2>
           <p className="text-slate-500 max-w-xl mt-4 font-sans text-sm md:text-base leading-relaxed">
             Explore real demos of websites, automations and AI systems built by NanoWare.
           </p>
        </div>
        
        <ProjectNetwork />
      </section>

      {/* Services Section */}
      <ServiceChain />

      {/* Why Nanoware AI Section */}
      <section className="py-32 bg-brand-secondary text-white px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-24">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-6">
                Built for speed.<br />
                <span className="text-white/60">Designed for execution.</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-sans max-w-xl leading-relaxed">
                From idea to production without unnecessary complexity.
              </p>
            </div>
            <Link href="/contact" className="hidden md:inline-flex items-center gap-3 text-sm tracking-wide font-medium bg-white text-brand-secondary hover:bg-slate-200 transition-colors px-8 py-4 rounded-full shadow-lg">
              Get Free Consultation
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-accent mb-6 border border-slate-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </div>
              <h3 className="text-xl font-heading font-medium text-[#0F172A] mb-3">Fast Delivery</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Rapid prototypes and fast launches.</p>
            </div>
            
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-accent mb-6 border border-slate-100">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              </div>
              <h3 className="text-xl font-heading font-medium text-[#0F172A] mb-3">Intelligent Systems</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Built for your workflow and goals.</p>
            </div>
            
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-accent mb-6 border border-slate-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <h3 className="text-xl font-heading font-medium text-[#0F172A] mb-3">Managed Infrastructure</h3>
              <p className="text-slate-500 text-sm leading-relaxed">We maintain deployment and operations.</p>
            </div>
          </div>

          {/* Process Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
               <h3 className="text-2xl font-heading font-medium text-white">The Live-Build Process</h3>
               <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                 <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
                 <span className="text-xs font-medium uppercase tracking-wider text-slate-300">Track your project in real-time through your dashboard</span>
               </div>
            </div>
            
            {/* Timeline UI */}
            <div className="relative">
               {/* Vertical line for mobile, horizontal line for desktop */}
               <div className="absolute left-5 md:left-0 top-0 bottom-0 md:bottom-auto w-px h-full md:h-px md:w-full bg-slate-800 md:top-5 -z-10"></div>
               
               <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-4 lg:gap-8">
                  {[
                    { id: '01', title: 'Discovery', desc: 'Requirements gathered' },
                    { id: '02', title: 'Planning', desc: 'Architecture defined' },
                    { id: '03', title: 'Build', desc: 'UX/UI & structures' },
                    { id: '04', title: 'Live Preview', desc: 'Watch us build' },
                    { id: '05', title: 'Launch', desc: 'Push to production' }
                  ].map((step, idx) => (
                     <div key={idx} className="relative flex md:flex-col items-start md:items-center gap-6 md:gap-4 md:text-center w-full group">
                        <div className="bg-slate-900 w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center z-10 shrink-0 text-slate-500 font-mono text-sm group-hover:border-brand-accent group-hover:text-brand-accent transition-colors">
                          {step.id}
                        </div>
                        <div>
                          <h4 className="font-heading font-medium text-white mb-1">{step.title}</h4>
                          <p className="text-xs text-slate-500 hidden md:block">{step.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>



        </div>
      </section>

    </PageTransition>
  );
}
