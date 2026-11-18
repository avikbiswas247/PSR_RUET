import { transaction } from "@/lib/db";
import { one } from "./_shared";

export interface LoginUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  email_verified_at: string | Date | null;
  roles: string[];
}

/** Fetch only the fields needed to verify a login. Never return password_hash to a browser. */
export async function findUserForLogin(email: string): Promise<LoginUser | null> {
  const result = await one<LoginUser>(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active,
            u.email_verified_at,
            COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::varchar[]) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL
     GROUP BY u.id`,
    [email.trim()],
  );
  return result;
}
/** Fetch a user by ID with their current roles for session authentication. */
export async function findUserById(
  userId: string,
): Promise<LoginUser | null> {
  return one<LoginUser>(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.password_hash,
       u.is_active,
       u.email_verified_at,
       COALESCE(
         array_agg(r.name) FILTER (WHERE r.name IS NOT NULL),
         ARRAY[]::varchar[]
       ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = $1 AND u.deleted_at IS NULL
     GROUP BY u.id
     LIMIT 1`,
    [userId],
  );
}
/** Create account and optional initial role atomically. Hash the password before calling this. */
export async function createAccount(input: {
  full_name: string;
  email: string;
  password_hash: string;
  initial_role_name?: string;
}) {
  return transaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, full_name, email, is_active, created_at`,
      [input.full_name, input.email, input.password_hash],
    );
    const user = inserted.rows[0];
    if (!user) throw new Error("User creation failed");

    if (input.initial_role_name) {
      const roleResult = await client.query(
        "SELECT id FROM roles WHERE name = $1",
        [input.initial_role_name],
      );
      const role = roleResult.rows[0];
      if (!role) throw new Error(`Role ${input.initial_role_name} does not exist`);
      await client.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [user.id, role.id],
      );
    }
    return user;
  });
}
