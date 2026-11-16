import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400, code?: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error: { message, ...(code ? { code } : {}), ...(details ? { details } : {}) } },
    { status },
  );
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function getPagination(url: URL, defaults = { limit: 50, offset: 0 }) {
  const limit = Number(url.searchParams.get("limit") ?? defaults.limit);
  const offset = Number(url.searchParams.get("offset") ?? defaults.offset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("limit must be an integer between 1 and 100.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("offset must be a non-negative integer.");
  }
  return { limit, offset };
}

/** Read pagination from Next.js searchParams (string | string[] | undefined). */
export function getPaginationFromSearch(
  searchParams: { [key: string]: string | string[] | undefined },
  defaults = { limit: 50, offset: 0 }
) {
  const limitRaw = searchParams.limit;
  const offsetRaw = searchParams.offset;
  const limit = Array.isArray(limitRaw) ? Number(limitRaw[0]) : Number(limitRaw ?? defaults.limit);
  const offset = Array.isArray(offsetRaw) ? Number(offsetRaw[0]) : Number(offsetRaw ?? defaults.offset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("limit must be an integer between 1 and 100.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("offset must be a non-negative integer.");
  }

  return { limit, offset };
}

/** Use this only inside route-handler catch blocks. Log the real error server-side. */
export function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  console.error("[API Error]", error instanceof Error ? error.stack : String(error));

  if (/forbidden|not allowed/i.test(message)) return jsonError(message, 403, "FORBIDDEN");
  if (/not found/i.test(message)) return jsonError(message, 404, "NOT_FOUND");
  if (/authentication|required|unauthorized/i.test(message)) return jsonError(message, 401, "UNAUTHORIZED");
  if (/already exists|duplicate|unique/i.test(message)) return jsonError("A record with these details already exists.", 409, "CONFLICT");

  return jsonError(message, 400, "BAD_REQUEST");
}
