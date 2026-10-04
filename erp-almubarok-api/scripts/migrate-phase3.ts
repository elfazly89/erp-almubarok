/**
 * Script migrasi database: Phase 3 Mobile Foundation
 * Menambahkan kolom-kolom baru ke tabel existing:
 * - users: refresh_token, refresh_token_expires
 * - absensi: foto_selfie, id_shift
 *
 * Jalankan: npx tsx scripts/migrate-phase3.ts
 */

import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function migratePhase3() {
  console.log("🔄 Memulai migrasi Phase 3: Mobile Foundation...\n");

  const migrations: { label: string; query: string }[] = [
    {
      label: "Tambah kolom refresh_token di tabel users",
      query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT`,
    },
    {
      label: "Tambah kolom refresh_token_expires di tabel users",
      query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires TEXT`,
    },
    {
      label: "Tambah kolom foto_selfie di tabel absensi",
      query: `ALTER TABLE absensi ADD COLUMN IF NOT EXISTS foto_selfie TEXT`,
    },
    {
      label: "Tambah kolom id_shift di tabel absensi",
      query: `ALTER TABLE absensi ADD COLUMN IF NOT EXISTS id_shift INTEGER`,
    },
    {
      label: "Buat index pada refresh_token untuk pencarian cepat",
      query: `CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token)`,
    },
  ];

  for (const migration of migrations) {
    try {
      await db.execute(sql.raw(migration.query));
      console.log(`  ✅ ${migration.label}`);
    } catch (err: any) {
      if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
        console.log(`  ⚠️  Kolom sudah ada (skip): ${migration.label}`);
      } else {
        console.error(`  ❌ Gagal: ${migration.label}`);
        console.error(`     Error: ${err.message}`);
        throw err;
      }
    }
  }

  console.log("\n✅ Migrasi Phase 3 selesai!");
  console.log("\nEndpoint mobile baru yang tersedia:");
  console.log("  POST /api/auth/mobile-login      — Login mobile (access + refresh token)");
  console.log("  POST /api/auth/refresh           — Perbarui access token dengan refresh token");
  console.log("  GET  /api/mobile/absensi/status  — Status absensi hari ini");
  console.log("  POST /api/mobile/absensi/check-in  — Absensi masuk + GPS + Selfie");
  console.log("  POST /api/mobile/absensi/check-out — Absensi pulang + GPS + Selfie");
  console.log("  GET  /api/mobile/absensi/riwayat — Riwayat absensi personal");
  console.log("  POST /api/mobile/izin-cuti/ajukan  — Ajukan izin/cuti");
  console.log("  GET  /api/mobile/izin-cuti        — Riwayat izin/cuti");
  console.log("  GET  /api/mobile/slip-gaji         — Slip gaji personal");
  console.log("  GET  /api/mobile/jadwal-shift      — Daftar shift");
  console.log("  GET  /api/mobile/profil            — Profil personal");
  process.exit(0);
}

migratePhase3().catch((err) => {
  console.error("\n❌ Migrasi gagal:", err);
  process.exit(1);
});
