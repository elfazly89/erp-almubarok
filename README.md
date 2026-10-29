# 🚀 ERP Al Mubarok (Next.js 16 Frontend)

Sistem Enterprise Resource Planning modern berbasis **Next.js 16 (App Router)**, **React 19**, **TailwindCSS v4**, **TypeScript**, dan terintegrasi dengan **Hono RESTful API Backend**.

---

## 📚 Dokumentasi Lengkap
Dokumentasi teknis, skema database, ERD, arsitektur, dan rincian modul dapat dibaca pada file:
- **[DOKUMENTASI_ERP_ALMUBAROK.md](../DOKUMENTASI_ERP_ALMUBAROK.md)**
- **[Dokumentasi Teknis — ERP Almubarok.md](./Dokumentasi%20Teknis%20%E2%80%94%20ERP%20Almubarok.md)**

---

## ⚡ Quick Start (Jalankan di Komputer Baru)

### 1. Prasyarat Sistem
- **Node.js** (v20 atau v24)
- **PostgreSQL** (v15 - v17)
- **Git**

### 2. Clone Repository
```bash
git clone https://github.com/elfazly89/erp-almubarok.git
cd erp-almubarok
```

### 3. Setup Database PostgreSQL
1. Buat database bernama `erp_almubarok` di PostgreSQL:
   ```sql
   CREATE DATABASE erp_almubarok;
   ```
2. Restore skema & data dari file dump:
   ```bash
   psql -U postgres -d erp_almubarok -f erp_almubarok_dump.sql
   ```

### 4. Konfigurasi Environment (.env)
- Di folder utama, buat file `.env.local` (sesuai `.env.example`):
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001
  JWT_SECRET=super_secret_key_erp_al_mubarok_2026_abdi_priyayi
  ```
- Di folder `erp-almubarok-api`, buat file `.env` (sesuai `.env.example`):
  ```env
  DATABASE_URL=postgresql://postgres:password_kamu@localhost:5432/erp_almubarok
  JWT_SECRET=super_secret_key_erp_al_mubarok_2026_abdi_priyayi
  ```

### 5. Install Dependensi
```bash
# Frontend
npm install

# Backend API
cd erp-almubarok-api
npm install
cd ..
```

### 6. Jalankan Aplikasi
- **Cara Cepat**: Klik 2x file `run-local.bat`
- **Cara Manual**:
  - Terminal 1 (Backend API):
    ```bash
    cd erp-almubarok-api && npm run dev
    ```
  - Terminal 2 (Frontend Web):
    ```bash
    npm run dev
    ```
Buka browser di **`http://localhost:3000`**.
- Akun default: `admin` / `admin123`

---

## 🛠️ Scripts NPM

```bash
npm run dev               # Menjalankan Next.js development server (port 3000)
npm run build             # Build bundle Next.js untuk produksi
npm run start             # Menjalankan server Next.js mode produksi
npm run lint              # Melakukan pemeriksaan kode dengan ESLint
npm run db:push           # Push skema Drizzle langsung ke database
npm run db:seed           # Menjalankan script seeding data awal
```

---

## 📦 Modul Utama
- **HRD & Kepegawaian (Abdi):** Data Abdi, Absensi GPS Haversine, Jabatan, Shift Kerja, Cuti/Izin, Hutang, & Bisyaroh (Payroll).
- **Master Data:** Barang (Multi-Satuan 1, 2, 3 & 9 Tingkat Harga), Kategori, Supplier, Cabang, Pelanggan.
- **Penjualan (POS):** Kasir Cepat dengan Barcode Scan, 11 Skema Promosi Otomatis, Poin Loyalitas, & Infaq Kasir.
- **Pembelian:** Purchase Order (PO), Faktur Penerimaan Barang, & Hutang Supplier.
- **Distribusi (DMS):** Smart Replenishment DC ke Cabang, ADS (Sales Velocity), Forecast Habis Stok, Rekomendasi Restock, & Selisih Pengiriman.
- **Akuntansi:** Chart of Accounts (COA), Jurnal Memorial Double-Entry, Buku Besar, Laba Rugi, & Neraca.
- **Pengaturan:** Matriks Hak Akses Role Menu (CRUD) per Jabatan & Profil Toko.
