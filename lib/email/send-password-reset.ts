"use server";

import { createMailTransporter } from "@/lib/email/mailer";

export interface SendPasswordResetEmailInput {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const { transporter, from } = createMailTransporter();
  const logoUrl = new URL("/psr-logo-dark.png", input.resetUrl).toString();

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#090909;color:#f4f1ed;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;padding:24px;background:#111110;border:1px solid rgba(255,255,255,0.13);border-radius:14px;">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <img src="${logoUrl}" width="300" alt="PSR — Photographic Society" style="display:block;width:300px;max-width:100%;height:auto;" />
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px;color:#f4f1ed;line-height:1.6;font-size:16px;">
          <h1 style="font-size:32px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em;">Reset your password</h1>
          <p style="margin:0 0 16px;color:#a29d97;">
            You requested a password reset for your PSR account. Use the button below to set a new password.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td align="center">
                <a href="${input.resetUrl}" style="display:inline-block;background:#ff7417;color:#14110f;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;">Reset Password</a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 16px;color:#a29d97;font-size:14px;">
            This link expires in <strong>${input.expiresInMinutes} minutes</strong> and can be used only once. If you didn't request a password reset, you can safely ignore this email — your account is secure.
          </p>
          <p style="margin:0;color:#a29d97;font-size:13px;">
            PSR<br>Rajshahi · Bangladesh
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  const text = `
PSR — Reset your password

You requested a password reset for your PSR account.

Reset your password: ${input.resetUrl}

This link expires in ${input.expiresInMinutes} minutes and can be used only once.
If you didn't request a password reset, you can safely ignore this email — your account is secure.

PSR
Rajshahi · Bangladesh
`.trim();

  const info = await transporter.sendMail({
    from,
    to: input.to,
    subject: "Reset your password — PSR",
    text,
    html,
  });

  return { messageId: info.messageId };
}
