export type SmtpConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

function parsePort(value: string | undefined) {
  if (value === undefined || value.trim() === '') return 465;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return NaN;
  return port;
}

function parseSecure(value: string | undefined, port: number) {
  if (value === undefined || value.trim() === '') return port === 465;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
}

export function readSmtpConfiguration(env: NodeJS.ProcessEnv = process.env): SmtpConfiguration | null {
  const port = parsePort(env.SMTP_PORT);
  const secure = parseSecure(env.SMTP_SECURE, port);
  const host = (env.SMTP_HOST || 'smtp.zoho.in').trim();
  const user = (env.SMTP_USER || '').trim();
  const pass = env.SMTP_PASS || '';

  if (!host || /[\s\r\n]/.test(host) || !Number.isInteger(port) || secure === null || !user || !pass) return null;
  return { host, port, secure, user, pass };
}
