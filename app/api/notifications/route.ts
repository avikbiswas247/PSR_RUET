import { NotificationService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk } from "@/lib/api/http";


export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { limit, offset } = getPagination(new URL(request.url), { limit: 30, offset: 0 });
    return jsonOk(await NotificationService.getMyNotifications(auth.id, limit, offset));
  } catch (error) { return handleApiError(error); }
}
