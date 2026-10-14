import test from 'node:test';
import assert from 'node:assert/strict';

const { fetchPublicHtml } = await import('../lib/security/safe-fetch.ts');

for (const [name, url, expected] of [
  ['loopback IPv4', 'http://127.0.0.1', 'PRIVATE_DESTINATION'],
  ['IPv6 loopback', 'http://[::1]', null],
  ['unsupported scheme', 'ftp://example.com', 'DISALLOWED_SCHEME'],
  ['unapproved port', 'http://example.com:8080', 'DISALLOWED_PORT'],
  ['embedded credentials', 'https://user:pass@example.com', 'CREDENTIALS_NOT_ALLOWED'],
]) {
  test(`safe-fetch rejects ${name}`, async () => {
    await assert.rejects(fetchPublicHtml(url), (error) => expected ? error?.message === expected : Boolean(error));
  });
}
