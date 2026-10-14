const SECRET = /token|secret|password|otp|prompt|authorization|cookie|api.?key|payment/i;
const SENSITIVE_VALUE = /bearer\s|sk-[a-z0-9]|AIza[a-z0-9_-]{10,}|(?:secret|password|token)\s*=/i;

export class AuditEventError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AuditEventError';
    this.code = code;
  }
}

export function createAuditEvent(input) {
  if (!input?.action || !input?.result || !input?.correlationId || !input?.actorClass) throw new AuditEventError('AUDIT_FIELDS_REQUIRED');
  const details = {};
  for (const [key, value] of Object.entries(input.details ?? {})) {
    if (!SECRET.test(key) && typeof value !== 'object') {
      const safeValue = String(value).slice(0, 200);
      if (!SENSITIVE_VALUE.test(safeValue)) details[key] = safeValue;
    }
  }
  return Object.freeze({
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    environment: input.environment ?? 'unknown',
    route: input.route ?? null,
    correlationId: input.correlationId,
    actorClass: input.actorClass,
    businessId: input.businessId ?? null,
    action: input.action,
    result: input.result,
    errorCode: input.errorCode ?? null,
    details,
  });
}
