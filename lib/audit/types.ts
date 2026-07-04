// Audit Engine Types

export interface AuditRequest {
  url: string;
  email?: string;
}

export interface AuditProgress {
  phase: number;
  phaseName: string;
  progress: number;
  message: string;
}

export interface BusinessInfo {
  name: string;
  industry: string;
  description: string;
  locations: string[];
  phone: string;
  email: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  googleMaps?: string;
}

export interface WebsiteAnalysis {
  design: {
    score: number;
    issues: string[];
    strengths: string[];
  };
  responsive: {
    score: number;
    isResponsive: boolean;
    mobileFriendly: boolean;
  };
  loadingSpeed: {
    score: number;
    timeInSeconds: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  navigation: {
    score: number;
    issues: string[];
    menuDepth: number;
    hasBreadcrumbs: boolean;
  };
  brokenLinks: {
    score: number;
    links: Array<{
      url: string;
      status: number;
    }>;
  };
  forms: {
    count: number;
    issues: string[];
    hasValidation: boolean;
    hasProgressiveProfiling: boolean;
  };
  chatWidget: {
    present: boolean;
    type: 'ai' | 'rule-based' | 'live' | 'none';
    provider?: string;
  };
  newsletter: {
    present: boolean;
    embedded: boolean;
    popup: boolean;
  };
  blog: {
    present: boolean;
    postCount: number;
    freshness: string;
  };
  accessibility: {
    score: number;
    issues: string[];
    wcagLevel: 'A' | 'AA' | 'AAA' | 'None';
  };
  seo: {
    score: number;
    issues: string[];
    hasMetaTags: boolean;
    hasOpenGraph: boolean;
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
  };
  trustSignals: {
    score: number;
    hasSSL: boolean;
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    hasTrustBadges: string[];
    hasTestimonials: boolean;
  };
}

export interface LeadCaptureAnalysis {
  contactForm: {
    present: boolean;
    fields: string[];
    hasSpamProtection: boolean;
  };
  phone: {
    present: boolean;
    clickToCall: boolean;
  };
  whatsapp: {
    present: boolean;
    number?: string;
  };
  messenger: {
    present: boolean;
  };
  booking: {
    present: boolean;
    type: 'inline' | 'external' | 'none';
  };
  crm: {
    present: boolean;
    name?: string;
  };
  chatbot: {
    present: boolean;
    type: 'ai' | 'rule-based' | 'none';
  };
  emailCapture: {
    present: boolean;
    type: 'inline' | 'popup' | 'exit-intent' | 'none';
  };
  leadQualification: {
    level: 'none' | 'basic' | 'advanced';
    criteria: string[];
  };
  leadRouting: {
    present: boolean;
    type: 'manual' | 'automated' | 'unknown';
  };
  responseExperience: {
    score: number;
    autoResponder: boolean;
    estimatedResponseTime: string;
  };
}

export interface AIReadinessAssessment {
  aiChatbot: {
    present: boolean;
    provider?: string;
    features: string[];
  };
  ruleBasedChatbot: {
    present: boolean;
    provider?: string;
  };
  liveChat: {
    present: boolean;
    provider?: string;
  };
  propertyRecommendation: {
    present: boolean;
    type: 'rule-based' | 'ai' | 'none';
  };
  bookingAI: {
    present: boolean;
    features: string[];
  };
  voiceAI: {
    present: boolean;
    type: 'ivr' | 'voicebot' | 'none';
  };
  leadQualificationAI: {
    present: boolean;
    features: string[];
  };
  knowledgeBase: {
    present: boolean;
    searchable: boolean;
    articleCount?: number;
  };
  personalization: {
    present: boolean;
    basedOn: string[];
  };
  customerMemory: {
    present: boolean;
    features: string[];
  };
  overallScore: number;
  maturityLevel: 'None' | 'Basic' | 'Intermediate' | 'Advanced' | 'AI-First';
}

export interface Opportunity {
  id: string;
  category: 'lead-capture' | 'ai-readiness' | 'automation' | 'ux' | 'seo' | 'performance' | 'trust';
  observation: string;
  businessImpact: string;
  recommendation: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedEffort: '1-2 days' | '3-5 days' | '1-2 weeks' | '2-4 weeks' | '1-2 months';
  estimatedValue: 'Low' | 'Medium' | 'High' | 'Critical';
  evidence: string[];
  relatedScores: string[];
}

export interface CustomerJourneyAnalysis {
  steps: Array<{
    name: string;
    path: string;
    friction: 'low' | 'medium' | 'high';
    issues: string[];
    dropOffRisk: 'low' | 'medium' | 'high';
  }>;
  overallFlow: {
    score: number;
    deadEnds: string[];
    brokenFlows: string[];
    slowResponses: string[];
    missingCTAs: string[];
    unclearNavigation: string[];
  };
}

// Helper type for customer journey steps
export type CustomerJourneyStep = {
  name: string;
  path: string;
  friction: 'low' | 'medium' | 'high';
  issues: string[];
  dropOffRisk: 'low' | 'medium' | 'high';
};

export interface DecisionMaker {
  name: string;
  position: string;
  linkedIn?: string;
  email?: string;
  confidence: number;
  source: 'about' | 'team' | 'linkedin' | 'inferred';
}

export interface WebsiteScore {
  overall: number;
  ux: number;
  performance: number;
  leadCapture: number;
  automation: number;
  aiReadiness: number;
  seo: number;
  content: number;
  trust: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  benchmarks: {
    industryAverage: number;
    competitorAverage: number;
    topPerformer: number;
  };
}

export interface OpportunityScore {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  items: string[];
  timeline: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface PricingEstimate {
  implementation: {
    low: number;
    medium: number;
    high: number;
    currency: string;
  };
  maintenance: {
    low: number;
    medium: number;
    high: number;
    currency: string;
    period: 'monthly' | 'quarterly' | 'annually';
  };
  recommendedPlan: string;
  timeline: string;
  includedFeatures: string[];
}

export interface ExecutiveSummary {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  keyOpportunities: string[];
  recommendedNextSteps: string[];
  riskFactors: string[];
}

export interface AuditReport {
  id: string;
  url: string;
  businessName: string;
  industry: string;
  createdAt: Date;
  phases: {
    discovery: boolean;
    research: boolean;
    leadCapture: boolean;
    aiReadiness: boolean;
    customerJourney: boolean;
    opportunities: boolean;
    decisionMakers: boolean;
    scoring: boolean;
    roadmap: boolean;
    report: boolean;
  };
  businessInfo: BusinessInfo;
  websiteAnalysis: WebsiteAnalysis;
  leadCapture: LeadCaptureAnalysis;
  aiReadiness: AIReadinessAssessment;
  customerJourney: CustomerJourneyAnalysis;
  opportunities: Opportunity[];
  decisionMakers: DecisionMaker[];
  websiteScore: WebsiteScore;
  opportunityScore: OpportunityScore;
  executiveSummary: ExecutiveSummary;
  roadmap: RoadmapPhase[];
  pricing: PricingEstimate;
  shareableLink: string;
}

export type AuditPhase = 
  | 'queued'
  | 'discovery'
  | 'research'
  | 'lead-capture'
  | 'ai-readiness'
  | 'customer-journey'
  | 'opportunities'
  | 'decision-makers'
  | 'scoring'
  | 'report'
  | 'complete'
  | 'failed';
