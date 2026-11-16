import { AdminService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

export async function GET(_request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const stats = await AdminService.getDashboardStats();
    return jsonOk(stats);
  } catch (error) { return handleApiError(error); }
}
