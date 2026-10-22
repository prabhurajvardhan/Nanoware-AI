export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

type EmailDeliveryFailureCode = 'EMAIL_CONFIGURATION_INVALID' | 'EMAIL_AUTH_FAILED' | 'EMAIL_DELIVERY_UNCONFIRMED';

export type EmailDeliveryResult =
  | { success: true; data: { messageId: string; [key: string]: unknown }; emailId: string }
  | { success: false; error: EmailDeliveryFailureCode };

type SmtpSendInfo = {
  messageId?: unknown;
  accepted?: unknown;
  rejected?: unknown;
};

type SmtpTransportLike = {
  sendMail: (message: { from: string; to: string; subject: string; html: string }) => Promise<unknown>;
};

export type EmailFailureCode = EmailDeliveryFailureCode;

const LOCAL_PART = /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const DOMAIN_LABEL = /^(?=.{1,63}$)[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i;

function validEmailAddress(value: string) {
  if (value.length > 254 || /[\s<>\r\n]/.test(value)) return false;
  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const labels = domain.split('.');
  return LOCAL_PART.test(local)
    && labels.length >= 2
    && labels.every((label) => DOMAIN_LABEL.test(label))
    && /^[A-Z]{2,63}$/i.test(labels.at(-1) || '');
}

export function extractEmailAddress(value: string): string {
  let address = value.trim();
  if (address.includes('<') || address.includes('>')) {
    const match = /^(?:"([^"\r\n]+)"|([^<>\r\n]+))\s*<([^<>\s]+)>$/.exec(address);
    const displayName = (match?.[1] || match?.[2] || '').trim();
    if (!match || !displayName) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
    address = match[3];
  }
  if (!validEmailAddress(address)) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
  return address;
}

export function validateEmailFrom(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('EMAIL_CONFIGURATION_INVALID');
  const sender = value.trim();
  if (!sender || sender.length > 320 || /[\r\n\u0000]/.test(sender)) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
  extractEmailAddress(sender);
  return sender;
}

function logFailure(category: EmailDeliveryFailureCode, error?: unknown) {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const code = typeof record.code === 'string' && /^[A-Z0-9_-]{1,32}$/.test(record.code) ? record.code : undefined;
  const responseCode = typeof record.responseCode === 'number' && Number.isInteger(record.responseCode)
    ? record.responseCode
    : undefined;
  // Only fixed categories and protocol error codes are logged. Never log raw error, message, address or body.
  console.error('Email delivery failed:', {
    category,
    ...(code ? { code } : {}),
    ...(responseCode !== undefined ? { responseCode } : {}),
  });
}

function failure(category: EmailDeliveryFailureCode, error?: unknown): EmailDeliveryResult {
  logFailure(category, error);
  return { success: false, error: category };
}

function acceptedAddressMatches(accepted: unknown, recipient: string) {
  if (!Array.isArray(accepted)) return false;
  const normalizedRecipient = recipient.trim().toLowerCase();
  return accepted.some((item) => {
    const address = typeof item === 'string'
      ? item
      : item && typeof item === 'object' && typeof (item as { address?: unknown }).address === 'string'
        ? (item as { address: string }).address
        : '';
    return address.trim().toLowerCase() === normalizedRecipient;
  });
}

function noRejectedRecipients(rejected: unknown) {
  return Array.isArray(rejected) && rejected.length === 0;
}

export async function sendEmailWithTransport(
  transport: SmtpTransportLike | null,
  senderValue: unknown,
  smtpUserValue: unknown,
  message: EmailMessage,
): Promise<EmailDeliveryResult> {
  let from: string;
  let authenticatedUser: string;
  try {
    from = validateEmailFrom(senderValue);
    if (typeof smtpUserValue !== 'string' || !smtpUserValue.trim()) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
    authenticatedUser = extractEmailAddress(smtpUserValue.trim());
    if (typeof message.to !== 'string' || !validEmailAddress(message.to.trim())) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
  } catch {
    return failure('EMAIL_CONFIGURATION_INVALID');
  }

  if (!transport) return failure('EMAIL_CONFIGURATION_INVALID');

  const fromAddress = extractEmailAddress(from);
  if (fromAddress.toLowerCase() !== authenticatedUser.toLowerCase()) {
    // A different From may be a verified Zoho alias; surface only a fixed warning code.
    console.warn('Email sender configuration warning: EMAIL_FROM_DIFFERS_FROM_SMTP_USER');
  }

  try {
    const response: unknown = await transport.sendMail({ from, ...message });
    if (!response || typeof response !== 'object') return failure('EMAIL_DELIVERY_UNCONFIRMED');
    const info = response as SmtpSendInfo;
    if (typeof info.messageId !== 'string' || !info.messageId.trim()) return failure('EMAIL_DELIVERY_UNCONFIRMED');
    if (!acceptedAddressMatches(info.accepted, message.to)) return failure('EMAIL_DELIVERY_UNCONFIRMED');
    if (!noRejectedRecipients(info.rejected)) return failure('EMAIL_DELIVERY_UNCONFIRMED');
    return {
      success: true,
      emailId: info.messageId,
      data: { messageId: info.messageId },
    };
  } catch (error) {
    const providerCode = error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
    return failure(providerCode === 'EAUTH' ? 'EMAIL_AUTH_FAILED' : 'EMAIL_DELIVERY_UNCONFIRMED', error);
  }
}

export async function attemptVerificationEmail(
  send: () => Promise<EmailDeliveryResult>,
  invalidate: () => Promise<boolean>,
): Promise<{ success: true; tokenInvalidated: false } | { success: false; tokenInvalidated: boolean }> {
  try {
    const result = await send();
    if (result?.success === true && typeof result.emailId === 'string' && result.emailId.trim()) {
      return { success: true, tokenInvalidated: false };
    }
  } catch {
    // Treat unexpected delivery exceptions exactly like an unconfirmed provider response.
  }

  let tokenInvalidated = false;
  try {
    tokenInvalidated = await invalidate();
  } catch {
    // The route still returns a retryable failure and logs only a request identifier.
  }
  return { success: false, tokenInvalidated };
}
