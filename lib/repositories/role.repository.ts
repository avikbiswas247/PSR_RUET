import { many, one, run } from "./_shared";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string | Date;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: string | Date;
}

export function listRoles() {
  return many<Role>("SELECT * FROM roles ORDER BY name ASC");
}

export function getRoleByName(name: string) {
  return one<Role>("SELECT * FROM roles WHERE name = $1", [name]);
}

export function getUserRoles(userId: string) {
  return many<Role>(
    `SELECT r.* FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 ORDER BY r.name`,
    [userId],
  );
}

/** Assigning the same role twice is harmless because of ON CONFLICT. */
export async function assignRole(userId: string, roleId: string) {
  await run(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId, roleId],
  );
}

export function removeRole(userId: string, roleId: string) {
  return run("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2", [userId, roleId]);
}

export function userHasRole(userId: string, roleName: string) {
  return one<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND r.name = $2
     ) AS allowed`,
    [userId, roleName],
  ).then((row) => row?.allowed ?? false);
}
