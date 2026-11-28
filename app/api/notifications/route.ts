import { NotificationService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonError, jsonOk } from "@/lib/api/http";


export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const url = new URL(request.url);
    if (url.searchParams.get("unreadCount") === "true") {
      return jsonOk({ unreadCount: await NotificationService.getMyUnreadCount(auth.id) });
    }
    const { limit, offset } = getPagination(url, { limit: 30, offset: 0 });
    return jsonOk(await NotificationService.getMyNotifications(auth.id, limit, offset));
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const body = await request.json().catch(() => null) as { action?: string } | null;
    if (body?.action !== "mark-all-read") return jsonError("Choose a valid notification action.", 422, "INVALID_ACTION");
    await NotificationService.markAllMyNotificationsRead(auth.id);
    return jsonOk({ success: true });
  } catch (error) { return handleApiError(error); }
}
