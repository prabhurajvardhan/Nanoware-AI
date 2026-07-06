'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GlobalChatWidgetProps {
  currentPage?: string;
  auditData?: {
    score?: number;
    businessName?: string;
    opportunities?: number;
  };
}

const SUGGESTED_QUESTIONS = [
  { label: 'What services do you offer?', quick: 'services' },
  { label: 'Show me your portfolio', quick: 'portfolio' },
  { label: 'How does the AI audit work?', quick: 'audit' },
  { label: 'What are your pricing?', quick: 'pricing' },
];

const PAGE_CONTEXT: Record<string, string> = {
  '/': 'You are on the homepage - showcasing our AI-powered business solutions',
  '/services': 'You are viewing our services page',
  '/projects': 'You are viewing our portfolio of completed projects',
  '/contact': 'You are on the contact page',
  '/about': 'You are learning about Nanoware AI',
};

export default function GlobalChatWidget({ currentPage = '/', auditData }: GlobalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI assistant from Nanoware AI. I can help you with:\n\n• Understanding our services\n• Explaining our AI audit process\n• Navigating the website\n• Answering questions about your business\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateResponse = async (userMessage: string): Promise<string> => {
    // In production, this would call your AI API
    // For now, provide contextual responses
    
    const lowerMessage = userMessage.toLowerCase();
    const pageContext = PAGE_CONTEXT[currentPage] || '';
    
    // Service inquiries
    if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
      return `At Nanoware AI, we offer:\n\n• **Custom Web Development** - Websites, web apps, dashboards\n• **AI Integration** - Custom AI solutions, automation\n• **Business Automation** - Workflows, CRM integration\n• **AI Business Audits** - Analyze your website for AI readiness\n\nWould you like to schedule a consultation?`;
    }
    
    // Pricing inquiries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      return `Our pricing is tailored to your specific needs. We offer:\n\n• **Project-based** - Fixed scope projects\n• **Retainer** - Ongoing partnership\n• **AI Audit** - Free initial analysis\n\nThe best way to get accurate pricing is through a free consultation. Would you like me to connect you with our team?`;
    }
    
    // Portfolio/Projects
    if (lowerMessage.includes('portfolio') || lowerMessage.includes('project') || lowerMessage.includes('work')) {
      return `We've delivered 50+ projects across:\n\n• SaaS platforms\n• E-commerce solutions\n• AI integrations\n• Business automations\n• Custom web applications\n\nYou can view our full portfolio on our Projects page. Would you like me to take you there?`;
    }
    
    // AI Audit specific
    if (lowerMessage.includes('audit') || lowerMessage.includes('analyze')) {
      return `Our AI Business Audit is a comprehensive analysis of your website:\n\n• **UX Score** - User experience evaluation\n• **AI Readiness** - How prepared you are for AI integration\n• **Lead Capture** - Opportunities to capture leads\n• **SEO & Performance** - Technical analysis\n• **Personalized Roadmap** - Actionable recommendations\n\nYou can start a free audit right now by entering your website URL. Want me to guide you there?`;
    }
    
    // Contact
    if (lowerMessage.includes('contact') || lowerMessage.includes('talk') || lowerMessage.includes('schedule') || lowerMessage.includes('meeting')) {
      return `I'd be happy to help you connect with our team!\n\nYou can reach us at:\n• Email: hello@nanoware.ai\n• Schedule a call directly\n\nOr I can take you to our contact page right now.`;
    }
    
    // Navigation help
    if (lowerMessage.includes('navigate') || lowerMessage.includes('go to') || lowerMessage.includes('take me')) {
      if (lowerMessage.includes('service')) return 'I\'ll take you to our services page.';
      if (lowerMessage.includes('project') || lowerMessage.includes('portfolio')) return 'I\'ll take you to our projects page.';
      if (lowerMessage.includes('contact')) return 'I\'ll take you to our contact page.';
      if (lowerMessage.includes('home')) return 'I\'ll take you to the homepage.';
      return 'Just use the navigation menu at the top to explore our website, or tell me where you\'d like to go!';
    }
    
    // Default contextual response
    return `Thanks for your question! I'm here to help you understand Nanoware AI's capabilities.\n\n${pageContext}\n\nWould you like to:\n• Learn about our services\n• See our portfolio\n• Start a free AI audit\n• Schedule a consultation`;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const response = await generateResponse(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or reach out to our team directly at hello@nanoware.ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleQuickAction = (quick: string) => {
    const quickMessages: Record<string, string> = {
      services: 'What services do you offer?',
      portfolio: 'Show me your portfolio',
      audit: 'How does the AI audit work?',
      pricing: 'What are your pricing options?',
    };
    
    if (quickMessages[quick]) {
      setInput(quickMessages[quick]);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#C6A15B] to-[#b8944d] rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6 text-white" />
              {/* Notification dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with us!
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-48px)] h-[32rem] max-h-[calc(100vh-160px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0F172A] to-slate-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">NORA Assistant</h3>
                <p className="text-slate-400 text-xs">AI-powered help • Usually responds instantly</p>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-slate-400 text-xs">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#C6A15B] text-white rounded-br-md'
                        : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white text-slate-700 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-slate-100">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q.quick}
                    onClick={() => handleQuickAction(q.quick)}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full whitespace-nowrap transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A15B] focus:bg-white transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 bg-[#C6A15B] hover:bg-[#b8944d] disabled:bg-slate-300 rounded-xl flex items-center justify-center transition-colors"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              
              <div className="mt-3 flex items-center justify-center gap-4">
                <Link 
                  href="/contact" 
                  className="text-xs text-slate-400 hover:text-[#C6A15B] flex items-center gap-1 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Schedule a call <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-slate-300">•</span>
                <Link 
                  href="/" 
                  className="text-xs text-slate-400 hover:text-[#C6A15B] flex items-center gap-1 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Try AI Audit <Sparkles className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
