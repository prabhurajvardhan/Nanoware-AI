'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Globe,
  Bot,
  BarChart3,
  Lightbulb,
  Loader2,
  FileText
} from 'lucide-react';
import { downloadAuditPDF } from '@/components/audit/PDFDownload';
import type { AuditReport } from '@/lib/audit/types';

function generateMockAuditData(id: string): AuditReport {
  return {
    id,
    url: 'https://example-company.com',
    businessName: 'Example Company Inc.',
    industry: 'Technology Services',
    createdAt: new Date(),
    phases: {
      discovery: true, research: true, leadCapture: true, aiReadiness: true,
      customerJourney: true, opportunities: true, decisionMakers: true,
      scoring: true, roadmap: true, report: true,
    },
    businessInfo: {
      name: 'Example Company Inc.', industry: 'Technology Services',
      description: 'A technology services company.',
      locations: ['San Francisco, CA'], phone: '+1 (555) 123-4567',
      email: 'contact@example.com', socialMedia: {},
    },
    websiteAnalysis: {
      design: { score: 65, issues: [], strengths: ['Modern layout'] },
      responsive: { score: 70, isResponsive: true, mobileFriendly: true },
      loadingSpeed: { score: 52, timeInSeconds: 4.2, grade: 'D' as const },
      navigation: { score: 58, issues: [], menuDepth: 4, hasBreadcrumbs: false },
      brokenLinks: { score: 80, links: [] as { url: string; status: number }[] },
      forms: { count: 2, issues: [], hasValidation: true, hasProgressiveProfiling: false },
      chatWidget: { present: false, type: 'none' as const },
      newsletter: { present: true, embedded: true, popup: false },
      blog: { present: true, postCount: 12, freshness: 'Recent' },
      accessibility: { score: 48, issues: [], wcagLevel: 'None' as const },
      seo: { score: 68, issues: [], hasMetaTags: true, hasOpenGraph: true, hasSitemap: false, hasRobotsTxt: false },
      trustSignals: { score: 65, hasSSL: true, hasPrivacyPolicy: true, hasTermsOfService: true, hasTrustBadges: [], hasTestimonials: true },
    },
    leadCapture: {
      contactForm: { present: true, fields: ['name', 'email', 'message'], hasSpamProtection: true },
      phone: { present: true, clickToCall: true },
      whatsapp: { present: false },
      messenger: { present: false },
      booking: { present: false, type: 'none' as const },
      crm: { present: false },
      chatbot: { present: false, type: 'none' as const },
      emailCapture: { present: true, type: 'inline' as const },
      leadQualification: { level: 'basic' as const, criteria: ['Email'] },
      leadRouting: { present: false, type: 'unknown' as const },
      responseExperience: { score: 40, autoResponder: false, estimatedResponseTime: 'Unknown' },
    },
    aiReadiness: {
      aiChatbot: { present: false, features: [] },
      ruleBasedChatbot: { present: false, provider: undefined },
      liveChat: { present: false, provider: undefined },
      propertyRecommendation: { present: false, type: 'none' as const },
      bookingAI: { present: false, features: [] },
      voiceAI: { present: false, type: 'none' as const },
      leadQualificationAI: { present: false, features: [] },
      knowledgeBase: { present: false, searchable: false, articleCount: 0 },
      personalization: { present: false, basedOn: [] },
      customerMemory: { present: false, features: [] },
      overallScore: 20, maturityLevel: 'None' as const,
    },
    customerJourney: {
      steps: [
        { name: 'Landing', path: '/', friction: 'low' as const, issues: [], dropOffRisk: 'low' as const },
        { name: 'Browse', path: '/services', friction: 'medium' as const, issues: [], dropOffRisk: 'medium' as const },
        { name: 'Contact', path: '/contact', friction: 'medium' as const, issues: [], dropOffRisk: 'medium' as const },
        { name: 'Conversion', path: '/', friction: 'high' as const, issues: [], dropOffRisk: 'high' as const },
      ],
      overallFlow: {
        score: 55, deadEnds: [], brokenFlows: [], slowResponses: [], missingCTAs: [], unclearNavigation: [],
      },
    },
    opportunities: [
      {
        id: 'opp-1', category: 'lead-capture' as const,
        observation: 'No chatbot available.', businessImpact: 'Visitors cannot get answers.',
        recommendation: 'Deploy AI chatbot.', priority: 'High' as const,
        estimatedEffort: '1-2 weeks' as const, estimatedValue: 'High' as const,
        evidence: [], relatedScores: [],
      },
      {
        id: 'opp-2', category: 'ai-readiness' as const,
        observation: 'No AI features.', businessImpact: 'Limited automation.',
        recommendation: 'Implement AI chatbot.', priority: 'High' as const,
        estimatedEffort: '2-4 weeks' as const, estimatedValue: 'High' as const,
        evidence: [], relatedScores: [],
      },
      {
        id: 'opp-3', category: 'automation' as const,
        observation: 'Manual follow-up.', businessImpact: 'Slow responses.',
        recommendation: 'Automate lead nurturing.', priority: 'Medium' as const,
        estimatedEffort: '2-4 weeks' as const, estimatedValue: 'Medium' as const,
        evidence: [], relatedScores: [],
      },
    ],
    decisionMakers: [],
    websiteScore: {
      overall: 58, ux: 62, performance: 52, leadCapture: 45, automation: 30,
      aiReadiness: 20, seo: 68, content: 72, trust: 65, grade: 'D' as const,
      benchmarks: { industryAverage: 55, competitorAverage: 62, topPerformer: 85 },
    },
    opportunityScore: { critical: 0, high: 2, medium: 1, low: 0, total: 3 },
    executiveSummary: {
      overview: 'Example Company Inc. has significant opportunities in AI adoption and lead capture.',
      strengths: ['Modern design', 'Active blog'], weaknesses: ['No chatbot', 'Slow load times'],
      keyOpportunities: ['Deploy AI chatbot'], recommendedNextSteps: ['Schedule consultation'],
      riskFactors: ['Lost leads'],
    },
    roadmap: [
      { phase: 1, title: 'AI Chatbot', items: ['Deploy chatbot'], timeline: '2-3 weeks', priority: 'High' as const },
      { phase: 2, title: 'Automation', items: ['CRM integration'], timeline: '3-4 weeks', priority: 'High' as const },
    ],
    pricing: {
      implementation: { low: 8500, medium: 12500, high: 18000, currency: 'USD' },
      maintenance: { low: 500, medium: 800, high: 1200, currency: 'USD', period: 'monthly' as const },
      recommendedPlan: 'Growth', timeline: '8-12 weeks',
      includedFeatures: ['AI chatbot', 'CRM integration'],
    },
    shareableLink: `/audit/${id}`,
  };
}

function ScoreRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const getColor = (s: number) => s >= 70 ? '#22c55e' : s >= 50 ? '#C6A15B' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={getColor(score)} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-heading font-medium text-[#0F172A]">{score}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-[#C6A15B]' : 'bg-red-500';
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-[#0F172A]">{score}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [auditData, setAuditData] = useState<AuditReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'roadmap' | 'pricing'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const response = await fetch(`/api/audit?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setAuditData(data);
        } else {
          setAuditData(generateMockAuditData(id));
        }
      } catch {
        setAuditData(generateMockAuditData(id));
      } finally {
        setIsLoading(false);
      }
    }
    fetchAudit();
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C6A15B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading audit results...</p>
        </div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-medium text-[#0F172A] mb-2">Audit Not Found</h1>
          <Link href="/" className="text-[#C6A15B] hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Target },
    { id: 'analysis' as const, label: 'Analysis', icon: BarChart3 },
    { id: 'roadmap' as const, label: 'Roadmap', icon: Clock },
    { id: 'pricing' as const, label: 'Pricing', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-[#0F172A]">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg">
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={handleDownloadPDF} disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#0F172A] text-white hover:bg-[#1e293b] rounded-lg disabled:opacity-50">
              {isDownloading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><FileText className="w-4 h-4" />Download PDF</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">Audit Complete</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-medium text-[#0F172A] mb-2">AI Growth Opportunity Audit</h1>
          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-2"><Globe className="w-4 h-4" /><span>{auditData.url}</span></div>
            <span>•</span><span>{auditData.businessName}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex flex-col items-center">
              <ScoreRing score={auditData.websiteScore.overall} size={160} strokeWidth={10} />
              <p className="mt-4 text-lg font-medium text-[#0F172A]">Overall Score</p>
              <p className="text-slate-500">Grade {auditData.websiteScore.grade}</p>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
              <ScoreBar label="UX" score={auditData.websiteScore.ux} />
              <ScoreBar label="Performance" score={auditData.websiteScore.performance} />
              <ScoreBar label="Lead Capture" score={auditData.websiteScore.leadCapture} />
              <ScoreBar label="AI Readiness" score={auditData.websiteScore.aiReadiness} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 border-b border-slate-200">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === tab.id ? 'border-[#C6A15B] text-[#C6A15B]' : 'border-transparent text-slate-500 hover:text-[#0F172A]'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6">Executive Summary</h2>
              <p className="text-slate-600 leading-relaxed mb-8">{auditData.executiveSummary.overview}</p>
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-100">
                <div>
                  <h3 className="font-medium text-green-600 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5" />Strengths</h3>
                  <ul className="space-y-2">
                    {auditData.executiveSummary.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-green-500 mt-1">•</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-amber-600 mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" />Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {auditData.executiveSummary.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-amber-500 mt-1">•</span>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-[#0F172A] rounded-2xl p-6 text-white">
              <h3 className="font-medium mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-[#C6A15B]" />Quick Win</h3>
              <p className="text-sm text-slate-300 mb-4">{auditData.opportunities[0]?.observation}</p>
              <span className="inline-flex items-center text-xs bg-[#C6A15B] text-white px-3 py-1 rounded-full">{auditData.opportunities[0]?.priority} Priority</span>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6 flex items-center gap-3"><Bot className="w-6 h-6 text-[#C6A15B]" />AI Readiness</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'AI Chatbot', present: auditData.aiReadiness.aiChatbot.present },
                  { label: 'Knowledge Base', present: auditData.aiReadiness.knowledgeBase.present },
                  { label: 'CRM', present: auditData.leadCapture.crm.present },
                  { label: 'Automation', present: auditData.leadCapture.leadRouting.present },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl flex items-center gap-3 ${item.present ? 'bg-green-50' : 'bg-slate-50'}`}>
                    {item.present ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-slate-300" />}
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{item.label}</p>
                      <p className={`text-xs ${item.present ? 'text-green-600' : 'text-slate-400'}`}>{item.present ? 'Present' : 'Missing'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6 flex items-center gap-3"><Target className="w-6 h-6 text-[#C6A15B]" />Growth Opportunities</h2>
              <div className="space-y-4">
                {auditData.opportunities.map((opp) => (
                  <div key={opp.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        opp.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        opp.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>{opp.priority}</span>
                    </div>
                    <p className="text-sm text-slate-600">{opp.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6">Implementation Roadmap</h2>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-8">
                {auditData.roadmap.map((phase) => (
                  <div key={phase.phase} className="relative flex gap-6">
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#0F172A] text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs opacity-60">Phase</span>
                      <span className="text-xl font-bold">{phase.phase}</span>
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-[#0F172A]">{phase.title}</h3>
                        <span className="text-sm text-slate-500">{phase.timeline}</span>
                      </div>
                      <ul className="space-y-2">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                            <div className="w-2 h-2 rounded-full bg-[#C6A15B]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6">Personalized Investment Plan</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Implementation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-600">Entry</span><span className="font-medium">${auditData.pricing.implementation.low.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Standard</span><span className="font-medium">${auditData.pricing.implementation.medium.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Premium</span><span className="font-medium">${auditData.pricing.implementation.high.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Monthly Maintenance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-600">Basic</span><span className="font-medium">${auditData.pricing.maintenance.low}/mo</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Standard</span><span className="font-medium">${auditData.pricing.maintenance.medium}/mo</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Premium</span><span className="font-medium">${auditData.pricing.maintenance.high}/mo</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-[#0F172A] rounded-xl text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Recommended Plan</h3>
                  <span className="text-[#C6A15B]">{auditData.pricing.recommendedPlan}</span>
                </div>
                <p className="text-sm text-slate-400">Timeline: {auditData.pricing.timeline}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-[#0F172A] rounded-2xl p-8 text-white">
                <h3 className="font-medium mb-4">What&apos;s Included</h3>
                <ul className="space-y-3">
                  {auditData.pricing.includedFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm"><CheckCircle className="w-5 h-5 text-[#C6A15B]" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <h3 className="font-medium text-[#0F172A] mb-4">Ready to Start?</h3>
                <Link href="/contact" className="block w-full text-center bg-[#0F172A] text-white py-3 rounded-xl font-medium hover:bg-[#1e293b]">Schedule Consultation</Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
