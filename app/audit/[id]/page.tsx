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
  Zap,
  Target,
  Clock,
  ChevronRight,
  Globe,
  Phone,
  Mail,
  Users,
  MessageSquare,
  Bot,
  BarChart3,
  Search,
  Shield,
  Lightbulb
} from 'lucide-react';

// Mock audit data structure
interface AuditData {
  id: string;
  url: string;
  businessName: string;
  industry: string;
  location: string;
  phone: string;
  email: string;
  discoveredAt: Date;
  scores: {
    overall: number;
    ux: number;
    performance: number;
    leadCapture: number;
    automation: number;
    aiReadiness: number;
    seo: number;
    content: number;
    trust: number;
  };
  phases: {
    phase1: boolean;
    phase2: boolean;
    phase3: boolean;
    phase4: boolean;
    phase5: boolean;
    phase6: boolean;
    phase7: boolean;
    phase8: boolean;
    phase9: boolean;
    phase10: boolean;
  };
  websiteAnalysis: {
    design: { score: number; issues: string[] };
    responsive: boolean;
    loadingSpeed: { score: number; time: string };
    navigation: { score: number; issues: string[] };
    brokenLinks: string[];
    forms: { count: number; issues: string[] };
    chatWidget: boolean;
    newsletter: boolean;
    blog: boolean;
    accessibility: { score: number; issues: string[] };
  };
  leadCapture: {
    contactForm: boolean;
    phone: boolean;
    whatsapp: boolean;
    messenger: boolean;
    booking: boolean;
    crm: boolean;
    chatbot: boolean;
    emailCapture: boolean;
    leadQualification: string;
    leadRouting: string;
  };
  aiReadiness: {
    aiChatbot: boolean;
    ruleBasedChatbot: boolean;
    liveChat: boolean;
    propertyRecommendation: boolean;
    bookingAI: boolean;
    voiceAI: boolean;
    leadQualificationAI: boolean;
    knowledgeBase: boolean;
    personalization: boolean;
    customerMemory: boolean;
  };
  opportunities: Array<{
    id: string;
    category: string;
    observation: string;
    businessImpact: string;
    recommendation: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    estimatedEffort: string;
    estimatedValue: string;
    evidence: string[];
  }>;
  decisionMakers: Array<{
    name: string;
    position: string;
    linkedIn: string;
    email: string;
    confidence: number;
  }>;
  roadmap: Array<{
    phase: number;
    title: string;
    items: string[];
    timeline: string;
  }>;
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  pricing: {
    implementation: { low: number; medium: number; high: number };
    maintenance: { low: number; medium: number; high: number };
    recommendedPlan: string;
    timeline: string;
  };
}

// Generate mock audit data
function generateMockAuditData(id: string): AuditData {
  return {
    id,
    url: 'https://example-company.com',
    businessName: 'Example Company Inc.',
    industry: 'Technology Services',
    location: 'San Francisco, CA',
    phone: '+1 (555) 123-4567',
    email: 'contact@example-company.com',
    discoveredAt: new Date(),
    scores: {
      overall: 58,
      ux: 62,
      performance: 55,
      leadCapture: 45,
      automation: 30,
      aiReadiness: 25,
      seo: 68,
      content: 72,
      trust: 65,
    },
    phases: {
      phase1: true,
      phase2: true,
      phase3: true,
      phase4: true,
      phase5: true,
      phase6: true,
      phase7: true,
      phase8: true,
      phase9: true,
      phase10: true,
    },
    websiteAnalysis: {
      design: { 
        score: 65, 
        issues: ['Inconsistent color scheme', 'Small touch targets on mobile'] 
      },
      responsive: true,
      loadingSpeed: { score: 52, time: '4.2s' },
      navigation: { 
        score: 58, 
        issues: ['Deep nesting in menu', 'Missing breadcrumb navigation'] 
      },
      brokenLinks: ['/old-products', '/team-2023', '/legacy'],
      forms: { 
        count: 2, 
        issues: ['Contact form lacks validation feedback', 'Missing progressive profiling'] 
      },
      chatWidget: false,
      newsletter: true,
      blog: true,
      accessibility: { 
        score: 48, 
        issues: ['Low contrast text', 'Missing alt tags', 'No skip links'] 
      },
    },
    leadCapture: {
      contactForm: true,
      phone: true,
      whatsapp: false,
      messenger: false,
      booking: false,
      crm: false,
      chatbot: false,
      emailCapture: true,
      leadQualification: 'Basic form fields only',
      leadRouting: 'Unknown - no visible CRM integration',
    },
    aiReadiness: {
      aiChatbot: false,
      ruleBasedChatbot: false,
      liveChat: false,
      propertyRecommendation: false,
      bookingAI: false,
      voiceAI: false,
      leadQualificationAI: false,
      knowledgeBase: false,
      personalization: false,
      customerMemory: false,
    },
    opportunities: [
      {
        id: 'opp-1',
        category: 'Lead Capture',
        observation: 'Contact form submissions are not followed up within 24 hours.',
        businessImpact: 'Potential leads abandoning after initial contact due to slow response times.',
        recommendation: 'Implement AI-powered lead response system with instant acknowledgment and qualification.',
        priority: 'Critical',
        estimatedEffort: '2-3 weeks',
        estimatedValue: 'High',
        evidence: [
          'Form submission test resulted in 48-hour response delay',
          'No automated acknowledgment email sent',
        ],
      },
      {
        id: 'opp-2',
        category: 'AI Readiness',
        observation: 'No chatbot or instant messaging capability on the website.',
        businessImpact: 'Visitors cannot get instant answers outside business hours, leading to missed opportunities.',
        recommendation: 'Deploy AI Property Advisor chatbot for 24/7 lead engagement.',
        priority: 'High',
        estimatedEffort: '1-2 weeks',
        estimatedValue: 'High',
        evidence: [
          'No chat widget detected during testing',
          'Contact page only shows email and phone',
        ],
      },
      {
        id: 'opp-3',
        category: 'Automation',
        observation: 'Lead data is manually entered into spreadsheets.',
        businessImpact: 'High risk of data entry errors and slow follow-up processes.',
        recommendation: 'Implement CRM integration with automated lead capture and routing.',
        priority: 'High',
        estimatedEffort: '3-4 weeks',
        estimatedValue: 'Medium',
        evidence: [
          'No CRM detected on website',
          'Contact form redirects to generic email',
        ],
      },
      {
        id: 'opp-4',
        category: 'UX',
        observation: 'Mobile navigation requires excessive scrolling and tapping.',
        businessImpact: 'Frustrated mobile users may leave before converting.',
        recommendation: 'Implement sticky navigation with hamburger menu for mobile.',
        priority: 'Medium',
        estimatedEffort: '3-5 days',
        estimatedValue: 'Medium',
        evidence: [
          'Mobile navigation requires 5+ taps to reach key pages',
          'Menu items are too small for comfortable tapping',
        ],
      },
    ],
    decisionMakers: [
      {
        name: 'Sarah Chen',
        position: 'CEO & Founder',
        linkedIn: 'https://linkedin.com/in/sarahchen',
        email: 'sarah@example-company.com',
        confidence: 85,
      },
      {
        name: 'Michael Roberts',
        position: 'Managing Director',
        linkedIn: 'https://linkedin.com/in/michaelroberts',
        email: 'michael@example-company.com',
        confidence: 72,
      },
    ],
    roadmap: [
      {
        phase: 1,
        title: 'Critical UX Issues',
        items: ['Fix accessibility issues', 'Improve mobile navigation', 'Add loading speed optimizations'],
        timeline: '2-3 weeks',
      },
      {
        phase: 2,
        title: 'AI Property Advisor',
        items: ['Deploy AI chatbot', 'Set up knowledge base', 'Configure 24/7 automated responses'],
        timeline: '2-3 weeks',
      },
      {
        phase: 3,
        title: 'Automation Layer',
        items: ['CRM integration', 'Lead scoring system', 'Automated follow-up sequences'],
        timeline: '3-4 weeks',
      },
      {
        phase: 4,
        title: 'Analytics & Optimization',
        items: ['Implement conversion tracking', 'Set up A/B testing', 'Create reporting dashboard'],
        timeline: '2 weeks',
      },
    ],
    executiveSummary: `This AI-powered audit of Example Company Inc.'s digital presence reveals significant opportunities for improvement in lead capture and AI adoption. While the website demonstrates solid content quality and modern design elements, critical gaps in conversion optimization and automation leave potential revenue unrealized.

The most pressing concern is the absence of instant engagement capabilities. With zero chatbot or live chat functionality, the company risks losing 40-60% of potential leads who visit outside business hours. Additionally, the current manual lead management process introduces significant friction and delays that could be eliminated through strategic automation.

Our analysis indicates that implementing AI-powered lead engagement and automated follow-up systems could potentially increase conversion rates by 25-35% while reducing response times from days to seconds.`,
    strengths: [
      'Modern, visually appealing design with consistent brand identity',
      'Well-structured content with clear value proposition',
      'Active blog with fresh, relevant content',
      'SSL certificate properly implemented',
      'Mobile-responsive layout',
    ],
    weaknesses: [
      'No instant messaging or chatbot capability',
      'Slow page load times affecting user experience',
      'Manual lead management without CRM integration',
      'Accessibility issues limiting audience reach',
      'No automated follow-up or lead nurturing sequences',
    ],
    pricing: {
      implementation: { low: 8500, medium: 12500, high: 18000 },
      maintenance: { low: 500, medium: 800, high: 1200 },
      recommendedPlan: 'Growth Package',
      timeline: '8-12 weeks',
    },
  };
}

function ScoreRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#C6A15B';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-heading font-medium text-[#0F172A]">{score}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-[#C6A15B]';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-[#0F172A]">{score}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'roadmap' | 'pricing'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setAuditData(generateMockAuditData(id));
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [id]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
          <p className="text-slate-500 mb-6">The requested audit could not be found.</p>
          <Link href="/" className="text-[#C6A15B] hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'roadmap', label: 'Roadmap', icon: Clock },
    { id: 'pricing', label: 'Pricing', icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-[#0F172A] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#0F172A] text-white hover:bg-[#1e293b] rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                  Audit Complete
                </span>
                <span className="text-slate-400 text-sm">
                  Generated {auditData.discoveredAt.toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-medium text-[#0F172A] mb-2">
                AI Growth Opportunity Audit
              </h1>
              <div className="flex items-center gap-4 text-slate-500">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{auditData.url}</span>
                </div>
                <span>•</span>
                <span>{auditData.businessName}</span>
                <span>•</span>
                <span>{auditData.industry}</span>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex flex-col items-center">
                <ScoreRing score={auditData.scores.overall} size={160} strokeWidth={10} />
                <p className="mt-4 text-lg font-medium text-[#0F172A]">Overall Score</p>
                <p className="text-slate-500">Website Health Index</p>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                <ScoreBar label="UX" score={auditData.scores.ux} />
                <ScoreBar label="Performance" score={auditData.scores.performance} />
                <ScoreBar label="Lead Capture" score={auditData.scores.leadCapture} />
                <ScoreBar label="AI Readiness" score={auditData.scores.aiReadiness} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#C6A15B] text-[#C6A15B]'
                  : 'border-transparent text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Executive Summary */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6">Executive Summary</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {auditData.executiveSummary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
                <div>
                  <h3 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {auditData.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-amber-600 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {auditData.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-medium text-[#0F172A] mb-4">Business Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Business</dt>
                    <dd className="font-medium">{auditData.businessName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Industry</dt>
                    <dd className="font-medium">{auditData.industry}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="font-medium">{auditData.location}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-medium">{auditData.phone}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-medium text-[#0F172A] mb-4">Decision Makers Found</h3>
                <div className="space-y-4">
                  {auditData.decisionMakers.map((dm, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">{dm.name}</p>
                        <p className="text-sm text-slate-500">{dm.position}</p>
                        <p className="text-xs text-slate-400 mt-1">{dm.confidence}% confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F172A] rounded-2xl p-6 text-white">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#C6A15B]" />
                  Quick Win
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  {auditData.opportunities[0]?.observation}
                </p>
                <span className="inline-flex items-center text-xs bg-[#C6A15B] text-white px-3 py-1 rounded-full">
                  {auditData.opportunities[0]?.priority} Priority
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Website Analysis */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6 flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#C6A15B]" />
                Website Analysis
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${auditData.websiteAnalysis.responsive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-slate-600">Responsive Design</span>
                  </div>
                  <span className={auditData.websiteAnalysis.responsive ? 'text-green-600' : 'text-red-600'}>
                    {auditData.websiteAnalysis.responsive ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600">Loading Speed</span>
                  </div>
                  <span className="font-medium">{auditData.websiteAnalysis.loadingSpeed.time}</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Issues Found</h4>
                  {auditData.websiteAnalysis.design.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{issue}</span>
                    </div>
                  ))}
                </div>

                {auditData.websiteAnalysis.brokenLinks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-red-500 uppercase tracking-wider">Broken Links</h4>
                    {auditData.websiteAnalysis.brokenLinks.map((link, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{link}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lead Capture */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6 flex items-center gap-3">
                <Target className="w-6 h-6 text-[#C6A15B]" />
                Lead Capture Analysis
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Contact Form', value: auditData.leadCapture.contactForm, icon: Mail },
                  { label: 'Phone', value: auditData.leadCapture.phone, icon: Phone },
                  { label: 'WhatsApp', value: auditData.leadCapture.whatsapp, icon: MessageSquare },
                  { label: 'Chatbot', value: auditData.leadCapture.chatbot, icon: Bot },
                  { label: 'Email Capture', value: auditData.leadCapture.emailCapture, icon: Mail },
                  { label: 'CRM', value: auditData.leadCapture.crm, icon: BarChart3 },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl flex items-center gap-3 ${
                    item.value ? 'bg-green-50' : 'bg-slate-50'
                  }`}>
                    <item.icon className={`w-5 h-5 ${item.value ? 'text-green-500' : 'text-slate-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{item.label}</p>
                      <p className={`text-xs ${item.value ? 'text-green-600' : 'text-slate-400'}`}>
                        {item.value ? 'Present' : 'Missing'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-2">Lead Routing</p>
                <p className="text-sm font-medium text-[#0F172A]">{auditData.leadCapture.leadRouting}</p>
              </div>
            </div>

            {/* AI Readiness */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-[#C6A15B]" />
                AI Readiness Assessment
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'AI Chatbot', value: auditData.aiReadiness.aiChatbot },
                  { label: 'Rule-based Bot', value: auditData.aiReadiness.ruleBasedChatbot },
                  { label: 'Live Chat', value: auditData.aiReadiness.liveChat },
                  { label: 'Lead Qual. AI', value: auditData.aiReadiness.leadQualificationAI },
                  { label: 'Knowledge Base', value: auditData.aiReadiness.knowledgeBase },
                  { label: 'Personalization', value: auditData.aiReadiness.personalization },
                  { label: 'Customer Memory', value: auditData.aiReadiness.customerMemory },
                  { label: 'Booking AI', value: auditData.aiReadiness.bookingAI },
                  { label: 'Voice AI', value: auditData.aiReadiness.voiceAI },
                  { label: 'Property Rec. AI', value: auditData.aiReadiness.propertyRecommendation },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl text-center ${
                    item.value ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      item.value ? 'bg-green-100' : 'bg-slate-200'
                    }`}>
                      {item.value ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <p className={`text-xs font-medium ${item.value ? 'text-green-700' : 'text-slate-500'}`}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6 flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-[#C6A15B]" />
                Growth Opportunities
              </h2>
              <div className="space-y-6">
                {auditData.opportunities.map((opp, i) => (
                  <div key={opp.id} className="border border-slate-200 rounded-xl p-6 hover:border-[#C6A15B]/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded mb-2 ${
                          opp.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          opp.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {opp.priority}
                        </span>
                        <h3 className="font-medium text-[#0F172A]">{opp.category}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Observation</p>
                        <p className="text-sm text-[#0F172A]">{opp.observation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Business Impact</p>
                        <p className="text-sm text-[#0F172A]">{opp.businessImpact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Recommendation</p>
                        <p className="text-sm font-medium text-[#C6A15B]">{opp.recommendation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Effort: {opp.estimatedEffort}</span>
                      <span className="text-xs text-slate-500">Value: {opp.estimatedValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6">Implementation Roadmap</h2>
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-8">
                  {auditData.roadmap.map((phase, i) => (
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
                          {phase.items.map((item, j) => (
                            <li key={j} className="flex items-center gap-3 text-sm text-slate-600">
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
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-heading font-medium text-[#0F172A] mb-6">Personalized Investment Plan</h2>
              <p className="text-slate-500 mb-8">
                Based on your business size, industry, and specific requirements, we recommend the {auditData.pricing.recommendedPlan}.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">One-Time Implementation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Entry</span>
                      <span className="font-medium">${auditData.pricing.implementation.low.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Standard</span>
                      <span className="font-medium">${auditData.pricing.implementation.medium.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Premium</span>
                      <span className="font-medium">${auditData.pricing.implementation.high.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Monthly Maintenance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic</span>
                      <span className="font-medium">${auditData.pricing.maintenance.low}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Standard</span>
                      <span className="font-medium">${auditData.pricing.maintenance.medium}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Premium</span>
                      <span className="font-medium">${auditData.pricing.maintenance.high}/mo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-[#0F172A] rounded-xl text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Estimated Timeline</h3>
                  <span className="text-[#C6A15B]">{auditData.pricing.timeline}</span>
                </div>
                <p className="text-sm text-slate-400">
                  Final pricing depends on your specific requirements, existing systems, and chosen implementation approach.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0F172A] rounded-2xl p-8 text-white">
                <h3 className="font-medium mb-4">What&apos;s Included</h3>
                <ul className="space-y-3">
                  {[
                    'Custom AI chatbot development',
                    'CRM integration & automation',
                    'Performance optimization',
                    'Mobile-responsive enhancements',
                    'Ongoing maintenance & support',
                    'Monthly reporting & analytics',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-[#C6A15B]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <h3 className="font-medium text-[#0F172A] mb-4">Ready to Start?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Schedule a free consultation to discuss your specific needs and get a detailed proposal.
                </p>
                <Link 
                  href="/contact"
                  className="block w-full text-center bg-[#0F172A] text-white py-3 rounded-xl font-medium hover:bg-[#1e293b] transition-colors"
                >
                  Schedule Consultation
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
