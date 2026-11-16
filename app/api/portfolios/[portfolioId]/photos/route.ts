import { PortfolioService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ portfolioId: string }> };
type Body = { photoId?: string; displayOrder?: number };

export async function GET(_request: Request, context: Context) {
  try {
    const { portfolioId } = await context.params;
    return jsonOk(await PortfolioService.getPortfolioPhotos(portfolioId));
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { portfolioId } = await context.params;
    const body = await readJson<Body>(request);
    if (!body.photoId) return jsonOk({ message: "photoId is required." }, 422);
    return jsonOk(await PortfolioService.addPhotoToPhotographerPortfolio({
      portfolioId, photoId: body.photoId, authenticatedPhotographerId: auth.id, displayOrder: body.displayOrder,
    }), 201);
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { portfolioId } = await context.params;
    const photoId = new URL(request.url).searchParams.get("photoId");
    if (!photoId) return jsonOk({ message: "photoId query parameter is required." }, 422);
    return jsonOk(await PortfolioService.removePhotoFromPhotographerPortfolio({ portfolioId, photoId, authenticatedPhotographerId: auth.id }));
  } catch (error) { return handleApiError(error); }
}
