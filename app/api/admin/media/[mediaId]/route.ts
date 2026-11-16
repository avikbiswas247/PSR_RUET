import { MediaService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk } from "@/lib/api/http";

export async function DELETE(_request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { mediaId } = await params;
    const ok = await MediaService.removeMediaRecord(mediaId, async () => {});
    return jsonOk({ deleted: !!ok });
  } catch (error) { return handleApiError(error); }
}
