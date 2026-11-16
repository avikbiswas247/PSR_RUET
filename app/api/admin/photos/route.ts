import { AdminService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { limit, offset } = getPagination(new URL(request.url));
    const photos = await AdminService.listAdminPhotos(limit, offset);
    return jsonOk(photos);
  } catch (error) { return handleApiError(error); }
}
