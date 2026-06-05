import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";
import path from "path";
import { eq } from "drizzle-orm";

const DB_PATH = path.join(process.cwd(), "erp-almubarok.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

async function diagnose() {
  const jabId = 7; // Kasir role ID
  const main_menu = [
    { id: 1, can_create: false, can_read: true, can_update: false, can_delete: false },
    { id: 2, can_create: false, can_read: true, can_update: false, can_delete: false }
  ];
  const sub_menu = [
    { id: 1, can_create: false, can_read: true, can_update: false, can_delete: false }
  ];

  console.log("Starting synchronous transactional test...");
  try {
    db.transaction((tx) => {
      console.log("Deleting existing roles...");
      tx.delete(schema.role_menu).where(eq(schema.role_menu.id_jabatan, jabId)).run();
      tx.delete(schema.role_menu_sub).where(eq(schema.role_menu_sub.id_jabatan, jabId)).run();

      console.log("Inserting main menu roles...");
      for (const item of main_menu) {
        console.log(`Inserting main menu id ${item.id} with values:`, item);
        tx.insert(schema.role_menu).values({
          id_jabatan: jabId,
          id_menu_main: item.id,
          aktif: !!item.can_read,
          can_create: !!item.can_create,
          can_read: !!item.can_read,
          can_update: !!item.can_update,
          can_delete: !!item.can_delete,
        }).run();
      }

      console.log("Inserting sub menu roles...");
      for (const item of sub_menu) {
        console.log(`Inserting sub menu id ${item.id} with values:`, item);
        tx.insert(schema.role_menu_sub).values({
          id_jabatan: jabId,
          id_menu_sub: item.id,
          aktif: !!item.can_read,
          can_create: !!item.can_create,
          can_read: !!item.can_read,
          can_update: !!item.can_update,
          can_delete: !!item.can_delete,
        }).run();
      }
    });
    console.log("Transaction successfully completed!");
  } catch (error) {
    console.error("TRANSACTION FAILED:", error);
  } finally {
    sqlite.close();
  }
}

diagnose();
