const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export const TENANT_ROLES = Object.freeze(['owner', 'admin', 'member', 'operator']);

export class TenantAuthorizationError extends Error {
  constructor(code = 'TENANT_FORBIDDEN') {
    super(code);
    this.name = 'TenantAuthorizationError';
    this.code = code;
  }
}

function validId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/**
 * Create a tenant context only from a server-trusted membership lookup.
 * Client-provided business IDs and roles must never be passed as trusted=true.
 */
export function createTenantContext(input, { trusted = false } = {}) {
  if (!trusted) throw new TenantAuthorizationError('UNTRUSTED_TENANT_CONTEXT');
  if (!input || !validId(input.businessId) || !validId(input.userId)) {
    throw new TenantAuthorizationError('INVALID_TENANT_CONTEXT');
  }
  if (!TENANT_ROLES.includes(input.role) || input.status !== 'active') {
    throw new TenantAuthorizationError('INACTIVE_TENANT_MEMBERSHIP');
  }
  return Object.freeze({
    businessId: input.businessId,
    userId: input.userId,
    role: input.role,
    status: 'active',
  });
}

export function assertTenantAccess(context, businessId, allowedRoles = TENANT_ROLES) {
  if (!context || !validId(businessId) || context.businessId !== businessId) {
    throw new TenantAuthorizationError('TENANT_FORBIDDEN');
  }
  if (!allowedRoles.includes(context.role)) {
    throw new TenantAuthorizationError('ROLE_FORBIDDEN');
  }
  return context;
}

export function canAccessTenant(context, businessId, allowedRoles = TENANT_ROLES) {
  try {
    assertTenantAccess(context, businessId, allowedRoles);
    return true;
  } catch {
    return false;
  }
}
