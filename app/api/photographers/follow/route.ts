import { PhotographerService } from "@/lib/services";
import { requireUser, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const body = await readJson<{ photographer_id: string }>(request);
    if (!body.photographer_id) {
      return jsonOk({ message: "Photographer ID is required." }, 422);
    }
    if (!isValidUuid(body.photographer_id)) {
      return jsonOk({ message: "Invalid photographer ID." }, 400);
    }
    if (auth.id === body.photographer_id) {
      return jsonOk({ message: "You cannot follow yourself." }, 422);
    }
    return jsonOk(await PhotographerService.followPhotographer(auth.id, body.photographer_id));
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const body = await readJson<{ photographer_id: string }>(request);
    if (!body.photographer_id) {
      return jsonOk({ message: "Photographer ID is required." }, 422);
    }
    if (!isValidUuid(body.photographer_id)) {
      return jsonOk({ message: "Invalid photographer ID." }, 400);
    }
    return jsonOk(await PhotographerService.unfollowPhotographer(auth.id, body.photographer_id));
  } catch (error) { return handleApiError(error); }
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const { searchParams } = new URL(request.url);
    const photographer_id = searchParams.get("photographer_id");
    if (!photographer_id) {
      return jsonOk({ message: "Photographer ID is required." }, 422);
    }
    if (!isValidUuid(photographer_id)) {
      return jsonOk({ message: "Invalid photographer ID." }, 400);
    }
    return jsonOk(await PhotographerService.getFollowStatus(auth.id, photographer_id));
  } catch (error) { return handleApiError(error); }
}
