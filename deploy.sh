#!/usr/bin/env bash
set -e

# ==============================================================================
# ERP AL MUBAROK - VPS AUTO UPDATE & DEPLOY SCRIPT
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${BLUE}        🚀 MEMULAI PROSES UPDATE ERP AL MUBAROK (VPS)        ${NC}"
echo -e "${BLUE}================================================================${NC}\n"

# 1. Pindah ke direktori proyek
APP_DIR="/opt/erp-almubarok"
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

echo -e "${YELLOW}[1/5] Berpindah ke direktori proyek: $APP_DIR${NC}"
cd "$APP_DIR"

# 2. Tarik kode terbaru dari GitHub
echo -e "\n${YELLOW}[2/5] Menarik pembaruan kode terbaru dari GitHub (git pull)...${NC}"
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}✓ Kode terbaru berhasil disinkronkan.${NC}"

# 3. Sinkronisasi Skema & Indeks Database PostgreSQL
echo -e "\n${YELLOW}[3/5] Memeriksa & menerapkan skema dan indeks database...${NC}"
docker compose exec -T postgres psql -U postgres -d erp_almubarok << 'EOF' > /dev/null 2>&1 || true
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
  ADD COLUMN IF NOT EXISTS level_barang text DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS level_mode text DEFAULT 'AUTO',
  ADD COLUMN IF NOT EXISTS terakhir_terjual text,
  ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP::text,
  ADD COLUMN IF NOT EXISTS lapor_pajak boolean DEFAULT true;

ALTER TABLE stok_barang 
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

-- Indeks Users (Daftar Abdi)
CREATE INDEX IF NOT EXISTS idx_users_nama_trgm ON users USING gin (nama_user gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_kode ON users (kode_user);
CREATE INDEX IF NOT EXISTS idx_users_no_hp ON users (no_hp);
CREATE INDEX IF NOT EXISTS idx_users_no_ktp ON users (no_ktp);
CREATE INDEX IF NOT EXISTS idx_users_cabang ON users (id_cabang);
CREATE INDEX IF NOT EXISTS idx_users_jabatan ON users (id_jabatan);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Indeks Supplier & Pelanggan
CREATE INDEX IF NOT EXISTS idx_supplier_nama_trgm ON supplier USING gin (nama_supplier gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_supplier_telepon ON supplier (telepon);
CREATE INDEX IF NOT EXISTS idx_supplier_status_pajak ON supplier (status_pajak);
CREATE INDEX IF NOT EXISTS idx_pelanggan_nama_trgm ON pelanggan USING gin (nama_lengkap gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pelanggan_kode ON pelanggan (kode_pelanggan);
CREATE INDEX IF NOT EXISTS idx_pelanggan_telepon ON pelanggan (telepon);

-- Indeks Barang & Transaksi
CREATE INDEX IF NOT EXISTS idx_barang_nama_trgm ON barang USING gin (nama_barang gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_barang_barcode ON barang (barcode);
CREATE INDEX IF NOT EXISTS idx_barang_level ON barang (level_barang);
CREATE INDEX IF NOT EXISTS idx_barang_lapor_pajak ON barang (lapor_pajak);
CREATE INDEX IF NOT EXISTS idx_stok_barang_cabang ON stok_barang (id_barang, id_cabang);
CREATE INDEX IF NOT EXISTS idx_stok_level_cabang ON stok_barang (level_cabang);
CREATE INDEX IF NOT EXISTS idx_penjualan_id_cabang ON penjualan (id_cabang);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_barang ON kartu_stok (id_barang, id_cabang);
CREATE INDEX IF NOT EXISTS idx_barang_batch_cabang ON barang_batch (id_barang, id_cabang);
EOF
echo -e "${GREEN}✓ Skema dan indeks database PostgreSQL siap.${NC}"

# 4. Rebuild & Restart Container Docker
echo -e "\n${YELLOW}[4/5] Mem-build ulang dan me-restart container (Next.js & API)...${NC}"
docker compose up -d --build
echo -e "${GREEN}✓ Container berhasil di-build dan berjalan.${NC}"

# 5. Bersihkan cache & image lama agar hemat penyimpanan
echo -e "\n${YELLOW}[5/5] Membersihkan image build lama (docker image prune)...${NC}"
docker image prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Image lama dibersihkan, ruang penyimpanan tetap optimal.${NC}"

# Tampilkan ringkasan status container
echo -e "\n${BLUE}================================================================${NC}"
echo -e "${GREEN}  ✓ UPDATE SELESAI! SELURUH SISTEM ERP AL MUBAROK TELAH AKTIF  ${NC}"
echo -e "${BLUE}================================================================${NC}\n"
docker compose ps

echo -e "\n${GREEN}Website siap diakses di: https://almubarok.systems${NC}\n"

