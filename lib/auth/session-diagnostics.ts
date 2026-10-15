const SENSITIVE_ASSIGNMENT = /\b([A-Z0-9_]*(?:access|refresh|id)[_-]?token|[A-Z0-9_]*authorization|[A-Z0-9_]*(?:service[_-]?)?account[_-]?(?:json|key)|[A-Z0-9_]*private[_-]?key|[A-Z0-9_]*api[_-]?key|[A-Z0-9_]*password|[A-Z0-9_]*secret)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi;

export function sanitizeSessionDiagnostic(value: unknown, limit = 2_000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]*)?/g, '[REDACTED TOKEN]')
    .replace(/\bAIza[A-Za-z0-9_-]{30,}\b/g, '[REDACTED KEY]')
    .replace(SENSITIVE_ASSIGNMENT, '$1=[REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]')
    .slice(0, limit);
}

export function sessionErrorDetails(error: unknown) {
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const name = typeof value.name === 'string'
    ? value.name
    : error instanceof Error ? error.constructor.name : typeof error;
  const message = typeof value.message === 'string'
    ? value.message
    : typeof error === 'string' ? error : String(error);
  return {
    errorName: sanitizeSessionDiagnostic(name, 120),
    errorCode: sanitizeSessionDiagnostic(typeof value.code === 'string' ? value.code : '', 120) || undefined,
    errorMessage: sanitizeSessionDiagnostic(message),
    errorStack: sanitizeSessionDiagnostic(typeof value.stack === 'string' ? value.stack : '', 4_000) || undefined,
  };
}
