import { domainToASCII } from 'node:url';

function normalizeDomain(value: string) {
  const raw = value.trim().toLowerCase().replace(/\.$/, '');
  return domainToASCII(raw).replace(/\.$/, '').replace(/^www\./, '');
}

export function websiteDomain(value: string) {
  try {
    const parsed = new URL(value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`);
    if (parsed.username || parsed.password || !parsed.hostname) return '';
    return normalizeDomain(parsed.hostname);
  } catch { return ''; }
}

export function emailDomain(value: string) {
  const at = value.lastIndexOf('@');
  return at > 0 ? normalizeDomain(value.slice(at + 1)) : '';
}

export function domainMatchesWebsite(email: string, website: string) {
  const domain = emailDomain(email);
  const host = websiteDomain(website);
  return !!domain && !!host && (domain === host || domain.endsWith(`.${host}`));
}
