import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { attachDatabasePool } from "@vercel/functions";
type DatabaseGlobal = typeof globalThis & { __psruDatabasePool?: Pool };
export type TransactionOptions = { isolationLevel?: "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE"; readOnly?: boolean };
export type DatabaseClient = PoolClient;
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("[PSRU Database] DATABASE_URL environment variable is missing.");
  return url;
}
function normalizeDatabaseSslMode(url: string): string {
  try {
    const parsed = new URL(url);
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
    const legacyModes = new Set(["prefer", "require", "verify-ca"]);
    if (sslmode && legacyModes.has(sslmode) && parsed.searchParams.get("uselibpqcompat") !== "true") {
      // pg-connection-string currently treats these aliases as verify-full and
      // warns that their semantics will change. Make today's secure behavior explicit.
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
  } catch {
    // Leave non-URL libpq connection strings unchanged.
  }
  return url;
}
function positiveIntegerEnv(name: string, fallback: number, max: number): number {
  const raw = process.env[name]; if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`[PSRU Database] ${name} must be an integer between 1 and ${max}.`);
  return value;
}
function createDatabasePool(): Pool {
  const pool = new Pool({ connectionString: normalizeDatabaseSslMode(getDatabaseUrl()), max: positiveIntegerEnv("DB_POOL_MAX", 5, 50), min: 0, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 20_000, maxUses: 7_500, allowExitOnIdle: true, keepAlive: true, keepAliveInitialDelayMillis: 10_000, application_name: "photographic-society-ruet" });
  pool.on("error", error => console.error("[PSRU Database] Unexpected idle client error:", error.message));
  if (process.env.VERCEL) attachDatabasePool(pool);
  return pool;
}
function getPool(): Pool {
  const g = globalThis as DatabaseGlobal;
  if (!g.__psruDatabasePool) g.__psruDatabasePool = createDatabasePool();
  return g.__psruDatabasePool;
}
export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> { return getPool().query<T>(sql, params); }
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>, options: TransactionOptions = {}): Promise<T> {
  const client = await getPool().connect(); const isolation = options.isolationLevel ?? "READ COMMITTED"; const access = options.readOnly ? "READ ONLY" : "READ WRITE";
  try { await client.query("BEGIN"); await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolation} ${access}`); const result = await callback(client); await client.query("COMMIT"); return result; }
  catch (error) { try { await client.query("ROLLBACK"); } catch (rollbackError) { console.error("[PSRU Database] Rollback failed:", rollbackError instanceof Error ? rollbackError.message : "Unknown rollback error"); } throw error; }
  finally { client.release(); }
}
export async function checkDatabaseConnection(): Promise<boolean> {
  try { await query("SELECT 1"); return true; }
  catch (error) { console.error("[PSRU Database] Health check failed:", error instanceof Error ? error.message : "Unknown database error"); return false; }
}
export function getDatabaseStats() { const p = getPool(); return { totalConnections: p.totalCount, idleConnections: p.idleCount, waitingRequests: p.waitingCount }; }
export { getPool };
