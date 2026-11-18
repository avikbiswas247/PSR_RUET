import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/email/rate-limit";

type Body = { email?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.email || typeof body.email !== "string") {
      return jsonOk({ message: "If an account exists for that email, a verification code will be sent." }, 200);
    }
    const email = body.email.trim().toLowerCase();
    if (!checkRateLimit(`admin-fp:${email}`, 5, 60 * 60 * 1000).allowed) {
      return jsonOk({ message: "If an account exists for that email, a verification code will be sent." }, 200);
    }
    const result = await AdminAuthService.adminForgotPassword({ email });
    // Generic response: don't reveal whether email exists.
    // userId is returned only when the email belongs to an active admin,
    // so the frontend can navigate to the OTP challenge page.
    return jsonOk({
      message: "If an account exists for that email, a verification code will be sent.",
      userId: result.userId ?? null,
      otp_expires_at: result.otpExpiresAt,
    }, 200);
  } catch (error) { return handleApiError(error); }
}
