const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9 ()().-]{7,24}$/;

export class CustomerValidationError extends Error {
  constructor(code) {
    super(code);
    this.name = 'CustomerValidationError';
    this.code = code;
  }
}

export function normalizeCustomerContact({ email, phone }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.replace(/[ ()().-]/g, '') : '';
  if (!normalizedEmail && !normalizedPhone) throw new CustomerValidationError('CONTACT_REQUIRED');
  if (normalizedEmail && !EMAIL.test(normalizedEmail)) throw new CustomerValidationError('INVALID_EMAIL');
  if (normalizedPhone && !PHONE.test(normalizedPhone)) throw new CustomerValidationError('INVALID_PHONE');
  return Object.freeze({ email: normalizedEmail || null, phone: normalizedPhone || null });
}

export function customerKey(businessId, contact) {
  if (typeof businessId !== 'string' || !businessId || !contact) throw new CustomerValidationError('BUSINESS_CONTEXT_REQUIRED');
  const normalized = normalizeCustomerContact(contact);
  const value = normalized.email ?? normalized.phone;
  return `${businessId}:${value}`;
}

export function privateCustomerProjection(record, { businessId, role } = {}) {
  if (!record || !['owner', 'member', 'operator'].includes(role) || record.businessId !== businessId) throw new CustomerValidationError('CUSTOMER_FORBIDDEN');
  return Object.freeze({
    id: record.id,
    businessId: record.businessId,
    displayName: record.displayName ?? null,
    contact: normalizeCustomerContact(record.contact ?? {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
