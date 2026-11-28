import { PhotographerService } from "@/lib/services";
import { getPagination, handleApiError, jsonOk } from "@/lib/api/http";

const ALLOWED_ROLES = new Set(["ADMIN", "PHOTOGRAPHER"]);

export async function GET(request: Request) {
  try {
    const { limit, offset } = getPagination(new URL(request.url));
    const url = new URL(request.url);
    const photographers = await PhotographerService.listPublicPhotographers({
      limit,
      offset,
      search: url.searchParams.get("search") || undefined,
      genre: url.searchParams.get("genre") || undefined,
      device: url.searchParams.get("device") || undefined,
      location: url.searchParams.get("location") || undefined,
      availableOnly: url.searchParams.get("availableOnly") === "true",
    });
    const filtered = photographers.filter((p) =>
      (p.roles ?? []).some((role) => ALLOWED_ROLES.has(role))
    );
    return jsonOk(filtered);
  } catch (error) { return handleApiError(error); }
}
