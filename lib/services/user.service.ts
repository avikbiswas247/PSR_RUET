import * as UserRepo from "@/lib/repositories/user.repository";
import * as RoleRepo from "@/lib/repositories/role.repository";
import { AuthServiceError } from "./auth.service";
const page = (limit = 50, offset = 0) => { if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) throw new Error("Invalid pagination."); return { limit, offset }; };
export async function getPublicUser(userId: string) { const u = await UserRepo.getUserById(userId); if (!u) return null; const { password_hash: secret, ...safe } = u; void secret; const roles = await RoleRepo.getUserRoles(userId); return { ...safe, roles: roles.map((r) => r.name) }; }
export async function listUsers(input: { limit?: number; offset?: number } = {}) { const p = page(input.limit, input.offset); return UserRepo.listUsers(p.limit, p.offset); }
export async function updateOwnProfile(authenticatedUserId: string, patch: { fullName?: string; avatarUrl?: string | null; phone?: string | null }) {
  const data: { full_name?: string; avatar_url?: string | null; phone?: string | null } = {};
  if (patch.fullName !== undefined) { if (patch.fullName.trim().length < 2) throw new Error("Name is too short."); data.full_name = patch.fullName.trim(); }
  if (patch.avatarUrl !== undefined) data.avatar_url = patch.avatarUrl;
  if (patch.phone !== undefined) data.phone = patch.phone;
  const row = await UserRepo.updateUser(authenticatedUserId, data); if (!row) throw new AuthServiceError("User not found.", "USER_NOT_FOUND");
  const { password_hash: secret, ...safe } = row; void secret; return safe;
}
export async function deactivateUser(userId: string) { const row = await UserRepo.updateUser(userId, { is_active: false }); if (!row) throw new Error("User not found."); return { id: row.id, is_active: row.is_active }; }
export const getUserRoles = (userId: string) => RoleRepo.getUserRoles(userId);
