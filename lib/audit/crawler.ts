// Website Crawler Service
// Uses fetch API for HTTP requests and parses HTML

import { WebsiteAnalysis, BusinessInfo, LeadCaptureAnalysis, AIReadinessAssessment } from './types';

interface CrawlResult {
  html: string;
  url: string;
  status: number;
  headers: Record<string, string>;
}

interface ParsedPage {
  title: string;
  meta: {
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
  scripts: string[];
  styles: string[];
  links: string[];
  images: string[];
  forms: Array<{
    action: string;
    method: string;
    fields: string[];
  }>;
  text: string;
  html: string;
}

export class WebsiteCrawler {
  private baseUrl: string;
  private visitedUrls: Set<string> = new Set();
  private maxPages: number = 10;
  private timeout: number = 30000;

  constructor(url: string) {
    this.baseUrl = this.normalizeUrl(url);
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private async fetchWithTimeout(url: string): Promise<CrawlResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Nanoware AI Audit Bot/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timeoutId);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const html = await response.text();

      return {
        html,
        url,
        status: response.status,
        headers,
      };
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  }

  private parseHtml(html: string, url: string): ParsedPage {
    // Simple HTML parsing without external dependencies
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

    const extractLinks = (html: string, baseUrl: string): string[] => {
      const links: string[] = [];
      const pattern = /<a[^>]*href=["']([^"']+)["']/gi;
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let href = match[1];
        if (href.startsWith('/')) {
          href = baseUrl + href;
        }
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
      return images.slice(0, 30);
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

    const extractForms = (html: string): ParsedPage['forms'] => {
      const forms: ParsedPage['forms'] = [];
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

    return {
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
      links: extractLinks(html, this.baseUrl),
      images: extractImages(html),
      forms: extractForms(html),
      text: extractText(html),
      html,
    };
  }

  async crawl(): Promise<CrawlResult | null> {
    return this.fetchWithTimeout(this.baseUrl);
  }

  async crawlPage(url: string): Promise<{ result: CrawlResult | null; parsed: ParsedPage | null }> {
    const result = await this.fetchWithTimeout(url);
    if (!result) return { result: null, parsed: null };
    
    const parsed = this.parseHtml(result.html, url);
    this.visitedUrls.add(url);
    
    return { result, parsed };
  }

  getVisitedUrls(): string[] {
    return Array.from(this.visitedUrls);
  }
}

// Discovery: Extract business information
export function discoverBusinessInfo(parsed: ParsedPage, url: string): BusinessInfo {
  const domain = new URL(url).hostname.replace('www.', '');
  const businessName = parsed.title.split('|')[0].split('-')[0].split('–')[0].trim() || domain;
  
  // Extract potential phone numbers
  const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
  const phones = parsed.text.match(phonePattern) || [];
  
  // Extract potential emails
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = parsed.text.match(emailPattern) || [];
  
  // Detect social media links
  const socialMedia: BusinessInfo['socialMedia'] = {};
  parsed.links.forEach(link => {
    if (link.includes('facebook.com') || link.includes('fb.com')) {
      socialMedia.facebook = link;
    } else if (link.includes('twitter.com') || link.includes('x.com')) {
      socialMedia.twitter = link;
    } else if (link.includes('linkedin.com')) {
      socialMedia.linkedin = link;
    } else if (link.includes('instagram.com')) {
      socialMedia.instagram = link;
    }
  });

  // Detect Google Maps
  const hasGoogleMaps = parsed.text.toLowerCase().includes('google maps') || 
                        parsed.links.some(l => l.includes('maps.google') || l.includes('goo.gl/maps'));

  // Detect industry keywords
  const industryKeywords = {
    'Real Estate': ['property', 'real estate', 'home', 'listing', 'broker', 'realtor', 'condo', 'apartment'],
    'E-commerce': ['shop', 'store', 'buy', 'cart', 'checkout', 'product', 'order'],
    'SaaS': ['software', 'platform', 'solution', 'dashboard', 'analytics', 'pricing'],
    'Healthcare': ['clinic', 'doctor', 'medical', 'health', 'patient', 'wellness'],
    'Restaurant': ['restaurant', 'menu', 'reservation', 'food', 'dining', 'catering'],
    'Education': ['course', 'learn', 'education', 'tutorial', 'student', 'class'],
    'Finance': ['financial', 'investment', 'banking', 'loan', 'credit', 'insurance'],
  };

  let detectedIndustry = 'General Business';
  let maxMatches = 0;
  const textLower = parsed.text.toLowerCase();
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const matches = keywords.filter(kw => textLower.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIndustry = industry;
    }
  }

  return {
    name: businessName,
    industry: detectedIndustry,
    description: parsed.meta.description || parsed.text.slice(0, 500),
    locations: [], // Would need geocoding API for this
    phone: phones[0] || '',
    email: emails[0] || '',
    socialMedia,
    googleMaps: hasGoogleMaps ? url : undefined,
  };
}

// Analyze website design and structure
export function analyzeDesign(parsed: ParsedPage): WebsiteAnalysis['design'] {
  const issues: string[] = [];
  const strengths: string[] = [];

  // Check for modern CSS frameworks indicators
  const hasTailwind = parsed.styles.some(s => s.includes('tailwind'));
  const hasBootstrap = parsed.styles.some(s => s.includes('bootstrap'));
  const hasFontAwesome = parsed.scripts.some(s => s.includes('fontawesome'));
  
  // Check for animations
  const hasAnimations = parsed.scripts.some(s => 
    s.includes('anime') || s.includes('gsap') || s.includes('velocity')
  );

  // Check design quality indicators
  if (parsed.meta.description && parsed.meta.description.length > 50) {
    strengths.push('Has descriptive meta tags');
  }
  
  if (hasAnimations) {
    strengths.push('Uses modern animations');
  }
  
  if (hasTailwind || hasBootstrap) {
    strengths.push('Uses modern CSS framework');
  }

  // Calculate score based on factors
  let score = 70; // Base score
  
  if (!parsed.meta.description) {
    issues.push('Missing meta description');
    score -= 10;
  }
  
  if (parsed.styles.length < 3) {
    issues.push('Limited stylesheet usage');
    score -= 10;
  }
  
  if (!hasAnimations && parsed.styles.length < 5) {
    issues.push('Static design without visual enhancements');
    score -= 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    strengths,
  };
}

// Analyze responsiveness
export function analyzeResponsive(parsed: ParsedPage): WebsiteAnalysis['responsive'] {
  const html = parsed.html.toLowerCase();
  
  // Check for responsive indicators
  const hasViewport = html.includes('viewport');
  const hasMediaQueries = html.includes('@media');
  const hasResponsiveFramework = parsed.styles.some(s => 
    s.includes('bootstrap') || s.includes('tailwind') || s.includes('foundation')
  );
  
  const isResponsive = hasViewport && (hasMediaQueries || hasResponsiveFramework);
  const mobileFriendly = isResponsive;

  let score = 50;
  if (hasViewport) score += 15;
  if (hasMediaQueries) score += 20;
  if (hasResponsiveFramework) score += 15;

  return {
    score: Math.max(0, Math.min(100, score)),
    isResponsive,
    mobileFriendly,
  };
}

// Analyze loading speed (simplified estimation)
export function analyzeLoadingSpeed(parsed: ParsedPage): WebsiteAnalysis['loadingSpeed'] {
  // Estimate based on content size and resources
  const htmlSize = parsed.html.length;
  const resourceCount = parsed.scripts.length + parsed.styles.length + parsed.images.length;
  
  // Very rough estimation (actual would need real measurements)
  const estimatedSeconds = Math.max(0.5, (htmlSize / 50000) + (resourceCount * 0.3));
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  let score = 60;
  
  if (estimatedSeconds < 2) {
    grade = 'A';
    score = 90;
  } else if (estimatedSeconds < 3) {
    grade = 'B';
    score = 75;
  } else if (estimatedSeconds < 5) {
    grade = 'C';
    score = 60;
  } else if (estimatedSeconds < 8) {
    grade = 'D';
    score = 40;
  } else {
    grade = 'F';
    score = 20;
  }

  return {
    score,
    timeInSeconds: Math.round(estimatedSeconds * 10) / 10,
    grade,
  };
}

// Analyze navigation
export function analyzeNavigation(parsed: ParsedPage): WebsiteAnalysis['navigation'] {
  const issues: string[] = [];
  let menuDepth = 1;
  
  // Check for breadcrumbs
  const hasBreadcrumbs = parsed.html.includes('breadcrumb') || parsed.html.includes('breadcrumbs');
  
  // Estimate menu depth from navigation structure
  const navMatches = parsed.html.match(/<nav[^>]*>[\s\S]*?<\/nav>/gi);
  if (navMatches) {
    const maxNestedLists = Math.max(...navMatches.map(n => (n.match(/<ul/g) || []).length));
    menuDepth = Math.min(maxNestedLists, 4);
  }
  
  if (menuDepth > 3) {
    issues.push('Deep navigation hierarchy');
  }
  
  if (!hasBreadcrumbs) {
    issues.push('No breadcrumb navigation');
  }

  let score = 80;
  if (issues.includes('Deep navigation hierarchy')) score -= 15;
  if (issues.includes('No breadcrumb navigation')) score -= 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    menuDepth,
    hasBreadcrumbs,
  };
}

// Analyze broken links (requires actual checking)
export async function analyzeBrokenLinks(crawler: WebsiteCrawler): Promise<WebsiteAnalysis['brokenLinks']> {
  const links = crawler.getVisitedUrls().slice(0, 20);
  const brokenLinks: Array<{ url: string; status: number }> = [];
  
  // In production, would actually check each link
  // For now, return empty as we can't make synchronous requests for all links
  
  return {
    score: 100,
    links: brokenLinks,
  };
}

// Analyze forms
export function analyzeForms(parsed: ParsedPage): WebsiteAnalysis['forms'] {
  const issues: string[] = [];
  let hasValidation = false;
  let hasProgressiveProfiling = false;
  
  const formCount = parsed.forms.length;
  
  if (formCount === 0) {
    issues.push('No contact forms found');
  }
  
  parsed.forms.forEach((form, i) => {
    // Check for validation attributes
    if (parsed.html.includes('required') || parsed.html.includes('pattern=')) {
      hasValidation = true;
    }
    
    // Check for progressive profiling indicators
    if (form.fields.length > 3) {
      hasProgressiveProfiling = true;
    }
    
    // Check for honeypot/spam protection
    const hasSpamProtection = parsed.html.includes('captcha') || 
                             parsed.html.includes('honeypot') ||
                             parsed.html.includes('cf-turnstile');
    
    if (!hasSpamProtection && i === 0) {
      issues.push('Contact form may lack spam protection');
    }
  });

  let score = 70;
  if (formCount === 0) score -= 30;
  if (!hasValidation) score -= 15;
  if (!hasProgressiveProfiling) score -= 10;

  return {
    count: formCount,
    issues,
    hasValidation,
    hasProgressiveProfiling,
  };
}

// Detect chat widgets
export function detectChatWidget(parsed: ParsedPage): WebsiteAnalysis['chatWidget'] {
  const html = parsed.html.toLowerCase();
  const scripts = parsed.scripts.map(s => s.toLowerCase());
  
  const chatProviders = {
    'Intercom': ['intercom', 'widget.intercom'],
    'Zendesk': ['zendesk', 'zd'],
    'Drift': ['drift'],
    'HubSpot': ['hubspot', 'hsforms'],
    'Tidio': ['tidio'],
    'Crisp': ['crisp'],
    'LiveChat': ['livechat'],
    'Freshdesk': ['freshdesk'],
    'Olark': ['olark'],
    'Smartsupp': ['smartsupp'],
  };
  
  let type: 'ai' | 'rule-based' | 'live' | 'none' = 'none';
  let provider: string | undefined;
  
  for (const [name, patterns] of Object.entries(chatProviders)) {
    if (scripts.some(s => patterns.some(p => s.includes(p)))) {
      provider = name;
      type = 'rule-based'; // Most are rule-based unless specified
      
      // Check for AI indicators
      if (scripts.some(s => s.includes('openai') || s.includes('ai') || s.includes('gpt'))) {
        type = 'ai';
      }
      break;
    }
  }
  
  // Check for common chat patterns
  if (html.includes('chatbot') || html.includes('chat-widget') || html.includes('messenger')) {
    type = type === 'none' ? 'rule-based' : type;
  }

  return {
    present: type !== 'none',
    type,
    provider,
  };
}

// Detect newsletter signup
export function detectNewsletter(parsed: ParsedPage): WebsiteAnalysis['newsletter'] {
  const html = parsed.html.toLowerCase();
  
  const hasNewsletter = html.includes('newsletter') || 
                        html.includes('subscribe') || 
                        html.includes('signup') ||
                        parsed.forms.some(f => 
                          f.fields.some(field => 
                            field.toLowerCase().includes('email')
                          )
                        );
  
  const hasPopup = html.includes('popup') || 
                   html.includes('modal') && html.includes('subscribe');
  
  const hasEmbedded = parsed.forms.some(f => 
    f.fields.some(field => 
      field.toLowerCase().includes('email')
    )
  );

  return {
    present: hasNewsletter,
    embedded: hasEmbedded,
    popup: hasPopup,
  };
}

// Detect blog
export function detectBlog(parsed: ParsedPage): WebsiteAnalysis['blog'] {
  const html = parsed.html.toLowerCase();
  
  const hasBlog = html.includes('/blog') || 
                  html.includes('/news') ||
                  html.includes('/articles') ||
                  html.includes('blog-post') ||
                  html.includes('article');
  
  // Check for post indicators
  const postIndicators = (html.match(/post-title|article-title|entry-title/g) || []).length;
  
  // Check for date patterns (indicates recent content)
  const hasDates = /\d{4}-\d{2}-\d{2}/.test(html) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(html);
  
  const freshness = hasDates ? 'Recent content detected' : 'Content age unknown';

  return {
    present: hasBlog,
    postCount: postIndicators,
    freshness,
  };
}

// Analyze accessibility
export function analyzeAccessibility(parsed: ParsedPage): WebsiteAnalysis['accessibility'] {
  const issues: string[] = [];
  const html = parsed.html.toLowerCase();
  
  // Check for common accessibility issues
  const imageCount = parsed.images.length;
  const altTags = (html.match(/alt=["'][^"']+["']/gi) || []).length;
  const imagesWithoutAlt = imageCount - altTags;
  
  if (imagesWithoutAlt > imageCount * 0.3) {
    issues.push(`Many images (${imagesWithoutAlt}) lack alt text`);
  }
  
  // Check for skip links
  if (!html.includes('skip')) {
    issues.push('No skip navigation link');
  }
  
  // Check for proper heading hierarchy
  const h1Count = (html.match(/<h1/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  
  if (h1Count === 0) {
    issues.push('No H1 heading found');
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings (should be one)');
  }
  
  // Check for color contrast (simplified)
  if (!html.includes('contrast')) {
    // This is a very weak check - real analysis would need visual testing
  }
  
  // Determine WCAG level
  let wcagLevel: 'A' | 'AA' | 'AAA' | 'None' = 'None';
  let score = 40;
  
  if (issues.length === 0) {
    wcagLevel = 'AA';
    score = 90;
  } else if (issues.length <= 2) {
    wcagLevel = 'A';
    score = 70;
  } else if (issues.length <= 4) {
    score = 50;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    wcagLevel,
  };
}

// Analyze SEO
export function analyzeSEO(parsed: ParsedPage): WebsiteAnalysis['seo'] {
  const issues: string[] = [];
  let score = 60;
  
  const hasMetaTags = !!parsed.meta.description;
  const hasOpenGraph = !!parsed.meta.ogTitle || !!parsed.meta.ogDescription;
  
  // Check for sitemap and robots
  const html = parsed.html;
  const hasMetaRobots = html.includes('robots') || html.includes('noindex');
  
  if (!hasMetaTags) {
    issues.push('Missing meta description');
    score -= 15;
  }
  
  if (!hasOpenGraph) {
    issues.push('Missing Open Graph tags for social sharing');
    score -= 10;
  }
  
  // Title length
  if (parsed.title.length > 60) {
    issues.push('Title tag is too long (over 60 characters)');
    score -= 5;
  } else if (parsed.title.length < 30) {
    issues.push('Title tag is too short (under 30 characters)');
    score -= 5;
  }
  
  // Content length
  if (parsed.text.length < 300) {
    issues.push('Very little content for SEO');
    score -= 15;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    hasMetaTags,
    hasOpenGraph,
    hasSitemap: false, // Would need to check separately
    hasRobotsTxt: false, // Would need to check separately
  };
}

// Analyze trust signals
export function analyzeTrustSignals(parsed: ParsedPage, hasSSL: boolean): WebsiteAnalysis['trustSignals'] {
  const html = parsed.html.toLowerCase();
  const trustBadges: string[] = [];
  
  // Check for common trust indicators
  const trustProviders = [
    { name: 'SSL/Secure', patterns: ['ssl', 'secure', 'https', 'padlock'] },
    { name: 'Google', patterns: ['google', 'google reviews'] },
    { name: 'BBB', patterns: ['bbb', 'better business'] },
    { name: 'Norton', patterns: ['norton', 'norton secured'] },
    { name: 'McAfee', patterns: ['mcafee', 'secured by mcafee'] },
    { name: 'Trustpilot', patterns: ['trustpilot', 'trust pilot'] },
  ];
  
  for (const provider of trustProviders) {
    if (provider.patterns.some(p => html.includes(p))) {
      trustBadges.push(provider.name);
    }
  }
  
  const hasPrivacyPolicy = html.includes('privacy policy') || html.includes('privacy-policy');
  const hasTerms = html.includes('terms of service') || html.includes('terms & conditions');
  const hasTestimonials = html.includes('testimonial') || html.includes('review') || html.includes('customer said');
  
  let score = 50;
  if (hasSSL) score += 15;
  if (hasPrivacyPolicy) score += 10;
  if (hasTerms) score += 10;
  if (trustBadges.length > 0) score += 10;
  if (hasTestimonials) score += 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    hasSSL,
    hasPrivacyPolicy,
    hasTermsOfService: hasTerms,
    hasTrustBadges: trustBadges,
    hasTestimonials,
  };
}
