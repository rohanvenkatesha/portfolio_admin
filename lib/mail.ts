import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP transport for the contact form.
 *
 * Kept out of the route handler so the "is this configured?" question can be
 * answered without constructing a transport, and so the credentials are read
 * in exactly one place.
 */

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  /** Where contact-form messages land. Defaults to the SMTP user. */
  to: string;
  /**
   * Envelope sender. Must be an address the SMTP account is allowed to send
   * as — Gmail rewrites anything else, and stricter providers reject outright,
   * which is why this is never set to the visitor's address.
   */
  from: string;
};

export function readMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 465);

  return {
    host,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS after connecting.
    secure: port === 465,
    user,
    pass,
    to: process.env.CONTACT_TO || user,
    from: process.env.SMTP_FROM || user,
  };
}

export function isMailConfigured(): boolean {
  return readMailConfig() !== null;
}

let cached: Transporter | null = null;

export function mailer(config: MailConfig): Transporter {
  // One pooled transport per process: each createTransport opens its own
  // connection pool, and a serverless instance handling a burst of submissions
  // would otherwise open one per request.
  cached ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    pool: true,
    maxConnections: 1,
  });

  return cached;
}

/** Strip CR/LF so a crafted subject can't inject extra SMTP headers. */
export function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Minimal HTML escape for the values interpolated into the email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
