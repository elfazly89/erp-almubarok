import { pool } from "../src/lib/db";

async function runMigration() {
  console.log("=== Memulai Migrasi Modul Jadwal Shift Karyawan Global ===");
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    console.log("1. Membuat tabel 'jadwal_karyawan'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS jadwal_karyawan (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        id_cabang INTEGER NOT NULL REFERENCES cabang(id_cabang),
        id_jabatan INTEGER NOT NULL REFERENCES jabatan(id_jabatan),
        id_shift INTEGER REFERENCES jam_kerja(id),
        tanggal TEXT NOT NULL,
        status_hari TEXT NOT NULL DEFAULT 'KERJA',
        catatan TEXT,
        aktif BOOLEAN NOT NULL DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unq_jadwal_karyawan_user_tanggal UNIQUE (user_id, tanggal)
      );
    `);

    console.log("2. Membuat indeks untuk optimasi performa 'jadwal_karyawan'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jadwal_karyawan_cabang_tgl ON jadwal_karyawan(id_cabang, tanggal);
      CREATE INDEX IF NOT EXISTS idx_jadwal_karyawan_jabatan_tgl ON jadwal_karyawan(id_jabatan, tanggal);
      CREATE INDEX IF NOT EXISTS idx_jadwal_karyawan_user ON jadwal_karyawan(user_id);
      CREATE INDEX IF NOT EXISTS idx_jadwal_karyawan_tanggal ON jadwal_karyawan(tanggal);
    `);

    console.log("3. Membuat tabel 'jabatan_shift_config'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS jabatan_shift_config (
        id SERIAL PRIMARY KEY,
        id_jabatan INTEGER NOT NULL UNIQUE REFERENCES jabatan(id_jabatan),
        tipe_kerja TEXT NOT NULL,
        default_id_shift INTEGER REFERENCES jam_kerja(id),
        hari_kerja_aktif TEXT NOT NULL DEFAULT '1,2,3,4,5,6',
        keterangan TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("4. Membuat tabel 'tukar_shift'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS tukar_shift (
        id SERIAL PRIMARY KEY,
        id_jadwal_pengaju INTEGER NOT NULL REFERENCES jadwal_karyawan(id),
        user_pengaju INTEGER NOT NULL REFERENCES users(id),
        id_jadwal_pengganti INTEGER NOT NULL REFERENCES jadwal_karyawan(id),
        user_pengganti INTEGER NOT NULL REFERENCES users(id),
        tanggal_tukar TEXT NOT NULL,
        alasan TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TEXT,
        catatan_reviewer TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("5. Migrasi data historis dari 'kasir_jadwal' ke 'jadwal_karyawan'...");
    const copyResult = await client.query(`
      INSERT INTO jadwal_karyawan (
        user_id, id_cabang, id_jabatan, id_shift, tanggal, status_hari, catatan, aktif, created_by, created_at
      )
      SELECT 
        kj.id_kasir, 
        kj.id_cabang, 
        COALESCE(u.id_jabatan, 7), 
        kj.id_shift, 
        kj.tanggal, 
        'KERJA', 
        kj.catatan, 
        kj.aktif, 
        kj.created_by, 
        kj.created_at
      FROM kasir_jadwal kj
      LEFT JOIN users u ON u.id = kj.id_kasir
      ON CONFLICT (user_id, tanggal) DO UPDATE SET
        id_shift = EXCLUDED.id_shift,
        id_cabang = EXCLUDED.id_cabang,
        catatan = EXCLUDED.catatan;
    `);
    console.log(`   ✓ Berhasil menyalin ${copyResult.rowCount || 0} jadwal kasir ke jadwal_karyawan.`);

    console.log("6. Mengisi konfigurasi default jabatan (jabatan_shift_config)...");
    // Ambil default shift id pertama dari jam_kerja jika ada
    const shiftRes = await client.query("SELECT id FROM jam_kerja ORDER BY id ASC LIMIT 1;");
    const defaultShiftId = shiftRes.rows[0]?.id || null;

    // Jabatan id_jabatan yang umum:
    // 1: Super User, 2: IT, 3: HRD, 4: Bendahara, 5: Admin, 8: Manager => NON_SHIFT
    // 6: Pramuniaga, 7: Kasir, 9: Driver, 10: Admin Gudang, 11: SPV => SHIFT_ROTASI
    const jabatanRes = await client.query("SELECT id_jabatan, jabatan FROM jabatan ORDER BY id_jabatan ASC;");
    for (const row of jabatanRes.rows) {
      const jId = row.id_jabatan;
      const jName = (row.jabatan || "").toLowerCase();
      const isShiftRotasi = 
        jName.includes("kasir") || 
        jName.includes("pramuniaga") || 
        jName.includes("toko") || 
        jName.includes("driver") || 
        jName.includes("gudang") || 
        jName.includes("spv") || 
        jName.includes("security") || 
        jName.includes("satpam");

      const tipeKerja = isShiftRotasi ? "SHIFT_ROTASI" : "NON_SHIFT";
      const shiftId = isShiftRotasi ? null : defaultShiftId;
      const hariAktif = isShiftRotasi ? "1,2,3,4,5,6,0" : "1,2,3,4,5,6";

      await client.query(`
        INSERT INTO jabatan_shift_config (id_jabatan, tipe_kerja, default_id_shift, hari_kerja_aktif, keterangan)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id_jabatan) DO UPDATE SET
          tipe_kerja = EXCLUDED.tipe_kerja,
          default_id_shift = EXCLUDED.default_id_shift,
          hari_kerja_aktif = EXCLUDED.hari_kerja_aktif;
      `, [jId, tipeKerja, shiftId, hariAktif, `Konfigurasi default otomatis untuk ${row.jabatan}`]);
    }
    console.log("   ✓ Konfigurasi default jabatan berhasil diatur.");

    await client.query("COMMIT;");
    console.log("\n✅ Migrasi Jadwal Karyawan Global BERHASIL!");
  } catch (error: any) {
    await client.query("ROLLBACK;");
    console.error("❌ Gagal migrasi jadwal karyawan global:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
