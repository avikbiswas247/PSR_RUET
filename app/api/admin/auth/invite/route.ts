import { AdminAuthService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";
import { sendAdminInvitationEmail } from "@/lib/email/send-admin-otp";

type Body = { email?: string };

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.email || typeof body.email !== "string") {
      return jsonOk({ message: "Email is required." }, 422);
    }
    const result = await AdminAuthService.inviteAdmin({
      authenticatedAdminId: auth.id,
      email: body.email,
    });
    // Send invitation email (best-effort; registration still succeeds if mail fails)
    try {
      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      await sendAdminInvitationEmail({
        to: result.email,
        invitationUrl: `${baseUrl}/admin/auth/register?token=${encodeURIComponent(result.token)}`,
        invitedBy: auth.full_name || "Administrator",
        expiresInHours: 48,
      });
    } catch (mailErr) {
      console.error("[AdminInvite] Mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
    }
    return jsonOk({ message: "Invitation sent.", email: result.email, expires_at: result.expires_at }, 201);
  } catch (error) { return handleApiError(error); }
}
