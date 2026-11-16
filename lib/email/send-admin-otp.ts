"use server";

import nodemailer from "nodemailer";

export interface SendAdminOtpInput {
  to: string;
  userId: string;
  code: string;
  purpose: "email_verification" | "password_reset" | "login";
  expiresInMinutes: number;
}

export interface SendAdminInvitationInput {
  to: string;
  invitationUrl: string;
  invitedBy: string;
  expiresInHours: number;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("Mail provider is not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM || `PSR Admin <${process.env.SMTP_USER}>`;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

function brandLogo() {
  return `
    <img src="${APP_BASE_URL}/psr-logo-dark.png" width="300" alt="PSR — Photographic Society" style="display:block;width:300px;max-width:100%;height:auto;" />
  `;
}

function button(url: string, text: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display:inline-block;background:#ff7417;color:#14110f;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;">${text}</a>
        </td>
      </tr>
    </table>
  `;
}

function footer() {
  return `
    <p style="margin:0;color:#a29d97;font-size:13px;">
      PSR<br>Rajshahi · Bangladesh
    </p>
  `;
}

export async function sendAdminOtpEmail(input: SendAdminOtpInput) {
  const transporter = createTransporter();

  const purposeLabel = input.purpose === "email_verification" ? "Verify your email" : input.purpose === "login" ? "Verify your login" : "Reset your password";

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#090909;color:#f4f1ed;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;padding:24px;background:#111110;border:1px solid rgba(255,255,255,0.13);border-radius:14px;">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          ${brandLogo()}
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px;color:#f4f1ed;line-height:1.6;font-size:16px;">
          <h1 style="font-size:32px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em;">${purposeLabel}</h1>
          <p style="margin:0 0 24px;color:#a29d97;">
            Your one-time code is <strong style="letter-spacing:0.25em;font-family:monospace;">${input.code}</strong>.
          </p>
          ${button(input.purpose === "login" ? `${APP_BASE_URL}/admin/verify-login?userId=${encodeURIComponent(input.userId)}` : `${APP_BASE_URL}/admin/verify-email?userId=${encodeURIComponent(input.userId)}&purpose=${input.purpose}`, "Verify Code")}
          <p style="margin:0 0 16px;color:#a29d97;font-size:14px;">
            This code expires in <strong>${input.expiresInMinutes} minutes</strong> and can be used only once.
          </p>
          ${footer()}
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  const text = `
PSR — ${purposeLabel}

Your one-time code is: ${input.code}

This code expires in ${input.expiresInMinutes} minutes and can be used only once.

PSR
Rajshahi · Bangladesh
  `.trim();

  const info = await transporter.sendMail({
    from: FROM,
    to: input.to,
    subject: `${purposeLabel} — PSR`,
    text,
    html,
  });

  return { messageId: info.messageId };
}

export async function sendAdminInvitationEmail(input: SendAdminInvitationInput) {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#090909;color:#f4f1ed;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;padding:24px;background:#111110;border:1px solid rgba(255,255,255,0.13);border-radius:14px;">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          ${brandLogo()}
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px;color:#f4f1ed;line-height:1.6;font-size:16px;">
          <h1 style="font-size:32px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em;">You're invited to join PSR as an Administrator</h1>
          <p style="margin:0 0 16px;color:#a29d97;">
            <strong>${input.invitedBy}</strong> has invited you to become an administrator of PSR.
          </p>
          ${button(input.invitationUrl, "Accept Invitation")}
          <p style="margin:0 0 16px;color:#a29d97;font-size:14px;">
            This invitation expires in <strong>${input.expiresInHours} hours</strong> and can be used only once.
          </p>
          ${footer()}
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  const text = `
PSR — Administrator Invitation

${input.invitedBy} has invited you to become an administrator of PSR.

Accept invitation: ${input.invitationUrl}

This invitation expires in ${input.expiresInHours} hours and can be used only once.

PSR
Rajshahi · Bangladesh
  `.trim();

  const info = await transporter.sendMail({
    from: FROM,
    to: input.to,
    subject: "Administrator Invitation — PSR",
    text,
    html,
  });

  return { messageId: info.messageId };
}
