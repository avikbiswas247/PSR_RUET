import { ExhibitionService } from "@/lib/services";
import { handleApiError, jsonOk } from "@/lib/api/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const exhibition = await ExhibitionService.getPublicExhibition(id);
    if (!exhibition) {
      return jsonOk({ message: "Exhibition not found." }, 404);
    }
    return jsonOk(exhibition);
  } catch (error) { return handleApiError(error); }
}
