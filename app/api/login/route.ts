import { NextRequest, NextResponse } from "next/server";
import { findUserForLogin } from "@/lib/repositories/auth.repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { AdminAuthService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    const input = body as Record<string, unknown>;
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!email || !password) return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    const user = await findUserForLogin(email);
    if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

    // ADMIN accounts must use the dedicated admin login flow with OTP verification.
    // Do not create a session here for administrators.
    if (user.roles.includes("ADMIN")) {
      return NextResponse.json({
        message: "Administrator accounts require OTP verification. Please use the admin sign-in page.",
        requiresAdminOtp: true,
        userId: user.id,
      }, { status: 200 });
    }

    if (!user.email_verified_at) {
      let verificationEmailSent = false;
      try {
        await AdminAuthService.sendOtpEmail({ userId: user.id, purpose: "email_verification" });
        verificationEmailSent = true;
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        verificationEmailSent = code === "OTP_RESEND_COOLDOWN";
        if (!verificationEmailSent) {
          console.error("[Login] Verification email send failed:", error instanceof Error ? error.message : error);
        }
      }
      return NextResponse.json({
        message: "Verify your email address before signing in.",
        code: "EMAIL_NOT_VERIFIED",
        userId: user.id,
        verificationEmailSent,
      }, { status: 403 });
    }

    const token = await createSession(user.id); await setSessionCookie(token);
    return NextResponse.json({ message: "Login successful", user: { id: user.id, full_name: user.full_name, email: user.email, roles: user.roles } });
  } catch (error) { console.error("[Login] Request failed:", error); return NextResponse.json({ message: "Internal server error" }, { status: 500 }); }
}
