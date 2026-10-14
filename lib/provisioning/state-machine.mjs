export const PROVISIONING_STATES = Object.freeze([
  'requested',
  'identity_verified',
  'provisioning',
  'configured',
  'published',
  'failed',
  'suspended',
]);

const TRANSITIONS = Object.freeze({
  requested: ['identity_verified', 'failed', 'suspended'],
  identity_verified: ['provisioning', 'failed', 'suspended'],
  provisioning: ['configured', 'failed', 'suspended'],
  configured: ['published', 'provisioning', 'failed', 'suspended'],
  published: ['configured', 'suspended'],
  failed: ['requested', 'identity_verified', 'provisioning', 'suspended'],
  suspended: ['requested', 'identity_verified', 'provisioning'],
});

export class ProvisioningTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid provisioning transition: ${from} -> ${to}`);
    this.name = 'ProvisioningTransitionError';
    this.code = 'INVALID_PROVISIONING_TRANSITION';
    this.from = from;
    this.to = to;
  }
}

export function canTransitionProvisioning(from, to) {
  return PROVISIONING_STATES.includes(from) && TRANSITIONS[from]?.includes(to) === true;
}

export function transitionProvisioning(from, to) {
  if (!canTransitionProvisioning(from, to)) throw new ProvisioningTransitionError(from, to);
  return { from, to };
}
