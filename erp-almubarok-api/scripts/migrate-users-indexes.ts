import { pool } from "../src/lib/db";

async function migrateUsersIndexes() {
  console.log("=== Memulai Migrasi Indeks Users (Abdi HRD) ===");
  const client = await pool.connect();

  try {
    console.log("Membuat ekstensi pg_trgm jika belum ada...");
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    console.log("Membuat indeks pada tabel 'users'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_nama_trgm ON users USING gin (nama_user gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_users_kode ON users (kode_user);
      CREATE INDEX IF NOT EXISTS idx_users_no_hp ON users (no_hp);
      CREATE INDEX IF NOT EXISTS idx_users_no_ktp ON users (no_ktp);
      CREATE INDEX IF NOT EXISTS idx_users_cabang ON users (id_cabang);
      CREATE INDEX IF NOT EXISTS idx_users_jabatan ON users (id_jabatan);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
    `);
    console.log("✓ Indeks tabel 'users' berhasil dibuat.");

    // Verifikasi daftar indeks
    const indexRes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'users'
      ORDER BY indexname;
    `);

    console.log("\n=== Indeks Aktif Users ===");
    console.table(indexRes.rows);

  } catch (error: any) {
    console.error("Gagal migrasi indeks users:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUsersIndexes();
