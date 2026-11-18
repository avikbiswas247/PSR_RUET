import { AdminAuthService } from "@/lib/services";
import { findUserById } from "@/lib/repositories/auth.repository";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { userId?: string; code?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.userId || !body.code || !/^\d{6}$/.test(body.code)) {
      return jsonOk({ message: "Enter the 6-digit code sent to your email." }, 422);
    }

    const user = await findUserById(body.userId);
    if (!user || !user.is_active || user.roles.includes("ADMIN")) {
      return jsonOk({ message: "This verification request is not valid." }, 400);
    }
    if (user.email_verified_at) {
      return jsonOk({ message: "This email address is already verified." }, 409);
    }

    await AdminAuthService.verifyOtp({ userId: user.id, purpose: "email_verification", code: body.code });
    await AdminAuthService.markEmailVerified(user.id);
    const token = await createSession(user.id);
    await setSessionCookie(token);

    return jsonOk({
      message: "Email verified successfully.",
      user: { id: user.id, full_name: user.full_name, email: user.email, roles: user.roles },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
