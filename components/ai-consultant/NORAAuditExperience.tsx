'use client';

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Globe, 
  Download, 
  Calendar, 
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  Bot,
  TrendingUp,
  Zap,
  Target,
  Clock,
  Users,
  Search,
  BarChart3,
  Shield,
  Smartphone,
  Gauge,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { downloadAuditPDF } from '@/components/audit/PDFDownload';
import type { AuditReport } from '@/lib/audit/types';

// Analysis steps for live animation
const ANALYSIS_STEPS = [
  { id: 'detecting-industry', label: 'Detecting industry', icon: Search },
  { id: 'crawling', label: 'Crawling website', icon: Globe },
  { id: 'customer-journey', label: 'Mapping customer journey', icon: Target },
  { id: 'ux', label: 'Checking UX', icon: Users },
  { id: 'crm', label: 'Detecting CRM', icon: BarChart3 },
  { id: 'lead-capture', label: 'Detecting Lead Capture', icon: TrendingUp },
  { id: 'ai-detection', label: 'Detecting AI', icon: Bot },
  { id: 'mobile', label: 'Measuring Mobile Experience', icon: Smartphone },
  { id: 'performance', label: 'Measuring Performance', icon: Gauge },
  { id: 'seo', label: 'Checking SEO', icon: Search },
  { id: 'conversion', label: 'Estimating Conversion Opportunities', icon: TrendingUp },
  { id: 'profile', label: 'Building Business Profile', icon: Lightbulb },
  { id: 'summary', label: 'Generating Executive Summary', icon: Sparkles },
];

// NORA persona
const NORA_INTRO = `Hello. I'm NORA. I've completed your business analysis.

Overall Digital Score: {score}/100

I identified {opportunities} opportunities that could improve your customer journey.

Would you like me to explain them?`;

type ViewState = 'landing' | 'analyzing' | 'dashboard' | 'conversation' | 'qualification' | 'consultation';

interface AnalysisStep {
  icon: React.ComponentType<{className?: string}>;
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

export default function NORAAuditExperience() {
  // View state
  const [viewState, setViewState] = useState<ViewState>('landing');
  
  // Landing state
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  
  // Analysis state
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>(
    ANALYSIS_STEPS.map(s => ({ ...s, status: 'pending' }))
  );
  const [currentStep, setCurrentStep] = useState(0);
  
  // Audit data
  const [auditId, setAuditId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditReport | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  
  // Conversation state
  const [messages, setMessages] = useState<Array<{role: 'nora' | 'user'; content: string}>>([]);
  const [conversationInput, setConversationInput] = useState('');
  
  // Qualification state
  const [qualifiedLead, setQualifiedLead] = useState({
    companyName: '',
    industry: '',
    teamSize: '',
    monthlyVisitors: '',
    primaryGoal: '',
    biggestChallenge: '',
    name: '',
    workEmail: '',
    phone: '',
    contactMethod: 'email' as 'email' | 'phone' | 'whatsapp',
    bestTime: '',
  });
  const [qualificationStep, setQualificationStep] = useState(1);
  
  // UI state
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Run analysis animation and API call
  const runAnalysis = async (targetUrl: string) => {
    setViewState('analyzing');
    setAnalysisSteps(ANALYSIS_STEPS.map(s => ({ ...s, status: 'pending' })));
    setCurrentStep(0);
    
    // Animate through steps
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'active' } : s
      ));
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      setAnalysisSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'complete' } : s
      ));
      setCurrentStep(i + 1);
    }
    
    // Call API
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      
      if (!response.ok) throw new Error('Audit failed');
      
      const data = await response.json();
      setAuditId(data.id);
      
      // Fetch full audit data
      const auditResponse = await fetch(`/api/audit?id=${data.id}`);
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditData(auditData);
        setViewState('dashboard');
        initConversation(auditData);
      } else {
        throw new Error('Failed to fetch audit data');
      }
    } catch (error) {
      console.error('Audit error:', error);
      setAuditError('Unable to complete analysis. Please try again.');
      setViewState('landing');
    }
  };
  
  // Initialize NORA conversation
  const initConversation = (data: AuditReport) => {
    const intro = NORA_INTRO
      .replace('{score}', data.websiteScore.overall.toString())
      .replace('{opportunities}', data.opportunities.length.toString());
    setMessages([{ role: 'nora', content: intro }]);
  };
  
  // Handle URL submission
  const handleAnalyze = () => {
    setUrlError('');
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    try {
      new URL(normalizedUrl);
    } catch {
      setUrlError('Please enter a valid website URL');
      return;
    }
    
    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return;
    }
    
    runAnalysis(normalizedUrl);
  };
  
  // Handle conversation
  const handleSendMessage = () => {
    if (!conversationInput.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: conversationInput }]);
    const userMessage = conversationInput;
    setConversationInput('');
    
    // Simple NORA responses
    setTimeout(() => {
      let response = "Thank you for your question. Based on your audit, ";
      
      if (userMessage.toLowerCase().includes('score') || userMessage.toLowerCase().includes('overall')) {
        const score = auditData?.websiteScore.overall || 0;
        const grade = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'needs attention';
        response += `your overall digital maturity score is ${score}/100, which is ${grade}. The main areas for improvement are in AI adoption and lead capture automation.`;
      } else if (userMessage.toLowerCase().includes('ai') || userMessage.toLowerCase().includes('chatbot')) {
        response += `your AI readiness is currently at ${auditData?.websiteScore.aiReadiness || 0}/100. Implementing an AI consultant could significantly improve your lead qualification and response times.`;
      } else if (userMessage.toLowerCase().includes('lead') || userMessage.toLowerCase().includes('capture')) {
        response += `your lead capture capabilities score ${auditData?.websiteScore.leadCapture || 0}/100. There's significant potential to automate follow-ups and qualification.`;
      } else if (userMessage.toLowerCase().includes('roadmap') || userMessage.toLowerCase().includes('recommend') || userMessage.toLowerCase().includes('next')) {
        response += `I recommend starting with our AI Business Consultant as your first phase. This provides immediate 24/7 lead qualification and can be implemented quickly.`;
      } else if (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('explain') || userMessage.toLowerCase().includes('more')) {
        response += `Let me highlight the top 3 opportunities: First, implementing an AI consultant to qualify leads 24/7. Second, automating your follow-up sequences. Third, improving mobile experience for better conversion. Shall I elaborate on any of these?`;
      } else {
        response += `I'm here to help you understand your digital maturity and identify growth opportunities. Feel free to ask about your score, specific recommendations, or how to get started.`;
      }
      
      setMessages(prev => [...prev, { role: 'nora', content: response }]);
    }, 500);
  };
  
  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!auditData) return;
    setIsDownloading(true);
    try {
      await downloadAuditPDF(auditData);
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Submit qualification form
  const handleSubmitQualification = () => {
    // In production, this would submit to API
    console.log('Lead qualified:', qualifiedLead);
    setViewState('consultation');
  };
  
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#C6A15B]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#0F172A]/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* LANDING VIEW */}
        <AnimatePresence mode="wait">
          {viewState === 'landing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 bg-[#0F172A]/5 px-4 py-2 rounded-full mb-6">
                  <Bot className="w-4 h-4 text-[#C6A15B]" />
                  <span className="text-sm font-medium text-[#0F172A]/70">AI-Powered Analysis</span>
                </div>
                
                <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-[#0F172A] mb-4">
                  Meet Your AI Business
                  <span className="text-[#C6A15B] italic font-serif"> Consultant</span>
                </h2>
                
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                  Get a personalized AI Growth Opportunity Audit in under 3 minutes.
                </p>
              </motion.div>
              
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto mb-8"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder="Paste your business website"
                    className={`w-full pl-12 pr-32 py-5 text-lg border-2 rounded-2xl focus:outline-none focus:ring-0 transition-all ${
                      urlError 
                        ? 'border-red-300 focus:border-red-500 bg-red-50' 
                        : 'border-slate-200 focus:border-[#C6A15B] bg-white shadow-lg'
                    }`}
                  />
                  <button
                    onClick={handleAnalyze}
                    className="absolute inset-y-2 right-2 px-6 bg-[#0F172A] text-white font-medium rounded-xl hover:bg-[#1e293b] transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze Website
                  </button>
                </div>
                {urlError && (
                  <p className="text-red-500 text-sm mt-2 text-left pl-4">{urlError}</p>
                )}
              </motion.div>
              
              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 mb-12"
              >
                {[
                  { icon: Check, text: 'No signup required' },
                  { icon: Bot, text: 'AI Powered' },
                  { icon: Sparkles, text: 'Free Initial Audit' },
                  { icon: Target, text: 'Personalized Recommendations' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-green-500" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
              
              {/* Sample Audit Link */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  setAuditId('sample');
                  setViewState('dashboard');
                }}
                className="text-[#C6A15B] hover:underline font-medium"
              >
                View Sample Audit →
              </motion.button>
            </motion.div>
          )}
          
          {/* ANALYZING VIEW */}
          {viewState === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-3 rounded-full mb-4">
                  <Bot className="w-5 h-5 text-[#C6A15B]" />
                  <span className="font-medium">NORA is analyzing your business...</span>
                </div>
                <p className="text-slate-500">This typically takes 30-60 seconds</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-[#0F172A] to-[#1e293b] text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Bot className="w-5 h-5 text-[#C6A15B]" />
                    <span className="font-medium">NORA - AI Business Consultant</span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Analyzing {url}
                  </p>
                </div>
                
                <div className="p-6 space-y-3">
                  {analysisSteps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          step.status === 'active' ? 'bg-[#C6A15B]/10 border border-[#C6A15B]/30' :
                          step.status === 'complete' ? 'bg-green-50' :
                          'bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === 'active' ? 'bg-[#C6A15B] animate-pulse' :
                          step.status === 'complete' ? 'bg-green-500' :
                          'bg-slate-200'
                        }`}>
                          {step.status === 'active' ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : step.status === 'complete' ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <Icon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <span className={`flex-1 ${
                          step.status === 'pending' ? 'text-slate-400' :
                          step.status === 'active' ? 'text-[#0F172A] font-medium' :
                          'text-slate-600'
                        }`}>
                          {step.label}
                        </span>
                        {step.status === 'complete' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="px-6 pb-6">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#C6A15B]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentStep / ANALYSIS_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-center text-sm text-slate-500 mt-2">
                    {currentStep} of {ANALYSIS_STEPS.length} analyses complete
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* DASHBOARD VIEW */}
          {viewState === 'dashboard' && auditData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Dashboard Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-6 py-3 rounded-full mb-4">
                  <Bot className="w-5 h-5 text-[#C6A15B]" />
                  <span className="font-medium">Analysis Complete</span>
                </div>
                <h2 className="text-3xl font-heading font-medium text-[#0F172A] mb-2">
                  Your AI Growth Opportunity Audit
                </h2>
                <p className="text-slate-500">{auditData.businessName} • {auditData.url}</p>
              </div>
              
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-3xl p-8 text-white mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <p className="text-slate-400 text-sm mb-1">Overall Digital Maturity Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-bold">{auditData.websiteScore.overall}</span>
                      <span className="text-2xl text-slate-400">/100</span>
                    </div>
                    <p className="text-[#C6A15B] font-medium mt-1">Grade {auditData.websiteScore.grade}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'UX', value: auditData.websiteScore.ux },
                      { label: 'AI Readiness', value: auditData.websiteScore.aiReadiness },
                      { label: 'Lead Capture', value: auditData.websiteScore.leadCapture },
                      { label: 'Performance', value: auditData.websiteScore.performance },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-2xl font-bold">{item.value}</div>
                        <div className="text-xs text-slate-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button
                  onClick={() => setViewState('conversation')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0F172A] text-white font-medium rounded-xl hover:bg-[#1e293b] transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Talk to NORA
                </button>
                <button
                  onClick={() => setViewState('qualification')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#C6A15B] text-white font-medium rounded-xl hover:bg-[#b8944d] transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Book Consultation
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Download PDF
                </button>
              </div>
              
              {/* Opportunity Cards */}
              <div className="mb-8">
                <h3 className="text-xl font-heading font-medium text-[#0F172A] mb-4">
                  Priority Opportunities
                </h3>
                <div className="grid gap-4">
                  {auditData.opportunities.slice(0, 3).map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <button
                        onClick={() => setExpandedOpportunity(expandedOpportunity === opp.id ? null : opp.id)}
                        className="w-full p-6 text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            opp.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                            opp.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {opp.priority}
                          </span>
                          <span className="font-medium text-[#0F172A]">
                            {opp.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        {expandedOpportunity === opp.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedOpportunity === opp.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-4">
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observation</p>
                                <p className="text-slate-700">{opp.observation}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Business Impact</p>
                                <p className="text-slate-700">{opp.businessImpact}</p>
                              </div>
                              <div className="bg-[#C6A15B]/10 rounded-lg p-4">
                                <p className="text-xs text-[#C6A15B] uppercase tracking-wider mb-1">Recommendation</p>
                                <p className="text-[#0F172A] font-medium">{opp.recommendation}</p>
                              </div>
                              <div className="flex gap-4 text-sm text-slate-500">
                                <span>Effort: {opp.estimatedEffort}</span>
                                <span>Value: {opp.estimatedValue}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Customer Journey */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
                <h3 className="text-xl font-heading font-medium text-[#0F172A] mb-4">
                  Customer Journey Analysis
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-slate-500 mb-3">Current Journey</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {['Visitor', 'Website', 'Contact Form', 'Phone Call', 'Sales'].map((step, i) => (
                        <div key={step} className="flex items-center">
                          <span className="px-3 py-1.5 bg-slate-100 rounded-lg">{step}</span>
                          {i < 4 && <ArrowRight className="w-4 h-4 mx-1 text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-[#C6A15B] mb-3">Recommended Journey</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {['Visitor', 'AI Consultant', 'Qualification', 'Booking', 'CRM', 'Sales'].map((step, i) => (
                        <div key={step} className="flex items-center">
                          <span className="px-3 py-1.5 bg-[#C6A15B]/10 text-[#0F172A] rounded-lg font-medium">{step}</span>
                          {i < 5 && <ArrowRight className="w-4 h-4 mx-1 text-[#C6A15B]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Implementation Roadmap */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-xl font-heading font-medium text-[#0F172A] mb-4">
                  Digital Transformation Roadmap
                </h3>
                
                <div className="grid md:grid-cols-4 gap-4">
                  {auditData.roadmap.map((phase, i) => (
                    <div key={phase.phase} className="relative">
                      <div className="absolute -top-1 -left-1 w-8 h-8 bg-[#0F172A] text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {phase.phase}
                      </div>
                      <div className="pt-8 pl-6">
                        <h4 className="font-medium text-[#0F172A] mb-2">{phase.title}</h4>
                        <p className="text-xs text-slate-500 mb-2">{phase.timeline}</p>
                        <ul className="space-y-1">
                          {phase.items.slice(0, 2).map((item, j) => (
                            <li key={j} className="text-sm text-slate-600 flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* CONVERSATION VIEW */}
          {viewState === 'conversation' && auditData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-[#0F172A] to-[#1e293b] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-[#C6A15B]" />
                    <div>
                      <p className="font-medium">NORA - AI Business Consultant</p>
                      <p className="text-xs text-slate-400">Digital Transformation Expert</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewState('dashboard')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'nora' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'nora'
                          ? 'bg-white border border-slate-200 text-slate-700'
                          : 'bg-[#0F172A] text-white'
                      }`}>
                        {msg.role === 'nora' && (
                          <div className="flex items-center gap-2 mb-2 text-xs text-[#C6A15B]">
                            <Bot className="w-3 h-3" />
                            NORA
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={conversationInput}
                      onChange={(e) => setConversationInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask NORA about your audit..."
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-[#1e293b] transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['Tell me about my score', 'What should I do first?', 'Explain the recommendations'].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setConversationInput(q); }}
                        className="text-xs text-[#C6A15B] hover:underline"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* QUALIFICATION VIEW */}
          {viewState === 'qualification' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                <div className="text-center mb-6">
                  <Bot className="w-12 h-12 text-[#C6A15B] mx-auto mb-3" />
                  <h3 className="text-2xl font-heading font-medium text-[#0F172A] mb-2">
                    Let's personalize your recommendations
                  </h3>
                  <p className="text-slate-500">
                    Help us understand your business to provide tailored insights.
                  </p>
                </div>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={qualifiedLead.companyName}
                      onChange={(e) => setQualifiedLead({...qualifiedLead, companyName: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Industry *</label>
                      <select
                        value={qualifiedLead.industry}
                        onChange={(e) => setQualifiedLead({...qualifiedLead, industry: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                      >
                        <option value="">Select...</option>
                        <option value="technology">Technology</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="finance">Finance</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Team Size *</label>
                      <select
                        value={qualifiedLead.teamSize}
                        onChange={(e) => setQualifiedLead({...qualifiedLead, teamSize: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                      >
                        <option value="">Select...</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Primary Business Goal *</label>
                    <select
                      value={qualifiedLead.primaryGoal}
                      onChange={(e) => setQualifiedLead({...qualifiedLead, primaryGoal: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                    >
                      <option value="">Select...</option>
                      <option value="leads">Generate More Leads</option>
                      <option value="conversion">Improve Conversion Rate</option>
                      <option value="automation">Automate Processes</option>
                      <option value="ai">Adopt AI Solutions</option>
                      <option value="growth">Business Growth</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={qualifiedLead.name}
                      onChange={(e) => setQualifiedLead({...qualifiedLead, name: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      value={qualifiedLead.workEmail}
                      onChange={(e) => setQualifiedLead({...qualifiedLead, workEmail: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={qualifiedLead.phone}
                      onChange={(e) => setQualifiedLead({...qualifiedLead, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSubmitQualification}
                    className="w-full py-3 bg-[#C6A15B] text-white font-medium rounded-xl hover:bg-[#b8944d] transition-colors"
                  >
                    Get Personalized Recommendations
                  </button>
                </form>
              </div>
            </motion.div>
          )}
          
          {/* CONSULTATION VIEW */}
          {viewState === 'consultation' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-3xl p-12 text-white">
                <Calendar className="w-16 h-16 text-[#C6A15B] mx-auto mb-6" />
                <h2 className="text-3xl font-heading font-medium mb-4">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                  Based on your audit, I've identified several high-impact opportunities. 
                  Let's discuss how to implement them in a personalized strategy session.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <button className="px-8 py-4 bg-[#C6A15B] text-white font-medium rounded-xl hover:bg-[#b8944d] transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Book Strategy Session
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="px-8 py-4 border-2 border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download Your Audit
                  </button>
                </div>
                
                <div className="text-sm text-slate-400">
                  <p>Your audit will be saved. We'll send a confirmation to {qualifiedLead.workEmail || 'your email'}.</p>
                </div>
              </div>
              
              <button
                onClick={() => setViewState('dashboard')}
                className="mt-6 text-slate-500 hover:text-slate-700"
              >
                ← Back to Audit Results
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
