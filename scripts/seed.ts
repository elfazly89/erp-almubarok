import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "erp-almubarok.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── JABATAN ─────────────────────────────────────────────────────────────
  console.log("  Inserting jabatan...");
  await db.insert(schema.jabatan).values([
    { id_jabatan: 1, jabatan: "Super User" },
    { id_jabatan: 2, jabatan: "IT" },
    { id_jabatan: 3, jabatan: "HRD" },
    { id_jabatan: 4, jabatan: "Bendahara" },
    { id_jabatan: 5, jabatan: "Admin" },
    { id_jabatan: 6, jabatan: "Pramuniaga" },
    { id_jabatan: 7, jabatan: "Kasir" },
    { id_jabatan: 8, jabatan: "Manager" },
    { id_jabatan: 9, jabatan: "Driver" },
    { id_jabatan: 10, jabatan: "Admin Gudang" },
    { id_jabatan: 11, jabatan: "SPV" },
  ]).onConflictDoNothing();

  // ─── CABANG ──────────────────────────────────────────────────────────────
  console.log("  Inserting cabang...");
  await db.insert(schema.cabang).values([
    { id_cabang: 2, kode_cabang: "SR09231", nama_cabang: "SUKOSARI", alamat: "SUKOSARI", telepon: "021812481", email: "info@almubarok.com" },
    { id_cabang: 3, kode_cabang: "Kantor", nama_cabang: "Kantor", alamat: "Sukowono", telepon: "082337522221", email: "kantor@almubarok.com" },
  ]).onConflictDoNothing();

  // ─── USERS ───────────────────────────────────────────────────────────────
  console.log("  Inserting users...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const kasirPassword = await bcrypt.hash("kasir123", 10);
  const hrdPassword = await bcrypt.hash("hrd123", 10);

  await db.insert(schema.users).values([
    {
      id: 4,
      kode_user: "admin",
      nama_user: "ACH FAWAID BAQIR",
      no_hp: "082317356095",
      status: "Kontrak",
      password: adminPassword,
      id_jabatan: 1,
      id_cabang: 2,
      tanggal_masuk: "2004-05-20",
    },
    {
      id: 9,
      kode_user: "kasir",
      nama_user: "Kasir Al Mubarok",
      no_hp: "082222545152",
      status: "Kontrak",
      password: kasirPassword,
      id_jabatan: 7,
      id_cabang: 2,
      tanggal_masuk: "2000-02-02",
    },
    {
      id: 28,
      kode_user: "HRD",
      nama_user: "HRD Al Mubarok",
      no_hp: "08525023232",
      status: "Abdi Tetap",
      password: hrdPassword,
      id_jabatan: 3,
      id_cabang: 3,
      tanggal_masuk: "2025-02-02",
    },
  ]).onConflictDoNothing();

  // ─── JAM KERJA ───────────────────────────────────────────────────────────
  console.log("  Inserting jam kerja...");
  await db.insert(schema.jam_kerja).values([
    { id: 1, nama_shift: "shift1", jam_masuk: "06:30:00", jam_masuk_batas_akhir: "07:00:00", jam_pulang: "14:00:00", jam_pulang_batas_awal: "13:50:00", keterangan: "Shift Toko Pagi" },
    { id: 2, nama_shift: "shift2", jam_masuk: "13:30:00", jam_masuk_batas_akhir: "14:00:00", jam_pulang: "21:30:00", jam_pulang_batas_awal: "21:20:00", keterangan: "Shift Toko Siang" },
    { id: 3, nama_shift: "kantor", jam_masuk: "08:00:00", jam_masuk_batas_akhir: "08:15:00", jam_pulang: "16:00:00", jam_pulang_batas_awal: "15:45:00", keterangan: "Karyawan Kantor" },
  ]).onConflictDoNothing();

  // ─── HARI LIBUR ──────────────────────────────────────────────────────────
  console.log("  Inserting hari libur...");
  await db.insert(schema.hari_libur).values([
    { tanggal: "2025-01-01", nama_libur: "Tahun Baru Masehi", keterangan: "Libur Nasional" },
    { tanggal: "2025-04-09", nama_libur: "Hari Raya Idul Fitri", keterangan: "Libur Nasional" },
    { tanggal: "2025-04-10", nama_libur: "Hari Raya Idul Fitri", keterangan: "Libur Nasional" },
    { tanggal: "2025-05-01", nama_libur: "Hari Buruh", keterangan: "Libur Nasional" },
    { tanggal: "2025-12-25", nama_libur: "Hari Natal", keterangan: "Libur Nasional" },
  ]).onConflictDoNothing();

  // ─── KATEGORI BARANG ─────────────────────────────────────────────────────────
  console.log("  Inserting kategori barang...");
  await db.insert(schema.kategori_barang).values([
    { id_kategori: 1, kode_kategori: "kt-001", nama_kategori: "Makanan" },
    { id_kategori: 2, kode_kategori: "kt-002", nama_kategori: "Minuman" },
    { id_kategori: 3, kode_kategori: "kt-003", nama_kategori: "Obat-obatan" },
  ]).onConflictDoNothing();

  // ─── SUPPLIER ────────────────────────────────────────────────────────────────
  console.log("  Inserting supplier...");
  await db.insert(schema.supplier).values([
    { id_supplier: 1, nama_supplier: "PT Mayora Indah", alamat: "Jakarta", telepon: "021-123456", email: "contact@mayora.com", bank: "Mandiri", no_rek_bank: "1234567890", hari_kunjungan: "Senin", periode_kunjungan: "Mingguan", status_pajak: "PKP" },
    { id_supplier: 2, nama_supplier: "PT Unilever Indonesia", alamat: "Tangerang", telepon: "021-654321", email: "contact@unilever.com", bank: "BCA", no_rek_bank: "0987654321", hari_kunjungan: "Rabu", periode_kunjungan: "Mingguan", status_pajak: "PKP" },
  ]).onConflictDoNothing();

  // ─── BARANG ──────────────────────────────────────────────────────────────────
  console.log("  Inserting barang...");
  await db.insert(schema.barang).values([
    {
      id_barang: 1,
      barcode: "8998866200225",
      nama_barang: "Indomie Goreng Spesial",
      id_kategori: 1,
      id_supplier: 1,
      satuan_1: "pcs",
      satuan_2: "pak",
      satuan_3: "dus",
      isi_1: 1,
      isi_2: 5,
      isi_3: 40,
      harga_beli: 2500,
      harga_rata: 2500,
      harga_jual_1_1: 3000,
      harga_jual_1_2: 14500,
      harga_jual_1_3: 110000,
      harga_jual_2_1: 2900,
      harga_jual_2_2: 14000,
      harga_jual_2_3: 108000,
      harga_jual_3_1: 2800,
      harga_jual_3_2: 13500,
      harga_jual_3_3: 105000,
      jual_rugi: 0,
      status: "Aktif",
      status_pajak: "Non PPn",
    },
    {
      id_barang: 2,
      barcode: "8992695700355",
      nama_barang: "Aqua Botol 600ml",
      id_kategori: 2,
      id_supplier: 2,
      satuan_1: "pcs",
      satuan_2: "dus",
      isi_1: 1,
      isi_2: 24,
      harga_beli: 2000,
      harga_rata: 2000,
      harga_jual_1_1: 3500,
      harga_jual_1_2: 72000,
      harga_jual_2_1: 3300,
      harga_jual_2_2: 70000,
      jual_rugi: 0,
      status: "Aktif",
      status_pajak: "Non PPn",
    },
    {
      id_barang: 3,
      barcode: "8992745300030",
      nama_barang: "Panadol Extra 10 Tablet",
      id_kategori: 3,
      id_supplier: 1,
      satuan_1: "strip",
      satuan_2: "box",
      isi_1: 1,
      isi_2: 10,
      harga_beli: 10000,
      harga_rata: 10000,
      harga_jual_1_1: 12500,
      harga_jual_1_2: 120000,
      jual_rugi: 0,
      status: "Aktif",
      status_pajak: "Non PPn",
    },
  ]).onConflictDoNothing();

  // ─── STOK BARANG ─────────────────────────────────────────────────────────────
  console.log("  Inserting stok barang...");
  await db.insert(schema.stok_barang).values([
    { id: 1, id_barang: 1, id_cabang: 2, stok_akhir: 120, penjualan: 0, posisi_rak: "A1-03", minimal_stok: 10, maksimal_stok: 200 },
    { id: 2, id_barang: 2, id_cabang: 2, stok_akhir: 240, penjualan: 0, posisi_rak: "B2-01", minimal_stok: 24, maksimal_stok: 500 },
    { id: 3, id_barang: 3, id_cabang: 2, stok_akhir: 15, penjualan: 0, posisi_rak: "C3-02", minimal_stok: 5, maksimal_stok: 50 },
    { id: 4, id_barang: 1, id_cabang: 3, stok_akhir: 40, penjualan: 0, posisi_rak: "Rak A", minimal_stok: 10, maksimal_stok: 100 },
  ]).onConflictDoNothing();

  // ─── PELANGGAN ───────────────────────────────────────────────────────────────
  console.log("  Inserting pelanggan...");
  await db.insert(schema.pelanggan).values([
    { id_pelanggan: 1, kode_pelanggan: "PLG-001", nama_lengkap: "Umum", alamat: "-", telepon: "-" },
    { id_pelanggan: 2, kode_pelanggan: "PLG-002", nama_lengkap: "Ach Fawaid Baqir", alamat: "Sukowono", telepon: "082337522221", total_poin: 150 },
    { id_pelanggan: 3, kode_pelanggan: "PLG-003", nama_lengkap: "Siti Rahmawati", alamat: "Bondowoso", telepon: "081234567892", total_poin: 50 },
  ]).onConflictDoNothing();

  // ─── VOUCHERS ────────────────────────────────────────────────────────────────
  console.log("  Inserting vouchers...");
  await db.insert(schema.vouchers).values([
    { id: 1, kode_voucher: "DISKON10K", nilai: 10000, status: "AKTIF" },
    { id: 2, kode_voucher: "ALMUBAROK50", nilai: 50000, status: "AKTIF" },
    { id: 3, kode_voucher: "BERKAH20K", nilai: 20000, status: "AKTIF" },
  ]).onConflictDoNothing();

  // ─── TIPE AKUN ───────────────────────────────────────────────────────────────
  console.log("  Inserting tipe akun...");
  await db.insert(schema.tipe_akun).values([
    { id: 1, nama: "Aset", posisi_saldo_normal: "DEBIT" },
    { id: 2, nama: "Kewajiban", posisi_saldo_normal: "KREDIT" },
    { id: 3, nama: "Ekuitas", posisi_saldo_normal: "KREDIT" },
    { id: 4, nama: "Pendapatan", posisi_saldo_normal: "KREDIT" },
    { id: 5, nama: "Beban", posisi_saldo_normal: "DEBIT" },
  ]).onConflictDoNothing();

  // ─── DAFTAR AKUN / COA ────────────────────────────────────────────────────────
  console.log("  Inserting daftar akun...");
  await db.insert(schema.daftar_akun).values([
    { id: 1, kode_akun: "1.101.01", nama_akun: "Kas Toko", deskripsi: "Kas Utama di Toko", tipe_akun_id: 1, status: "Aktif" },
    { id: 2, kode_akun: "1.101.02", nama_akun: "Kas Kecil", deskripsi: "Kas Kecil Operasional Harian", tipe_akun_id: 1, status: "Aktif" },
    { id: 3, kode_akun: "1.102.01", nama_akun: "Bank Mandiri", deskripsi: "Rekening Bank Mandiri", tipe_akun_id: 1, status: "Aktif" },
    { id: 4, kode_akun: "1.102.02", nama_akun: "Bank BCA", deskripsi: "Rekening Bank BCA", tipe_akun_id: 1, status: "Aktif" },
    { id: 5, kode_akun: "2.101.01", nama_akun: "Hutang Usaha", deskripsi: "Hutang Dagang Ke Supplier", tipe_akun_id: 2, status: "Aktif" },
    { id: 6, kode_akun: "3.101.01", nama_akun: "Modal Pemilik", deskripsi: "Modal Disetor Pemilik", tipe_akun_id: 3, status: "Aktif" },
    { id: 7, kode_akun: "4.101.01", nama_akun: "Pendapatan Penjualan Toko", deskripsi: "Pendapatan Hasil Penjualan Kasir POS", tipe_akun_id: 4, status: "Aktif" },
    { id: 8, kode_akun: "6.101.01", nama_akun: "Beban Gaji Karyawan", deskripsi: "Beban Bisyaroh / Gaji Karyawan", tipe_akun_id: 5, status: "Aktif" },
    { id: 9, kode_akun: "6.101.02", nama_akun: "Beban Listrik & Air", deskripsi: "Beban Listrik & Air Cabang", tipe_akun_id: 5, status: "Aktif" },
    { id: 10, kode_akun: "6.101.03", nama_akun: "Beban Operasional Toko", deskripsi: "Biaya Operasional Toko Lainnya", tipe_akun_id: 5, status: "Aktif" },
  ]).onConflictDoNothing();

  console.log("✅ Seeding selesai!");
  console.log("\n📋 Akun Login:");
  console.log("  Admin:  kode_user=admin  | password=admin123");
  console.log("  Kasir:  kode_user=kasir  | password=kasir123");
  console.log("  HRD:    kode_user=HRD    | password=hrd123");

  sqlite.close();
}

seed().catch((e) => {
  console.error("❌ Seeding error:", e);
  process.exit(1);
});
