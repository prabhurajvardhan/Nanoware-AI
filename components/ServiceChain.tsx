'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import clsx from 'clsx';
import { Layout, Cpu, Settings2, BoxSelect, Database, Zap } from 'lucide-react';

const services = [
  {
    id: 'ai-automations',
    title: 'AI Automations',
    desc: 'Build secure workflow systems.',
    offer: 'Save hundreds of hours',
    icon: Settings2,
    features: [
      'Multi-platform integration',
      'Data-driven triggers',
      'End-to-end automation'
    ],
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    desc: 'Custom intelligent assistants.',
    offer: 'Autonomous workflows',
    icon: Cpu,
    features: [
      'Custom LLM Integration',
      'Agentic reasoning',
      'Dedicated memory capabilities'
    ],
  },
  {
    id: 'web-platforms',
    title: 'Web Platforms',
    desc: 'Premium websites and dashboards.',
    offer: 'Unmatched performance',
    icon: Layout,
    features: [
      'High-fidelity modern UI/UX',
      'Scalable architecture',
      'Seamless API integrations'
    ],
  },
  {
    id: 'client-portal',
    title: 'Client Portal',
    desc: 'Live preview and project management.',
    offer: 'Real-time observability',
    icon: BoxSelect,
    features: [
      'Live client dashboard tracking',
      'Direct developer communication',
      'Transparent milestone updates'
    ],
  }
];

export default function ServiceChain() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      const progress = scrollLeft / (scrollWidth - clientWidth);
      setScrollProgress(progress || 0);
    }
  };

  return (
    <div className="relative z-0 w-full overflow-hidden bg-slate-50 py-12 md:py-20 lg:py-32 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-16 relative">
        
        {/* Left Side Header */}
        <div className="lg:w-1/3 flex flex-col justify-center shrink-0 relative z-50">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-brand-accent"></span>
            <span className="text-brand-accent font-heading font-medium tracking-widest text-sm uppercase">Capabilities</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-brand-secondary leading-tight">
            From Idea to<br />
            <span className="italic font-serif">Working Product</span><br />
            — In Hours.
          </h2>
          <p className="text-slate-500 mt-6 font-sans text-sm md:text-base leading-relaxed">
            Experience our transparent, high-velocity workflow. We bypass the bloat, delivering functional intelligence systems directly to your dashboard.
          </p>

          <div className="mt-8 flex gap-2 items-center text-sm font-medium text-slate-400">
             <div className="w-8 h-px bg-slate-200"></div>
             Swipe or Scroll to explore
             <div className="w-8 h-px bg-slate-200"></div>
          </div>
        </div>

        {/* Chain Area */}
        <div className="lg:w-2/3 relative">
          {/* Dimmed background when active */}
          <AnimatePresence>
            {activeIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 -inset-x-6 md:-inset-x-12 -inset-y-12 bg-slate-50/60 backdrop-blur-[2px] z-40 pointer-events-none"
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>
           
           <div 
             ref={containerRef}
             onScroll={handleScroll}
             className="flex items-center overflow-x-auto pb-16 pt-8 px-4 -mx-4 hide-scrollbar snap-x snap-mandatory relative z-50"
           >
             
             {/* Background connecting line */}
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -z-10 -translate-y-1/2 mt-[-1rem]"></div>
             <div 
               className="absolute top-1/2 left-0 h-[1px] bg-brand-accent -z-10 -translate-y-1/2 transition-all duration-300 mt-[-1rem]"
               style={{ width: `${scrollProgress * 100}%` }}
             ></div>

             <div className={clsx(
               "flex gap-12 md:gap-20 items-center px-8 md:px-16 min-w-max transition-all duration-300",
               activeIndex !== null ? "pb-[22rem]" : "pb-16"
             )}>
               {services.map((service, idx) => {
                 const isActive = activeIndex === idx;
                 const Icon = service.icon;
                 
                 return (
                   <div key={service.id} className={clsx("relative snap-center", isActive ? "z-50" : "z-10")}>
                     
                     {/* The Block */}
                     <motion.button
                       onClick={() => setActiveIndex(isActive ? null : idx)}
                       onHoverStart={() => { if (activeIndex === null) document.body.style.cursor = 'pointer'; }}
                       onHoverEnd={() => { document.body.style.cursor = 'auto'; }}
                       animate={{
                         y: isActive ? -10 : 0,
                         scale: isActive ? 1.05 : 1,
                       }}
                       whileHover={activeIndex === null ? {
                         y: -4,
                         scale: 1.02,
                       } : {}}
                       transition={{ type: "spring", stiffness: 300, damping: 20 }}
                       className={clsx(
                         "w-24 h-24 md:w-32 md:h-32 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 relative z-30",
                         "shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]",
                         isActive 
                           ? "bg-brand-primary text-brand-accent shadow-[0_12px_40px_rgba(198,161,91,0.2)]" 
                           : "bg-white text-brand-secondary border border-slate-100"
                       )}
                     >
                       <Icon className={clsx("w-6 h-6 md:w-8 md:h-8", isActive ? "text-brand-accent" : "text-brand-secondary")} />
                       <div className="absolute -bottom-8 whitespace-nowrap font-heading text-xs uppercase tracking-widest font-medium text-slate-500">
                         {String(idx + 1).padStart(2, '0')}.
                       </div>
                     </motion.button>
                     
                     {/* Connecting node points */}
                     <div className={clsx(
                       "absolute top-1/2 left-[-1.5rem] md:left-[-2.5rem] w-2 h-2 rounded-full -translate-y-1/2 z-10 transition-colors",
                       idx === 0 ? "hidden" : "block",
                       isActive || (activeIndex !== null && idx <= activeIndex) ? "bg-brand-accent" : "bg-slate-200"
                     )}></div>

                     {/* Expanded Card */}
                     <AnimatePresence>
                       {isActive && (
                         <motion.div
                           initial={{ opacity: 0, y: 20, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: -20, scale: 0.95 }}
                           transition={{ type: "spring", stiffness: 400, damping: 30 }}
                           className="absolute top-[120%] left-1/2 -translate-x-1/2 w-[85vw] max-w-[340px] z-40"
                         >
                           <div className="glass bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-brand-accent/20 shadow-[0_20px_50px_rgba(15,23,42,0.15)] flex flex-col gap-4">
                              <h3 className="font-heading text-xl font-medium text-brand-secondary">
                                {service.title}
                              </h3>
                              <p className="text-sm text-slate-500 leading-relaxed">
                                {service.desc}
                              </p>
                              
                              <div className="my-2 bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4">
                                <p className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-accent mb-1">Key Offer</p>
                                <p className="text-sm font-medium text-brand-secondary">{service.offer}</p>
                              </div>

                              <ul className="flex flex-col gap-3 my-2">
                                {service.features.map((feature, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <svg className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                              
                              <Link 
                                href="/contact" 
                                className="mt-4 w-full bg-brand-secondary text-white py-3 rounded-xl text-sm tracking-wide font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group"
                              >
                                Request Service
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              </Link>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>

                   </div>
                 );
               })}
             </div>
           </div>

        </div>
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
