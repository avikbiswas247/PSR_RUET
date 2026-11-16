import { PhotoService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const body = await readJson<{ photo_id: string }>(request);
    if (!body.photo_id) {
      return jsonOk({ message: "Photo ID is required." }, 422);
    }
    return jsonOk(await PhotoService.likePhoto(auth.id, body.photo_id));
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const body = await readJson<{ photo_id: string }>(request);
    if (!body.photo_id) {
      return jsonOk({ message: "Photo ID is required." }, 422);
    }
    return jsonOk(await PhotoService.unlikePhoto(auth.id, body.photo_id));
  } catch (error) { return handleApiError(error); }
}
