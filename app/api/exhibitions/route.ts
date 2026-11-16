import { ExhibitionService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Body = { title?: string; slug?: string; description?: string | null; coverImageUrl?: string | null; venue?: string | null; startDate?: string | null; endDate?: string | null };

export async function GET(request: Request) {
  try {
    const { limit, offset } = getPagination(new URL(request.url));
    const exhibitions = await ExhibitionService.listPublicExhibitions(limit, offset);
    return jsonOk(exhibitions);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.title || !body.slug) return jsonOk({ message: "title and slug are required." }, 422);
    return jsonOk(await ExhibitionService.createExhibition({
      authenticatedCreatorId: auth.id, title: body.title, slug: body.slug,
      description: body.description, coverImageUrl: body.coverImageUrl, venue: body.venue, startDate: body.startDate, endDate: body.endDate,
    }), 201);
  } catch (error) { return handleApiError(error); }
}
