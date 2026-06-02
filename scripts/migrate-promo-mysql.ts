import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Koneksi ke SQLite Database lokal Next.js
const SQLITE_DB_PATH = path.join(process.cwd(), "erp-almubarok.db");
const sqliteDb = new Database(SQLITE_DB_PATH);

// Konfigurasi MySQL berdasarkan berkas config.php di public_html
const mysqlConfig = {
  host: "localhost",
  user: "u495433207_pujasera",
  password: "Misfalah89",
  database: "u495433207_pujasera",
};

// Path File JSON Dump Fallback
const JSON_DUMP_PATH = path.join(process.cwd(), "data-promo-migration.json");

const PROMO_TABLES = [
  "promo_cabang",
  "promo_syarat_pembelanjaan",
  "promo_syarat_kategori",
  "promo_syarat_supplier",
  "promo_hadiah_poin",
  "promo_hadiah_diskon",
  "promo_syarat_barang_tertentu",
  "promo_syarat_beli",
  "promo_hadiah_gratis",
  "promo_diskon_barang",
  "promo_poin_barang",
  "promo_hadiah_barang",
  "promo_barang_tebus_murah",
  "promo",
];

async function migrate() {
  let mysqlConnection;
  try {
    // ─── SKENARIO A: CEK APAKAH FILE JSON DUMP TERSEDIA (OFFLINE FALLBACK) ───
    if (fs.existsSync(JSON_DUMP_PATH)) {
      console.log("📂 Ditemukan file dump JSON: 'data-promo-migration.json'");
      console.log("⚡ Memulai proses migrasi data secara offline...");

      const rawData = fs.readFileSync(JSON_DUMP_PATH, "utf8");
      const dump = JSON.parse(rawData);

      executeSqliteMigration(dump);
      return;
    }

    // ─── SKENARIO B: HUBUNGKAN KE DATABASE MYSQL SECARA LANGSUNG ───
    console.log("🔌 File JSON tidak ditemukan. Mencoba menghubungkan ke database MySQL lokal...");
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log("✓ Berhasil terhubung ke MySQL!");

    const dump: { [key: string]: any[] } = {};

    for (const table of PROMO_TABLES) {
      console.log(`📦 Mengambil data dari tabel '${table}' di MySQL...`);
      try {
        const [rows]: [any[], any] = await mysqlConnection.query(`SELECT * FROM ${table}`);
        dump[table] = rows;
        console.log(`✓ Ditemukan ${rows.length} data pada tabel ${table}.`);
      } catch (err: any) {
        console.warn(`⚠️ Gagal mengambil tabel '${table}':`, err.message);
        dump[table] = [];
      }
    }

    // Eksekusi migrasi ke SQLite
    executeSqliteMigration(dump);

  } catch (error: any) {
    console.error("\n❌ GAGAL MENGHUBUNGKAN KE DATABASE MYSQL.");
    console.log("\n💡 TIPS SOLUSI MIGRASI OFFLINE (SANGAT MUDAH):");
    console.log("==================================================================");
    console.log("1. Buat file 'data-promo-migration.json' secara manual di folder ini.");
    console.log("2. Isi file tersebut dengan format JSON object berisi array data");
    console.log("   tabel promo (misal: { \"promo\": [], \"promo_cabang\": [] }).");
    console.log("3. Jalankan kembali perintah ini: npm run db:migrate-promo");
    console.log("==================================================================\n");
    console.error("Detail Galat:", error.message || error);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    sqliteDb.close();
    console.log("🔌 Koneksi database ditutup.");
  }
}

function executeSqliteMigration(dump: { [key: string]: any[] }) {
  console.log("📝 Memulai transaksi pada database SQLite...");
  sqliteDb.pragma("foreign_keys = OFF"); // Nonaktifkan sementara selama migrasi massal

  try {
    // Memulai transaksi database
    const transaction = sqliteDb.transaction(() => {
      // Bersihkan seluruh tabel lama dengan urutan foreign key aman
      for (const table of PROMO_TABLES) {
        sqliteDb.prepare(`DELETE FROM ${table}`).run();
      }
      console.log("🧹 Berhasil membersihkan seluruh tabel promo lama di SQLite.");

      // 1. Migrasi data utama `promo`
      const promoRows = dump.promo || [];
      const insertPromo = sqliteDb.prepare(`
        INSERT INTO promo (
          id_promo, nama_promo, tipe_promo, deskripsi, berlaku_untuk, tanggal_mulai, tanggal_selesai, 
          status, berlaku_kelipatan, created_by, updated_by, id_cabang_pembuat, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of promoRows) {
        insertPromo.run(
          row.id_promo,
          row.nama_promo,
          row.tipe_promo,
          row.deskripsi || null,
          row.berlaku_untuk || "UMUM",
          row.tanggal_mulai,
          row.tanggal_selesai,
          row.status || "Aktif",
          row.berlaku_kelipatan !== undefined ? Number(row.berlaku_kelipatan) : 0,
          row.created_by || null,
          row.updated_by || null,
          row.id_cabang_pembuat || null,
          row.created_at || new Date().toISOString(),
          row.updated_at || new Date().toISOString()
        );
      }
      console.log(`✓ Berhasil memindahkan ${promoRows.length} data utama 'promo' ke SQLite!`);

      // 2. Migrasi data detail `promo_cabang`
      const cabangRows = dump.promo_cabang || [];
      const insertCabang = sqliteDb.prepare(`
        INSERT INTO promo_cabang (id, id_promo, id_cabang) VALUES (?, ?, ?)
      `);
      for (const row of cabangRows) {
        insertCabang.run(row.id || null, row.id_promo, row.id_cabang);
      }
      console.log(`✓ Berhasil memindahkan ${cabangRows.length} data 'promo_cabang' ke SQLite!`);

      // 3. Migrasi data `promo_syarat_pembelanjaan`
      const syaratPemRows = dump.promo_syarat_pembelanjaan || [];
      const insertSyaratPem = sqliteDb.prepare(`
        INSERT INTO promo_syarat_pembelanjaan (id, id_promo, minimum_pembelanjaan, berlaku_kelipatan) VALUES (?, ?, ?, ?)
      `);
      for (const row of syaratPemRows) {
        insertSyaratPem.run(row.id || null, row.id_promo, Number(row.minimum_pembelanjaan) || 0, Number(row.berlaku_kelipatan) || 0);
      }

      // 4. Migrasi data `promo_syarat_kategori`
      const syaratKatRows = dump.promo_syarat_kategori || [];
      const insertSyaratKat = sqliteDb.prepare(`
        INSERT INTO promo_syarat_kategori (id, id_promo, id_kategori) VALUES (?, ?, ?)
      `);
      for (const row of syaratKatRows) {
        insertSyaratKat.run(row.id || null, row.id_promo, row.id_kategori);
      }

      // 5. Migrasi data `promo_syarat_supplier`
      const syaratSupRows = dump.promo_syarat_supplier || [];
      const insertSyaratSup = sqliteDb.prepare(`
        INSERT INTO promo_syarat_supplier (id, id_promo, id_supplier) VALUES (?, ?, ?)
      `);
      for (const row of syaratSupRows) {
        insertSyaratSup.run(row.id || null, row.id_promo, row.id_supplier);
      }

      // 6. Migrasi data `promo_hadiah_poin`
      const hadiahPoinRows = dump.promo_hadiah_poin || [];
      const insertHadiahPoin = sqliteDb.prepare(`
        INSERT INTO promo_hadiah_poin (id, id_promo, jumlah_poin) VALUES (?, ?, ?)
      `);
      for (const row of hadiahPoinRows) {
        insertHadiahPoin.run(row.id || null, row.id_promo, Number(row.jumlah_poin) || 0);
      }

      // 7. Migrasi data `promo_hadiah_diskon`
      const hadiahDiskRows = dump.promo_hadiah_diskon || [];
      const insertHadiahDisk = sqliteDb.prepare(`
        INSERT INTO promo_hadiah_diskon (id, id_promo, jenis_diskon, nilai_diskon) VALUES (?, ?, ?, ?)
      `);
      for (const row of hadiahDiskRows) {
        insertHadiahDisk.run(row.id || null, row.id_promo, row.jenis_diskon, Number(row.nilai_diskon) || 0);
      }

      // 8. Migrasi data `promo_syarat_barang_tertentu`
      const syaratBarangRows = dump.promo_syarat_barang_tertentu || [];
      const insertSyaratBarang = sqliteDb.prepare(`
        INSERT INTO promo_syarat_barang_tertentu (id, id_promo, id_barang) VALUES (?, ?, ?)
      `);
      for (const row of syaratBarangRows) {
        insertSyaratBarang.run(row.id || null, row.id_promo, row.id_barang);
      }

      // 9. Migrasi data `promo_syarat_beli`
      const syaratBeliRows = dump.promo_syarat_beli || [];
      const insertSyaratBeli = sqliteDb.prepare(`
        INSERT INTO promo_syarat_beli (id, id_promo, id_barang, jumlah, id_satuan) VALUES (?, ?, ?, ?, ?)
      `);
      for (const row of syaratBeliRows) {
        insertSyaratBeli.run(row.id || null, row.id_promo, row.id_barang, Number(row.jumlah) || 0, Number(row.id_satuan) || 1);
      }

      // 10. Migrasi data `promo_hadiah_gratis`
      const hadiahGratisRows = dump.promo_hadiah_gratis || [];
      const insertHadiahGratis = sqliteDb.prepare(`
        INSERT INTO promo_hadiah_gratis (id, id_promo, id_barang, jumlah, id_satuan) VALUES (?, ?, ?, ?, ?)
      `);
      for (const row of hadiahGratisRows) {
        insertHadiahGratis.run(row.id || null, row.id_promo, row.id_barang, Number(row.jumlah) || 0, Number(row.id_satuan) || 1);
      }

      // 11. Migrasi data `promo_diskon_barang`
      const diskonBarangRows = dump.promo_diskon_barang || [];
      const insertDiskonBarang = sqliteDb.prepare(`
        INSERT INTO promo_diskon_barang (id, id_promo, id_barang, jumlah, id_satuan, jenis_diskon, nilai_diskon, berlaku_kelipatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of diskonBarangRows) {
        insertDiskonBarang.run(
          row.id || null,
          row.id_promo,
          row.id_barang,
          Number(row.jumlah) || 0,
          Number(row.id_satuan) || 1,
          row.jenis_diskon || "PERSEN",
          Number(row.nilai_diskon) || 0,
          Number(row.berlaku_kelipatan) || 0
        );
      }

      // 12. Migrasi data `promo_poin_barang`
      const poinBarangRows = dump.promo_poin_barang || [];
      const insertPoinBarang = sqliteDb.prepare(`
        INSERT INTO promo_poin_barang (id, id_promo, id_barang, jumlah_barang, id_satuan, jumlah_poin, berlaku_kelipatan) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of poinBarangRows) {
        insertPoinBarang.run(
          row.id || null,
          row.id_promo,
          row.id_barang,
          Number(row.jumlah_barang) || 0,
          Number(row.id_satuan) || 1,
          Number(row.jumlah_poin) || 0,
          Number(row.berlaku_kelipatan) || 0
        );
      }

      // 13. Migrasi data `promo_hadiah_barang`
      const hadiahBarangRows = dump.promo_hadiah_barang || [];
      const insertHadiahBarang = sqliteDb.prepare(`
        INSERT INTO promo_hadiah_barang (id, id_promo, id_barang, jumlah, id_satuan) VALUES (?, ?, ?, ?, ?)
      `);
      for (const row of hadiahBarangRows) {
        insertHadiahBarang.run(row.id || null, row.id_promo, row.id_barang, Number(row.jumlah) || 0, Number(row.id_satuan) || 1);
      }

      // 14. Migrasi data `promo_barang_tebus_murah`
      const tebusRows = dump.promo_barang_tebus_murah || [];
      const insertTebus = sqliteDb.prepare(`
        INSERT INTO promo_barang_tebus_murah (id, id_promo, id_barang, jumlah, id_satuan, harga_tebus) VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const row of tebusRows) {
        insertTebus.run(row.id || null, row.id_promo, row.id_barang, Number(row.jumlah) || 0, Number(row.id_satuan) || 1, Number(row.harga_tebus) || 0);
      }

      console.log("✓ Seluruh tabel detail promo berhasil dipetakan!");
    });

    // Eksekusi transaksi
    transaction();

    sqliteDb.pragma("foreign_keys = ON"); // Aktifkan kembali
    console.log("\n🎉 SEMUA DATA PROMOSI BERHASIL DIMIGRASIKAN DENGAN SUKSES KE SQLITE!");

    // Bersihkan file JSON dump setelah migrasi selesai
    if (fs.existsSync(JSON_DUMP_PATH)) {
      try {
        fs.unlinkSync(JSON_DUMP_PATH);
        console.log("🧹 Berhasil membersihkan file dump 'data-promo-migration.json'.");
      } catch (e: any) {
        console.warn("⚠️ Tidak dapat menghapus file dump JSON:", e.message);
      }
    }
  } catch (error: any) {
    sqliteDb.pragma("foreign_keys = ON");
    console.error("❌ Terjadi kesalahan transaksi SQLite:", error.message || error);
    throw error;
  }
}

migrate();
