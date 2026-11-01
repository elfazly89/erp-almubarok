import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/erp_almubarok",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("⚠️ [PostgreSQL Pool] Error tak terduga pada client idle:", err.message);
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
