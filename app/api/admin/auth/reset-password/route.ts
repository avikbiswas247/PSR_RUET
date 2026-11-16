import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { userId?: string; otpCode?: string; newPassword?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.userId || !body.otpCode || !body.newPassword) {
      return jsonOk({ message: "User ID, verification code and new password are required." }, 422);
    }
    await AdminAuthService.adminResetPassword({
      userId: body.userId,
      otpCode: body.otpCode,
      newPassword: body.newPassword,
    });
    return jsonOk({ message: "Your password has been reset. You can now sign in with your new password." }, 200);
  } catch (error) { return handleApiError(error); }
}
