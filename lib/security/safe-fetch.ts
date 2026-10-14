import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { assertSupportedPort, isBlockedIpv4 } from './validation.mjs';

const MAX_RESPONSE_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 10_000;
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];

function assertPublicAddress(address: string) {
  if (net.isIPv6(address)) {
    // IPv6 destination pinning is deliberately disabled until the runtime path
    // has an equivalent connection-time policy. Failing closed is safer than a
    // DNS check followed by an unpinned fetch.
    throw new Error('IPV6_DESTINATION_NOT_SUPPORTED');
  }
  if (!net.isIPv4(address) || isBlockedIpv4(address)) throw new Error('PRIVATE_DESTINATION');
}

async function resolvePublicAddress(hostname: string) {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0) throw new Error('NO_DESTINATION');
  records.forEach(({ address }) => assertPublicAddress(address));
  return records[0].address;
}

export async function fetchPublicHtml(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('DISALLOWED_SCHEME');
  assertSupportedPort(url.port);
  if (url.username || url.password) throw new Error('CREDENTIALS_NOT_ALLOWED');

  const address = await resolvePublicAddress(url.hostname);
  const transport = url.protocol === 'https:' ? https : http;
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  const path = `${url.pathname || '/'}${url.search}`;

  return await new Promise<{ html: string; status: number; headers: Record<string, string> }>((resolve, reject) => {
    let settled = false;
    let bytes = 0;
    const chunks: Buffer[] = [];
    const request = transport.request({
      hostname: address,
      port,
      path,
      method: 'GET',
      // Pin the socket to the already-screened address while preserving HTTP
      // host routing and TLS certificate validation for the original hostname.
      headers: { Host: url.host, Accept: 'text/html,application/xhtml+xml' },
      servername: url.hostname,
      timeout: REQUEST_TIMEOUT_MS,
      rejectUnauthorized: true,
    }, (response) => {
      const contentType = response.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase() || '';
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
        request.destroy(new Error('REDIRECT_NOT_ALLOWED'));
        return;
      }
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        request.destroy(new Error('UNSUPPORTED_CONTENT_TYPE'));
        return;
      }
      response.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) {
          request.destroy(new Error('RESPONSE_TOO_LARGE'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        if (settled) return;
        settled = true;
        const headers: Record<string, string> = {};
        Object.entries(response.headers).forEach(([key, value]) => {
          if (typeof value === 'string') headers[key] = value;
        });
        resolve({ html: Buffer.concat(chunks).toString('utf8'), status: response.statusCode || 0, headers });
      });
    });
    request.on('timeout', () => request.destroy(new Error('REQUEST_TIMEOUT')));
    request.on('error', (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    request.end();
  });
}
