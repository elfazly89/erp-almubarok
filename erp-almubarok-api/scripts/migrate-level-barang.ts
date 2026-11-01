import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🚀 Menjalankan migrasi kolom level_barang (FSN Classification)...");

  // 1. Alter tabel barang
  await db.execute(sql`
    ALTER TABLE barang 
    ADD COLUMN IF NOT EXISTS level_barang text DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS level_mode text DEFAULT 'AUTO',
    ADD COLUMN IF NOT EXISTS terakhir_terjual text,
    ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP::text;
  `);
  console.log("✅ Kolom level_barang, level_mode, terakhir_terjual, created_at berhasil ditambahkan ke tabel barang.");

  // 2. Alter tabel stok_barang
  await db.execute(sql`
    ALTER TABLE stok_barang 
    ADD COLUMN IF NOT EXISTS level_cabang text DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS terakhir_terjual_cabang text;
  `);
  console.log("✅ Kolom level_cabang, terakhir_terjual_cabang berhasil ditambahkan ke tabel stok_barang.");

  console.log("🎉 Migrasi database selesai dengan sukses!");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Gagal migrasi database:", err);
  process.exit(1);
});

