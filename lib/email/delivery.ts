export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

type EmailDeliveryFailureCode = 'EMAIL_CONFIGURATION_INVALID' | 'EMAIL_DELIVERY_UNCONFIRMED';

export type EmailDeliveryResult =
  | { success: true; data: { id: string; [key: string]: unknown }; emailId: string }
  | { success: false; error: EmailDeliveryFailureCode };

type ResendPayload = EmailMessage & { from: string };
type ResendSend = (payload: ResendPayload) => Promise<unknown>;

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

export function validateEmailFrom(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('EMAIL_CONFIGURATION_INVALID');
  const sender = value.trim();
  if (!sender || sender.length > 320 || /[\r\n\u0000]/.test(sender)) throw new TypeError('EMAIL_CONFIGURATION_INVALID');

  let address = sender;
  if (sender.includes('<') || sender.includes('>')) {
    const match = /^(?:"([^"\r\n]+)"|([^<>\r\n]+))\s*<([^<>\s]+)>$/.exec(sender);
    const displayName = (match?.[1] || match?.[2] || '').trim();
    if (!match || !displayName) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
    address = match[3];
  }
  if (!validEmailAddress(address)) throw new TypeError('EMAIL_CONFIGURATION_INVALID');
  return sender;
}

function failure(error: EmailDeliveryFailureCode): EmailDeliveryResult {
  // Log only a fixed category. Never include provider errors, recipients, tokens, sender values, or email content.
  console.error('Email delivery could not be confirmed:', error);
  return { success: false, error };
}

export async function sendEmailWithResend(
  send: ResendSend,
  senderValue: unknown,
  message: EmailMessage,
): Promise<EmailDeliveryResult> {
  let from: string;
  try {
    from = validateEmailFrom(senderValue);
  } catch {
    return failure('EMAIL_CONFIGURATION_INVALID');
  }

  try {
    const response: unknown = await send({ from, ...message });
    if (!response || typeof response !== 'object') return failure('EMAIL_DELIVERY_UNCONFIRMED');

    const result = response as { data?: unknown; error?: unknown };
    const hasError = Object.prototype.hasOwnProperty.call(result, 'error')
      && result.error !== undefined
      && result.error !== null;
    if (hasError || !result.data || typeof result.data !== 'object') return failure('EMAIL_DELIVERY_UNCONFIRMED');

    const data = result.data as Record<string, unknown>;
    if (typeof data.id !== 'string' || !data.id.trim()) return failure('EMAIL_DELIVERY_UNCONFIRMED');
    return { success: true, data: data as { id: string; [key: string]: unknown }, emailId: data.id };
  } catch {
    return failure('EMAIL_DELIVERY_UNCONFIRMED');
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
