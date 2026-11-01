import { pool } from "../src/lib/db";

async function migrateSupplierPelangganIndexes() {
  console.log("=== Memulai Migrasi Indeks Supplier & Pelanggan ===");
  const client = await pool.connect();

  try {
    // 1. Indeks pada Tabel Supplier
    console.log("[1/2] Membuat indeks pada tabel 'supplier'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_supplier_nama_trgm ON supplier USING gin (nama_supplier gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_supplier_telepon ON supplier (telepon);
      CREATE INDEX IF NOT EXISTS idx_supplier_status_pajak ON supplier (status_pajak);
      CREATE INDEX IF NOT EXISTS idx_supplier_hari_kunjungan ON supplier (hari_kunjungan);
      CREATE INDEX IF NOT EXISTS idx_supplier_periode_kunjungan ON supplier (periode_kunjungan);
    `);
    console.log("✓ Indeks tabel 'supplier' berhasil dibuat.");

    // 2. Indeks pada Tabel Pelanggan
    console.log("[2/2] Membuat indeks pada tabel 'pelanggan'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pelanggan_nama_trgm ON pelanggan USING gin (nama_lengkap gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_pelanggan_kode ON pelanggan (kode_pelanggan);
      CREATE INDEX IF NOT EXISTS idx_pelanggan_telepon ON pelanggan (telepon);
      CREATE INDEX IF NOT EXISTS idx_pelanggan_level_harga ON pelanggan (level_harga);
    `);
    console.log("✓ Indeks tabel 'pelanggan' berhasil dibuat.");

    // Verifikasi daftar indeks yang telah dibuat
    const indexRes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename IN ('supplier', 'pelanggan')
      ORDER BY tablename, indexname;
    `);

    console.log("\n=== Indeks Aktif Supplier & Pelanggan ===");
    console.table(indexRes.rows);

  } catch (error: any) {
    console.error("Gagal migrasi indeks supplier & pelanggan:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSupplierPelangganIndexes();

