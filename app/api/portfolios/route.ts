import { PortfolioService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getPagination, handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { title?: string; slug?: string; description?: string | null; theme?: string | null; isPublic?: boolean };

export async function GET(request: Request) {
  try {
    // Public browse: list public portfolios. Authenticated photographers see their own list.
    const user = await getCurrentUser();
    const { limit, offset } = getPagination(new URL(request.url));
    if (user && user.roles?.includes("PHOTOGRAPHER")) {
      return jsonOk(await PortfolioService.listPhotographerPortfolios(user.id, limit, offset));
    }
    return jsonOk(await PortfolioService.listPublicPortfolios(limit, offset));
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "PHOTOGRAPHER"); if (denied) return denied;
    const body = await readJson<Body>(request);
    if (!body.title || !body.slug) return jsonOk({ message: "title and slug are required." }, 422);
    return jsonOk(await PortfolioService.createPhotographerPortfolio({
      authenticatedPhotographerId: auth.id, title: body.title, slug: body.slug,
      description: body.description, theme: body.theme, isPublic: body.isPublic,
    }), 201);
  } catch (error) { return handleApiError(error); }
}
