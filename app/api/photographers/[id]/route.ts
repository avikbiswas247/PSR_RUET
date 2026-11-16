import { PhotographerService } from "@/lib/services";
import { handleApiError, jsonOk } from "@/lib/api/http";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!isValidUuid(id)) {
      return jsonOk({ message: "Invalid photographer ID." }, 400);
    }
    const photographer = await PhotographerService.getPublicPhotographer(id);
    if (!photographer) {
      return jsonOk({ message: "Photographer not found." }, 404);
    }
    return jsonOk(photographer);
  } catch (error) { return handleApiError(error); }
}
