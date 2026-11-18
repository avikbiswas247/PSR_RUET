import { AdminAuthService } from "@/lib/services";
import { findUserById } from "@/lib/repositories/auth.repository";
import { checkRateLimit } from "@/lib/email/rate-limit";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { userId?: string };
const GENERIC_MESSAGE = "If this account needs verification, a code will be sent to its email.";

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) return jsonOk({ message: GENERIC_MESSAGE }, 200);

    const rate = checkRateLimit(`email-verify:${userId}`, 5, 60 * 60 * 1000);
    const user = await findUserById(userId);
    if (!rate.allowed || !user || !user.is_active || user.email_verified_at || user.roles.includes("ADMIN")) {
      return jsonOk({ message: GENERIC_MESSAGE }, 200);
    }

    const delivery = await AdminAuthService.sendOtpEmail({ userId, purpose: "email_verification" });
    return jsonOk({ message: "Verification code sent.", expiresAt: delivery.expires_at }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
