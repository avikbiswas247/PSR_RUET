import nodemailer from "nodemailer";

export function createMailTransporter() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
  const secure = (process.env.SMTP_SECURE || process.env.MAIL_SECURE) === "true";
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.MAIL_APP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("Mail provider is not configured. Set SMTP_* or MAIL_* credentials.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Mail provider port is invalid.");
  }

  const from = process.env.SMTP_FROM || process.env.MAIL_FROM || `PSR <${user}>`;
  return {
    transporter: nodemailer.createTransport({ host, port, secure, auth: { user, pass } }),
    from,
  };
}
