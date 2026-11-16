import { AdminService, MembershipService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";


export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { limit, offset } = getPagination(new URL(request.url));
    return jsonOk(await AdminService.listApplications(limit, offset));
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<{ applicationId?: string; decision?: "APPROVED" | "REJECTED"; memberCode?: string }>(request);
    if (!body.applicationId || !body.decision) return jsonOk({ message: "applicationId and decision are required." }, 422);
    if (body.decision === "APPROVED") {
      if (!body.memberCode) return jsonOk({ message: "memberCode is required for approval." }, 422);
      return jsonOk(await MembershipService.approveApplication({ applicationId: body.applicationId, authenticatedAdminId: auth.id, memberCode: body.memberCode }));
    }
    return jsonOk(await MembershipService.rejectApplication({ applicationId: body.applicationId, authenticatedAdminId: auth.id }));
  } catch (error) { return handleApiError(error); }
}
