// AI Audit Engine API Route
// Handles audit requests and coordinates the analysis pipeline

import { NextRequest, NextResponse } from 'next/server';
import { WebsiteCrawler, discoverBusinessInfo, analyzeDesign, analyzeResponsive, analyzeLoadingSpeed, analyzeNavigation, analyzeForms, detectChatWidget, detectNewsletter, detectBlog, analyzeAccessibility, analyzeSEO, analyzeTrustSignals } from '@/lib/audit/crawler';
import { analyzeLeadCapture, analyzeAIReadiness, analyzeCustomerJourney, generateOpportunities, calculateWebsiteScores, calculateOpportunityScores, generateExecutiveSummary, generateRoadmap, generatePricing } from '@/lib/audit/analyzer';
import { AuditReport, AuditRequest } from '@/lib/audit/types';
import { analyzeWebsiteWithAI, getModelInfo } from '@/lib/bedrock/bedrockService';

// In-memory cache for audits
const auditCache = new Map<string, AuditReport>();

// Generate unique audit ID
function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// POST /api/audit - Start a new audit
export async function POST(request: NextRequest) {
  try {
    const body: AuditRequest = await request.json();
    const { url, email } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create audit
    const auditId = generateAuditId();
    console.log(`[API] Starting audit ${auditId} for ${targetUrl}`);

    // Get model info for response
    const modelInfo = getModelInfo();
    console.log(`[API] Using AI Model: ${modelInfo.modelName} (${modelInfo.provider}) in ${modelInfo.region}`);

    // Run audit process with AI
    const report = await runAudit(auditId, targetUrl, email);
    
    console.log(`[API] Audit ${auditId} completed. Business: ${report.businessName}, Score: ${report.websiteScore.overall}`);

    // Store in cache
    auditCache.set(auditId, report);
    console.log(`[API] Audit ${auditId} stored in memory cache`);

    // Try to also save to Firebase (async, non-blocking)
    try {
      const { saveAudit } = await import('@/lib/firebase/auditService');
      await saveAudit(report);
      console.log(`[API] Audit ${auditId} saved to Firebase`);
    } catch (dbError) {
      console.warn('[API] Firebase save failed (using memory cache):', dbError);
    }

    return NextResponse.json({
      id: auditId,
      url: targetUrl,
      status: 'complete',
      shareableLink: `/audit/${auditId}`,
      createdAt: report.createdAt,
      aiModel: modelInfo.modelName,
    });
  } catch (error) {
    console.error('[API] Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to start audit', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/audit - Get audit by ID, list audits, or get model info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get('id');
  const modelInfo = searchParams.get('model');

  // Return model information
  if (modelInfo === 'true') {
    return NextResponse.json(getModelInfo());
  }

  if (auditId) {
    // First try memory cache
    const cachedReport = auditCache.get(auditId);
    if (cachedReport) {
      console.log(`Audit ${auditId} found in memory cache`);
      return NextResponse.json(cachedReport);
    }

    // Try Firebase as fallback
    try {
      const { getAuditById } = await import('@/lib/firebase/auditService');
      const report = await getAuditById(auditId);
      if (report) {
        console.log(`Audit ${auditId} found in Firebase`);
        return NextResponse.json(report);
      }
    } catch (dbError) {
      console.warn('Firebase lookup failed:', dbError);
    }
    
    return NextResponse.json(
      { error: 'Audit not found' },
      { status: 404 }
    );
  }

  // Return list of recent audits
  try {
    const { getRecentAudits } = await import('@/lib/firebase/auditService');
    const audits = await getRecentAudits(20);
    return NextResponse.json({ 
      audits: audits.map(a => ({
        id: a.id,
        url: a.url,
        businessName: a.businessName,
        createdAt: a.createdAt,
        score: a.websiteScore?.overall || 0,
      }))
    });
  } catch (dbError) {
    console.warn('Firebase lookup failed:', dbError);
    return NextResponse.json({ audits: [] });
  }
}

// Run the complete audit process
async function runAudit(auditId: string, url: string, email?: string): Promise<AuditReport> {
  console.log(`[${auditId}] Phase 1: Discovering website...`);
  
  // Initialize crawler
  const crawler = new WebsiteCrawler(url);
  
  // Crawl the main page
  const crawlResult = await crawler.crawl();
  
  if (!crawlResult) {
    throw new Error(`Failed to fetch website: ${url}`);
  }

  // Parse the HTML
  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Nanoware AI Audit Bot/1.0',
    },
  });

  clearTimeout(fetchTimeout);

  const html = await response.text();
  
  // Parse HTML manually
  const getMetaContent = (html: string, name: string): string => {
    const patterns = [
      new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'),
      new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return '';
  };

  const getTitle = (html: string): string => {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : '';
  };

  const extractLinks = (html: string): string[] => {
    const links: string[] = [];
    const pattern = /<a[^>]*href=["']([^"']+)["']/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith('http')) {
        links.push(href);
      }
    }
    return [...new Set(links)].slice(0, 50);
  };

  const extractImages = (html: string): string[] => {
    const images: string[] = [];
    const pattern = /<img[^>]*src=["']([^"']+)["']/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      images.push(match[1]);
    }
    return images;
  };

  const extractScripts = (html: string): string[] => {
    const scripts: string[] = [];
    const pattern = /<script[^>]*src=["']([^"']+)["']/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      scripts.push(match[1]);
    }
    return scripts;
  };

  const extractStyles = (html: string): string[] => {
    const styles: string[] = [];
    const pattern = /<link[^>]*href=["']([^"']+\.css[^"']*)["']/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      styles.push(match[1]);
    }
    return styles;
  };

  const extractForms = (html: string) => {
    const forms: Array<{ action: string; method: string; fields: string[] }> = [];
    const formPattern = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    let formMatch;
    while ((formMatch = formPattern.exec(html)) !== null) {
      const formHtml = formMatch[0];
      const actionMatch = formHtml.match(/action=["']([^"']+)["']/i);
      const methodMatch = formHtml.match(/method=["']([^"']+)["']/i);
      
      const fieldPattern = /<(?:input|select|textarea)[^>]*name=["']([^"']+)["']/gi;
      const fields: string[] = [];
      let fieldMatch;
      while ((fieldMatch = fieldPattern.exec(formHtml)) !== null) {
        fields.push(fieldMatch[1]);
      }

      forms.push({
        action: actionMatch ? actionMatch[1] : '',
        method: methodMatch ? methodMatch[1] : 'get',
        fields,
      });
    }
    return forms;
  };

  const extractText = (html: string): string => {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const parsed = {
    title: getTitle(html),
    meta: {
      description: getMetaContent(html, 'description'),
      keywords: getMetaContent(html, 'keywords'),
      ogTitle: getMetaContent(html, 'title') || getTitle(html),
      ogDescription: getMetaContent(html, 'description'),
      ogImage: getMetaContent(html, 'image'),
    },
    scripts: extractScripts(html),
    styles: extractStyles(html),
    links: extractLinks(html),
    images: extractImages(html),
    forms: extractForms(html),
    text: extractText(html),
    html,
  };

  // Phase 1: Discovery
  console.log(`[${auditId}] Phase 1: Discovery complete`);
  
  const businessInfo = discoverBusinessInfo(parsed, url);
  
  // Phase 2: Website Analysis
  console.log(`[${auditId}] Phase 2: Analyzing website...`);
  
  const hasSSL = url.startsWith('https://');
  
  const websiteAnalysis = {
    design: analyzeDesign(parsed),
    responsive: analyzeResponsive(parsed),
    loadingSpeed: analyzeLoadingSpeed(parsed),
    navigation: analyzeNavigation(parsed),
    brokenLinks: { score: 100, links: [] as Array<{ url: string; status: number }> },
    forms: analyzeForms(parsed),
    chatWidget: detectChatWidget(parsed),
    newsletter: detectNewsletter(parsed),
    blog: detectBlog(parsed),
    accessibility: analyzeAccessibility(parsed),
    seo: analyzeSEO(parsed),
    trustSignals: analyzeTrustSignals(parsed, hasSSL),
    scripts: parsed.scripts,
    links: parsed.links,
    html: parsed.html,
  };
  
  // Phase 3: Lead Capture Analysis
  console.log(`[${auditId}] Phase 3: Analyzing lead capture...`);
  
  const leadCapture = analyzeLeadCapture(websiteAnalysis, businessInfo);
  
  // Phase 4: AI Readiness
  console.log(`[${auditId}] Phase 4: Assessing AI readiness...`);
  
  const aiReadiness = analyzeAIReadiness(websiteAnalysis, leadCapture);
  
  // Phase 5: Customer Journey
  console.log(`[${auditId}] Phase 5: Analyzing customer journey...`);
  
  const customerJourney = analyzeCustomerJourney(websiteAnalysis, leadCapture);
  
  // Phase 6: Generate Opportunities (with AI enhancement)
  console.log(`[${auditId}] Phase 6: Generating opportunities with AI...`);
  
  // First generate rule-based opportunities
  let opportunities = generateOpportunities(websiteAnalysis, leadCapture, aiReadiness, customerJourney);
  
  // Enhance with AI analysis
  try {
    console.log(`[${auditId}] Calling Claude 3.5 Sonnet via Bedrock for AI insights...`);
    const aiAnalysis = await analyzeWebsiteWithAI({
      url,
      title: parsed.title,
      description: parsed.meta.description,
      content: parsed.text.substring(0, 3000),
    }, {
      name: businessInfo.name,
      industry: businessInfo.industry,
    });
    
    console.log(`[${auditId}] AI analysis complete. Found ${aiAnalysis.opportunities.length} opportunities.`);
    
    // Use AI-generated opportunities if available
    if (aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0) {
      // Map AI effort levels to our format
      const effortMap: Record<string, '1-2 days' | '3-5 days' | '1-2 weeks' | '2-4 weeks' | '1-2 months'> = {
        'Low': '1-2 days',
        'Medium': '1-2 weeks',
        'High': '2-4 weeks',
      };
      
      opportunities = aiAnalysis.opportunities.map((opp, index) => ({
        id: `ai-opp-${index}`,
        category: opp.category as 'lead-capture' | 'ai-readiness' | 'automation' | 'ux' | 'seo' | 'performance' | 'trust',
        title: opp.observation.substring(0, 50),
        description: opp.observation,
        priority: opp.priority,
        observation: opp.observation,
        businessImpact: opp.businessImpact,
        recommendation: opp.recommendation,
        estimatedEffort: effortMap[opp.estimatedEffort] || '1-2 weeks',
        estimatedValue: opp.estimatedValue,
        evidence: [`AI-generated insight from Claude 3.5 Sonnet`],
        relatedScores: [opp.category],
      }));
    }
  } catch (aiError) {
    console.warn(`[${auditId}] AI analysis failed, using rule-based opportunities:`, aiError);
  }
  
  // Phase 7-8: Scoring
  console.log(`[${auditId}] Phase 7-8: Calculating scores...`);
  
  const websiteScore = calculateWebsiteScores(websiteAnalysis, leadCapture, aiReadiness, customerJourney, opportunities);
  const opportunityScore = calculateOpportunityScores(opportunities);
  
  // Phase 9: Executive Summary (with AI enhancement)
  console.log(`[${auditId}] Phase 9: Generating executive summary...`);
  
  const executiveSummary = generateExecutiveSummary(businessInfo, websiteScore, opportunities, aiReadiness, leadCapture);
  
  // Phase 10: Roadmap & Pricing
  console.log(`[${auditId}] Phase 10: Generating roadmap and pricing...`);
  
  const roadmap = generateRoadmap(opportunities);
  const pricing = generatePricing(opportunities, websiteScore, businessInfo);
  
  // Build final report
  const report: AuditReport = {
    id: auditId,
    url,
    businessName: businessInfo.name,
    industry: businessInfo.industry,
    createdAt: new Date(),
    phases: {
      discovery: true,
      research: true,
      leadCapture: true,
      aiReadiness: true,
      customerJourney: true,
      opportunities: true,
      decisionMakers: false, // Would need external API
      scoring: true,
      roadmap: true,
      report: true,
    },
    businessInfo,
    websiteAnalysis: websiteAnalysis as AuditReport['websiteAnalysis'],
    leadCapture,
    aiReadiness,
    customerJourney,
    opportunities,
    decisionMakers: [],
    websiteScore,
    opportunityScore,
    executiveSummary,
    roadmap,
    pricing,
    shareableLink: `/audit/${auditId}`,
  };

  console.log(`[${auditId}] Audit complete! Overall score: ${websiteScore.overall}/100`);
  
  return report;
}
