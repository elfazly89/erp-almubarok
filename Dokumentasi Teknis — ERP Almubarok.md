# 📋 Dokumentasi Teknis & Fungsional — ERP Almubarok (Next.js & Hono Stack)

> **Versi:** 2.0.0 (Modern Next.js & Hono Architecture)  
> **Target:** Tim Pengembang, Administrator, dan Pengguna Sistem  
> **Catatan:** Dokumen ini telah diperbarui secara menyeluruh untuk arsitektur modern Next.js 16 (App Router), Hono API, Drizzle ORM, dan mengabaikan sistem file lama (legacy PHP/CodeIgniter).

---

## 📑 Daftar Isi

1. [Gambaran Umum & Arsitektur Sistem](#1-gambaran-umum--arsitektur-sistem)
2. [Spesifikasi Teknologi & Dependensi](#2-spesifikasi-teknologi--dependensi)
3. [Struktur Direktori Proyek](#3-struktur-direktori-proyek)
4. [Sistem Autentikasi, Keamanan & RBAC](#4-sistem-autentikasi-keamanan--rbac)
5. [Skema Database & Relasi (ERD)](#5-skema-database--relasi-erd)
6. [Modul & Logika Bisnis Aplikasi](#6-modul--logika-bisnis-aplikasi)
   - 6.1 [Dashboard & Analitik](#61-dashboard--analitik)
   - 6.2 [Master Data (Barang 3-Satuan, 9-Harga, Cabang, Pelanggan, Supplier)](#62-master-data)
   - 6.3 [HRD & Bisyaroh (Absensi Geofencing GPS, Izin, Penggajian)](#63-hrd--bisyaroh)
   - 6.4 [Penjualan (Kasir POS, 11 Skema Promo, Poin, Infaq)](#64-penjualan-pos--promo)
   - 6.5 [Pembelian & Hutang Dagang (PO, Faktur Penerimaan, HPP Rata-Rata)](#65-pembelian--hutang-dagang)
   - 6.6 [Distribusi DMS & Smart Replenishment (ADS, Forecast, Transfer Antar Cabang)](#66-distribusi-dms--smart-replenishment)
   - 6.7 [Akuntansi (COA, Jurnal Umum Double-Entry, Buku Besar, Laba Rugi, Neraca)](#67-akuntansi)
   - 6.8 [Pengaturan Aplikasi & Matriks Role Menu](#68-pengaturan-aplikasi--matriks-role-menu)
   - 6.9 [API Layanan Mobile](#69-api-layanan-mobile)
7. [Daftar Lengkap REST API Endpoints](#7-daftar-lengkap-rest-api-endpoints)
8. [Panduan Instalasi, Setup & Deployment Produksi](#8-panduan-instalasi-setup--deployment-produksi)

---

## 1. Gambaran Umum & Arsitektur Sistem

ERP Almubarok adalah sistem Enterprise Resource Planning multi-cabang yang dirancang untuk mengintegrasikan seluruh proses bisnis mulai dari retail store, kasir POS, distribution center (DC), pergudangan, SDM (HRD), hingga akuntansi berstandar *double-entry*.

Arsitektur aplikasi terbagi menjadi dua komponen utama:

```text
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND: Next.js 16 (Port 3000)            │
│  - React 19 + TypeScript + TailwindCSS v4                   │
│  - App Router, Client Components, Radix UI Primitives       │
│  - Edge Middleware Auth Guard                               │
│  - Reverse Proxy Rewrites: /api/* ──► Backend Hono API      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND: Hono API (Port 3001)               │
│  - Ultra-fast Node.js HTTP framework (Hono)                 │
│  - Global JWT Middleware Guard & Session Validation         │
│  - Geofencing GPS Haversine Engine & File Uploader          │
│  - Atomic Transaction Manager with Branch Locking           │
│  - Drizzle ORM Multi-DB Support (PostgreSQL / SQLite)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE: PostgreSQL / SQLite               │
│  - Master Data, Transaksi POS, DMS, Payroll, Akuntansi      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Spesifikasi Teknologi & Dependensi

### Frontend (`erp-almubarok-nextjs`)
| Paket | Versi | Fungsi / Kegunaan |
|---|---|---|
| `next` | `16.2.6` | Framework React Fullstack (App Router, Server Rendering, Reverse Proxy) |
| `react` / `react-dom` | `19.2.4` | Core UI Library |
| `typescript` | `^5` | Strict static typing |
| `tailwindcss` | `^4` | Styling modern dengan TailwindCSS engine v4 |
| `@radix-ui/*` | Latest | Komponen UI primitif (Dialog, Select, Dropdown, Tabs, Popover, Toast, Tooltip) |
| `lucide-react` | `^1.17.0` | Library ikon vektor modern |
| `recharts` | `^3.8.1` | Visualisasi grafik data analitik omzet & performa toko |
| `jsqr` | `^1.4.0` | Barcode & QR scanner langsung via kamera web peramban |
| `xlsx` | `^0.18.5` | Export data tabel ke file Microsoft Excel (.xlsx) |
| `date-fns` | `^4.4.0` | Manipulasi dan formatting tanggal Indonesia |
| `next-themes` | `^0.4.6` | Engine toggle tema gelap (Dark Mode) dan terang (Light Mode) |

### Backend API (`erp-almubarok-api`)
| Paket | Versi | Fungsi / Kegunaan |
|---|---|---|
| `hono` | `^4.13.1` | Framework RESTful API modern, cepat dan bertipe data ketat |
| `@hono/node-server`| `^2.1.0` | HTTP Server runtime untuk Hono pada Node.js |
| `drizzle-orm` | `^0.45.2` | Type-safe ORM |
| `drizzle-kit` | `^0.31.10`| CLI generator migrasi & introspeksi skema database |
| `pg` | `^8.23.0` | Driver database PostgreSQL |
| `jose` | `^6.2.8` | Engine penandatanganan dan validasi JSON Web Token (JWT HS256) |
| `bcryptjs` | `^3.0.3` | Hashing dan verifikasi kata sandi dengan salt rounds |

---

## 3. Struktur Direktori Proyek

```text
erp-almubarok/
├── DOKUMENTASI_ERP_ALMUBAROK.md     # Dokumentasi Lengkap Proyek
├── erp-almubarok-nextjs/            # Frontend Next.js 16
│   ├── next.config.ts               # Konfigurasi Next.js & Proxy /api ke port 3001
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── middleware.ts            # Route Guard, Verifikasi JWT, Security Headers
│       ├── app/
│       │   ├── layout.tsx           # Root HTML Layout & Theme Provider
│       │   ├── globals.css          # Design System, HSL Theme Colors
│       │   ├── login/               # Halaman Login
│       │   └── (dashboard)/         # Protected Layout & Halaman Dashboard
│       │       ├── dashboard/       # Ringkasan KPI Bisnis
│       │       ├── barang/          # Master Barang & Konversi Satuan
│       │       ├── kategori/        # Master Kategori Barang
│       │       ├── supplier/        # Master Data Rekanan Pemasok
│       │       ├── pelanggan/       # Data Member & Poin Reward
│       │       ├── cabang/          # Master Cabang & Titik Koordinat GPS
│       │       ├── stok/            # Monitoring & Koreksi Stok Opname
│       │       ├── hrd/             # Modul HRD (Users, Absensi, Shift, Cuti, Bisyaroh)
│       │       ├── penjualan/       # Modul POS Kasir, Riwayat Nota & Master Promo
│       │       ├── pembelian/       # Modul Purchase Order, Faktur Beli & Hutang
│       │       ├── distribusi/      # Modul DMS DC (Forecast, Rekomendasi, Selisih)
│       │       ├── akuntansi/       # Modul COA, Jurnal Umum & Laporan Keuangan
│       │       ├── profil/          # Form Ubah Profil
│       │       ├── ubah-password/   # Form Ubah Password
│       │       └── pengaturan/      # Matriks Hak Akses Role Menu & App Settings
│       ├── components/
│       │   ├── layout/              # Sidebar.tsx, UserMenu.tsx, Logo.tsx, ThemeToggle.tsx
│       │   └── providers/           # PermissionProvider.tsx, AppSettingsProvider.tsx
│       └── lib/
│           ├── api-client.ts        # Helper Universal Fetcher (BFF & SSR Ready)
│           ├── auth/                # Session & JWT Helpers
│           └── utils.ts             # Format Rupiah, Parsing Angka, Helper CN
│
└── erp-almubarok-api/               # Backend API Hono Engine
    ├── src/
    │   ├── index.ts                 # Server Entry & Route Registrations
    │   ├── middleware/auth.ts       # Global JWT Auth Guard
    │   ├── routes/                  # Controller Route Endpoints (RESTful)
    │   │   ├── auth.ts              # Login Web/Mobile, Refresh Token, Rate Limit
    │   │   ├── master.ts            # CRUD Master Data Barang, Cabang, Pelanggan, dll
    │   │   ├── hrd.ts               # Presensi, Izin/Cuti, Payroll Bisyaroh
    │   │   ├── penjualan.ts         # POS Checkout (Locking, Stock Cut, Infaq, Poin)
    │   │   ├── pembelian.ts         # PO, Faktur Beli & Penyesuaian HPP
    │   │   ├── distribusi.ts        # Analisis ADS, Forecast Stok, Restock Rekomendasi
    │   │   ├── akuntansi.ts         # Jurnal Memorial, Buku Besar, Neraca, Laba Rugi
    │   │   ├── promo.ts             # 11 Skema Evaluasi Diskon & Hadiah
    │   │   ├── voucher.ts           # Kupon Belanja
    │   │   ├── pengaturan.ts        # Konfigurasi Aplikasi & Hak Akses Menu
    │   │   └── mobile.ts            # Endpoint Khusus Mobile App (Geofencing GPS)
    │   └── lib/
    │       ├── auth/jwt.ts          # Generator & Verifier JWT Token (HS256)
    │       └── db/                  # Drizzle ORM Connection Pool & Relational Schema
    └── scripts/                     # Migrasi, Seeding & Utilities
```

---

## 4. Sistem Autentikasi, Keamanan & RBAC

### 4.1 Mekanisme Autentikasi
1. User memasukkan kredensial Nomor HP dan Password di `/login`.
2. Password diverifikasi dengan algoritma `bcryptjs`.
3. Server menerbitkan JWT token (`HS256`, masa aktif 8 jam) berisi identitas user: `id`, `kode_user`, `nama_user`, `id_jabatan`, `id_cabang`, `role`.
4. Token disimpan di HTTP-Only cookie `auth_token` untuk web browser dan `access_token` untuk mobile client.
5. Next.js `middleware.ts` memvalidasi setiap request halaman, menginjeksi header `x-user-id`, `x-cabang-id`, serta menyertakan security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

### 4.2 Granular RBAC (Role-Based Access Control)
Hak akses diatur per jabatan terhadap setiap menu dan sub-menu dengan 4 tingkatan flag:
- `can_read` : Hak untuk melihat halaman dan data tabel.
- `can_create` : Hak untuk membuat data / entri baru.
- `can_update` : Hak untuk mengubah / mengedit data yang sudah ada.
- `can_delete` : Hak untuk menghapus data.

Hook `useMenuPermissions()` di sisi frontend secara otomatis membaca hak akses user yang sedang login dan mengontrol rendering tombol aksi di antarmuka pengguna.

---

## 5. Skema Database & Relasi (ERD)

```mermaid
erDiagram
    CABANG ||--o{ USERS : "memiliki"
    JABATAN ||--o{ USERS : "mengelompokkan"
    JABATAN ||--o{ ROLE_MENU : "mengatur hak akses"
    USERS ||--o{ ABSENSI : "mencatat kehadiran"
    USERS ||--o{ BISYAROH : "menerima slip gaji"
    
    KATEGORI_BARANG ||--o{ BARANG : "kategori"
    SUPPLIER ||--o{ BARANG : "pemasok"
    BARANG ||--o{ STOK_BARANG : "stok per cabang"
    CABANG ||--o{ STOK_BARANG : "lokasi gudang"

    PELANGGAN ||--o{ PENJUALAN : "pembeli"
    USERS ||--o{ PENJUALAN : "kasir"
    PENJUALAN ||--|{ PENJUALAN_DETAIL : "item belanja"
    BARANG ||--o{ PENJUALAN_DETAIL : "produk"

    SUPPLIER ||--o{ PESAN_BELI : "order ke"
    PESAN_BELI ||--|{ PESAN_BELI_DETAIL : "item PO"
    PESAN_BELI ||--o{ FAKTUR_BELI : "faktur masuk"
    FAKTUR_BELI ||--|{ FAKTUR_BELI_DETAIL : "item diterima"

    CABANG ||--o{ PENGIRIMAN : "cabang asal/tujuan"
    PENGIRIMAN ||--|{ PENGIRIMAN_DETAIL : "muatan surat jalan"
    BARANG ||--o{ FORECAST_STOK : "proyeksi ketersediaan"
    
    TIPE_AKUN ||--|{ DAFTAR_AKUN : "klasifikasi COA"
    DAFTAR_AKUN ||--|{ JURNAL_UMUM : "transaksi akuntansi"
```

---

## 6. Modul & Logika Bisnis Aplikasi

### 6.1 Dashboard & Analitik
Menyajikan ringkasan real-time:
- Omzet penjualan harian, mingguan, dan bulanan.
- Jumlah transaksi kasir yang berhasil diproses.
- Peringatan stok kritis (SKU yang runout time-nya $\le 3$ hari).
- Rekapitulasi presensi karyawan yang hadir, telat, dan izin.

### 6.2 Master Data
- **Struktur Konversi 3 Satuan:** Tiap barang memiliki Satuan 1 (Dus), Satuan 2 (Pack), dan Satuan 3 (Pcs) beserta rasio isinya.
- **Matriks 9 Harga Jual:** Mengakomodasi 3 level pembeli (Umum, Grosir, Mitra Khusus) untuk tiap satuan.
- **Metode Moving Average HPP:** Perhitungan otomatis nilai HPP rata-rata berjalan setiap kali barang masuk dari faktur pembelian.
- **Master Cabang & Titik GPS:** Koordinat latitude/longitude untuk geofencing absensi.

### 6.3 HRD & Bisyaroh
- **Absensi Geofencing GPS (Formula Haversine):** Jarak posisi koordinat ponsel abdi dengan titik cabang dihitung secara presisi dengan toleransi radius maksimal 500 meter, disertai foto selfie.
- **Izin & Cuti:** Workflow pengajuan digital disertai lampiran surat dokter dan approval HRD.
- **Hutang / Kasbon Abdi:** Pinjaman karyawan yang secara otomatis dipotong saat penggajian.
- **Perhitungan Penggajian (Bisyaroh):**
  $$\text{Total Gaji} = \text{Gaji Pokok} + (\text{Hari Hadir} \times \text{Tarif Harian}) + (\text{Jam Lembur} \times \text{Tarif Lembur}) + \text{Tunjangan} - \text{Potongan Hutang}$$

### 6.4 Penjualan (POS Kasir & Master Promo)
- **Point of Sale Terpadu:** Dukungan scanner barcode kamera/USB, hotkeys kasir cepat, pemotongan stok otomatis, perolehan poin pelanggan, dan kotak infaq sukarela.
- **Atomic Locking:** Menghindari nomor faktur ganda melalui PostgreSQL Advisory Lock per cabang.
- **11 Skema Mesin Promosi:** Diskon persen/nominal, Beli X Gratis Y, Hadiah Poin Ekstra, Hadiah Barang, Diskon Grosir Bertingkat, dan Promo Tebus Murah.

### 6.5 Pembelian & Hutang Dagang
- **Purchase Order (PO):** Pembuatan dokumen pesanan ke supplier.
- **Faktur Beli (Receiving):** Validasi penerimaan fisik, penambahan stok gudang otomatis, pembaruan HPP rata-rata, dan pencatatan hutang supplier.
- **Pelunasan Hutang Supplier:** Rekapitulasi jatuh tempo dan bukti bayar kas/bank.

### 6.6 Distribusi DMS & Smart Replenishment
- **Average Daily Sales (ADS):** Menghitung laju konsumsi barang per cabang berdasarkan riwayat transaksi 7, 30, dan 90 hari.
- **Proyeksi Ketersediaan (Forecast Runout):** Prediksi kapan stok habis ($\text{Stok} / \text{ADS}$).
- **Rekomendasi Restock DC:** Generator otomatis kuantitas pengiriman berdasarkan target buffer days, lead time, dan safety stock.
- **Penyeimbangan Antar Cabang:** Rekomendasi pemindahan stok jika cabang tetangga overstock dan DC kehabisan persediaan.
- **Surat Jalan & Laporan Selisih:** Penerbitan surat jalan driver serta investigasi barang rusak/kurang saat serah terima di cabang.

### 6.7 Akuntansi
- **Chart of Accounts (COA):** Pengelompokan akun Aktiva, Kewajiban, Modal, Pendapatan, HPP, dan Beban.
- **Jurnal Umum:** Form jurnal memorial dengan validasi otomatis keseimbangan Debet = Kredit.
- **Laporan Keuangan Otomatis:** Buku Besar per akun, Laporan Laba Rugi, dan Neraca Keuangan.

### 6.8 Pengaturan Aplikasi & Matriks Role Menu
- Konfigurasi nama toko, alamat, nomor telepon, dan pesan footer pada struk nota.
- Pengaturan izin akses dinamis untuk setiap jabatan.

### 6.9 API Layanan Mobile
Endpoint terisolasi di `/api/mobile/*` untuk aplikasi mobile karyawan (Check-in/Check-out GPS + Selfie, pengajuan izin cuti, unduh slip gaji digital, dan jadwal shift).

---

## 7. Daftar Lengkap REST API Endpoints

| Modul | Method | Endpoint | Fungsi |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Login web (Cookie HttpOnly) |
| | `POST` | `/api/auth/mobile-login` | Login mobile app (JWT Bearer) |
| | `POST` | `/api/auth/refresh` | Refresh masa aktif token |
| | `POST` | `/api/auth/logout` | Logout & hapus session |
| **HRD** | `GET` | `/api/hrd/dashboard-stats` | Statistik KPI SDM & Kehadiran |
| | `GET`/`POST` | `/api/hrd/users` | Daftar & Tambah abdi / karyawan |
| | `PUT`/`DELETE` | `/api/hrd/users/:id` | Update & Hapus data abdi |
| | `GET`/`POST` | `/api/hrd/absensi` | Log presensi seluruh cabang |
| | `GET`/`POST` | `/api/hrd/izin-cuti` | Daftar pengajuan izin & pengajuan baru |
| | `PUT` | `/api/hrd/izin-cuti/:id` | Persetujuan izin/cuti |
| | `GET`/`POST` | `/api/hrd/bisyaroh` | Rekapitulasi & generate payroll bulanan |
| **Master** | `GET`/`POST` | `/api/barang` | Katalog produk & penambahan SKU |
| | `PUT`/`DELETE` | `/api/barang/:id` | Edit detail produk & hapus |
| | `GET`/`POST` | `/api/cabang` | Master cabang toko & gudang DC |
| | `GET`/`POST` | `/api/pelanggan` | Master pelanggan & data member |
| | `GET`/`POST` | `/api/supplier` | Master vendor & pemasok |
| | `GET`/`POST` | `/api/stok` | Monitoring stok gudang & penyesuaian |
| **POS** | `GET` | `/api/penjualan` | Riwayat nota transaksi kasir |
| | `POST` | `/api/penjualan` | **Checkout Kasir POS** (Atomic Lock, stok, poin, HPP) |
| | `GET`/`POST` | `/api/promo` | Master konfigurasi promosi |
| **Pembelian**| `GET`/`POST` | `/api/pembelian/po` | Purchase Order ke vendor |
| | `GET`/`POST` | `/api/pembelian/invoice` | Penerimaan faktur barang masuk |
| | `GET`/`POST` | `/api/pembelian/hutang` | Manajemen & pembayaran hutang supplier |
| **DMS** | `GET` | `/api/distribusi/dashboard` | Dashboard stok kritis & top sales SKU |
| | `GET`/`POST` | `/api/distribusi/forecast` | Proyeksi hari habis & trigger kalkulasi ADS |
| | `GET`/`POST` | `/api/distribusi/rekomendasi`| Rekomendasi kirim otomatis DC |
| | `GET`/`POST` | `/api/distribusi/pengiriman` | Penerbitan surat jalan DC |
| | `GET`/`POST` | `/api/distribusi/selisih` | Laporan selisih kirim vs terima |
| **Akuntansi**| `GET`/`POST` | `/api/akuntansi/daftar-akun`| Master COA rekening |
| | `GET`/`POST` | `/api/akuntansi/jurnal` | Entri & rekap jurnal memorial |
| | `GET` | `/api/akuntansi/laporan` | Laba Rugi, Neraca, dan Buku Besar |
| **Mobile** | `GET` | `/api/mobile/absensi/status`| Cek status absensi hari ini |
| | `POST` | `/api/mobile/absensi/check-in` | Absen masuk (GPS + Selfie) |
| | `POST` | `/api/mobile/absensi/check-out`| Absen pulang (GPS + Selfie) |
| | `GET` | `/api/mobile/slip-gaji` | Lihat rincian slip bisyaroh digital |

---

## 8. Panduan Instalasi, Setup & Deployment Produksi

### 8.1 Setup Awal di Development
1. **Clone repository dan buka terminal:**
   ```bash
   # Masuk ke folder backend API
   cd erp-almubarok-api
   npm install
   npm run db:push
   npm run dev

   # Di terminal kedua, masuk ke folder frontend Next.js
   cd erp-almubarok-nextjs
   npm install
   npm run dev
   ```
2. Buka peramban di `http://localhost:3000`.

### 8.2 Konfigurasi Environment (`.env`)
- **Backend API (`erp-almubarok-api/.env`):**
  ```env
  PORT=3001
  DATABASE_URL="postgresql://postgres:password@localhost:5432/erp_almubarok"
  JWT_SECRET="kunci_rahasia_jwt_produksi_super_aman_12345"
  CORS_ORIGIN="http://localhost:3000"
  ```
- **Frontend Next.js (`erp-almubarok-nextjs/.env.local`):**
  ```env
  NEXT_PUBLIC_API_URL="http://localhost:3001"
  JWT_SECRET="kunci_rahasia_jwt_produksi_super_aman_12345"
  ```

### 8.3 Production Deployment dengan PM2 & Nginx
```bash
# Build Backend
cd erp-almubarok-api && npm run build
pm2 start dist/index.js --name "erp-api"

# Build Frontend
cd ../erp-almubarok-nextjs && npm run build
pm2 start npm --name "erp-web" -- start
```

---
*Dokumentasi Sistem ERP Al Mubarok Next.js & Hono.*
