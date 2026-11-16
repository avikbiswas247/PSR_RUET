import { PhotoService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ photoId: string }> };
type Body = { title?: string; description?: string | null; imageUrl?: string; thumbnailUrl?: string | null; visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED" };

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { photoId } = await context.params;
    const body = await readJson<Body>(request);
    return jsonOk(await PhotoService.updateOwnPhoto({ photoId, authenticatedPhotographerId: auth.id, patch: body }));
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { photoId } = await context.params;
    return jsonOk({ deleted: await PhotoService.deleteOwnPhoto(photoId, auth.id) });
  } catch (error) { return handleApiError(error); }
}
