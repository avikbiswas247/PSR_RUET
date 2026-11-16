import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export async function requireUser(): Promise<AuthenticatedUser | Response> {
  const user = await getCurrentUser();
  return user ?? NextResponse.json({ message: "Authentication required" }, { status: 401 });
}
/** Check the role on the already-authenticated user without a second DB lookup. */
export function requireRole(user: AuthenticatedUser, role: string): Response | null {
  if (!user.roles.includes(role)) return NextResponse.json({ message: "You do not have permission to perform this action" }, { status: 403 });
  return null;
}
export function isResponse(value: unknown): value is Response { return value instanceof Response; }
