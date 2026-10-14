import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireLocalConcurrency, RateLimitError, rateLimitResponse } from '../lib/security/concurrency.mjs';

test('local concurrency saturation returns a retryable 429 and cleanup is idempotent', () => {
  const releases = [];
  try {
    for (let index = 0; index < 32; index += 1) releases.push(acquireLocalConcurrency());
    assert.throws(() => acquireLocalConcurrency(), (error) => error instanceof RateLimitError && error.retryAfterSeconds === 5);
    const response = rateLimitResponse(new RateLimitError(5));
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '5');
  } finally {
    for (const release of releases) {
      release();
      release();
    }
  }

  const release = acquireLocalConcurrency();
  release();
  assert.doesNotThrow(release);
});
