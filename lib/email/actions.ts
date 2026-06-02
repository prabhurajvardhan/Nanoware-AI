'use server';

import { getResendClient } from './client';
import * as templates from './templates';

// Helper to get from address
const getFromAddress = () => {
  // Use a verified domain or default for testing
  return process.env.EMAIL_FROM || 'hello@nanowareai.in';
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
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error?.message || String(error) };
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
  } catch (error: any) {
    console.error('Failed to send auth email:', error);
    return { success: false, error: error?.message || String(error) };
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
  } catch (error: any) {
    console.error('Failed to send revenue report email:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Send Welcome Back Email
 */
export async function sendWelcomeBackEmail(to: string, name: string) {
  try {
    const resend = getResendClient();
    const html = templates.welcomeBackEmailTemplate(name, getAppUrl());
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: 'Welcome Back to Nanoware AI',
      html,
    });
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send welcome back email:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Send Request Accepted Email
 */
export async function sendRequestAcceptedEmail(to: string, name: string, service: string) {
  try {
    const resend = getResendClient();
    const html = templates.requestAcceptedTemplate(name, service, getAppUrl());
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: `Update: Your request for ${service} has been accepted`,
      html,
    });
    
    // Also notify admin that the acceptance email was successfully sent
    await sendAdminNotification(
      'Service Request Accepted email sent',
      'request_accepted',
      `An acceptance email was sent to ${to} for service: ${service}`,
      { Email: to, Name: name, Service: service }
    );
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send request accepted email:', error);
    return { success: false, error: error?.message || String(error) };
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
  } catch (error: any) {
    console.error('Failed to send solution request emails:', error);
    return { success: false, error: error?.message || String(error) };
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
  } catch (error: any) {
    console.error('Failed to send payment email:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Send OTP for 2-Step Verification
 */
export async function sendAdminOtpEmail(to: string, code: string) {
  try {
    const resend = getResendClient();
    const html = templates.authEmailTemplate(
      'Admin Portal Login Verification',
      'Please use the following 6-digit code to complete your login to the Nanoware Admin Dashboard.',
      code
    );
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: 'Nanoware Admin Login Verification Code',
      html,
    });
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send Admin OTP email:', error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Generic Admin Notification
 */
export async function sendAdminNotification(title: string, eventType: string, summary: string, metadata: Record<string, string> = {}) {
  try {
    const resend = getResendClient();
    const html = templates.adminNotificationTemplate(title, eventType, summary, metadata, getAppUrl());
    
    const data = await resend.emails.send({
      from: getFromAddress(),
      to: getAdminAddress(),
      subject: `[SYSTEM] ${title}`,
      html,
    });
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send admin notification:', error);
    return { success: false, error: error?.message || String(error) };
  }
}
