import 'server-only';

import nodemailer, { type Transporter } from 'nodemailer';
import { readSmtpConfiguration } from './smtp-config';

export type { SmtpConfiguration } from './smtp-config';

type SmtpTransport = Pick<Transporter, 'sendMail'>;

let smtpTransport: SmtpTransport | null = null;

export function getSmtpTransport(): SmtpTransport {
  if (smtpTransport) return smtpTransport;
  const configuration = readSmtpConfiguration();
  if (!configuration) throw new TypeError('EMAIL_CONFIGURATION_INVALID');

  smtpTransport = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: { user: configuration.user, pass: configuration.pass },
    pool: false,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return smtpTransport;
}
