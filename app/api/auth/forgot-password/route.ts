import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { findUserForLogin } from "@/lib/repositories/auth.repository";
import { createPasswordReset } from "@/lib/services/auth.service";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { checkRateLimit } from "@/lib/email/rate-limit";

const RESET_TTL_MINUTES = 30;
const GENERIC_MESSAGE = "If an account exists for that email, reset instructions will be sent.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? emailOf(body.email) : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const rate = checkRateLimit(`fp:${email}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const user = await findUserForLogin(email);

    if (user && user.is_active) {
      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000).toISOString();

      await createPasswordReset({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendPasswordResetEmail({
          to: email,
          resetUrl,
          expiresInMinutes: RESET_TTL_MINUTES,
        });
      } catch (mailErr) {
        console.error("[ForgotPassword] Mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }
}

function emailOf(v: string) {
  return v.trim().toLowerCase();
}
