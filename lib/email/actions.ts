'use server';

import { getResendClient } from './client';
import * as templates from './templates';

// Helper to get from address
const getFromAddress = () => {
  // Use a verified domain or default for testing
  return process.env.EMAIL_FROM || 'Nanoware AI <noreply@nanoware.ai>';
};

const getAdminAddress = () => {
  return process.env.ADMIN_EMAIL || 'admin@nanoware.ai';
};

const getAppUrl = () => {
  return process.env.APP_URL || 'http://localhost:3000';
};

/**
 * Send Welcome Email
 */
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const resend = getResendClient();
    const html = templates.welcomeEmailTemplate(name, getAppUrl());
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: 'Welcome to Nanoware AI',
      html,
    });
    
    // Also notify admin of new signup
    await sendAdminNotification(
      'New User Signup',
      'signup',
      `A new user has signed up for Nanoware AI: ${name}`,
      { Email: to, Name: name, Date: new Date().toISOString() }
    );
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Send Authentication/Security Email
 */
export async function sendAuthEmail(to: string, title: string, message: string, code?: string) {
  try {
    const resend = getResendClient();
    const html = templates.authEmailTemplate(title, message, code);
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: title,
      html,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send auth email:', error);
    return { success: false, error };
  }
}

/**
 * Send Revenue Report Email
 */
export async function sendRevenueReportEmail(to: string, name: string, loss: number, recoverable: number) {
  try {
    const resend = getResendClient();
    const html = templates.revenueReportEmailTemplate({
      name,
      loss,
      recoverable,
      url: getAppUrl()
    });
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: 'Your Nanoware AI Revenue Analysis',
      html,
    });
    
    // Notify admin
    await sendAdminNotification(
      'Revenue Report Generated',
      'revenue_report',
      `A user generated a revenue loss report showing an estimated loss of $${loss.toLocaleString()}.`,
      { Email: to, Name: name, 'Calculated Loss': `$${loss.toLocaleString()}` }
    );
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send revenue report email:', error);
    return { success: false, error };
  }
}

/**
 * Send Solution Request Emails (User & Admin)
 */
export async function sendSolutionRequestEmails(userEmail: string, userName: string, service: string, details: string, estimatedLoss?: number) {
  try {
    const resend = getResendClient();
    
    // Send to user
    const userHtml = templates.requestSolutionUserTemplate(userName, service);
    await resend.emails.send({
      from: getFromAddress(),
      to: userEmail,
      subject: 'Request Received - Nanoware AI',
      html: userHtml,
    });
    
    // Send to Admin
    const adminHtml = templates.requestSolutionAdminTemplate({
      name: userName,
      email: userEmail,
      service,
      details,
      estimatedLoss
    });
    await resend.emails.send({
      from: getFromAddress(),
      to: getAdminAddress(),
      subject: `New Solution Request: ${service}`,
      html: adminHtml,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send solution request emails:', error);
    return { success: false, error };
  }
}

/**
 * Send Payment/Invoice Email
 */
export async function sendPaymentEmail(to: string, type: 'success' | 'failed' | 'invoice', amount: number, id: string) {
  try {
    const resend = getResendClient();
    const html = templates.paymentEmailTemplate({
      type,
      amount,
      id,
      date: new Date().toLocaleDateString(),
      supportUrl: `${getAppUrl()}/contact`
    });
    
    const subjectMap = {
      success: 'Payment Receipt - Nanoware AI',
      failed: 'Action Required: Payment Failed',
      invoice: 'New Invoice Available'
    };
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: subjectMap[type],
      html,
    });
    
    // Notify admin appropriately
    await sendAdminNotification(
      `Payment Event: ${type.toUpperCase()}`,
      `payment_${type}`,
      `A payment transaction for $${amount} was marked as ${type}.`,
      { Email: to, 'Transaction ID': id, Amount: `$${amount}` }
    );
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send payment email:', error);
    return { success: false, error };
  }
}

/**
 * Generic Admin Notification
 */
export async function sendAdminNotification(title: string, eventType: string, summary: string, metadata: Record<string, string> = {}) {
  try {
    const resend = getResendClient();
    const html = templates.adminNotificationTemplate(title, eventType, summary, metadata);
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to: getAdminAddress(),
      subject: `[SYSTEM] ${title}`,
      html,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return { success: false, error };
  }
}
