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

// Mobile endpoints (protected — memerlukan access_token di header Authorization)
app.route("/mobile", mobileRoutes);

async function ensureDatabaseSchema() {
  try {
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      -- 1. Tabel Cabang
      ALTER TABLE cabang 
        ADD COLUMN IF NOT EXISTS jenis_cabang text DEFAULT 'INTERNAL',
        ADD COLUMN IF NOT EXISTS nisbah_pengelola numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS nisbah_investor numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_modal_investor numeric DEFAULT 0,
        ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP::text,
        ADD COLUMN IF NOT EXISTS updated_at text DEFAULT CURRENT_TIMESTAMP::text;

      -- 2. Tabel Cabang Investor (Konsorsium Multi-Investor)
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

      -- 3. Tabel Barang & Stok
      ALTER TABLE barang 
        ADD COLUMN IF NOT EXISTS kode_barang text,
        ADD COLUMN IF NOT EXISTS level_barang text DEFAULT 'MEDIUM',
        ADD COLUMN IF NOT EXISTS level_mode text DEFAULT 'AUTO',
        ADD COLUMN IF NOT EXISTS terakhir_terjual text,
        ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP::text,
        ADD COLUMN IF NOT EXISTS lapor_pajak boolean DEFAULT true;

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

      -- 4. Tabel Faktur Beli & Detail (Landed Cost & Batch)
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

      -- 5. Tabel Periode Akuntansi
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

      -- 6. Tabel Master Pajak & Barang Pajak
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

      -- 7. Tabel Aset Tetap & Riwayat Penyusutan
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

      -- 8. Supply Chain & WMS (Batch, Sub-Lokasi, Opname, Adjustment, Kartu Stok)
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
        hpp_satuan integer DEFAULT 0 NOT NULL,
        total_nilai integer DEFAULT 0 NOT NULL,
        keterangan text,
        id_user integer NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      -- 8. Tabel Preferensi Dashboard Modular Pengguna
      CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
        id serial PRIMARY KEY,
        id_user integer NOT NULL UNIQUE REFERENCES users(id),
        layout_config text NOT NULL,
        last_preset text DEFAULT 'CUSTOM',
        created_at text DEFAULT CURRENT_TIMESTAMP::text,
        updated_at text DEFAULT CURRENT_TIMESTAMP::text
      );

      -- Indeks Performa & Keamanan
      CREATE INDEX IF NOT EXISTS idx_barang_nama_trgm ON barang USING gin (nama_barang gin_trgm_ops);
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
    console.log("✅ Integritas skema database PostgreSQL (kolom, tabel enterprise & indeks performa) terverifikasi.");
  } catch (err: any) {
    console.warn("⚠️ Peringatan verifikasi skema database:", err.message);
  }
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
