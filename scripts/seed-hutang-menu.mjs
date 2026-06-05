/**
 * Script: seed-hutang-menu.mjs
 * Inserts "Hutang Abdi" (/hrd/hutang) into menu_sub and grants
 * full access to ALL existing jabatan in role_menu_sub.
 *
 * Usage: node scripts/seed-hutang-menu.mjs
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "erp-almubarok.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("📦 Database:", DB_PATH);

// 1. Find HRD & Abdi main menu id
const hrdMenu = db.prepare(`SELECT id FROM menu_main WHERE nama = 'HRD & Abdi' LIMIT 1`).get();
if (!hrdMenu) {
  console.error("❌ Menu utama 'HRD & Abdi' tidak ditemukan di database!");
  process.exit(1);
}
console.log(`✅ HRD & Abdi main menu found: id=${hrdMenu.id}`);

// 2. Check if /hrd/hutang already exists
const existing = db.prepare(`SELECT id FROM menu_sub WHERE link = '/hrd/hutang' LIMIT 1`).get();

let subId;
if (existing) {
  subId = existing.id;
  console.log(`ℹ️  menu_sub '/hrd/hutang' sudah ada: id=${subId}`);
} else {
  // 3. Insert the new sub menu
  const insertSub = db.prepare(`
    INSERT INTO menu_sub (id_menu_main, nama, link, urutan, aktif)
    VALUES (?, 'Hutang Abdi', '/hrd/hutang', 7, 1)
  `);
  const result = insertSub.run(hrdMenu.id);
  subId = result.lastInsertRowid;
  console.log(`✅ Inserted menu_sub 'Hutang Abdi' → id=${subId}`);

  // Also update Bisyaroh urutan to 8
  db.prepare(`UPDATE menu_sub SET urutan = 8 WHERE link = '/hrd/bisyaroh'`).run();
  console.log(`✅ Updated Bisyaroh urutan → 8`);
}

// 4. Get all jabatan
const jabatanList = db.prepare(`SELECT id_jabatan, jabatan FROM jabatan`).all();
console.log(`\n👥 Jabatan ditemukan: ${jabatanList.length}`);

// 5. Grant full access to each jabatan
const checkExisting = db.prepare(`
  SELECT id FROM role_menu_sub 
  WHERE id_jabatan = ? AND id_menu_sub = ? 
  LIMIT 1
`);
const insertRole = db.prepare(`
  INSERT INTO role_menu_sub (id_jabatan, id_menu_sub, aktif, can_create, can_read, can_update, can_delete)
  VALUES (?, ?, 1, 1, 1, 1, 1)
`);

let inserted = 0;
let skipped = 0;

for (const jab of jabatanList) {
  const already = checkExisting.get(jab.id_jabatan, subId);
  if (already) {
    console.log(`  ⏭️  ${jab.jabatan} — sudah ada, skip`);
    skipped++;
  } else {
    insertRole.run(jab.id_jabatan, subId);
    console.log(`  ✅ ${jab.jabatan} — akses diberikan`);
    inserted++;
  }
}

console.log(`\n🎉 Selesai! Inserted: ${inserted}, Skipped: ${skipped}`);
console.log(`Menu 'Hutang Abdi' siap muncul di sidebar untuk semua jabatan.`);

db.close();
