import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken, hashSessionToken } from "@/lib/auth/session";
import { findValidSession, revokeSession } from "@/lib/repositories/user-session.repository";
export async function POST() {
  try {
    const token = await getSessionToken();
    if (token) { const session = await findValidSession(hashSessionToken(token)); if (session) await revokeSession(session.id); }
    await clearSessionCookie(); return NextResponse.json({ success: true, message: "Logged out" });
  } catch (error) { console.error("[Logout] Request failed:", error); return NextResponse.json({ success: false, message: "Unable to log out" }, { status: 500 }); }
}
