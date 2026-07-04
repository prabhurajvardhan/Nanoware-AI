'use client';

import { jsPDF } from 'jspdf';
import type { AuditReport } from '@/lib/audit/types';

const colors = {
  primary: '#0F172A',
  accent: '#C6A15B',
  lightGray: '#F8FAFC',
  gray: '#64748B',
  darkGray: '#334155',
  border: '#E2E8F0',
  success: '#22C55E',
  error: '#EF4444',
};

export async function generateAuditPDF(report: AuditReport): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper functions
  const addHeader = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Nanoware AI', margin, yPos + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Growth Opportunity Audit', margin, yPos + 15);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Professional Audit Report', pageWidth - margin, yPos + 8, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const date = new Date(report.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(date, pageWidth - margin, yPos + 15, { align: 'right' });
    
    doc.setDrawColor(198, 161, 91);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 20, pageWidth - margin, yPos + 20);
    
    return yPos + 30;
  };

  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      yPos = addHeader();
    }
  };

  const addSectionTitle = (title: string) => {
    checkNewPage(20);
    yPos += 5;
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPos);
    yPos += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  const addBullet = (text: string, indent = 10) => {
    checkNewPage(8);
    doc.setFillColor(198, 161, 91);
    doc.circle(margin + indent, yPos - 1.5, 1, 'F');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
    doc.text(lines, margin + indent + 4, yPos);
    yPos += lines.length * 5 + 3;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return [22, 163, 74];
      case 'B': return [202, 138, 4];
      case 'C': return [234, 88, 12];
      default: return [220, 38, 38];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return [220, 38, 38];
      case 'High': return [217, 119, 6];
      case 'Medium': return [37, 99, 235];
      default: return [107, 114, 128];
    }
  };

  // ===== PAGE 1: Cover & Executive Summary =====
  yPos = addHeader();

  // Title
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Growth Opportunity', margin, yPos);
  yPos += 10;
  doc.text('Audit', margin, yPos);
  yPos += 8;

  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Strategic Analysis & Recommendations', margin, yPos);
  yPos += 15;

  // Business Info
  doc.setFontSize(18);
  doc.setTextColor(198, 161, 91);
  doc.setFont('helvetica', 'bold');
  doc.text(report.businessName, margin, yPos);
  yPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(report.url, margin, yPos);
  yPos += 15;

  // Score Overview
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 45, 3, 3, 'F');

  // Overall Score
  doc.setFontSize(36);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.websiteScore.overall.toString(), margin + 30, yPos + 20);
  doc.setFontSize(10);
  doc.text('Overall Score', margin + 30, yPos + 28);

  const gradeColor = getGradeColor(report.websiteScore.grade);
  doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.roundedRect(margin + 25, yPos + 32, 20, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Grade ${report.websiteScore.grade}`, margin + 28, yPos + 38);

  // Individual Scores
  const scoreX = pageWidth / 2;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text(`${report.websiteScore.ux}`, scoreX, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('UX', scoreX, yPos + 22);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text(`${report.websiteScore.performance}`, scoreX + 25, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Performance', scoreX + 25, yPos + 22);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text(`${report.websiteScore.leadCapture}`, scoreX + 55, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Lead Capture', scoreX + 55, yPos + 22);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text(`${report.websiteScore.aiReadiness}`, scoreX + 85, yPos + 15);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AI Readiness', scoreX + 85, yPos + 22);

  yPos += 55;

  // Executive Summary
  addSectionTitle('Executive Summary');
  
  // Dark box for overview
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  const overviewLines = doc.splitTextToSize(report.executiveSummary.overview, pageWidth - margin * 2 - 10);
  doc.text(overviewLines.slice(0, 5), margin + 5, yPos + 8);
  yPos += 42;

  // Two column layout for strengths/weaknesses
  const colWidth = (pageWidth - margin * 2 - 10) / 2;
  
  doc.setFontSize(11);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Strengths', margin, yPos);
  yPos += 5;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  report.executiveSummary.strengths.slice(0, 3).forEach(strength => {
    checkNewPage(8);
    addBullet(strength, 0);
  });
  
  const strengthsEndY = yPos;
  yPos = yPos - 30;
  
  doc.setFontSize(11);
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.text('Areas for Improvement', margin + colWidth + 10, yPos);
  yPos += 5;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  report.executiveSummary.weaknesses.slice(0, 3).forEach(weakness => {
    checkNewPage(8);
    const lines = doc.splitTextToSize(weakness, colWidth - 15);
    doc.setFillColor(239, 68, 68);
    doc.circle(margin + colWidth + 15, yPos - 1.5, 1, 'F');
    doc.text(lines, margin + colWidth + 20, yPos);
    yPos += lines.length * 5 + 3;
  });

  yPos = Math.max(yPos, strengthsEndY) + 10;

  // ===== PAGE 2: Opportunities =====
  doc.addPage();
  yPos = addHeader();

  addSectionTitle('Top Growth Opportunities');

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  const oppText = `Based on our comprehensive analysis, we have identified ${report.opportunities.filter(o => o.priority === 'High' || o.priority === 'Critical').length} high-priority opportunities that will have the greatest impact on your business growth.`;
  const oppLines = doc.splitTextToSize(oppText, pageWidth - margin * 2);
  doc.text(oppLines, margin, yPos);
  yPos += oppLines.length * 5 + 8;

  // Priority Opportunities
  const priorityOpps = report.opportunities.filter(o => o.priority === 'High' || o.priority === 'Critical').slice(0, 3);

  priorityOpps.forEach((opp, index) => {
    checkNewPage(60);
    
    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 55, 3, 3, 'F');
    
    // Left accent
    doc.setFillColor(198, 161, 91);
    doc.rect(margin, yPos, 3, 55, 'F');
    
    // Title and priority
    yPos += 5;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${opp.category.charAt(0).toUpperCase() + opp.category.slice(1).replace('-', ' ')}`, margin + 8, yPos);
    
    const pColor = getPriorityColor(opp.priority);
    doc.setFillColor(pColor[0], pColor[1], pColor[2]);
    doc.roundedRect(pageWidth - margin - 25, yPos - 4, 22, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(opp.priority, pageWidth - margin - 22, yPos);
    
    yPos += 7;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVATION', margin + 8, yPos);
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const obsLines = doc.splitTextToSize(opp.observation, pageWidth - margin * 2 - 20);
    doc.text(obsLines.slice(0, 2), margin + 8, yPos);
    yPos += obsLines.slice(0, 2).length * 4 + 4;
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDATION', margin + 8, yPos);
    yPos += 4;
    doc.setTextColor(198, 161, 91);
    doc.setFont('helvetica', 'bold');
    const recLines = doc.splitTextToSize(opp.recommendation, pageWidth - margin * 2 - 20);
    doc.text(recLines.slice(0, 2), margin + 8, yPos);
    yPos += recLines.slice(0, 2).length * 4 + 8;
    
    // Effort/Value tags
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Effort: ${opp.estimatedEffort}`, margin + 8, yPos);
    doc.text(`Value: ${opp.estimatedValue}`, margin + 50, yPos);
    yPos += 15;
  });

  // ===== PAGE 3: Roadmap & Pricing =====
  doc.addPage();
  yPos = addHeader();

  addSectionTitle('Phased Implementation Plan');

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  const roadmapIntro = 'We recommend a phased approach to implementation, prioritizing quick wins and critical improvements while building toward comprehensive AI-powered business transformation.';
  const roadmapLines = doc.splitTextToSize(roadmapIntro, pageWidth - margin * 2);
  doc.text(roadmapLines, margin, yPos);
  yPos += roadmapLines.length * 5 + 10;

  // Roadmap phases
  report.roadmap.forEach((phase) => {
    checkNewPage(35);
    
    // Phase number circle
    doc.setFillColor(15, 23, 42);
    doc.circle(margin + 8, yPos + 5, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(phase.phase.toString(), margin + 5.5, yPos + 7);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(phase.title, margin + 22, yPos + 3);
    doc.setTextColor(198, 161, 91);
    doc.setFontSize(9);
    doc.text(phase.timeline, margin + 22, yPos + 10);
    yPos += 15;
    
    phase.items.slice(0, 3).forEach(item => {
      checkNewPage(8);
      addBullet(item, 15);
    });
    yPos += 5;
  });

  // Pricing section
  yPos += 5;
  addSectionTitle('Investment Overview');
  
  // Implementation costs
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 50, 3, 3, 'F');
  yPos += 8;
  
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Implementation Investment', margin + 5, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  const pricingData = [
    ['Essential Package', `$${report.pricing.implementation.low.toLocaleString()}`],
    ['Standard Package', `$${report.pricing.implementation.medium.toLocaleString()}`],
    ['Premium Package', `$${report.pricing.implementation.high.toLocaleString()}`],
  ];
  
  pricingData.forEach(([label, value]) => {
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 5, yPos);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - margin - 5, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    yPos += 7;
  });
  
  // Recommended badge
  doc.setFillColor(198, 161, 91);
  doc.roundedRect(margin + 5, yPos + 3, pageWidth - margin * 2 - 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Recommended: ${report.pricing.recommendedPlan} Package • Timeline: ${report.pricing.timeline}`, pageWidth / 2, yPos + 10, { align: 'center' });
  
  yPos += 60;

  // Maintenance costs
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
  yPos += 8;
  
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Maintenance', margin + 5, yPos);
  yPos += 10;
  
  const maintData = [
    ['Basic Support', `$${report.pricing.maintenance.low}/month`],
    ['Standard Support', `$${report.pricing.maintenance.medium}/month`],
    ['Premium Support', `$${report.pricing.maintenance.high}/month`],
  ];
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  maintData.forEach(([label, value]) => {
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 5, yPos);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - margin - 5, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    yPos += 7;
  });

  // ===== PAGE 4: Next Steps =====
  doc.addPage();
  yPos = addHeader();

  addSectionTitle('Recommended Next Steps');
  
  report.executiveSummary.recommendedNextSteps.forEach(step => {
    checkNewPage(8);
    addBullet(step);
  });

  yPos += 10;
  addSectionTitle('Risk Factors to Address');
  
  report.executiveSummary.riskFactors.forEach(risk => {
    checkNewPage(8);
    doc.setFillColor(239, 68, 68);
    doc.circle(margin + 5, yPos - 1.5, 1.5, 'F');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    const riskLines = doc.splitTextToSize(risk, pageWidth - margin * 2 - 10);
    doc.text(riskLines, margin + 10, yPos);
    yPos += riskLines.length * 5 + 4;
  });

  yPos += 10;
  addSectionTitle('Key Opportunities Summary');
  
  report.executiveSummary.keyOpportunities.forEach((opp, i) => {
    checkNewPage(8);
    addBullet(opp);
  });

  yPos += 15;
  
  // CTA Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, 'F');
  yPos += 10;
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Transform Your Business?', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This audit provides a strategic roadmap for implementing AI-powered solutions.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text('Our team is ready to help you execute this plan.', pageWidth / 2, yPos, { align: 'center' });

  yPos += 20;
  addSectionTitle('About This Audit');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  const aboutText = 'This AI Growth Opportunity Audit was conducted using Nanoware AI\'s proprietary analysis methodology. All recommendations are based on verified data extracted from your website and industry best practices.';
  const aboutLines = doc.splitTextToSize(aboutText, pageWidth - margin * 2);
  doc.text(aboutLines, margin, yPos);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Confidential - Prepared for ${report.businessName}`, margin, pageHeight - 10);
    doc.text(`© 2024 Nanoware AI. Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('blob');
}

export async function downloadAuditPDF(report: AuditReport) {
  const blob = await generateAuditPDF(report);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AI-Audit-${report.businessName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
