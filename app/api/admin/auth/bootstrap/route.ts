import { AdminAuthService } from "@/lib/services";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { bootstrapSecret?: string; username?: string; email?: string; password?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.bootstrapSecret || typeof body.username !== "string" || typeof body.email !== "string" || typeof body.password !== "string") {
      return jsonOk({ message: "Bootstrap secret, username, email and password are required." }, 422);
    }
    const user = await AdminAuthService.bootstrapAdmin({
      bootstrapSecret: body.bootstrapSecret,
      username: body.username,
      email: body.email,
      password: body.password,
    });
    // Send OTP for email verification
    let verificationEmailSent = true;
    try {
      await AdminAuthService.sendOtpEmail({ userId: user.id, purpose: "email_verification" });
    } catch (mailErr) {
      console.error("[AdminBootstrap] OTP mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
      verificationEmailSent = false;
    }
    return jsonOk({ message: "First administrator account created. Please verify your email.", userId: user.id, user, verificationEmailSent }, 201);
  } catch (error) { return handleApiError(error); }
}
