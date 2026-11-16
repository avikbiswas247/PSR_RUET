import { PhotoService } from "@/lib/services";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Context = { params: Promise<{ photoId: string }> };
type Body = { decision?: "APPROVED" | "FEATURED" | "REJECTED"; feedback?: string | null };

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    const denied = requireRole(auth, "ADMIN"); if (denied) return denied;
    const { photoId } = await context.params;
    const body = await readJson<Body>(request);
    if (!body.decision) return jsonOk({ message: "decision is required." }, 422);
    return jsonOk(await PhotoService.reviewPhoto({ photoId, authenticatedAdminId: auth.id, decision: body.decision, feedback: body.feedback }));
  } catch (error) { return handleApiError(error); }
}
