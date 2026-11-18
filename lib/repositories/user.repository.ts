import { byId, deleteById, insertRow, many, updateRow } from "./_shared";

export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  email_verified_at: string | Date | null;
  deleted_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

const TABLE = "users";
const CREATE_COLUMNS = ["full_name", "email", "password_hash", "avatar_url", "phone", "is_active", "email_verified_at", "deleted_at"] as const;
const UPDATE_COLUMNS = ["full_name", "email", "password_hash", "avatar_url", "phone", "is_active", "email_verified_at", "deleted_at"] as const;

export function getUserById(id: string) {
  return byId<User>(TABLE, id);
}

export function listUsers(limit = 50, offset = 0, includeDeleted = true) {
  const where = includeDeleted ? "" : "WHERE deleted_at IS NULL";
  return many<User>(`SELECT * FROM ${TABLE} ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
}

export function createUser(input: Pick<User, "full_name" | "email" | "password_hash" | "avatar_url" | "phone" | "is_active" | "email_verified_at">) {
  return insertRow<User>(TABLE, input as Record<string, unknown>, CREATE_COLUMNS);
}

export function updateUser(id: string, patch: Partial<Pick<User, "full_name" | "email" | "password_hash" | "avatar_url" | "phone" | "is_active" | "email_verified_at" | "deleted_at">>) {
  return updateRow<User>(TABLE, id, patch as Record<string, unknown>, UPDATE_COLUMNS);
}

export function deleteUser(id: string) {
  return deleteById(TABLE, id);
}
