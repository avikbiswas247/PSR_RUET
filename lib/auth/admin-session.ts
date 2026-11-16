import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import * as RoleRepo from "@/lib/repositories/role.repository";

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  is_active: boolean;
};

/**
 * Server-side authorization for admin routes.
 *
 * Reads the secure server-side session (HttpOnly cookie), loads the
 * authenticated user, and confirms the user is active and holds the
 * actual ADMIN role in the database. Returns null when any check fails.
 * Never trusts client-provided roles or frontend state.
 */
export async function requireAdminUser(): Promise<AdminUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const isAdmin = await RoleRepo.userHasRole(user.id, "ADMIN");
  if (!isAdmin) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    roles: user.roles ?? [],
    is_active: user.is_active,
  };
}
