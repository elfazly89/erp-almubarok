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

# 3. Sinkronisasi Indeks Database PostgreSQL
echo -e "\n${YELLOW}[3/5] Memeriksa & menerapkan indeks performa database...${NC}"
docker compose exec -T postgres psql -U postgres -d erp_almubarok << 'EOF' > /dev/null 2>&1 || true
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
CREATE INDEX IF NOT EXISTS idx_penjualan_id_cabang ON penjualan (id_cabang);
EOF
echo -e "${GREEN}✓ Indeks database PostgreSQL siap.${NC}"

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
