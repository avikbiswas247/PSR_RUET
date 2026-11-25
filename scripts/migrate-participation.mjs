import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is not configured. Add it to .env.local or the process environment.");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrations = [
  "0013_create_participation_forms.sql",
  "0014_add_participation_image_toggle.sql",
  "0015_add_participation_video_submissions.sql",
];
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });

try {
  const client = await pool.connect();
  try {
    for (const migration of migrations) {
      const sql = await readFile(path.join(root, "migrations", migration), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Applied ${migration}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
} catch (error) {
  const code = error && typeof error === "object" && "code" in error ? ` (${error.code})` : "";
  console.error(`Participation migration failed${code}. Check database connectivity and permissions.`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
