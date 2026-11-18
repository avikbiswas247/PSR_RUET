import { AdminAuthService } from "@/lib/services";
import { findUserById } from "@/lib/repositories/auth.repository";
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

    // Admin challenges are public until a session exists, but the target must be
    // an active administrator before any OTP is consumed.

    const user = await findUserById(body.userId);
    if (!user || !user.is_active || !user.roles.includes("ADMIN")) {
      return jsonOk({ message: "This verification request is not valid." }, 400);
    }

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
