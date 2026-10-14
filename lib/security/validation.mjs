const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_SERVICE = 80;
const MAX_DETAILS = 10000;

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('INVALID_EMAIL');
  }
  return email;
}

export function validatePublicRequest(input) {
  const name = String(input?.name ?? '').trim();
  const company = String(input?.company ?? '').trim();
  const service = String(input?.service ?? '').trim();
  const details = String(input?.details ?? '').trim();
  if (name.length < 1 || name.length > MAX_NAME) throw new Error('INVALID_NAME');
  if (company.length > MAX_NAME) throw new Error('INVALID_COMPANY');
  if (service.length < 1 || service.length > MAX_SERVICE) throw new Error('INVALID_SERVICE');
  if (details.length < 1 || details.length > MAX_DETAILS) throw new Error('INVALID_DETAILS');
  return { name, company, email: normalizeEmail(input?.email), service, details };
}

function ipv4Parts(address) {
  const parts = address.split('.').map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? parts : null;
}

export function isBlockedIpv4(address) {
  const p = ipv4Parts(address);
  if (!p) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && p[2] === 113) || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 198 && b === 20);
}

export function assertSupportedPort(port) {
  if (port !== '' && port !== '80' && port !== '443') throw new Error('DISALLOWED_PORT');
}
