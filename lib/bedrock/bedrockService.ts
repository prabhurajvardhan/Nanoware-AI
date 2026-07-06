/**
 * AWS Bedrock Service for AI-powered website analysis
 * Uses Amazon Nova via Bedrock in ap-southeast-2 (Sydney)
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// AWS Region - Sydney
const AWS_REGION = 'ap-southeast-2';

// Model ID - Amazon Nova Pro (most capable Nova model)
const MODEL_ID = 'amazon.nova-pro-v1:0';

// Initialize Bedrock client
let bedrockClient: BedrockRuntimeClient | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (bedrockClient) {
    return bedrockClient;
  }
  
  bedrockClient = new BedrockRuntimeClient({
    region: AWS_REGION,
  });
  
  return bedrockClient;
}

export interface WebsiteAnalysisInput {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  metaData?: Record<string, string>;
}

export interface NORAAnalysisResult {
  executiveSummary: string;
  opportunities: Array<{
    category: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    observation: string;
    businessImpact: string;
    recommendation: string;
    estimatedEffort: 'Low' | 'Medium' | 'High';
    estimatedValue: 'Low' | 'Medium' | 'High';
  }>;
  scores: {
    overall: number;
    ux: number;
    aiReadiness: number;
    leadCapture: number;
    performance: number;
    seo: number;
  };
  customerJourney: {
    current: string[];
    recommended: string[];
  };
  roadmap: Array<{
    phase: number;
    title: string;
    items: string[];
    timeline: string;
  }>;
}

/**
 * Analyze website using Amazon Nova via AWS Bedrock
 */
export async function analyzeWebsiteWithAI(
  websiteData: WebsiteAnalysisInput,
  businessInfo?: { name?: string; industry?: string }
): Promise<NORAAnalysisResult> {
  const client = getBedrockClient();
  
  const prompt = `You are NORA, a senior Digital Transformation Consultant. You analyze websites and provide strategic recommendations.

Analyze the following website and provide a comprehensive AI Growth Opportunity Audit.

Website URL: ${websiteData.url}
${businessInfo?.name ? `Business Name: ${businessInfo.name}` : ''}
${businessInfo?.industry ? `Industry: ${businessInfo.industry}` : ''}
${websiteData.title ? `Title: ${websiteData.title}` : ''}
${websiteData.description ? `Description: ${websiteData.description}` : ''}
${websiteData.content ? `Content Preview: ${websiteData.content.substring(0, 2000)}...` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "executiveSummary": "2-3 sentence professional summary of the business and key opportunities",
  "opportunities": [
    {
      "category": "lead-capture|ai-readiness|automation|seo|performance|ux|trust",
      "priority": "Critical|High|Medium|Low",
      "observation": "What you observed on the website",
      "businessImpact": "How this affects their business",
      "recommendation": "Specific actionable recommendation",
      "estimatedEffort": "Low|Medium|High",
      "estimatedValue": "Low|Medium|High"
    }
  ],
  "scores": {
    "overall": 0-100,
    "ux": 0-100,
    "aiReadiness": 0-100,
    "leadCapture": 0-100,
    "performance": 0-100,
    "seo": 0-100
  },
  "customerJourney": {
    "current": ["step1", "step2", "step3"],
    "recommended": ["step1", "step2", "step3"]
  },
  "roadmap": [
    {
      "phase": 1,
      "title": "Phase Title",
      "items": ["item1", "item2"],
      "timeline": "2-4 weeks"
    }
  ]
}`;

  // Nova uses a different API format
  const payload = {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 4096,
      temperature: 0.7,
    },
  };

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const result = JSON.parse(responseBody);

    // Extract text from Nova's response format
    if (result.message?.content?.[0]?.text) {
      const jsonStr = result.message.content[0].text;
      return JSON.parse(jsonStr);
    }

    // Fallback: try parsing directly
    return JSON.parse(responseBody);
  } catch (error) {
    console.error('[Bedrock] Error analyzing website:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate NORA's conversational response using Nova
 */
export async function generateNORAResponse(
  userMessage: string,
  context: {
    businessName?: string;
    scores?: NORAAnalysisResult['scores'];
    opportunities?: NORAAnalysisResult['opportunities'];
  }
): Promise<string> {
  const client = getBedrockClient();

  const prompt = `You are NORA, a senior Digital Transformation Consultant at Nanoware AI. You provide strategic, business-focused guidance.

IMPORTANT RULES:
- Never say "As an AI..."
- Be professional, strategic, and business-focused
- Keep responses concise but valuable
- Act like a McKinsey consultant

Context:
- Business: ${context.businessName || 'The client'}
- Overall Score: ${context.scores?.overall || 'Not yet assessed'}
- AI Readiness: ${context.scores?.aiReadiness || 'Not yet assessed'}/100
- Lead Capture: ${context.scores?.leadCapture || 'Not yet assessed'}/100

User's question: ${userMessage}

Respond as NORA would - professionally, strategically, and helpfully. Keep responses to 2-4 sentences.`;

  // Nova format
  const payload = {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 512,
      temperature: 0.7,
    },
  };

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const result = JSON.parse(responseBody);

    if (result.message?.content?.[0]?.text) {
      return result.message.content[0].text;
    }

    return 'I appreciate your question. Based on your audit, I recommend we discuss your specific challenges in detail during our strategy session.';
  } catch (error) {
    console.error('[Bedrock] Error generating NORA response:', error);
    return 'I understand your question. Let me provide more detailed insights when we connect for your strategy session.';
  }
}

/**
 * Get model information
 */
export function getModelInfo() {
  return {
    provider: 'AWS Bedrock',
    region: AWS_REGION,
    model: MODEL_ID,
    modelName: 'Amazon Nova Pro',
    description: 'Amazon Nova Pro via AWS Bedrock in Sydney (ap-southeast-2)',
  };
}
