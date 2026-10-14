import { randomUUID } from 'node:crypto';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export const ERROR_STATUS = Object.freeze({
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  DEPENDENCY: 503,
  INTERNAL: 500,
});

export function requestIdFromHeader(value) {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value) ? value : randomUUID();
}

export function successEnvelope(data, requestId) {
  return { data: data ?? null, requestId };
}

export function errorEnvelope(code, message, requestId, { retryable = false } = {}) {
  return {
    error: { code, message, retryable, requestId },
    data: null,
  };
}

export function statusForError(code) {
  return ERROR_STATUS[code] ?? ERROR_STATUS.INTERNAL;
}
