import { AdminAuthService } from "@/lib/services";
import { findUserById } from "@/lib/repositories/auth.repository";
import { checkRateLimit } from "@/lib/email/rate-limit";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type OtpPurpose = "email_verification" | "password_reset" | "login";
type Body = { userId?: string; purpose?: OtpPurpose; email?: string };
const GENERIC_MESSAGE = "If an account exists for that email, a verification code will be sent.";

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);

    if (body.userId && body.purpose) {
      if (!["email_verification", "password_reset", "login"].includes(body.purpose)) {
        return jsonOk({ message: "Invalid verification request." }, 422);
      }
      const user = await findUserById(body.userId);
      if (!user || !user.is_active || !user.roles.includes("ADMIN")) {
        return jsonOk({ message: "Unable to send a verification code." }, 404);
      }
      if (body.purpose === "email_verification" && user.email_verified_at) {
        return jsonOk({ message: "This email address is already verified." }, 409);
      }
      if (body.purpose === "login" && !user.email_verified_at) {
        return jsonOk({ message: "Verify your email address before signing in." }, 403);
      }

      const delivery = await AdminAuthService.sendOtpEmail({ userId: user.id, purpose: body.purpose });
      return jsonOk({ message: "Verification code sent.", expires_at: delivery.expires_at }, 201);
    }

    if (body.email && body.purpose === "password_reset") {
      const email = body.email.trim().toLowerCase();
      const rate = checkRateLimit(`admin-fp:${email}`, 5, 60 * 60 * 1000);
      if (!rate.allowed || !/^\S+@\S+\.\S+$/.test(email)) {
        return jsonOk({ message: GENERIC_MESSAGE }, 200);
      }
      const result = await AdminAuthService.adminForgotPassword({ email });
      return jsonOk({ message: GENERIC_MESSAGE, userId: result.userId ?? null, otp_expires_at: result.otpExpiresAt }, 200);
    }

    return jsonOk({ message: "Invalid request." }, 422);
  } catch (error) {
    return handleApiError(error);
  }
}
