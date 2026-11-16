import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";
import { sendAdminOtpEmail } from "@/lib/email/send-admin-otp";

type Body = { invitationToken?: string; bootstrapSecret?: string; username?: string; email?: string; password?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.username || typeof body.username !== "string" || typeof body.email !== "string" || typeof body.password !== "string") {
      return jsonOk({ message: "Username, email and password are required." }, 422);
    }
    const user = await AdminAuthService.completeAdminRegistration({
      invitationToken: body.invitationToken,
      bootstrapSecret: body.bootstrapSecret,
      username: body.username,
      email: body.email,
      password: body.password,
    });
    // Send OTP for email verification
    const otp = await AdminAuthService.generateOtp({
      userId: user.id,
      purpose: "email_verification",
    });
    try {
      await sendAdminOtpEmail({
        to: user.email,
        userId: user.id,
        code: otp.code,
        purpose: "email_verification",
        expiresInMinutes: 10,
      });
    } catch (mailErr) {
      console.error("[AdminRegister] OTP mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
    }
    return jsonOk({
      message: "Account created. Please verify your email.",
      userId: user.id,
      email: user.email,
      requiresOtp: true,
    }, 201);
  } catch (error) { return handleApiError(error); }
}
