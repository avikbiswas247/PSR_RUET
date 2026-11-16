import * as AuthRepo from "@/lib/repositories/auth.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as SessionRepo from "@/lib/repositories/user-session.repository";
import * as ResetRepo from "@/lib/repositories/password-reset-token.repository";
import * as RoleRepo from "@/lib/repositories/role.repository";

export class AuthServiceError extends Error { constructor(message: string, public code: string) { super(message); this.name = "AuthServiceError"; } }
const emailOf = (v: string) => v.trim().toLowerCase();

/** passwordHash must be produced by Argon2id/bcrypt in the route's auth adapter. */
export async function register(input: { fullName: string; email: string; passwordHash: string; initialRole?: "CLIENT" | "MEMBER" | "PHOTOGRAPHER" }) {
  const fullName = input.fullName.trim(); const email = emailOf(input.email);
  if (fullName.length < 2) throw new AuthServiceError("Name must contain at least 2 characters.", "INVALID_NAME");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthServiceError("A valid email is required.", "INVALID_EMAIL");
  if (!input.passwordHash) throw new AuthServiceError("A password hash is required.", "PASSWORD_HASH_REQUIRED");
  return AuthRepo.createAccount({ full_name: fullName, email, password_hash: input.passwordHash, initial_role_name: input.initialRole });
}
export async function getLoginRecord(email: string) {
  if (!email.trim()) throw new AuthServiceError("Email is required.", "INVALID_EMAIL");
  return AuthRepo.findUserForLogin(emailOf(email));
}
export async function revokeSession(sessionId: string, authenticatedUserId: string) {
  const sessions = await SessionRepo.listActiveSessionsForUser(authenticatedUserId);
  if (!sessions.some(s => s.id === sessionId)) throw new AuthServiceError("Session not found.", "SESSION_NOT_FOUND");
  return SessionRepo.revokeSession(sessionId);
}
export const revokeAllSessions = (authenticatedUserId: string) => SessionRepo.revokeAllUserSessions(authenticatedUserId);
export const findValidRefreshSession = (refreshTokenHash: string) => SessionRepo.findValidSession(refreshTokenHash);
export const createSession = (input: { userId: string; refreshTokenHash: string; expiresAt: string }) => SessionRepo.createUserSession({ user_id: input.userId, refresh_token_hash: input.refreshTokenHash, expires_at: input.expiresAt });
export const createPasswordReset = (input: { userId: string; tokenHash: string; expiresAt: string }) => ResetRepo.createPasswordResetToken({ user_id: input.userId, token_hash: input.tokenHash, expires_at: input.expiresAt });
export const findPasswordReset = (tokenHash: string) => ResetRepo.findValidPasswordResetToken(tokenHash);
export const consumePasswordReset = (tokenId: string) => ResetRepo.markPasswordResetTokenUsed(tokenId);
export async function changePassword(input: { userId: string; newPasswordHash: string }) {
  if (!input.newPasswordHash) throw new AuthServiceError("New password hash is required.", "PASSWORD_HASH_REQUIRED");
  const updated = await UserRepo.updateUser(input.userId, { password_hash: input.newPasswordHash });
  if (!updated) throw new AuthServiceError("User not found.", "USER_NOT_FOUND");
  await SessionRepo.revokeAllUserSessions(input.userId);
  return { id: updated.id };
}
export const hasRole = (userId: string, role: string) => RoleRepo.userHasRole(userId, role);
