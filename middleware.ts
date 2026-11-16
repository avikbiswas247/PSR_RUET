import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

// Paths that are publicly accessible without authentication.
// "/admin" is an exact match only (entry page). Sub-paths use prefix matching.
const PUBLIC_ADMIN_PATHS = [
  "/admin/register",
  "/admin/login",
  "/admin/auth",
  "/admin/verify-login",
  "/admin/verify-email",
  "/admin/forgot-password",
  "/admin/reset-password",
];

const isPublicAdminPath = (pathname: string) =>
  PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply middleware to /admin paths
  if (!pathname.startsWith("/admin/") && pathname !== "/admin") {
    return NextResponse.next();
  }

  // Allow unauthenticated access to auth pages (entry, login, register, bootstrap, OTP, etc.)
  if (pathname === "/admin" || isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  // For all other /admin/* routes, require a valid session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("psru_session")?.value ?? null;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
