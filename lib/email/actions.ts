'use server';

import { getResendClient } from './client';
import { sendEmailWithResend, type EmailDeliveryResult } from './delivery';
import * as templates from './templates';

const getAdminAddress = () => process.env.ADMIN_EMAIL || 'admin@nanoware.ai';
const getAppUrl = () => process.env.APP_URL || 'http://localhost:3000';

async function sendEmail(to: string, subject: string, html: string): Promise<EmailDeliveryResult> {
  return sendEmailWithResend(
    (payload) => getResendClient().emails.send(payload),
    process.env.EMAIL_FROM,
    { to, subject, html },
  );
}

function actionFailure(context: string) {
  // Context is a fixed internal label; never log exceptions, recipients, tokens, or message content.
  console.error(`Email helper failed before confirmed delivery: ${context}`);
  return { success: false as const, error: 'EMAIL_DELIVERY_UNCONFIRMED' as const };
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const delivery = await sendEmail(to, 'Welcome to Nanoware AI', templates.welcomeEmailTemplate(name, getAppUrl()));
    if (!delivery.success) return delivery;
    const admin = await sendAdminNotification(
      'New User Signup',
      'signup',
      `A new user has signed up for Nanoware AI: ${name}`,
      { Email: to, Name: name, Date: new Date().toISOString() },
    );
    if (!admin.success) return admin;
    return { success: true as const, data: delivery.data };
  } catch {
    return actionFailure('welcome');
  }
}

export async function sendAuthEmail(to: string, title: string, message: string, code?: string) {
  try {
    return await sendEmail(to, title, templates.authEmailTemplate(title, message, code));
  } catch {
    return actionFailure('authentication');
  }
}

export async function sendRevenueReportEmail(to: string, name: string, loss: number, recoverable: number) {
  try {
    const delivery = await sendEmail(to, 'Your Nanoware AI Revenue Analysis', templates.revenueReportEmailTemplate({
      name,
      loss,
      recoverable,
      url: getAppUrl(),
    }));
    if (!delivery.success) return delivery;
    const admin = await sendAdminNotification(
      'Revenue Report Generated',
      'revenue_report',
      `A user generated a revenue loss report showing an estimated loss of $${loss.toLocaleString()}.`,
      { Email: to, Name: name, 'Calculated Loss': `$${loss.toLocaleString()}` },
    );
    if (!admin.success) return admin;
    return { success: true as const, data: delivery.data };
  } catch {
    return actionFailure('revenue-report');
  }
}

export async function sendWelcomeBackEmail(to: string, name: string) {
  try {
    return await sendEmail(to, 'Welcome Back to Nanoware AI', templates.welcomeBackEmailTemplate(name, getAppUrl()));
  } catch {
    return actionFailure('welcome-back');
  }
}

export async function sendRequestAcceptedEmail(to: string, name: string, service: string) {
  try {
    const delivery = await sendEmail(to, `Update: Your request for ${service} has been accepted`, templates.requestAcceptedTemplate(name, service, getAppUrl()));
    if (!delivery.success) return delivery;
    const admin = await sendAdminNotification(
      'Service Request Accepted email sent',
      'request_accepted',
      `An acceptance email was sent to ${to} for service: ${service}`,
      { Email: to, Name: name, Service: service },
    );
    if (!admin.success) return admin;
    return { success: true as const, data: delivery.data };
  } catch {
    return actionFailure('request-accepted');
  }
}

export async function sendSolutionRequestEmails(userEmail: string, userName: string, service: string, details: string, estimatedLoss?: number) {
  try {
    const user = await sendEmail(userEmail, 'Request Received - Nanoware AI', templates.requestSolutionUserTemplate(userName, service));
    if (!user.success) return user;
    const admin = await sendEmail(
      getAdminAddress(),
      `New Solution Request: ${service}`,
      templates.requestSolutionAdminTemplate({ name: userName, email: userEmail, service, details, estimatedLoss }),
    );
    if (!admin.success) return admin;
    return { success: true as const };
  } catch {
    return actionFailure('solution-request');
  }
}

export async function sendPaymentEmail(to: string, type: 'success' | 'failed' | 'invoice', amount: number, id: string) {
  try {
    const subjectMap = {
      success: 'Payment Receipt - Nanoware AI',
      failed: 'Action Required: Payment Failed',
      invoice: 'New Invoice Available',
    };
    const delivery = await sendEmail(to, subjectMap[type], templates.paymentEmailTemplate({
      type,
      amount,
      id,
      date: new Date().toLocaleDateString(),
      supportUrl: `${getAppUrl()}/contact`,
    }));
    if (!delivery.success) return delivery;
    const admin = await sendAdminNotification(
      `Payment Event: ${type.toUpperCase()}`,
      `payment_${type}`,
      `A payment transaction for $${amount} was marked as ${type}.`,
      { Email: to, 'Transaction ID': id, Amount: `$${amount}` },
    );
    if (!admin.success) return admin;
    return { success: true as const, data: delivery.data };
  } catch {
    return actionFailure('payment');
  }
}

export async function sendAdminOtpEmail(to: string, code: string) {
  try {
    const html = templates.authEmailTemplate(
      'Admin Portal Login Verification',
      'Please use the following 6-digit code to complete your login to the Nanoware Admin Dashboard.',
      code,
    );
    return await sendEmail(to, 'Nanoware Admin Login Verification Code', html);
  } catch {
    return actionFailure('admin-otp');
  }
}

export async function sendAccountEmailVerificationEmail(to: string, name: string, verifyUrl: string) {
  try {
    return await sendEmail(to, 'Verify your Nanoware AI email address', templates.accountEmailVerificationTemplate(name, verifyUrl));
  } catch {
    return actionFailure('account-verification');
  }
}

export async function sendBusinessDomainEmailVerificationEmail(to: string, name: string, verifyUrl: string) {
  try {
    return await sendEmail(to, 'Verify your business email domain - Nanoware AI', templates.businessDomainEmailVerificationTemplate(name, verifyUrl));
  } catch {
    return actionFailure('business-domain-verification');
  }
}

export async function sendAdminNotification(title: string, eventType: string, summary: string, metadata: Record<string, string> = {}) {
  try {
    return await sendEmail(getAdminAddress(), `[SYSTEM] ${title}`, templates.adminNotificationTemplate(title, eventType, summary, metadata, getAppUrl()));
  } catch {
    return actionFailure('admin-notification');
  }
}

export async function sendBusinessVerificationStatusEmail(to: string, name: string, status: 'pending_verification' | 'pending_review' | 'verified' | 'more_information_required' | 'rejected' | 'suspended', reason?: string) {
  try {
    const subject = {
      pending_verification: 'Business verification started - Nanoware AI',
      pending_review: 'Business verification received - Nanoware AI',
      verified: 'Your business is verified - Nanoware AI',
      more_information_required: 'More information needed - Nanoware AI',
      rejected: 'Action needed on your business verification - Nanoware AI',
      suspended: 'Business access update - Nanoware AI',
    }[status];
    return await sendEmail(to, subject, templates.businessVerificationStatusTemplate({ name, status, reason, url: getAppUrl() }));
  } catch {
    return actionFailure('business-status');
  }
}
