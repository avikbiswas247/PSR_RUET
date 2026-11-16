import { PortfolioService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ portfolioId: string }> };
type Body = { title?: string | null; slug?: string | null; description?: string | null; theme?: string | null; isPublic?: boolean };

export async function GET(_request: Request, context: Context) {
  try {
    const { portfolioId } = await context.params;
    const portfolio = await PortfolioService.getPortfolio(portfolioId);
    return portfolio ? jsonOk(portfolio) : jsonOk({ message: "Portfolio not found." }, 404);
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { portfolioId } = await context.params;
    const body = await readJson<Body>(request);
    return jsonOk(await PortfolioService.updatePhotographerPortfolio({
      portfolioId, authenticatedPhotographerId: auth.id, ...body,
    }));
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const { portfolioId } = await context.params;
    return jsonOk({ deleted: await PortfolioService.deletePhotographerPortfolio({ portfolioId, authenticatedPhotographerId: auth.id }) });
  } catch (error) { return handleApiError(error); }
}
