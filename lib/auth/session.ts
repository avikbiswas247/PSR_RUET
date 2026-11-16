
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import * as AuthRepo from "@/lib/repositories/auth.repository";
import * as UserSessionRepo from "@/lib/repositories/user-session.repository";

// ============================================
// SESSION CONFIGURATION
// ============================================

export const SESSION_COOKIE_NAME = "psru_session";

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

// ============================================
// TOKEN GENERATION
// ============================================

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

// ============================================
// TOKEN HASHING
// ============================================

export function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

// ============================================
// COOKIE MANAGEMENT
// ============================================

export async function setSessionCookie(
  token: string
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================
// CREATE SESSION
// ============================================

/**
 * Creates a database-backed session.
 *
 * Returns the raw token so the login API can set the cookie.
 * Only the hashed token is stored in PostgreSQL.
 */
export async function createSession(
  userId: string
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to create a session");
  }

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000
  );

  await UserSessionRepo.createUserSession({
    user_id: userId,
    refresh_token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return token;
}

// ============================================
// GET CURRENT USER
// ============================================

export async function getCurrentUser() {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await UserSessionRepo.findValidSession(tokenHash);

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  const user = await AuthRepo.findUserById(session.user_id);

  if (!user || !user.is_active) {
    await UserSessionRepo.revokeSession(session.id);
    await clearSessionCookie();
    return null;
  }

  const { password_hash, ...safeUser } = user;
  void password_hash; // Explicitly discard the credential hash before returning the user.
  return safeUser;
}
