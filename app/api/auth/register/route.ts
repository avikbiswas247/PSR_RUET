import { AuthService, ProfileService, AdminAuthService } from "@/lib/services";
import { hashPassword } from "@/lib/auth/password";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";
type Body = { fullName?: string; email?: string; password?: string; initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER" };
export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (typeof body.fullName !== "string" || typeof body.email !== "string" || typeof body.password !== "string") return jsonOk({ message: "Full name, email and password are required." }, 422);
    if (body.initialRole && !["CLIENT", "MEMBER", "PHOTOGRAPHER"].includes(body.initialRole)) return jsonOk({ message: "This account role cannot be registered publicly." }, 403);
    if (body.password.length < 8 || body.password.length > 128) return jsonOk({ message: "Password must contain between 8 and 128 characters." }, 422);
    const passwordHash = await hashPassword(body.password);
    const user = await AuthService.register({ fullName: body.fullName, email: body.email, passwordHash, initialRole: body.initialRole ?? "CLIENT" });
    if (body.initialRole === "PHOTOGRAPHER" && user.id) {
      // Auto-create the photographer profile so newly registered photographers
      // appear in the portfolios listing and can be found & booked by clients.
      try {
        await ProfileService.createPhotographerProfile({
          userId: user.id,
          title: null,
          bio: null,
          location: null,
          instagramUrl: null,
          websiteUrl: null,
        });
      } catch {
        // Profile creation is best-effort; the photographer can complete it from
        // their workspace. Registration itself still succeeds.
      }
    }
    let verificationEmailSent = true;
    try {
      await AdminAuthService.sendOtpEmail({ userId: user.id, purpose: "email_verification" });
    } catch (mailErr) {
      console.error("[Register] Verification email send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
      verificationEmailSent = false;
    }
    return jsonOk({ ...user, verificationEmailSent }, 201);
  } catch (error) { return handleApiError(error); }
}
