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
const JSON_DUMP_PATH = path.join(process.cwd(), "data-pelanggan-migration.json");

async function migrate() {
  let mysqlConnection;
  try {
    // ─── SKENARIO A: CEK APAKAH FILE JSON DUMP TERSEDIA (OFFLINE FALLBACK) ───
    if (fs.existsSync(JSON_DUMP_PATH)) {
      console.log("📂 Ditemukan file dump JSON: 'data-pelanggan-migration.json'");
      console.log("⚡ Memulai proses migrasi data secara offline...");

      const rawData = fs.readFileSync(JSON_DUMP_PATH, "utf8");
      const dump = JSON.parse(rawData);

      const pelangganRows = dump.pelanggan || [];
      const poinRows = dump.riwayat_poin || [];

      console.log(`✓ Terdeteksi ${pelangganRows.length} data pelanggan.`);
      console.log(`✓ Terdeteksi ${poinRows.length} data riwayat poin.`);

      executeSqliteMigration(pelangganRows, poinRows);
      return;
    }

    // ─── SKENARIO B: HUBUNGKAN KE DATABASE MYSQL SECARA LANGSUNG ───
    console.log("🔌 File JSON tidak ditemukan. Mencoba menghubungkan ke database MySQL lokal...");
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log("✓ Berhasil terhubung ke MySQL!");

    // 1. Ambil data pelanggan dari MySQL
    console.log("📦 Mengambil data dari tabel 'pelanggan' di MySQL...");
    const [mysqlPelangganRows]: [any[], any] = await mysqlConnection.query(
      "SELECT * FROM pelanggan"
    );
    console.log(`✓ Ditemukan ${mysqlPelangganRows.length} data pelanggan.`);

    // 2. Ambil data riwayat poin dari MySQL
    console.log("📦 Mengambil data dari tabel 'riwayat_poin' di MySQL...");
    const [mysqlPoinRows]: [any[], any] = await mysqlConnection.query(
      "SELECT * FROM riwayat_poin"
    );
    console.log(`✓ Ditemukan ${mysqlPoinRows.length} data riwayat poin.`);

    // Eksekusi migrasi ke SQLite
    executeSqliteMigration(mysqlPelangganRows, mysqlPoinRows);

  } catch (error: any) {
    console.error("\n❌ GAGAL MENGHUBUNGKAN KE DATABASE MYSQL.");
    console.log("\n💡 TIPS SOLUSI MIGRASI OFFLINE (SANGAT MUDAH):");
    console.log("==================================================================");
    console.log("1. Jalankan web server PHP Anda (Laragon/XAMPP/Hosting).");
    console.log("2. Buka url berikut di browser untuk mengekspor data ke JSON:");
    console.log("   http://localhost/erp-almubarok/public_html/dump-pelanggan.php");
    console.log("3. File 'data-pelanggan-migration.json' akan otomatis dibuat di folder ini.");
    console.log("4. Jalankan kembali perintah ini: npm run db:migrate-pelanggan");
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

function executeSqliteMigration(pelangganRows: any[], poinRows: any[]) {
  console.log("📝 Memulai transaksi pada database SQLite...");
  sqliteDb.pragma("foreign_keys = OFF"); // Nonaktifkan sementara selama migrasi massal

  try {
    // Memulai transaksi database
    const transaction = sqliteDb.transaction(() => {
      // Bersihkan tabel pelanggan & riwayat_poin yang lama di SQLite
      sqliteDb.prepare("DELETE FROM riwayat_poin").run();
      sqliteDb.prepare("DELETE FROM pelanggan").run();

      // Persiapkan statement insert SQLite
      const insertPelanggan = sqliteDb.prepare(`
        INSERT INTO pelanggan (id_pelanggan, kode_pelanggan, nama_lengkap, email, alamat, telepon, level_harga, total_poin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertPoin = sqliteDb.prepare(`
        INSERT INTO riwayat_poin (id, id_pelanggan, jenis_transaksi, jumlah_poin, keterangan, id_referensi_transaksi, waktu)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // 1. Migrasi data pelanggan
      let pelangganMigratedCount = 0;
      for (const row of pelangganRows) {
        const id = row.id_pelanggan;
        // SQLite membutuhkan kode_pelanggan NOT NULL, mari kita buat kode unik
        const kodePelanggan = `PLG-${String(id).padStart(4, "0")}`;
        const nama = row.nama_lengkap;
        const email = row.email || null;
        const alamat = row.alamat || null;
        const telepon = row.telepon || null;
        const levelHarga = row.level_harga !== undefined ? Number(row.level_harga) : 1;
        const totalPoin = row.total_poin !== undefined ? Number(row.total_poin) : 0;

        insertPelanggan.run(id, kodePelanggan, nama, email, alamat, telepon, levelHarga, totalPoin);
        pelangganMigratedCount++;
      }
      console.log(`✓ Berhasil memindahkan ${pelangganMigratedCount} data pelanggan ke SQLite!`);

      // 2. Migrasi data riwayat poin
      let poinMigratedCount = 0;
      for (const row of poinRows) {
        const id = row.id_riwayat_poin || row.id || null;
        const idPelanggan = row.id_pelanggan;
        const jenis = row.jenis_transaksi || "DAPAT";
        const jumlah = row.jumlah_poin !== undefined ? Number(row.jumlah_poin) : 0;
        const ket = row.keterangan || null;
        const ref = row.id_referensi_transaksi || null;
        const waktu = row.tanggal_transaksi || row.waktu || new Date().toISOString();

        insertPoin.run(id, idPelanggan, jenis, jumlah, ket, ref, waktu);
        poinMigratedCount++;
      }
      console.log(`✓ Berhasil memindahkan ${poinMigratedCount} data riwayat poin ke SQLite!`);
    });

    // Eksekusi transaksi
    transaction();

    sqliteDb.pragma("foreign_keys = ON"); // Aktifkan kembali
    console.log("\n🎉 SEMUA DATA BERHASIL DIMIGRASIKAN DENGAN SUKSES KE SQLITE!");

    // Bersihkan file JSON dump setelah migrasi selesai untuk merapikan folder (opsional)
    if (fs.existsSync(JSON_DUMP_PATH)) {
      try {
        fs.unlinkSync(JSON_DUMP_PATH);
        console.log("🧹 Berhasil membersihkan file dump 'data-pelanggan-migration.json'.");
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
