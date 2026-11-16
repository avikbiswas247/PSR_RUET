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
      message: "Verification code sent to your email.",
      userId: result.id,
      requiresOtp: true,
    }, 200);
  } catch (error) { return handleApiError(error); }
}
