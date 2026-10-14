const LOCAL_LIMIT = 32;
let activeLocalRequests = 0;

export class RateLimitError extends Error {
  constructor(retryAfterSeconds) {
    super('RATE_LIMITED');
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function acquireLocalConcurrency() {
  if (activeLocalRequests >= LOCAL_LIMIT) throw new RateLimitError(5);
  activeLocalRequests += 1;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      activeLocalRequests = Math.max(0, activeLocalRequests - 1);
    }
  };
}

export function rateLimitResponse(error) {
  if (!(error instanceof RateLimitError)) return null;
  return new Response(JSON.stringify({ error: 'Too many requests. Please retry later.' }), {
    status: 429,
    headers: { 'content-type': 'application/json', 'retry-after': String(error.retryAfterSeconds) },
  });
}
