import { ExhibitionService } from "@/lib/services";
import * as Repo from "@/lib/repositories/exhibition.repository";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";
type Body = { title?: string; slug?: string; description?: string | null; coverImageUrl?: string | null; venue?: string | null; startDate?: string | null; endDate?: string | null; publishImmediately?: boolean };
async function admin() { const user = await requireUser(); if (isResponse(user)) return user; const denied = requireRole(user, "ADMIN"); return denied ?? user; }
export async function GET() { try { const auth = await admin(); if (isResponse(auth)) return auth; return jsonOk(await Repo.listExhibitions(100, 0)); } catch (e) { return handleApiError(e); } }
export async function POST(request: Request) { try { const auth = await admin(); if (isResponse(auth)) return auth; const b = await readJson<Body>(request); if (!b.title?.trim() || !b.slug?.trim()) return jsonOk({ message: "Title and slug are required." }, 422); const exhibition = await ExhibitionService.createExhibition({ authenticatedCreatorId: auth.id, ...b, title: b.title, slug: b.slug }); if (b.publishImmediately) return jsonOk(await Repo.updateExhibition(exhibition.id, { status: "PUBLISHED" }), 201); return jsonOk(exhibition, 201); } catch (e) { return handleApiError(e); } }
