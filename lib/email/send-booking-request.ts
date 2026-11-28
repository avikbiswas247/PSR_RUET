"use server";

import { createMailTransporter } from "@/lib/email/mailer";

export interface SendBookingRequestEmailInput {
  to: string;
  photographerName: string;
  photographerTitle: string | null;
  clientName: string;
  clientEmail: string | null;
  bookingId: string;
  bookingNumber: string;
  title: string;
  message: string;
  photographyType: string | null;
  location: string | null;
  date: string;
  startTime: string;
  endTime: string;
  budget: number | null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function appBaseUrl() {
  const configuredUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const vercelHost = process.env.VERCEL_URL;
  const value = configuredUrl || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Booking email application URL must use HTTP or HTTPS.");
  }
  return url;
}

function formattedDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-BD", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function sendBookingRequestEmail(input: SendBookingRequestEmailInput) {
  const { transporter, from } = createMailTransporter();
  const bookingUrl = new URL(`/photographer/bookings/${encodeURIComponent(input.bookingId)}`, appBaseUrl()).toString();
  const safe = {
    photographerName: escapeHtml(input.photographerName),
    photographerTitle: input.photographerTitle ? escapeHtml(input.photographerTitle) : "",
    clientName: escapeHtml(input.clientName),
    clientEmail: input.clientEmail ? escapeHtml(input.clientEmail) : "",
    bookingNumber: escapeHtml(input.bookingNumber),
    title: escapeHtml(input.title),
    message: escapeHtml(input.message),
    photographyType: input.photographyType ? escapeHtml(input.photographyType) : "Not specified",
    location: input.location ? escapeHtml(input.location) : "To be arranged",
    date: escapeHtml(formattedDate(input.date)),
    startTime: escapeHtml(input.startTime),
    endTime: escapeHtml(input.endTime),
    budget: input.budget == null ? "Not specified" : `BDT ${input.budget.toLocaleString("en-BD")}`,
  };

  const text = [
    `Hi ${input.photographerName},`,
    "",
    `${input.clientName} sent you a new photography booking request. It is pending your response.`,
    `Booking: ${input.bookingNumber}`,
    `Session: ${input.title}`,
    `Service: ${input.photographyType || "Not specified"}`,
    `Date: ${formattedDate(input.date)}`,
    `Time: ${input.startTime}–${input.endTime}`,
    `Location: ${input.location || "To be arranged"}`,
    `Proposed budget: ${input.budget == null ? "Not specified" : `BDT ${input.budget.toLocaleString("en-BD")}`}`,
    `Client: ${input.clientName}${input.clientEmail ? ` (${input.clientEmail})` : ""}`,
    "",
    "Message from the client:",
    input.message,
    "",
    `Review this request and accept or decline it: ${bookingUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#090909;color:#f4f1ed;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111110;border:1px solid rgba(255,255,255,.13);border-radius:14px;">
      <tr><td style="padding:32px;line-height:1.6;">
        <p style="margin:0 0 6px;color:#ff7417;font-size:12px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;">PSR booking request</p>
        <h1 style="margin:0 0 12px;font-size:26px;">New request for ${safe.photographerName}</h1>
        ${safe.photographerTitle ? `<p style="margin:0 0 20px;color:#a29d97;">${safe.photographerTitle}</p>` : ""}
        <p style="margin:0 0 24px;color:#c9c4be;"><strong>${safe.clientName}</strong>${safe.clientEmail ? ` (${safe.clientEmail})` : ""} sent a request. It is pending your response.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
          <tr><td style="padding:8px 0;color:#a29d97;">Booking</td><td style="padding:8px 0;text-align:right;">${safe.bookingNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#a29d97;">Session</td><td style="padding:8px 0;text-align:right;">${safe.title}</td></tr>
          <tr><td style="padding:8px 0;color:#a29d97;">Service</td><td style="padding:8px 0;text-align:right;">${safe.photographyType}</td></tr>
          <tr><td style="padding:8px 0;color:#a29d97;">Date and time</td><td style="padding:8px 0;text-align:right;">${safe.date}<br>${safe.startTime}–${safe.endTime}</td></tr>
          <tr><td style="padding:8px 0;color:#a29d97;">Location</td><td style="padding:8px 0;text-align:right;">${safe.location}</td></tr>
          <tr><td style="padding:8px 0;color:#a29d97;">Proposed budget</td><td style="padding:8px 0;text-align:right;">${safe.budget}</td></tr>
        </table>
        <div style="margin:20px 0;padding:16px;border-radius:8px;background:#181817;color:#c9c4be;white-space:pre-wrap;"><strong style="color:#f4f1ed;">Message from the client</strong><br>${safe.message}</div>
        <p style="margin:28px 0;text-align:center;"><a href="${escapeHtml(bookingUrl)}" style="display:inline-block;padding:13px 22px;border-radius:8px;background:#ff7417;color:#14110f;font-weight:bold;text-decoration:none;">Review request</a></p>
        <p style="margin:0;color:#8d8882;font-size:12px;">Open the request to view the client profile and accept or decline the booking.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  const info = await transporter.sendMail({
    from,
    to: input.to,
    subject: `New booking request ${input.bookingNumber} – PSR`,
    text,
    html,
  });

  return { messageId: info.messageId };
}
