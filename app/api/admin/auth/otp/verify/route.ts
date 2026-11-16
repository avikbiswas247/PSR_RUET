import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { userId?: string; purpose?: "email_verification" | "password_reset" | "login"; code?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.userId || !body.purpose || !body.code) {
      return jsonOk({ message: "User ID, purpose and code are required." }, 422);
    }
    if (!["email_verification", "password_reset", "login"].includes(body.purpose)) {
      return jsonOk({ message: "Invalid purpose." }, 422);
    }

    // For email_verification after registration: no auth required (user just registered)
    // For login verification: no auth required (user just logged in with password)
    // For password_reset: no auth required (user is resetting password)
    // All OTP verification is publicly accessible by userId + code

    const result = await AdminAuthService.verifyOtp({
      userId: body.userId,
      purpose: body.purpose,
      code: body.code,
    });

    // If email_verification succeeded, activate the admin account (rechecks limit + marks email verified)
    if (body.purpose === "email_verification" && result.verified) {
      await AdminAuthService.activateAdminAccount(body.userId);
    }

    return jsonOk({ message: "Code verified successfully.", verified: true }, 200);
  } catch (error) { return handleApiError(error); }
}
