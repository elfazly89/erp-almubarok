import { pool } from "../src/lib/db";

async function migratePerformanceIndexes() {
  console.log("=== Memulai Migrasi Indeks Performa Database PostgreSQL ===");
  const client = await pool.connect();

  try {
    // 1. Ekstensi Trigram untuk Full Text / Substring Search Cepat
    console.log("[1/5] Memeriksa ekstensi pg_trgm...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("✓ Ekstensi pg_trgm aktif.");

    // 2. Indeks pada Tabel Master Barang
    console.log("[2/5] Membuat indeks pada tabel 'barang'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_barang_nama_trgm ON barang USING gin (nama_barang gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_barang_barcode ON barang (barcode);
      CREATE INDEX IF NOT EXISTS idx_barang_kode ON barang (kode_barang);
      CREATE INDEX IF NOT EXISTS idx_barang_barcode2 ON barang (barcode_satuan_2);
      CREATE INDEX IF NOT EXISTS idx_barang_barcode3 ON barang (barcode_satuan_3);
      CREATE INDEX IF NOT EXISTS idx_barang_kategori ON barang (id_kategori);
      CREATE INDEX IF NOT EXISTS idx_barang_supplier ON barang (id_supplier);
      CREATE INDEX IF NOT EXISTS idx_barang_level ON barang (level_barang);
      CREATE INDEX IF NOT EXISTS idx_barang_status ON barang (status);
      CREATE INDEX IF NOT EXISTS idx_barang_lapor_pajak ON barang (lapor_pajak);
    `);
    console.log("✓ Indeks tabel 'barang' berhasil dibuat.");

    // 3. Indeks pada Tabel Stok Barang
    console.log("[3/5] Membuat indeks pada tabel 'stok_barang'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stok_barang_cabang ON stok_barang (id_barang, id_cabang);
      CREATE INDEX IF NOT EXISTS idx_stok_cabang_akhir ON stok_barang (id_cabang, stok_akhir);
      CREATE INDEX IF NOT EXISTS idx_stok_level_cabang ON stok_barang (level_cabang);
    `);
    console.log("✓ Indeks tabel 'stok_barang' berhasil dibuat.");

    // 4. Indeks pada Tabel Penjualan (Riwayat Transaksi)
    console.log("[4/5] Membuat indeks pada tabel 'penjualan'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_penjualan_cabang_tgl ON penjualan (id_cabang, tanggal_invoice DESC);
      CREATE INDEX IF NOT EXISTS idx_penjualan_tgl ON penjualan (tanggal_invoice DESC);
      CREATE INDEX IF NOT EXISTS idx_penjualan_no_inv ON penjualan (no_invoice);
      CREATE INDEX IF NOT EXISTS idx_penjualan_kasir ON penjualan (id_user);
      CREATE INDEX IF NOT EXISTS idx_penjualan_bayar ON penjualan (jenis_pembayaran);
    `);
    console.log("✓ Indeks tabel 'penjualan' berhasil dibuat.");

    // 5. Indeks pada Tabel Detail Penjualan
    console.log("[5/5] Membuat indeks pada tabel 'penjualan_detail'...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_penjualan_detail_inv ON penjualan_detail (id_penjualan);
      CREATE INDEX IF NOT EXISTS idx_penjualan_detail_brg ON penjualan_detail (id_barang);
    `);
    console.log("✓ Indeks tabel 'penjualan_detail' berhasil dibuat.");

    // Verifikasi daftar indeks yang telah dibuat
    const indexRes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log("\n=== Ringkasan Indeks Performa Aktif ===");
    console.table(indexRes.rows);
    console.log(`Total: ${indexRes.rows.length} indeks performa aktif.`);

  } catch (error: any) {
    console.error("Gagal migrasi indeks performa:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migratePerformanceIndexes();

