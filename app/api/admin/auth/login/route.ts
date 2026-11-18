import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { email?: string; password?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.email || !body.password) {
      return jsonOk({ message: "Email and password are required." }, 422);
    }
    const result = await AdminAuthService.adminLogin({
      email: body.email,
      password: body.password,
    });
    return jsonOk({
      message: result.requiresEmailVerification
        ? "Verify your email address to finish setting up administrator access."
        : "Verification code sent to your email.",
      userId: result.id,
      requiresOtp: result.requiresOtp === true,
      requiresEmailVerification: result.requiresEmailVerification === true,
    }, 200);
  } catch (error) { return handleApiError(error); }
}
