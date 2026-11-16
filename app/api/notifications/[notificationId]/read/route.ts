import { NotificationService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

type Context = { params: Promise<{ notificationId: string }> };

export async function PATCH(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { notificationId } = await context.params;
    return jsonOk(await NotificationService.markMyNotificationRead(notificationId, auth.id));
  } catch (error) { return handleApiError(error); }
}
