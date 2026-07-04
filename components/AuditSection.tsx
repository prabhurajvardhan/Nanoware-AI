'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Check, ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';

const EXAMPLE_URLS = [
  'yourcompany.com',
  'yourstartup.io',
  'youragency.co',
];

const AUDIT_FEATURES = [
  'UX Analysis',
  'AI Readiness',
  'Lead Capture',
  'Automation Opportunities',
  'SEO',
  'Performance',
  'Personalized Roadmap',
];

interface AuditResponse {
  id: string;
  status: string;
  shareableLink: string;
}

type AuditPhase = 
  | 'idle'
  | 'queued'
  | 'discovering'
  | 'researching'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'error';

const PHASE_LABELS: Record<AuditPhase, string> = {
  idle: 'Ready to Analyze',
  queued: 'Queuing Audit...',
  discovering: 'Discovering Website',
  researching: 'Researching Website',
  analyzing: 'Analyzing Data',
  generating: 'Generating Insights',
  complete: 'Analysis Complete',
  error: 'Analysis Failed',
};

export default function AuditSection() {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<AuditPhase>('idle');
  const [auditId, setAuditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    // Basic URL validation
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    if (!urlPattern.test(normalizedUrl.replace(/^https?:\/\//, ''))) {
      setError('Please enter a valid website URL');
      return;
    }

    setError(null);
    setPhase('queued');

    // Simulate visual phases while API processes
    await new Promise(resolve => setTimeout(resolve, 500));
    setPhase('discovering');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPhase('researching');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPhase('analyzing');

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!response.ok) {
        throw new Error('Audit request failed');
      }

      const data: AuditResponse = await response.json();
      
      setPhase('generating');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPhase('complete');
      setAuditId(data.id);

    } catch (err) {
      console.error('Audit error:', err);
      setPhase('error');
      setError('Failed to analyze website. Please try again.');
    }
  };

  const getProgress = (): number => {
    switch (phase) {
      case 'idle': return 0;
      case 'queued': return 5;
      case 'discovering': return 20;
      case 'researching': return 45;
      case 'analyzing': return 70;
      case 'generating': return 90;
      case 'complete': return 100;
      case 'error': return 0;
      default: return 0;
    }
  };

  const progress = getProgress();
  const isAnalyzing = phase !== 'idle' && phase !== 'complete' && phase !== 'error';
  const isComplete = phase === 'complete';
  const hasError = phase === 'error';

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C6A15B]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#0F172A]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-[#0F172A]/5 px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#C6A15B]" />
            <span className="text-sm font-medium text-[#0F172A]/70">Free AI-Powered Analysis</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-[#0F172A] mb-4"
          >
            AI Growth Opportunity<br />
            <span className="text-[#C6A15B] italic font-serif">Audit</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Get a free AI-powered audit of your business in under 2 minutes.
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-slate-200/50 shadow-[0_8px_30px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-xl">
            {/* URL Input */}
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Globe className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your website URL"
                  className="w-full pl-14 pr-32 py-5 text-lg bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#C6A15B] transition-colors text-[#0F172A] placeholder:text-slate-400"
                  disabled={isAnalyzing}
                  onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0F172A] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#1e293b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {(error || hasError) && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 text-sm"
                  >
                    {error || 'An error occurred. Please try again.'}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Example URLs */}
              {!isAnalyzing && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-400">Try:</span>
                  {EXAMPLE_URLS.map((exampleUrl) => (
                    <button
                      key={exampleUrl}
                      onClick={() => handleExampleClick(exampleUrl)}
                      className="text-sm text-[#C6A15B] hover:text-[#b8934a] underline-offset-2 hover:underline transition-colors"
                    >
                      {exampleUrl}
                    </button>
                  ))}
                </div>
              )}

              {/* Progress Indicator */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4"
                  >
                    {/* Progress bar */}
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#C6A15B] to-[#C6A15B]/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    
                    {/* Phase label */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-[#C6A15B] animate-spin" />
                        <span className="text-sm font-medium text-[#0F172A]">
                          {PHASE_LABELS[phase]}
                        </span>
                      </div>
                      <span className="text-sm text-slate-400">{progress}%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Complete State */}
              <AnimatePresence>
                {isComplete && auditId && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pt-4 space-y-4"
                  >
                    <div className="bg-[#0F172A]/5 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 bg-[#C6A15B] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-heading text-xl font-medium text-[#0F172A] mb-2">
                        Audit Complete!
                      </h3>
                      <p className="text-slate-500 text-sm mb-6">
                        Your AI Growth Opportunity Audit is ready.
                      </p>
                      <Link
                        href={`/audit/${auditId}`}
                        className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#1e293b] transition-colors"
                      >
                        View Your Audit Report
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Feature Checkmarks */}
            <AnimatePresence>
              {!isAnalyzing && !isComplete && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-100"
                >
                  {AUDIT_FEATURES.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#C6A15B]/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-[#C6A15B]" />
                      </div>
                      <span className="text-sm text-[#0F172A]/70">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
