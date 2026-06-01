import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let DB_PATH = path.join(process.cwd(), "erp-almubarok.db");

// If running in a serverless environment (like Vercel), copy the database to /tmp so it is writable!
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  const tmpPath = path.join("/tmp", "erp-almubarok.db");
  if (!fs.existsSync(tmpPath)) {
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, tmpPath);
        console.log("📁 Pre-seeded database copied to /tmp successfully!");
      } else {
        console.log("⚠️ Source database not found at process.cwd(), initializing fresh at /tmp");
      }
    } catch (err) {
      console.error("❌ Failed to copy database to /tmp:", err);
    }
  }
  DB_PATH = tmpPath;
}

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
