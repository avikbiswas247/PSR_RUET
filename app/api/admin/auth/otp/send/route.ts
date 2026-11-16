import { AdminAuthService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";
import { sendAdminOtpEmail } from "@/lib/email/send-admin-otp";
import { getUserById } from "@/lib/repositories/user.repository";

type Body = { userId?: string; purpose?: "email_verification" | "password_reset" | "login"; email?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);

    // Case 1: Authenticated user requesting email_verification OTP
    if (body.userId && body.purpose === "email_verification") {
      const auth = await requireUser(); if (isResponse(auth)) return auth;
      const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
      if (auth.id !== body.userId) {
        return jsonOk({ message: "You can only request OTP for your own account." }, 403);
      }
      const otp = await AdminAuthService.generateOtp({
        userId: body.userId,
        purpose: "email_verification",
      });
      const user = await getUserById(body.userId);
      if (user) {
        try {
          await sendAdminOtpEmail({
            to: user.email,
            userId: body.userId,
            code: otp.code,
            purpose: "email_verification",
            expiresInMinutes: 10,
          });
        } catch (mailErr) {
          console.error("[AdminOtpSend] Mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
        }
      }
      return jsonOk({ message: "Verification code sent.", expires_at: otp.expires_at }, 201);
    }

    // Case 2: Unauthenticated OTP request (email_verification, password_reset, or login)
    if (body.userId && body.purpose) {
      const otp = await AdminAuthService.generateOtp({
        userId: body.userId,
        purpose: body.purpose,
      });
      const user = await getUserById(body.userId);
      if (user) {
        try {
          await sendAdminOtpEmail({
            to: user.email,
            userId: body.userId,
            code: otp.code,
            purpose: body.purpose,
            expiresInMinutes: 10,
          });
        } catch (mailErr) {
          console.error("[AdminOtpSend] Mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
        }
      }
      return jsonOk({ message: "Verification code sent.", expires_at: otp.expires_at }, 201);
    }

    // Case 3: Unauthenticated password reset OTP request (email provided)
    if (body.email && body.purpose === "password_reset") {
      if (!/^\S+@\S+\.\S+$/.test(body.email)) {
        return jsonOk({ message: "If an account exists for that email, a verification code will be sent." }, 200);
      }
      const result = await AdminAuthService.adminForgotPassword({ email: body.email });
      if (result.userId) {
        const otp = await AdminAuthService.generateOtp({
          userId: result.userId,
          purpose: "password_reset",
        });
        const user = await getUserById(result.userId);
        if (user) {
          try {
            await sendAdminOtpEmail({
              to: user.email,
              userId: result.userId,
              code: otp.code,
              purpose: "password_reset",
              expiresInMinutes: 10,
            });
          } catch (mailErr) {
            console.error("[AdminOtpSend] Mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
          }
        }
      }
      // Generic response: don't reveal whether email exists
      return jsonOk({ message: "If an account exists for that email, a verification code will be sent.", otp_expires_at: result.otpExpiresAt }, 200);
    }

    return jsonOk({ message: "Invalid request." }, 422);
  } catch (error) { return handleApiError(error); }
}
