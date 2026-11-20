// Safely load .env natively if supported in modern Node.js
if (typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile();
  } catch (e) {
    // Ignore
  }
}

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "drizzle-orm";
import { db } from "./lib/db";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { masterRoutes } from "./routes/master";
import { hrdRoutes } from "./routes/hrd";
import { penjualanRoutes } from "./routes/penjualan";
import { pembelianRoutes } from "./routes/pembelian";
import { akuntansiRoutes } from "./routes/akuntansi";
import { akuntansiLanjutanRoutes } from "./routes/akuntansi-lanjutan";
import { distribusiRoutes } from "./routes/distribusi";
import { pengaturanRoutes } from "./routes/pengaturan";
import { promoRoutes } from "./routes/promo";
import { voucherRoutes } from "./routes/voucher";
import { mobileRoutes } from "./routes/mobile";
import { userRoutes } from "./routes/user";
import { kasRoutes } from "./routes/kas";
import { supplyChainRoutes } from "./routes/supply-chain";
import { dashboardRoutes } from "./routes/dashboard";
import { investorRoutes } from "./routes/investor";
import { migrasiRoutes } from "./routes/migrasi";
import { startDailyProductLevelScheduler } from "./services/product-level.service";

const app = new Hono().basePath("/api");

// CORS setup: Allow Next.js frontend (3000) and mobile apps to communicate
app.use("*", cors({
  origin: [
    "http://localhost:3000",      // Next.js web frontend
    "http://localhost:8081",      // React Native Metro dev server
    "capacitor://localhost",       // Capacitor/Ionic mobile app
    "http://localhost",           // Android emulator
  ],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Logging request middleware
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.path}`);
  await next();
});

// Root status check
app.get("/status", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

// Public auth routes
app.route("/auth", authRoutes);

// Guard all subsequent routes with global JWT auth middleware
app.use("/*", authMiddleware);

// Protected routes
app.route("/master", masterRoutes);
app.route("/", masterRoutes);
app.route("/hrd", hrdRoutes);
app.route("/penjualan", penjualanRoutes);
app.route("/pembelian", pembelianRoutes);
app.route("/akuntansi", akuntansiRoutes);
app.route("/akuntansi", akuntansiLanjutanRoutes);
app.route("/kas", kasRoutes);
app.route("/distribusi", distribusiRoutes);
app.route("/supply-chain", supplyChainRoutes);
app.route("/pengaturan", pengaturanRoutes);
app.route("/promo", promoRoutes);
app.route("/voucher", voucherRoutes);
app.route("/user", userRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/investor", investorRoutes);
app.route("/migrasi", migrasiRoutes);

// Mobile endpoints (protected — memerlukan access_token di header Authorization)
app.route("/mobile", mobileRoutes);

export async function ensureBarangSchema() {
  try {
    await db.execute(sql`
      ALTER TABLE barang 
        ADD COLUMN IF NOT EXISTS kode_barang text,
        ADD COLUMN IF NOT EXISTS barcode_satuan_2 text,
        ADD COLUMN IF NOT EXISTS barcode_satuan_3 text,
        ADD COLUMN IF NOT EXISTS tipe_barang text DEFAULT 'STOK',
        ADD COLUMN IF NOT EXISTS lacak_kadaluarsa boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS level_barang text DEFAULT 'MEDIUM',
        ADD COLUMN IF NOT EXISTS level_mode text DEFAULT 'AUTO',
        ADD COLUMN IF NOT EXISTS terakhir_terjual text,
        ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP::text,
        ADD COLUMN IF NOT EXISTS lapor_pajak boolean DEFAULT true;

      CREATE TABLE IF NOT EXISTS stok_barang (
        id serial PRIMARY KEY,
        id_barang integer,
        id_cabang integer,
        stok_akhir integer DEFAULT 0,
        penjualan integer DEFAULT 0,
        transfer_masuk integer DEFAULT 0,
        transfer_keluar integer DEFAULT 0,
        posisi_rak text,
        minimal_stok integer DEFAULT 0,
        maksimal_stok integer DEFAULT 0,
        level_cabang text DEFAULT 'MEDIUM',
        terakhir_terjual_cabang text
      );

      ALTER TABLE stok_barang 
        ADD COLUMN IF NOT EXISTS stok_akhir integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS minimal_stok integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS maksimal_stok integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS posisi_rak text,
        ADD COLUMN IF NOT EXISTS penjualan integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS transfer_masuk integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS transfer_keluar integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS level_cabang text DEFAULT 'MEDIUM',
        ADD COLUMN IF NOT EXISTS terakhir_terjual_cabang text;
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan ensureBarangSchema:", err.message);
  }
}

async function ensureDatabaseSchema() {
  // Ekstensi PostgreSQL (opsional jika permission user terbatas)
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  } catch (err: any) {
    console.warn("⚠️ Peringatan ekstensi pg_trgm:", err.message);
  }

  // 1. Skema Barang & Stok
  await ensureBarangSchema();

  // 2. Skema Cabang & Cabang Investor
  try {
    await db.execute(sql`
      ALTER TABLE cabang 
        ADD COLUMN IF NOT EXISTS jenis_cabang text DEFAULT 'INTERNAL',
        ADD COLUMN IF NOT EXISTS nisbah_pengelola numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS nisbah_investor numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_modal_investor numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP::text,
        ADD COLUMN IF NOT EXISTS updated_at text DEFAULT CURRENT_TIMESTAMP::text;

      CREATE TABLE IF NOT EXISTS cabang_investor (
        id_cabang_investor serial PRIMARY KEY,
        id_cabang integer NOT NULL,
        nama_investor text NOT NULL,
        telepon text,
        email text,
        nilai_investasi numeric DEFAULT 0 NOT NULL,
        porsi_kepemilikan numeric DEFAULT 0 NOT NULL,
        nama_bank text,
        no_rekening text,
        atas_nama_rekening text,
        tanggal_bergabung text,
        status text DEFAULT 'AKTIF' NOT NULL,
        catatan text,
        created_at text DEFAULT CURRENT_TIMESTAMP::text,
        updated_at text DEFAULT CURRENT_TIMESTAMP::text
      );
      CREATE INDEX IF NOT EXISTS idx_cabang_investor_cabang ON cabang_investor (id_cabang);
      ALTER TABLE cabang_investor ALTER COLUMN id_cabang DROP NOT NULL;

      ALTER TABLE investor_bagi_hasil
        ADD COLUMN IF NOT EXISTS jenis_periode text DEFAULT 'BULANAN',
        ADD COLUMN IF NOT EXISTS jadwal_pencairan_bulan integer DEFAULT 2,
        ADD COLUMN IF NOT EXISTS jadwal_pencairan_tahun integer;

      CREATE TABLE IF NOT EXISTS investor_bagi_hasil_member (
        id serial PRIMARY KEY,
        id_bagi_hasil integer NOT NULL REFERENCES investor_bagi_hasil(id) ON DELETE CASCADE,
        id_cabang_investor integer REFERENCES cabang_investor(id_cabang_investor),
        nama_investor text NOT NULL,
        modal_disetor numeric DEFAULT 0 NOT NULL,
        tanggal_bergabung text,
        bulan_aktif integer DEFAULT 12 NOT NULL,
        bobot_waktu_modal numeric DEFAULT 0 NOT NULL,
        porsi_persen numeric DEFAULT 0 NOT NULL,
        nominal_hak_dividen numeric DEFAULT 0 NOT NULL,
        nominal_transfer numeric DEFAULT 0 NOT NULL,
        nominal_reinvestasi numeric DEFAULT 0 NOT NULL,
        metode_pencairan text DEFAULT 'TRANSFER',
        nama_bank text,
        no_rekening text,
        atas_nama_rekening text,
        status_pencairan text DEFAULT 'PENDING' NOT NULL,
        tanggal_realisasi text,
        catatan text,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );
      CREATE INDEX IF NOT EXISTS idx_bagi_hasil_member_bh ON investor_bagi_hasil_member (id_bagi_hasil);
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema cabang/investor:", err.message);
  }

  // 3. Faktur Beli & Detail
  try {
    await db.execute(sql`
      ALTER TABLE faktur_beli
        ADD COLUMN IF NOT EXISTS biaya_ongkir integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS biaya_bongkar integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS biaya_asuransi integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS metode_alokasi_landed_cost text DEFAULT 'MANUAL',
        ADD COLUMN IF NOT EXISTS total_biaya_tambahan integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS grand_total integer DEFAULT 0;

      ALTER TABLE faktur_beli_detail
        ADD COLUMN IF NOT EXISTS nomor_batch text,
        ADD COLUMN IF NOT EXISTS tanggal_kadaluarsa text,
        ADD COLUMN IF NOT EXISTS alokasi_biaya_tambahan integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS hpp_efektif_satuan integer DEFAULT 0;
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema faktur_beli:", err.message);
  }

  // 4. Periode Akuntansi, Pajak, Aset Tetap
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS periode_akuntansi (
        id serial PRIMARY KEY,
        bulan integer NOT NULL,
        tahun integer NOT NULL,
        tanggal_mulai text NOT NULL,
        tanggal_akhir text NOT NULL,
        status text DEFAULT 'OPEN' NOT NULL,
        lock_date text,
        closed_by integer,
        closed_at text,
        reopen_reason text,
        reopened_by integer,
        reopened_at text,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS master_pajak (
        id serial PRIMARY KEY,
        kode_pajak text NOT NULL UNIQUE,
        nama_pajak text NOT NULL,
        tipe_pajak text NOT NULL,
        tarif_persen numeric(5, 2) NOT NULL,
        akun_pajak_keluaran integer,
        akun_pajak_masukan integer,
        is_aktif boolean DEFAULT true NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS barang_pajak (
        id serial PRIMARY KEY,
        id_barang integer NOT NULL,
        id_pajak integer NOT NULL,
        is_include_harga boolean DEFAULT true NOT NULL
      );

      CREATE TABLE IF NOT EXISTS aset_tetap (
        id serial PRIMARY KEY,
        kode_aset text NOT NULL UNIQUE,
        nama_aset text NOT NULL,
        id_cabang integer NOT NULL,
        kategori_aset text NOT NULL,
        tanggal_perolehan text NOT NULL,
        harga_perolehan integer NOT NULL,
        nilai_residu integer DEFAULT 0 NOT NULL,
        masa_manfaat_bulan integer NOT NULL,
        metode_penyusutan text DEFAULT 'GARIS_LURUS' NOT NULL,
        beban_penyusutan_per_bulan integer NOT NULL,
        akumulasi_penyusutan integer DEFAULT 0 NOT NULL,
        nilai_buku integer NOT NULL,
        akun_aset_id integer NOT NULL,
        akun_akumulasi_id integer NOT NULL,
        akun_beban_id integer NOT NULL,
        status text DEFAULT 'AKTIF' NOT NULL,
        tanggal_disposal text,
        nilai_disposal integer,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS riwayat_penyusutan (
        id serial PRIMARY KEY,
        id_aset integer NOT NULL,
        periode_bulan integer NOT NULL,
        periode_tahun integer NOT NULL,
        nominal_penyusutan integer NOT NULL,
        id_jurnal integer,
        tanggal_eksekusi text NOT NULL,
        dieksekusi_oleh integer,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema akuntansi/pajak/aset:", err.message);
  }

  // 5. Supply Chain & WMS (Batch, Sub-Lokasi, Opname, Adjustment, Kartu Stok)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS barang_batch (
        id_batch serial PRIMARY KEY,
        nomor_batch text NOT NULL,
        id_barang integer NOT NULL,
        id_cabang integer NOT NULL,
        tanggal_masuk text NOT NULL,
        tanggal_kadaluarsa text NOT NULL,
        stok_batch integer DEFAULT 0 NOT NULL,
        hpp_batch integer DEFAULT 0 NOT NULL,
        status text DEFAULT 'AKTIF' NOT NULL,
        catatan text,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS gudang_lokasi (
        id_lokasi serial PRIMARY KEY,
        id_cabang integer NOT NULL,
        kode_lokasi text NOT NULL,
        nama_lokasi text NOT NULL,
        tipe_lokasi text DEFAULT 'DISPLAY' NOT NULL,
        keterangan text,
        is_aktif boolean DEFAULT true NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stok_lokasi (
        id serial PRIMARY KEY,
        id_barang integer NOT NULL,
        id_lokasi integer NOT NULL,
        stok_qty integer DEFAULT 0 NOT NULL,
        posisi_rak text
      );

      CREATE TABLE IF NOT EXISTS stok_opname (
        id_opname serial PRIMARY KEY,
        nomor_opname text NOT NULL UNIQUE,
        id_cabang integer NOT NULL,
        tanggal_opname text NOT NULL,
        id_petugas integer NOT NULL,
        status text DEFAULT 'DRAFT' NOT NULL,
        total_selisih_item integer DEFAULT 0,
        total_selisih_rupiah integer DEFAULT 0,
        catatan text,
        id_approver integer,
        approved_at text,
        id_jurnal integer,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS stok_opname_detail (
        id serial PRIMARY KEY,
        id_opname integer NOT NULL,
        id_barang integer NOT NULL,
        stok_sistem integer NOT NULL,
        stok_fisik integer NOT NULL,
        selisih_qty integer NOT NULL,
        hpp_satuan integer NOT NULL,
        selisih_rupiah integer NOT NULL,
        alasan_selisih text,
        catatan text
      );

      CREATE TABLE IF NOT EXISTS stok_adjustment (
        id_adj serial PRIMARY KEY,
        nomor_adj text NOT NULL UNIQUE,
        id_cabang integer NOT NULL,
        tanggal_adj text NOT NULL,
        id_petugas integer NOT NULL,
        tipe_alasan text NOT NULL,
        tindakan_stok text DEFAULT 'PINDAH_KE_KARANTINA' NOT NULL,
        total_item integer DEFAULT 1 NOT NULL,
        total_nilai_kerugian integer DEFAULT 0 NOT NULL,
        keterangan text,
        id_jurnal integer,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE TABLE IF NOT EXISTS stok_adjustment_detail (
        id serial PRIMARY KEY,
        id_adj integer NOT NULL,
        id_barang integer NOT NULL,
        id_lokasi_asal integer,
        id_lokasi_tujuan integer,
        stok_sebelum integer NOT NULL,
        qty_penyesuaian integer NOT NULL,
        stok_setelah integer NOT NULL,
        hpp_satuan integer NOT NULL,
        subtotal_nilai integer NOT NULL,
        id_batch integer
      );

      CREATE TABLE IF NOT EXISTS kartu_stok (
        id_kartu serial PRIMARY KEY,
        id_barang integer NOT NULL,
        id_cabang integer NOT NULL,
        id_lokasi integer,
        tanggal_transaksi text NOT NULL,
        tipe_transaksi text NOT NULL,
        nomor_referensi text NOT NULL,
        saldo_awal integer NOT NULL,
        masuk integer DEFAULT 0 NOT NULL,
        keluar integer DEFAULT 0 NOT NULL,
        saldo_akhir integer NOT NULL,
        hpp_satuan numeric(15,2) DEFAULT 0 NOT NULL,
        total_nilai numeric(15,2) DEFAULT 0 NOT NULL,
        keterangan text,
        id_user integer NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema supply-chain:", err.message);
  }

  // 6. User Preferences
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
        id serial PRIMARY KEY,
        id_user integer NOT NULL UNIQUE REFERENCES users(id),
        layout_config text NOT NULL,
        last_preset text DEFAULT 'CUSTOM',
        created_at text DEFAULT CURRENT_TIMESTAMP::text,
        updated_at text DEFAULT CURRENT_TIMESTAMP::text
      );
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema user_dashboard_preferences:", err.message);
  }

  // 7. Indeks Performa & Keamanan
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_barang_barcode ON barang (barcode);
      CREATE INDEX IF NOT EXISTS idx_barang_level ON barang (level_barang);
      CREATE INDEX IF NOT EXISTS idx_barang_lapor_pajak ON barang (lapor_pajak);
      CREATE INDEX IF NOT EXISTS idx_stok_barang_cabang ON stok_barang (id_barang, id_cabang);
      CREATE INDEX IF NOT EXISTS idx_stok_kritis ON stok_barang (id_cabang, stok_akhir);
      CREATE INDEX IF NOT EXISTS idx_stok_level_cabang ON stok_barang (level_cabang);
      CREATE INDEX IF NOT EXISTS idx_users_cabang ON users (id_cabang);
      CREATE INDEX IF NOT EXISTS idx_penjualan_id_cabang ON penjualan (id_cabang);
      CREATE INDEX IF NOT EXISTS idx_penjualan_tgl_cbg ON penjualan (tanggal_invoice, id_cabang);
      CREATE INDEX IF NOT EXISTS idx_kartu_stok_barang ON kartu_stok (id_barang, id_cabang);
      CREATE INDEX IF NOT EXISTS idx_barang_batch_cabang ON barang_batch (id_barang, id_cabang);
      CREATE INDEX IF NOT EXISTS idx_barang_batch_exp ON barang_batch (id_cabang, tanggal_kadaluarsa);
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan indeks performa:", err.message);
  }

  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_barang_nama_trgm ON barang USING gin (nama_barang gin_trgm_ops);`);
  } catch (err: any) {
    // Abaikan jika pg_trgm belum aktif
  }

  // 8. Skema Kas & Transaksi Kas Enterprise
  try {
    await db.execute(sql`
      ALTER TABLE kas_transaksi 
        ADD COLUMN IF NOT EXISTS id_akun_lawan_coa integer;

      INSERT INTO pengaturan_aplikasi (key, value, updated_at)
      VALUES 
        ('cash_approval_threshold', '500000', CURRENT_TIMESTAMP),
        ('cash_pusat_approval_threshold', '10000000', CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO rekening_kas (kode, nama, jenis, id_cabang, saldo_awal, saldo, id_akun_coa, is_active)
      SELECT 'REK-BCA-PST', 'Bank BCA Pusat', 'BANK', 3, 0, 0, 5, true
      WHERE NOT EXISTS (SELECT 1 FROM rekening_kas WHERE kode = 'REK-BCA-PST');

      INSERT INTO rekening_kas (kode, nama, jenis, id_cabang, saldo_awal, saldo, id_akun_coa, is_active)
      SELECT 'REK-MDR-PST', 'Bank Mandiri Pusat', 'BANK', 3, 0, 0, 4, true
      WHERE NOT EXISTS (SELECT 1 FROM rekening_kas WHERE kode = 'REK-MDR-PST');
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema kas:", err.message);
  }

  // 9. Skema Log Migrasi Data Sistem Lama
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS migrasi_log (
        id serial PRIMARY KEY,
        id_cabang integer NOT NULL,
        id_user integer NOT NULL,
        nama_file text NOT NULL,
        tipe_migrasi text DEFAULT 'ALL',
        total_baris integer DEFAULT 0,
        berhasil integer DEFAULT 0,
        gagal integer DEFAULT 0,
        detail_error text,
        detail_summary text,
        status text DEFAULT 'SUCCESS',
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      CREATE INDEX IF NOT EXISTS idx_migrasi_log_cabang ON migrasi_log (id_cabang);
      CREATE INDEX IF NOT EXISTS idx_migrasi_log_created_at ON migrasi_log (created_at DESC);
    `);
  } catch (err: any) {
    console.warn("⚠️ Peringatan skema migrasi_log:", err.message);
  }

  console.log("✅ Integritas skema database PostgreSQL (kolom, tabel enterprise & indeks performa) terverifikasi.");
}

async function startServer() {
  await ensureDatabaseSchema();
  serve(
    {
      fetch: app.fetch,
      port: 3001,
    },
    (info) => {
      console.log(`🚀 ERP Al Mubarok Hono API running on http://localhost:${info.port}/api`);
      startDailyProductLevelScheduler();
    }
  );
}

startServer().catch((err) => {
  console.error("❌ Gagal memulai server ERP API:", err);
});
