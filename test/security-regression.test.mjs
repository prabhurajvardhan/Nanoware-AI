import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, normalizeEmail, validatePublicRequest, isBlockedIpv4, assertSupportedPort } from '../lib/security/validation.mjs';

test('HTML email values are escaped in every special-character context', () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`), '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;');
});

test('public request validation normalizes email and enforces bounds', () => {
  const value = validatePublicRequest({ name: '  Client ', email: ' CLIENT@Example.COM ', company: '', service: 'AI Services', details: 'Need an assistant' });
  assert.equal(value.email, 'client@example.com');
  assert.equal(value.name, 'Client');
  assert.throws(() => validatePublicRequest({ name: '', email: 'a@b.com', service: 'AI', details: 'x' }), /INVALID_NAME/);
  assert.throws(() => validatePublicRequest({ name: 'A', email: 'not-an-email', service: 'AI', details: 'x' }), /INVALID_EMAIL/);
});

test('private and reserved IPv4 destinations are blocked', () => {
  for (const address of ['0.0.0.0', '10.0.0.1', '127.0.0.1', '169.254.1.1', '172.16.0.1', '192.168.1.1', '224.0.0.1']) {
    assert.equal(isBlockedIpv4(address), true, address);
  }
  assert.equal(isBlockedIpv4('8.8.8.8'), false);
});

test('outbound ports are explicitly constrained', () => {
  assert.doesNotThrow(() => assertSupportedPort(''));
  assert.doesNotThrow(() => assertSupportedPort('80'));
  assert.doesNotThrow(() => assertSupportedPort('443'));
  assert.throws(() => assertSupportedPort('8080'), /DISALLOWED_PORT/);
});
