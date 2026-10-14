import { isIP } from 'node:net';

const HOST_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

export class HostResolutionError extends Error {
  constructor(code) {
    super(code);
    this.name = 'HostResolutionError';
    this.code = code;
  }
}

export function normalizeHost(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 253) {
    throw new HostResolutionError('INVALID_HOST');
  }
  const host = value.trim().toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || isIP(host) || !HOST_PATTERN.test(host) || host.includes('..')) throw new HostResolutionError('INVALID_HOST');
  return host;
}

/**
 * Classifies a host only. It does not resolve a slug to a business or trust a
 * custom domain; that requires an approved hosting/DNS mapping and server lookup.
 */
export function classifyHost(value, { platformHost, baseDomain }) {
  const host = normalizeHost(value);
  const platform = normalizeHost(platformHost);
  const base = normalizeHost(baseDomain);
  if (host === platform) return { host, kind: 'platform' };
  if (host === base) return { host, kind: 'platform' };
  if (host.endsWith(`.${base}`)) {
    const slug = host.slice(0, -(base.length + 1));
    if (slug && !slug.includes('.')) return { host, kind: 'business-slug', slug };
  }
  return { host, kind: 'custom-domain' };
}
