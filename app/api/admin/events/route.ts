import { EventService } from "@/lib/services";
import * as EventRepo from "@/lib/repositories/event.repository";
import { requireUser, requireRole, isResponse } from "@/lib/api/guards";
import { handleApiError, jsonOk, readJson } from "@/lib/api/http";

type Body = { title?: string; slug?: string; description?: string | null; coverImageUrl?: string | null; location?: string | null; startAt?: string | null; endAt?: string | null; registrationEnabled?: boolean; publishImmediately?: boolean };
async function admin() { const user = await requireUser(); if (isResponse(user)) return user; const denied = requireRole(user, "ADMIN"); return denied ?? user; }
export async function GET() { try { const auth = await admin(); if (isResponse(auth)) return auth; return jsonOk(await EventRepo.listEvents(100, 0)); } catch (e) { return handleApiError(e); } }
export async function POST(request: Request) { try { const auth = await admin(); if (isResponse(auth)) return auth; const b = await readJson<Body>(request); if (!b.title?.trim() || !b.slug?.trim()) return jsonOk({ message: "Title and slug are required." }, 422); const event = await EventService.createEvent({ authenticatedCreatorId: auth.id, ...b, title: b.title, slug: b.slug }); if (b.publishImmediately) return jsonOk(await EventRepo.updateEvent(event.id, { status: "PUBLISHED", published_at: new Date() }), 201); return jsonOk(event, 201); } catch (e) { return handleApiError(e); } }
