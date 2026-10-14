import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTenantAccess,
  canAccessTenant,
  createTenantContext,
  TenantAuthorizationError,
} from '../lib/tenant/context.mjs';
import {
  errorEnvelope,
  requestIdFromHeader,
  statusForError,
  successEnvelope,
} from '../lib/api/contracts.mjs';
import {
  canTransitionProvisioning,
  transitionProvisioning,
  ProvisioningTransitionError,
} from '../lib/provisioning/state-machine.mjs';
import { classifyHost, normalizeHost, HostResolutionError } from '../lib/routing/host.mjs';

test('tenant context requires trusted server input and prevents cross-tenant access', () => {
  assert.throws(() => createTenantContext({ businessId: 'a', userId: 'u', role: 'owner', status: 'active' }), TenantAuthorizationError);
  const context = createTenantContext({ businessId: 'business-a', userId: 'user-a', role: 'owner', status: 'active' }, { trusted: true });
  assert.equal(canAccessTenant(context, 'business-a'), true);
  assert.equal(canAccessTenant(context, 'business-b'), false);
  assert.throws(() => assertTenantAccess(context, 'business-a', ['member']), /ROLE_FORBIDDEN/);
});

test('API envelopes preserve request correlation and safe status mapping', () => {
  const requestId = requestIdFromHeader('req-12345678');
  assert.equal(requestId, 'req-12345678');
  assert.match(requestIdFromHeader('bad value'), /^[0-9a-f-]{36}$/);
  assert.deepEqual(successEnvelope({ ok: true }, requestId), { data: { ok: true }, requestId });
  assert.deepEqual(errorEnvelope('RATE_LIMITED', 'Try again later.', requestId, { retryable: true }), {
    error: { code: 'RATE_LIMITED', message: 'Try again later.', retryable: true, requestId }, data: null,
  });
  assert.equal(statusForError('FORBIDDEN'), 403);
  assert.equal(statusForError('unknown'), 500);
});

test('provisioning lifecycle accepts only documented transitions', () => {
  assert.equal(canTransitionProvisioning('requested', 'identity_verified'), true);
  assert.equal(canTransitionProvisioning('published', 'provisioning'), false);
  assert.deepEqual(transitionProvisioning('configured', 'published'), { from: 'configured', to: 'published' });
  assert.throws(() => transitionProvisioning('published', 'provisioning'), ProvisioningTransitionError);
});

test('host classification normalizes safely without claiming tenant resolution', () => {
  assert.equal(normalizeHost(' Business.Example.com. '), 'business.example.com');
  assert.deepEqual(classifyHost('alpha.example.com', { platformHost: 'app.example.com', baseDomain: 'example.com' }), {
    host: 'alpha.example.com', kind: 'business-slug', slug: 'alpha',
  });
  assert.deepEqual(classifyHost('customer-owned.test', { platformHost: 'app.example.com', baseDomain: 'example.com' }).kind, 'custom-domain');
  assert.throws(() => normalizeHost('https://example.com'), HostResolutionError);
  assert.throws(() => normalizeHost('a..example.com'), HostResolutionError);
});
