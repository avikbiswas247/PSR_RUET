import { query } from "@/lib/db";
import { QueryResultRow } from "pg";

/**
 * Shared, deliberately small database helpers.
 * All table names and allowed column names passed to these functions must be
 * constants authored inside repository files. Never pass client input as an
 * identifier (table/column/order-by name).
 */
export async function one<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] ?? null;
}

export async function many<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await query<T>(sql, params);
  return result.rows;
}

export async function run(sql: string, params: unknown[] = []): Promise<number> {
  const result = await query(sql, params);
  return result.rowCount ?? 0;
}

export async function insertRow<T extends QueryResultRow>(
  table: string,
  values: Record<string, unknown>,
  allowedColumns: readonly string[],
): Promise<T> {
  const entries = Object.entries(values).filter(
    ([key, value]) => allowedColumns.includes(key) && value !== undefined,
  );

  if (entries.length === 0) {
    throw new Error(`No valid values supplied for ${table}`);
  }

  const columns = entries.map(([key]) => `"${key}"`).join(", ");
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
  const params = entries.map(([, value]) => value);

  const result = await query<T>(
    `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`,
    params,
  );

  if (!result.rows[0]) throw new Error(`Insert into ${table} returned no row`);
  return result.rows[0];
}

export async function updateRow<T extends QueryResultRow>(
  table: string,
  id: string,
  patch: Record<string, unknown>,
  allowedColumns: readonly string[],
): Promise<T | null> {
  const entries = Object.entries(patch).filter(
    ([key, value]) => allowedColumns.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return one<T>(`SELECT * FROM "${table}" WHERE id = $1`, [id]);

  const assignments = entries
    .map(([key], index) => `"${key}" = $${index + 1}`)
    .join(", ");
  const params = [...entries.map(([, value]) => value), id];

  return one<T>(
    `UPDATE "${table}" SET ${assignments} WHERE id = $${params.length} RETURNING *`,
    params,
  );
}

export async function byId<T extends QueryResultRow>(table: string, id: string): Promise<T | null> {
  return one<T>(`SELECT * FROM "${table}" WHERE id = $1`, [id]);
}

export async function deleteById(table: string, id: string): Promise<boolean> {
  return (await run(`DELETE FROM "${table}" WHERE id = $1`, [id])) > 0;
}

export async function deleteRow(table: string, where: Record<string, unknown>): Promise<boolean> {
  const entries = Object.entries(where).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return false;

  const columns = entries.map(([key]) => `"${key}"`).join(", ");
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
  const params = entries.map(([, value]) => value);

  const result = await query(
    `DELETE FROM "${table}" WHERE ${columns} = (${placeholders})`,
    params,
  );
  return (result.rowCount ?? 0) > 0;
}
