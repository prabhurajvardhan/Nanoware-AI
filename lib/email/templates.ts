export const EMAIL_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #0F172A; /* slate-900 */
    color: #F8FAFC; /* slate-50 */
    margin: 0;
    padding: 0;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  .logo {
    font-size: 24px;
    font-weight: 700;
    color: #F8FAFC;
    letter-spacing: -0.025em;
    text-decoration: none;
  }
  .accent {
    color: #3B82F6;
  }
  .card {
    background-color: #1E293B; /* slate-800 */
    border: 1px solid #334155; /* slate-700 */
    border-radius: 12px;
    padding: 32px;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 24px;
    color: #F8FAFC;
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
    color: #F8FAFC;
  }
  p {
    margin-top: 0;
    margin-bottom: 16px;
    color: #CBD5E1; /* slate-300 */
    font-size: 15px;
  }
  .button-container {
    margin-top: 24px;
    margin-bottom: 24px;
  }
  .button {
    display: inline-block;
    background-color: #F8FAFC; /* slate-50 */
    color: #0F172A; /* slate-900 */
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    text-align: center;
    font-size: 15px;
  }
  .button-dark {
    display: inline-block;
    background-color: #0F172A;
    color: #F8FAFC;
    border: 1px solid #334155;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    text-align: center;
    font-size: 15px;
    margin-top: 12px;
  }
  .footer {
    text-align: center;
    margin-top: 40px;
    font-size: 13px;
    color: #64748B; /* slate-500 */
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 24px;
    margin-bottom: 24px;
  }
  .data-table th, .data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #334155;
    font-size: 14px;
  }
  .data-table th {
    color: #94A3B8;
    font-weight: 500;
  }
  .data-table td {
    color: #F8FAFC;
  }
  .highlight-value {
    font-size: 36px;
    font-weight: 700;
    color: #F8FAFC;
    margin-top: 4px;
    margin-bottom: 8px;
  }
  .highlight-box {
    background-color: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .highlight-label {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94A3B8;
    font-weight: 600;
  }
  .text-sm {
    font-size: 13px;
    color: #94A3B8;
  }
`;

export const baseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${EMAIL_STYLES}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Nanoware<span class="accent">.</span>AI</div>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Nanoware AI. All rights reserved.</p>
      <p>Secure automated communication systems.</p>
    </div>
  </div>
</body>
</html>
`;

export function welcomeEmailTemplate(name: string, url: string) {
  return baseLayout(`
    <h1>Welcome to Nanoware AI.</h1>
    <p>Hello ${name},</p>
    <p>Thank you for creating an account. Our platform bridges the gap between inefficient manual processes and high-performance intelligent systems.</p>
    <p>We build production-ready AI solutions designed to reclaim lost revenue and automate complex workflows.</p>
    <div class="button-container">
      <a href="${url}/revenue-loss-calculator" class="button">Calculate Revenue Loss</a>
    </div>
    <p>If you have any initial questions or require immediate support, reply directly to this email.</p>
    <p>Best regards,<br>The Nanoware AI Team</p>
  `);
}

export function authEmailTemplate(title: string, message: string, code?: string, actionUrl?: string, actionText?: string) {
  return baseLayout(`
    <h1>${title}</h1>
    <p>${message}</p>
    
    ${code ? `
      <div class="highlight-box" style="text-align: center;">
        <div class="highlight-label">Security Code</div>
        <div class="highlight-value" style="letter-spacing: 4px;">${code}</div>
        <p class="text-sm" style="margin-bottom: 0;">This code will expire in 15 minutes.</p>
      </div>
    ` : ''}
    
    ${actionUrl && actionText ? `
      <div class="button-container">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>
    ` : ''}
    
    <p class="text-sm">If you did not request this communication, please secure your account immediately or contact support.</p>
  `);
}

export function revenueReportEmailTemplate(data: { name: string, loss: number, recoverable: number, url: string }) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  return baseLayout(`
    <h1>Your Revenue Analysis Report</h1>
    <p>Hello ${data.name},</p>
    <p>Your recent assessment via our Revenue Loss Calculator is complete. The results indicate significant potential for optimization.</p>
    
    <div class="highlight-box">
      <div class="highlight-label">Estimated Annual Revenue Loss</div>
      <div class="highlight-value">${formatCurrency(data.loss)}</div>
    </div>
    
    <div class="highlight-box" style="background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2);">
      <div class="highlight-label">Projected AI Recoverable Revenue</div>
      <div class="highlight-value" style="color: #34D399;">${formatCurrency(data.recoverable)}</div>
      <p class="text-sm" style="margin-bottom: 0;">Based on standard workflow optimization models.</p>
    </div>
    
    <h2>Business Insights</h2>
    <p>Manual processing delays and unoptimized follow-ups are creating compounding inefficiencies within your sales funnel. Implementing automated context-aware agents can recover up to 75% of these dropped leads.</p>
    
    <div class="button-container">
      <a href="${data.url}/revenue-loss-calculator/report" class="button">View Full Report</a>
      <br>
      <a href="${data.url}/contact" class="button-dark">Request Custom Solution</a>
    </div>
  `);
}

export function welcomeBackEmailTemplate(name: string, url: string) {
  return baseLayout(`
    <h1>Welcome Back!</h1>
    <p>Hello ${name},</p>
    <p>We noticed a new login to your Nanoware AI account. We're glad to see you back.</p>
    <p>Access your dashboard to check the latest updates to your projects, review reports, or request new AI solutions to further optimize your workflows.</p>
    <div class="button-container">
      <a href="${url}/dashboard" class="button">Go to Dashboard</a>
    </div>
    <p>If this login wasn't you, please secure your account immediately.</p>
  `);
}

export function requestAcceptedTemplate(name: string, service: string, url: string) {
  return baseLayout(`
    <h1>Solution Request Accepted</h1>
    <p>Hello ${name},</p>
    <p>Great news! Your request for the <strong>${service}</strong> solution has been reviewed and accepted by our engineering team.</p>
    
    <h2>What happens next?</h2>
    <p>You can now track the progress of your new solution directly from your dashboard. Our systems will automatically provision the necessary initial resources, and our team will begin the architecture phase.</p>
    
    <div class="highlight-box">
      <div class="highlight-label">Next Steps</div>
      <p style="margin-bottom: 0;">1. View your project status in the dashboard</p>
      <p style="margin-bottom: 0;">2. Provide any additional requirements if prompted</p>
      <p style="margin-bottom: 0;">3. Wait for the initial preview link</p>
    </div>
    
    <div class="button-container">
      <a href="${url}/dashboard" class="button">View Dashboard</a>
    </div>
    
    <p>We are excited to build this solution for you. If you have any further details to add, feel free to reply to this email.</p>
  `);
}

export function requestSolutionUserTemplate(name: string, service: string) {
  return baseLayout(`
    <h1>Request Received</h1>
    <p>Hello ${name},</p>
    <p>We have successfully received your request for a <strong>${service}</strong> solution.</p>
    <p>Our engineering team will review your requirements and follow up within 24 business hours to discuss architecture, timelines, and next steps.</p>
    
    <table class="data-table">
      <tr>
        <th>Status</th>
        <td>Under Review</td>
      </tr>
      <tr>
        <th>Expected Timeline</th>
        <td>Contact within 24 hours</td>
      </tr>
    </table>
    
    <p>Thank you for choosing Nanoware AI.</p>
  `);
}

export function requestSolutionAdminTemplate(data: { name: string, email: string, service: string, details: string, estimatedLoss?: number }) {
  return baseLayout(`
    <h1>New Solution Request</h1>
    <p>A new service request has been submitted.</p>
    
    <table class="data-table">
      <tr>
        <th>Client Name</th>
        <td>${data.name}</td>
      </tr>
      <tr>
        <th>Client Email</th>
        <td><a href="mailto:${data.email}" style="color: #3B82F6;">${data.email}</a></td>
      </tr>
      <tr>
        <th>Requested Service</th>
        <td>${data.service}</td>
      </tr>
      ${data.estimatedLoss ? `
      <tr>
        <th>Estimated Loss</th>
        <td>$${data.estimatedLoss.toLocaleString()}</td>
      </tr>
      ` : ''}
    </table>
    
    <h2>Request Details</h2>
    <div style="background-color: #0F172A; padding: 16px; border-radius: 8px; border: 1px solid #334155; font-size: 14px; color: #CBD5E1;">
      ${data.details}
    </div>
  `);
}

export function paymentEmailTemplate(data: { type: 'success' | 'failed' | 'invoice', amount: number, id: string, date: string, supportUrl: string }) {
  const isFailed = data.type === 'failed';
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
  
  let title = "Payment Successful";
  let message = "Your transaction has been processed successfully.";
  
  if (isFailed) {
    title = "Payment Failed";
    message = "There was an issue processing your recent payment. Please update your billing information to maintain active services.";
  } else if (data.type === 'invoice') {
    title = "Invoice Available";
    message = "A new invoice has been generated for your account.";
  }

  return baseLayout(`
    <h1>${title}</h1>
    <p>${message}</p>
    
    <div class="highlight-box" style="${isFailed ? 'background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2);' : ''}">
      <div class="highlight-label">Transaction Amount</div>
      <div class="highlight-value" style="${isFailed ? 'color: #F87171;' : ''}">${formatCurrency(data.amount)}</div>
    </div>
    
    <table class="data-table">
      <tr>
        <th>Transaction ID</th>
        <td style="font-family: monospace;">${data.id}</td>
      </tr>
      <tr>
        <th>Date</th>
        <td>${data.date}</td>
      </tr>
      <tr>
        <th>Status</th>
        <td style="${isFailed ? 'color: #F87171;' : 'color: #34D399;'}">${data.type.toUpperCase()}</td>
      </tr>
    </table>
    
    <p class="text-sm">If you have any questions regarding this transaction, contact <a href="${data.supportUrl}" style="color: #3B82F6;">billing support</a>.</p>
  `);
}

export function adminNotificationTemplate(title: string, eventType: string, summary: string, metadata: Record<string, string>, url?: string) {
  const metaRows = Object.entries(metadata).map(([key, val]) => `
    <tr>
      <th>${key}</th>
      <td>${val}</td>
    </tr>
  `).join('');

  return baseLayout(`
    <h1>${title}</h1>
    <div style="background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; padding: 12px 16px; margin-bottom: 24px; font-weight: 600; color: #60A5FA;">
      SYSTEM EVENT: ${eventType.toUpperCase()}
    </div>
    <p>${summary}</p>
    
    ${metaRows ? `
    <h2>Event Metadata</h2>
    <table class="data-table">
      ${metaRows}
    </table>
    ` : ''}
    
    ${url ? `
    <div class="button-container">
      <a href="${url}/admin" class="button">Go to Admin Panel</a>
    </div>
    ` : ''}
  `);
}
