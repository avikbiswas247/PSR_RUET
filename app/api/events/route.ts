import { EventService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Body = { title?: string; slug?: string; description?: string | null; coverImageUrl?: string | null; location?: string | null; startAt?: string | null; endAt?: string | null; registrationEnabled?: boolean };

export async function GET(request: Request) {
  try {
    const { limit, offset } = getPagination(new URL(request.url));
    const events = await EventService.listPublicEvents(limit, offset);
    return jsonOk(events);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.title || !body.slug) return jsonOk({ message: "title and slug are required." }, 422);
    return jsonOk(await EventService.createEvent({
      authenticatedCreatorId: auth.id, title: body.title, slug: body.slug,
      description: body.description, coverImageUrl: body.coverImageUrl, location: body.location, startAt: body.startAt,
      endAt: body.endAt, registrationEnabled: body.registrationEnabled,
    }), 201);
  } catch (error) { return handleApiError(error); }
}
