// Lead Capture and AI Readiness Analyzer

import { 
  LeadCaptureAnalysis, 
  AIReadinessAssessment,
  Opportunity,
  CustomerJourneyAnalysis,
  WebsiteScore,
  OpportunityScore,
  ExecutiveSummary,
  RoadmapPhase,
  PricingEstimate,
  BusinessInfo,
  WebsiteAnalysis,
} from './types';

interface ParsedWebsiteData {
  html: string;
  scripts: string[];
  links: string[];
}

// Analyze lead capture capabilities
export function analyzeLeadCapture(
  websiteAnalysis: WebsiteAnalysis,
  businessInfo: BusinessInfo,
  parsedData?: ParsedWebsiteData
): LeadCaptureAnalysis {
  const { forms, chatWidget, newsletter } = websiteAnalysis;
  
  // Contact form analysis
  const hasContactForm = forms.count > 0;
  const formFields = forms.count > 0 ? 
    websiteAnalysis.forms.issues.length === 0 ? ['name', 'email', 'message'] : ['email'] : [];
  
  // CRM detection (simplified) - check chatWidget provider
  const crmProviders = ['hubspot', 'salesforce', 'pipedrive', 'zoho'];
  const crmPresent = crmProviders.some(p => 
    chatWidget.provider?.toLowerCase().includes(p)
  ) || false;

  // WhatsApp detection
  const hasWhatsApp = businessInfo.phone?.includes('whatsapp') || 
                      parsedData?.html.includes('whatsapp') || 
                      false;

  // Booking system detection
  const hasBooking = parsedData?.html.includes('booking') || 
                     parsedData?.html.includes('reserve') ||
                     parsedData?.html.includes('appointment') ||
                     false;

  // Lead qualification level
  let leadQualLevel: 'none' | 'basic' | 'advanced' = 'none';
  const qualificationCriteria: string[] = [];
  
  if (forms.count > 0) {
    leadQualLevel = 'basic';
    qualificationCriteria.push('Email collection');
    
    if (forms.count > 1) {
      leadQualLevel = 'advanced';
      qualificationCriteria.push('Multiple form touchpoints');
    }
  }

  // Response experience score
  let responseScore = 30;
  let responseTime = 'Unknown';
  const hasAutoResponder = parsedData?.html.includes('auto-reply') || 
                           parsedData?.html.includes('thank you for') ||
                           false;
  
  if (hasAutoResponder) {
    responseScore = 60;
    responseTime = 'Within hours';
  }
  
  if (chatWidget.present) {
    responseScore = 80;
    responseTime = 'Instant';
  }

  return {
    contactForm: {
      present: hasContactForm,
      fields: formFields,
      hasSpamProtection: !forms.issues.some(i => i.includes('spam')),
    },
    phone: {
      present: !!businessInfo.phone,
      clickToCall: parsedData?.html.includes('tel:') || false,
    },
    whatsapp: {
      present: hasWhatsApp,
      number: hasWhatsApp ? businessInfo.phone : undefined,
    },
    messenger: {
      present: parsedData?.html.includes('messenger') || 
               parsedData?.links?.some(l => l.includes('m.me')) || 
               false,
    },
    booking: {
      present: hasBooking,
      type: hasBooking ? 'external' : 'none',
    },
    crm: {
      present: crmPresent,
    },
    chatbot: {
      present: chatWidget.present,
      type: chatWidget.type === 'ai' ? 'ai' : chatWidget.present ? 'rule-based' : 'none',
    },
    emailCapture: {
      present: newsletter.present,
      type: newsletter.popup ? 'popup' : newsletter.embedded ? 'inline' : 'none',
    },
    leadQualification: {
      level: leadQualLevel,
      criteria: qualificationCriteria,
    },
    leadRouting: {
      present: crmPresent,
      type: crmPresent ? 'automated' : 'unknown',
    },
    responseExperience: {
      score: responseScore,
      autoResponder: hasAutoResponder,
      estimatedResponseTime: responseTime,
    },
  };
}

// Analyze AI readiness
export function analyzeAIReadiness(
  websiteAnalysis: WebsiteAnalysis,
  leadCapture: LeadCaptureAnalysis,
  businessInfo?: BusinessInfo,
  parsedData?: ParsedWebsiteData
): AIReadinessAssessment {
  const features: Record<string, boolean> = {
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
  };
  
  const providers: Record<string, string | undefined> = {};
  
  // Check chat widget type
  if (websiteAnalysis.chatWidget.type === 'ai') {
    features.aiChatbot = true;
    providers.aiChatbot = websiteAnalysis.chatWidget.provider;
  } else if (websiteAnalysis.chatWidget.present) {
    features.ruleBasedChatbot = true;
    providers.ruleBasedChatbot = websiteAnalysis.chatWidget.provider;
  }
  
  // Live chat detection
  const liveChatProviders = ['intercom', 'zendesk', 'drift', 'olark', 'livechat'];
  if (parsedData?.scripts?.some(s => 
    liveChatProviders.some(p => s.toLowerCase().includes(p))
  )) {
    features.liveChat = true;
    providers.liveChat = 'Detected';
  }
  
  // Booking AI
  if (leadCapture.booking.present) {
    features.bookingAI = true;
  }
  
  // Voice AI (IVR detection)
  if (parsedData?.html.includes('tel:') || businessInfo?.phone) {
    features.voiceAI = true;
  }
  
  // Knowledge base
  const hasKnowledgeBase = parsedData?.html.includes('help center') || 
                           parsedData?.html.includes('knowledge base') ||
                           parsedData?.html.includes('faq') ||
                           parsedData?.html.includes('/docs') ||
                           false;
  features.knowledgeBase = hasKnowledgeBase;
  
  // Personalization (basic indicators)
  const personalizationIndicators = ['recently viewed', 'recommended for you', 'based on your'];
  if (personalizationIndicators.some(p => 
    parsedData?.html?.toLowerCase().includes(p)
  )) {
    features.personalization = true;
  }
  
  // CRM = some level of customer memory
  if (leadCapture.crm.present) {
    features.customerMemory = true;
  }

  // Calculate overall AI score
  const aiFeaturesCount = Object.values(features).filter(Boolean).length;
  const overallScore = Math.round((aiFeaturesCount / 10) * 100);
  
  // Determine maturity level
  let maturityLevel: AIReadinessAssessment['maturityLevel'] = 'None';
  if (overallScore >= 80) maturityLevel = 'AI-First';
  else if (overallScore >= 60) maturityLevel = 'Advanced';
  else if (overallScore >= 40) maturityLevel = 'Intermediate';
  else if (overallScore >= 20) maturityLevel = 'Basic';

  return {
    aiChatbot: { present: features.aiChatbot, provider: providers.aiChatbot, features: [] },
    ruleBasedChatbot: { present: features.ruleBasedChatbot, provider: providers.ruleBasedChatbot },
    liveChat: { present: features.liveChat, provider: providers.liveChat },
    propertyRecommendation: { present: features.propertyRecommendation, type: 'none' },
    bookingAI: { present: features.bookingAI, features: [] },
    voiceAI: { present: features.voiceAI, type: 'none' },
    leadQualificationAI: { present: features.leadQualificationAI, features: [] },
    knowledgeBase: { 
      present: features.knowledgeBase, 
      searchable: features.knowledgeBase 
    },
    personalization: { 
      present: features.personalization, 
      basedOn: features.personalization ? ['browsing history', 'preferences'] : [] 
    },
    customerMemory: { 
      present: features.customerMemory, 
      features: features.customerMemory ? ['Contact history', 'Preferences'] : [] 
    },
    overallScore,
    maturityLevel,
  };
}

// Analyze customer journey
export function analyzeCustomerJourney(
  websiteAnalysis: WebsiteAnalysis,
  leadCapture: LeadCaptureAnalysis
): CustomerJourneyAnalysis {
  const steps: Array<{
    name: string;
    path: string;
    friction: 'low' | 'medium' | 'high';
    issues: string[];
    dropOffRisk: 'low' | 'medium' | 'high';
  }> = [
    { name: 'Landing', path: '/', friction: 'low', issues: [], dropOffRisk: 'low' },
    { name: 'Browse', path: '/products or /services', friction: 'low', issues: [], dropOffRisk: 'low' },
    { name: 'Property/Service Page', path: '/property or /service', friction: 'medium', issues: [], dropOffRisk: 'medium' },
    { name: 'Questions', path: '/contact or /faq', friction: 'medium', issues: [], dropOffRisk: 'medium' },
    { name: 'Contact', path: '/contact', friction: 'low', issues: [], dropOffRisk: 'medium' },
    { name: 'Booking/Conversion', path: '/book or /checkout', friction: 'high', issues: [], dropOffRisk: 'high' },
  ];
  
  // Analyze each step
  if (!websiteAnalysis.navigation.hasBreadcrumbs) {
    steps[1].issues.push('No breadcrumb navigation');
    steps[1].friction = 'medium' as const;
  }
  
  if (websiteAnalysis.forms.issues.length > 0) {
    steps[4].issues.push(...websiteAnalysis.forms.issues);
    steps[4].friction = 'high' as const;
  }
  
  if (!leadCapture.chatbot.present && !leadCapture.phone.present) {
    steps[3].issues.push('No instant support available');
    steps[3].friction = 'high' as const;
    steps[3].dropOffRisk = 'high' as const;
  }
  
  if (!leadCapture.booking.present) {
    steps[5].issues.push('No online booking available');
    steps[5].friction = 'high' as const;
  }

  // Overall flow analysis
  const deadEnds: string[] = [];
  const brokenFlows: string[] = [];
  const missingCTAs: string[] = [];
  const unclearNavigation: string[] = [];
  
  if (websiteAnalysis.navigation.menuDepth > 3) {
    unclearNavigation.push('Deep menu structure may confuse users');
    steps[1].issues.push('Complex navigation');
  }
  
  if (!leadCapture.contactForm.present) {
    missingCTAs.push('Contact form not found');
    deadEnds.push('No clear path to contact');
  }
  
  if (!leadCapture.booking.present) {
    missingCTAs.push('No booking/reservation option');
  }

  // Calculate flow score
  const frictionCount = steps.filter(s => s.friction === 'high').length;
  const flowScore = Math.max(20, 100 - (frictionCount * 15));

  return {
    steps,
    overallFlow: {
      score: flowScore,
      deadEnds,
      brokenFlows,
      slowResponses: !leadCapture.chatbot.present ? ['No instant support'] : [],
      missingCTAs,
      unclearNavigation,
    },
  };
}

// Generate opportunities based on analysis
export function generateOpportunities(
  websiteAnalysis: WebsiteAnalysis,
  leadCapture: LeadCaptureAnalysis,
  aiReadiness: AIReadinessAssessment,
  customerJourney: CustomerJourneyAnalysis
): Opportunity[] {
  const opportunities: Opportunity[] = [];
  let oppId = 1;

  // Lead capture opportunities
  if (!leadCapture.contactForm.present) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'lead-capture',
      observation: 'No contact form found on the website.',
      businessImpact: 'Visitors cannot easily get in touch, leading to missed leads.',
      recommendation: 'Add a prominent contact form with essential fields (name, email, message).',
      priority: 'Critical',
      estimatedEffort: '1-2 days',
      estimatedValue: 'High',
      evidence: ['No form elements detected during analysis'],
      relatedScores: ['leadCapture'],
    });
  }

  if (!leadCapture.crm.present) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'lead-capture',
      observation: 'No CRM system detected for managing leads.',
      businessImpact: 'Manual lead tracking leads to delays, errors, and lost opportunities.',
      recommendation: 'Implement a CRM system to capture, qualify, and route leads automatically.',
      priority: 'High',
      estimatedEffort: '2-4 weeks',
      estimatedValue: 'High',
      evidence: ['No CRM scripts detected', 'Lead routing unknown'],
      relatedScores: ['leadCapture', 'automation'],
    });
  }

  if (!leadCapture.chatbot.present) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'lead-capture',
      observation: 'No chat widget or chatbot available for instant support.',
      businessImpact: 'Visitors cannot get instant answers, especially outside business hours.',
      recommendation: 'Deploy an AI chatbot for 24/7 lead engagement and qualification.',
      priority: 'High',
      estimatedEffort: '1-2 weeks',
      estimatedValue: 'High',
      evidence: ['No chat widget detected'],
      relatedScores: ['leadCapture', 'aiReadiness'],
    });
  }

  if (!leadCapture.responseExperience.autoResponder && leadCapture.contactForm.present) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'lead-capture',
      observation: 'Contact form submissions receive delayed or no automatic response.',
      businessImpact: 'Submitters may feel ignored and not follow up.',
      recommendation: 'Set up automatic acknowledgment email with next steps.',
      priority: 'Medium',
      estimatedEffort: '1-2 days',
      estimatedValue: 'Medium',
      evidence: ['No auto-responder detected'],
      relatedScores: ['leadCapture'],
    });
  }

  // AI Readiness opportunities
  if (!aiReadiness.aiChatbot.present) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'ai-readiness',
      observation: 'No AI-powered chatbot detected on the website.',
      businessImpact: 'Limited ability to qualify leads and provide instant support.',
      recommendation: 'Upgrade from rule-based or no chatbot to AI-powered assistant.',
      priority: aiReadiness.ruleBasedChatbot.present ? 'Medium' : 'High',
      estimatedEffort: '2-4 weeks',
      estimatedValue: 'High',
      evidence: ['No AI chatbot scripts detected'],
      relatedScores: ['aiReadiness'],
    });
  }

  if (!aiReadiness.knowledgeBase.present) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'ai-readiness',
      observation: 'No knowledge base or FAQ section detected.',
      businessImpact: 'Users must contact support for basic questions.',
      recommendation: 'Create a searchable knowledge base to reduce support burden.',
      priority: 'Medium',
      estimatedEffort: '1-2 weeks',
      estimatedValue: 'Medium',
      evidence: ['No help center or FAQ detected'],
      relatedScores: ['aiReadiness', 'ux'],
    });
  }

  // Automation opportunities
  if (!leadCapture.leadRouting.present || leadCapture.leadRouting.type === 'manual') {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'automation',
      observation: 'Lead follow-up appears to be manual without automation.',
      businessImpact: 'Slow response times lead to leads going cold.',
      recommendation: 'Implement automated lead nurturing sequences based on behavior.',
      priority: 'High',
      estimatedEffort: '2-4 weeks',
      estimatedValue: 'High',
      evidence: ['Manual routing detected', 'No automation scripts found'],
      relatedScores: ['automation', 'leadCapture'],
    });
  }

  // UX opportunities
  if (websiteAnalysis.navigation.issues.length > 0) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'ux',
      observation: websiteAnalysis.navigation.issues[0],
      businessImpact: 'Confusing navigation leads to high bounce rates.',
      recommendation: 'Simplify navigation structure and add breadcrumb trail.',
      priority: 'Medium',
      estimatedEffort: '3-5 days',
      estimatedValue: 'Medium',
      evidence: websiteAnalysis.navigation.issues,
      relatedScores: ['ux'],
    });
  }

  if (websiteAnalysis.accessibility.issues.length > 2) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'ux',
      observation: 'Multiple accessibility issues detected.',
      businessImpact: 'Excludes users with disabilities and may have legal implications.',
      recommendation: 'Conduct accessibility audit and fix critical issues.',
      priority: 'Medium',
      estimatedEffort: '1-2 weeks',
      estimatedValue: 'Medium',
      evidence: websiteAnalysis.accessibility.issues.slice(0, 3),
      relatedScores: ['ux', 'trust'],
    });
  }

  // Performance opportunities
  if (websiteAnalysis.loadingSpeed.score < 60) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'performance',
      observation: `Page load time estimated at ${websiteAnalysis.loadingSpeed.timeInSeconds}s (Grade ${websiteAnalysis.loadingSpeed.grade}).`,
      businessImpact: 'Slow pages lead to high bounce rates and poor user experience.',
      recommendation: 'Optimize images, enable compression, and consider CDN.',
      priority: 'High',
      estimatedEffort: '1-2 weeks',
      estimatedValue: 'High',
      evidence: [`Loading time: ${websiteAnalysis.loadingSpeed.timeInSeconds}s`],
      relatedScores: ['performance'],
    });
  }

  // SEO opportunities
  if (!websiteAnalysis.seo.hasMetaTags) {
    opportunities.push({
      id: `opp-${oppId++}`,
      category: 'seo',
      observation: 'Missing meta description for search engines.',
      businessImpact: 'Reduced click-through rates in search results.',
      recommendation: 'Add compelling meta descriptions to all pages.',
      priority: 'Medium',
      estimatedEffort: '1-2 days',
      estimatedValue: 'Medium',
      evidence: ['Meta description missing'],
      relatedScores: ['seo'],
    });
  }

  return opportunities.sort((a, b) => {
    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Calculate website scores
export function calculateWebsiteScores(
  websiteAnalysis: WebsiteAnalysis,
  leadCapture: LeadCaptureAnalysis,
  aiReadiness: AIReadinessAssessment,
  customerJourney: CustomerJourneyAnalysis,
  opportunities: Opportunity[]
): WebsiteScore {
  // Individual category scores
  const ux = websiteAnalysis.design.score * 0.4 + 
              websiteAnalysis.navigation.score * 0.3 + 
              websiteAnalysis.accessibility.score * 0.3;
  
  const performance = websiteAnalysis.loadingSpeed.score;
  
  const leadCaptureScore = 
    (leadCapture.contactForm.present ? 20 : 0) +
    (leadCapture.phone.present ? 10 : 0) +
    (leadCapture.chatbot.present ? 20 : 0) +
    (leadCapture.crm.present ? 25 : 0) +
    (leadCapture.emailCapture.present ? 15 : 0) +
    (leadCapture.responseExperience.score > 50 ? 10 : 0);
  
  const automation = leadCapture.leadRouting.type === 'automated' ? 80 : 
                     leadCapture.leadRouting.type === 'manual' ? 30 : 20;
  
  const aiReadinessScore = aiReadiness.overallScore;
  
  const seo = websiteAnalysis.seo.score;
  
  const content = websiteAnalysis.blog.present ? 80 : 50;
  
  const trust = websiteAnalysis.trustSignals.score;

  // Overall score (weighted average)
  const overall = Math.round(
    ux * 0.15 +
    performance * 0.10 +
    leadCaptureScore * 0.20 +
    automation * 0.15 +
    aiReadinessScore * 0.15 +
    seo * 0.10 +
    content * 0.05 +
    trust * 0.10
  );

  // Determine grade
  let grade: WebsiteScore['grade'] = 'F';
  if (overall >= 90) grade = 'A';
  else if (overall >= 80) grade = 'B';
  else if (overall >= 70) grade = 'C';
  else if (overall >= 50) grade = 'D';

  // Industry benchmarks (simplified - would need real data)
  const industryAverage = 55;
  const competitorAverage = 62;
  const topPerformer = 85;

  return {
    overall,
    ux: Math.round(ux),
    performance,
    leadCapture: Math.round(leadCaptureScore),
    automation,
    aiReadiness: aiReadinessScore,
    seo,
    content,
    trust,
    grade,
    benchmarks: {
      industryAverage,
      competitorAverage,
      topPerformer,
    },
  };
}

// Calculate opportunity scores
export function calculateOpportunityScores(opportunities: Opportunity[]): OpportunityScore {
  return {
    critical: opportunities.filter(o => o.priority === 'Critical').length,
    high: opportunities.filter(o => o.priority === 'High').length,
    medium: opportunities.filter(o => o.priority === 'Medium').length,
    low: opportunities.filter(o => o.priority === 'Low').length,
    total: opportunities.length,
  };
}

// Generate executive summary
export function generateExecutiveSummary(
  businessInfo: BusinessInfo,
  websiteScore: WebsiteScore,
  opportunities: Opportunity[],
  aiReadiness: AIReadinessAssessment,
  leadCapture: LeadCaptureAnalysis
): ExecutiveSummary {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Analyze strengths
  if (websiteScore.ux >= 70) {
    strengths.push('Strong user experience with good navigation');
  }
  if (websiteScore.performance >= 70) {
    strengths.push('Fast loading pages for good user retention');
  }
  if (leadCapture.contactForm.present) {
    strengths.push('Contact form available for lead capture');
  }
  if (leadCapture.phone.present) {
    strengths.push('Phone contact option for direct communication');
  }
  if (websiteScore.trust >= 70) {
    strengths.push('Good trust signals and security indicators');
  }
  if (aiReadiness.knowledgeBase.present) {
    strengths.push('Knowledge base available for self-service support');
  }

  // Analyze weaknesses
  if (!leadCapture.chatbot.present) {
    weaknesses.push('No instant messaging capability for 24/7 support');
  }
  if (!leadCapture.crm.present) {
    weaknesses.push('No CRM system for managing leads effectively');
  }
  if (websiteScore.aiReadiness < 40) {
    weaknesses.push('Limited AI adoption for business automation');
  }
  if (websiteScore.performance < 60) {
    weaknesses.push('Page load times may be affecting user experience');
  }
  if (!leadCapture.leadRouting.present || leadCapture.leadRouting.type === 'manual') {
    weaknesses.push('Manual lead follow-up causing slow response times');
  }

  // Key opportunities
  const keyOpportunities = opportunities
    .filter(o => o.priority === 'Critical' || o.priority === 'High')
    .slice(0, 3)
    .map(o => o.recommendation);

  // Recommended next steps
  const recommendedNextSteps = [
    'Schedule a detailed consultation to discuss top-priority opportunities',
    'Review audit findings with key stakeholders',
    'Prioritize quick wins (1-2 day implementations) for immediate impact',
  ];

  // Risk factors
  const riskFactors: string[] = [];
  if (opportunities.filter(o => o.priority === 'Critical').length > 0) {
    riskFactors.push('Critical issues may be costing leads and revenue daily');
  }
  if (!leadCapture.crm.present) {
    riskFactors.push('Without proper lead management, valuable leads may be lost');
  }
  if (websiteScore.performance < 50) {
    riskFactors.push('Poor performance may be driving potential customers to competitors');
  }

  // Overview
  const overview = `${businessInfo.name} operates primarily in the ${businessInfo.industry.toLowerCase()} sector. ` +
    `The website scores ${websiteScore.overall}/100 overall, which is ` +
    `${websiteScore.overall > websiteScore.benchmarks.industryAverage ? 'above' : 'below'} the industry average. ` +
    `The most pressing opportunity is implementing AI-powered lead engagement to capture and qualify visitors ` +
    `who currently leave without contacting the business. ` +
    `With ${opportunities.filter(o => o.priority === 'High' || o.priority === 'Critical').length} high-priority opportunities identified, ` +
    `we recommend a phased approach starting with quick wins and building toward comprehensive AI adoption.`;

  return {
    overview,
    strengths,
    weaknesses,
    keyOpportunities,
    recommendedNextSteps,
    riskFactors,
  };
}

// Generate roadmap
export function generateRoadmap(opportunities: Opportunity[]): RoadmapPhase[] {
  const phases: RoadmapPhase[] = [];
  
  // Phase 1: Critical UX Issues
  const criticalUX = opportunities.filter(o => 
    o.category === 'ux' && (o.priority === 'Critical' || o.priority === 'High')
  );
  if (criticalUX.length > 0) {
    phases.push({
      phase: 1,
      title: 'Critical UX Issues',
      items: criticalUX.map(o => o.recommendation),
      timeline: '1-2 weeks',
      priority: 'Critical',
    });
  }
  
  // Phase 2: Lead Capture Enhancement
  const leadCapture = opportunities.filter(o => 
    o.category === 'lead-capture' && (o.priority === 'Critical' || o.priority === 'High')
  );
  if (leadCapture.length > 0) {
    phases.push({
      phase: 2,
      title: 'Lead Capture Enhancement',
      items: leadCapture.map(o => o.recommendation),
      timeline: '2-3 weeks',
      priority: 'High',
    });
  }
  
  // Phase 3: AI Implementation
  const aiOpps = opportunities.filter(o => 
    o.category === 'ai-readiness' && (o.priority === 'Critical' || o.priority === 'High')
  );
  if (aiOpps.length > 0) {
    phases.push({
      phase: 3,
      title: 'AI Implementation',
      items: aiOpps.map(o => o.recommendation),
      timeline: '3-4 weeks',
      priority: 'High',
    });
  }
  
  // Phase 4: Automation & Optimization
  const automation = opportunities.filter(o => 
    o.category === 'automation'
  );
  const performance = opportunities.filter(o => 
    o.category === 'performance' || o.category === 'seo'
  );
  const phase4Items = [...automation, ...performance].map(o => o.recommendation);
  if (phase4Items.length > 0) {
    phases.push({
      phase: 4,
      title: 'Automation & Optimization',
      items: phase4Items,
      timeline: '2-3 weeks',
      priority: 'Medium',
    });
  }
  
  // If no specific phases, add default
  if (phases.length === 0) {
    phases.push({
      phase: 1,
      title: 'Foundation & Quick Wins',
      items: [
        'Implement contact form with spam protection',
        'Add clear calls-to-action throughout site',
        'Optimize page load times',
      ],
      timeline: '1-2 weeks',
      priority: 'Medium',
    });
  }
  
  return phases;
}

// Generate pricing estimates
export function generatePricing(
  opportunities: Opportunity[],
  websiteScore: WebsiteScore,
  businessInfo: BusinessInfo
): PricingEstimate {
  // Base complexity factors
  let complexityMultiplier = 1.0;
  
  if (websiteScore.overall < 40) {
    complexityMultiplier = 1.3; // More work needed
  } else if (websiteScore.overall > 70) {
    complexityMultiplier = 0.8; // Less work needed
  }
  
  // Industry-specific adjustments
  if (businessInfo.industry === 'Real Estate' || businessInfo.industry === 'E-commerce') {
    complexityMultiplier *= 1.2; // More complex requirements
  }
  
  // Count high-priority opportunities
  const highPriorityCount = opportunities.filter(
    o => o.priority === 'Critical' || o.priority === 'High'
  ).length;
  
  if (highPriorityCount > 5) {
    complexityMultiplier *= 1.2;
  }

  // Calculate implementation costs
  const baseImplementation = 8000 * complexityMultiplier;
  const implementation = {
    low: Math.round(baseImplementation * 0.7),
    medium: Math.round(baseImplementation),
    high: Math.round(baseImplementation * 1.5),
    currency: 'USD',
  };
  
  // Calculate maintenance costs
  const baseMaintenance = 500 * complexityMultiplier;
  const maintenance = {
    low: Math.round(baseMaintenance),
    medium: Math.round(baseMaintenance * 1.5),
    high: Math.round(baseMaintenance * 2.5),
    currency: 'USD',
    period: 'monthly' as const,
  };
  
  // Determine recommended plan
  let recommendedPlan = 'Essential';
  if (implementation.medium >= 12000) {
    recommendedPlan = 'Growth';
  }
  if (implementation.medium >= 20000) {
    recommendedPlan = 'Enterprise';
  }
  
  // Calculate timeline
  const totalEffort = opportunities.reduce((acc, opp) => {
    switch (opp.estimatedEffort) {
      case '1-2 days': return acc + 1;
      case '1-2 weeks': return acc + 2;
      case '2-4 weeks': return acc + 3;
      case '1-2 months': return acc + 6;
      default: return acc + 2;
    }
  }, 0);
  
  const timeline = totalEffort <= 4 ? '4-6 weeks' :
                   totalEffort <= 8 ? '6-10 weeks' :
                   '10-16 weeks';

  // Included features based on plan
  const includedFeatures = [
    'AI Chatbot Implementation',
    'CRM Integration',
    'Lead Capture Optimization',
    'Performance Optimization',
    'Monthly Reporting',
  ];
  
  if (recommendedPlan === 'Growth') {
    includedFeatures.push(
      'Advanced Automation Sequences',
      'Custom Knowledge Base',
      'A/B Testing Framework'
    );
  }
  
  if (recommendedPlan === 'Enterprise') {
    includedFeatures.push(
      'Full AI Suite',
      'Custom Development',
      'Dedicated Account Manager',
      'Priority Support'
    );
  }

  return {
    implementation,
    maintenance,
    recommendedPlan,
    timeline,
    includedFeatures,
  };
}
