import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | null = null;
let db: DrizzleDb | null = null;

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

export function setDbForTest(input: { db: DrizzleDb; pool?: Pool | null }) {
  db = input.db;
  pool = input.pool ?? null;
}

export function resetDbForTest() {
  db = null;
  pool = null;
}

export type Db = ReturnType<typeof getDb>;
