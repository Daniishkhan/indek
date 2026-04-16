import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (db) return db;

  const connectionString =
    process.env.DATABASE_URL ?? "postgres://localhost:5432/indek_dev";

  pool = new Pool({ connectionString, max: 10 });
  db = drizzle(pool, { schema });
  return db;
}

export function getPool() {
  if (!pool) getDb();
  return pool!;
}

export type Db = ReturnType<typeof getDb>;
