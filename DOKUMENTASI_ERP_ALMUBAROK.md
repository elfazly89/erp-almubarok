# 📘 Dokumentasi Lengkap Sistem ERP Al Mubarok (Next.js & Hono)

> **Versi Sistem:** 2.0.0 (Next.js Modern Architecture)  
> **Status:** Production Ready  
> **Target Pengguna:** Tim Developer, System Administrator, HRD, Kasir, Bagian Gudang/Distribusi (DC), dan Akuntan.

---

## 📑 Daftar Isi

1. [Ringkasan Eksekutif & Arsitektur](#1-ringkasan-eksekutif--arsitektur)
2. [Tech Stack & Spesifikasi Dependensi](#2-tech-stack--spesifikasi-dependensi)
3. [Struktur Direktori Proyek](#3-struktur-direktori-proyek)
4. [Skema Database & ERD](#4-skema-database--erd)
5. [Sistem Keamanan, Autentikasi & Hak Akses (RBAC)](#5-sistem-keamanan-autentikasi--hak-akses-rbac)
6. [Modul & Fitur Aplikasi](#6-modul--fitur-aplikasi)
   - 6.1 [Dashboard Utama & Statistik](#61-dashboard-utama--statistik)
   - 6.2 [Master Data (Barang, Kategori, Supplier, Pelanggan, Cabang)](#62-master-data)
   - 6.3 [Modul HRD & Manajemen Abdi](#63-modul-hrd--manajemen-abdi)
   - 6.4 [Modul Penjualan (POS, Riwayat, Promo & Diskon)](#64-modul-penjualan-pos-riwayat-promo--diskon)
   - 6.5 [Modul Pembelian & Hutang Supplier](#65-modul-pembelian--hutang-supplier)
   - 6.6 [Modul DMS & Distribusi Multi-Cabang](#66-modul-dms--distribusi-multi-cabang)
   - 6.7 [Modul Akuntansi & Keuangan](#67-modul-akuntansi--keuangan)
   - 6.8 [Modul Pengaturan & Konfigurasi](#68-modul-pengaturan--konfigurasi)
   - 6.9 [API Layanan Mobile (Absensi & Self-Service)](#69-api-layanan-mobile-absensi--self-service)
7. [Dokumentasi API Endpoints](#7-dokumentasi-api-endpoints)
8. [Panduan Instalasi, Setup & Deployment](#8-panduan-instalasi-setup--deployment)
9. [Standar & Konvensi Pengembangan](#9-standar--konvensi-pengembangan)

---

## 1. Ringkasan Eksekutif & Arsitektur

**ERP Al Mubarok** adalah platform Enterprise Resource Planning multi-cabang terintegrasi yang dirancang khusus untuk mengelola operasional retail/toko grosir, distribution center (DC), sumber daya manusia (Abdi), sistem POS kasir, serta laporan akuntansi berstandar *double-entry*.

Arsitektur aplikasi menggunakan model **Modern Decoupled / Unified Fullstack**:

```text
┌──────────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                                   │
│  - Web Browser Desktop / Mobile (Next.js 16 Client Components)   │
│  - Mobile Native / Android (Capacitor / React Native Mobile App) │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│           NEXT.JS APP ROUTER (Port 3000)                         │
│  - React 19 Server & Client Components                           │
│  - Edge/Node Middleware (JWT Auth Verification & Security Headers)│
│  - Reverse Proxy Rewrites: /api/:path* ──► Hono Backend API      │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP / JSON
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│           HONO RESTful BACKEND API (Port 3001)                   │
│  - Lightweight, high-performance TypeScript API engine           │
│  - Global JWT Auth Middleware & Role Verifier                    │
│  - Geofencing Engine (Haversine Formula) & Selfie Uploads        │
│  - POS Locking & Transaction Manager                             │
│  - DMS Replenishment & Forecast Algorithms                       │
└───────────────────────────────┬──────────────────────────────────┘
                                │ Drizzle ORM
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                                 │
│  - PostgreSQL (Primary Production Engine)                        │
│  - SQLite (Local Dev / Offline Node) via Drizzle ORM             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack & Spesifikasi Dependensi

### Frontend (`erp-almubarok-nextjs`)
- **Core Framework:** Next.js `16.2.6` (App Router, Server Components & Client Hooks)
- **UI Library:** React `19.2.4` + TypeScript `5.x`
- **Styling:** TailwindCSS `v4`, `@tailwindcss/postcss`
- **UI Primitives:** Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-popover`, `@radix-ui/react-toast`, `@radix-ui/react-tooltip`)
- **Icons:** `lucide-react` `1.17.0`
- **Data Visualization & Charts:** `recharts` `3.8.1`
- **Scanning & Peripherals:** `jsqr` (Webcam barcode/QR scanner)
- **Utilities & Export:** `date-fns` `4.4.0`, `xlsx` `0.18.5`, `clsx`, `tailwind-merge`
- **Theming:** `next-themes` (Dark Mode & Light Mode support)

### Backend API (`erp-almubarok-api`)
- **Server Framework:** `hono` `4.13.1` with `@hono/node-server` `2.1.0`
- **Runtime:** Node.js (v20+ LTS)
- **Database Driver:** `pg` `8.23.0` (PostgreSQL Connection Pooling) / `better-sqlite3` `13.x`
- **ORM:** `drizzle-orm` `0.45.2` + `drizzle-kit` `0.31.10`
- **Security & Auth:** `jose` `6.2.8` (JWT HS256), `bcryptjs` `3.0.3`

---

## 3. Struktur Direktori Proyek

```text
erp-almubarok/
├── erp-almubarok-nextjs/           # Aplikasi Web Frontend (Next.js 16)
│   ├── next.config.ts              # Konfigurasi Next.js & Proxy Rewrites ke port 3001
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/                     # Asset statis, logo, icon
│   └── src/
│       ├── middleware.ts           # Route guard & inject auth headers
│       ├── app/
│       │   ├── layout.tsx          # Root Layout & Provider Wrapper
│       │   ├── globals.css         # Styling global & Design System Tokens
│       │   ├── login/              # Halaman Login Web
│       │   │   ├── page.tsx
│       │   │   └── layout.tsx
│       │   └── (dashboard)/        # Protected Routes (Sidebar & Header Layout)
│       │       ├── layout.tsx
│       │       ├── dashboard/      # Dashboard Utama & KPI
│       │       ├── barang/         # Katalog & Master Barang
│       │       ├── kategori/       # Kategori Barang
│       │       ├── supplier/       # Master Supplier
│       │       ├── pelanggan/      # Master Pelanggan & Riwayat Poin
│       │       ├── cabang/         # Master Cabang & Koordinat GPS
│       │       ├── stok/           # Monitor & Koreksi Stok per Cabang
│       │       ├── hrd/            # Submodul SDM & Kepegawaian
│       │       │   ├── users/      # Data Abdi / Karyawan
│       │       │   ├── absensi/    # Rekap Absensi & Log Masuk
│       │       │   ├── jabatan/    # Master Jabatan & Standar Gaji
│       │       │   ├── jam-kerja/  # Jadwal Shift & Toleransi Jam
│       │       │   ├── hari-libur/ # Kalender Hari Libur Nasional/Pondok
│       │       │   ├── izin-cuti/  # Approval Cuti & Izin
│       │       │   ├── hutang/     # Pinjaman & Hutang Abdi
│       │       │   └── bisyaroh/   # Penggajian & Slip Gaji
│       │       ├── penjualan/      # Submodul Kasir & Sales
│       │       │   ├── pos/        # Kasir Modern Point of Sale
│       │       │   ├── history/    # Riwayat Transaksi & Cetak Ulang Nota
│       │       │   └── promo/      # Engine Promosi & Diskon
│       │       ├── pembelian/      # Submodul Pengadaan & Purchasing
│       │       │   ├── po/         # Purchase Order
│       │       │   ├── invoice/    # Penerimaan Faktur Beli & Penyesuaian HPP
│       │       │   ├── history/    # Riwayat Faktur
│       │       │   └── hutang/     # Pelunasan Hutang Supplier
│       │       ├── distribusi/     # Submodul DMS (Distribution Management System)
│       │       │   ├── dashboard/  # Monitoring Stok Kritis Seluruh Cabang
│       │       │   ├── forecast/   # Perhitungan ADS & Estimasi Hari Habis
│       │       │   ├── rekomendasi/# Rekomendasi Restock DC Otomatis
│       │       │   ├── transfer/   # Saran Penyeimbangan Stok Antar Cabang
│       │       │   ├── pengiriman/ # Penerbitan Surat Jalan DC
│       │       │   ├── monitoring/ # Lacak Status Pengiriman Ekspedisi/Driver
│       │       │   └── selisih/    # Verifikasi & Investigasi Selisih Penerimaan
│       │       ├── akuntansi/      # Submodul Akuntansi Keuangan
│       │       │   ├── jurnal/     # Entri & Daftar Jurnal Umum
│       │       │   ├── coa/        # Chart of Accounts (Daftar Akun)
│       │       │   ├── tipe/       # Master Tipe Akun & Posisi Normal Saldo
│       │       │   └── laporan/    # Laba Rugi, Neraca, & Buku Besar
│       │       ├── profil/         # Edit Biodata User
│       │       ├── ubah-password/  # Ganti Kata Sandi
│       │       └── pengaturan/     # Konfigurasi Sistem
│       │           ├── role-menu/  # Matriks Hak Akses CRUD per Jabatan
│       │           └── aplikasi/   # Nama Toko, Alamat, Footer Struk
│       ├── components/
│       │   ├── layout/             # Sidebar, UserMenu, ThemeToggle, HelpButton
│       │   └── providers/          # PermissionProvider, AppSettingsProvider
│       └── lib/
│           ├── api-client.ts       # Unified API Fetcher (Client / SSR)
│           ├── auth/               # Helper Token & JWT Client
│           └── utils.ts            # Formatting Rupiah, Date, & Helper Class
│
└── erp-almubarok-api/              # Backend RESTful API Server (Hono)
    ├── src/
    │   ├── index.ts                # Server Entry, CORS, Global Route Loader
    │   ├── middleware/
    │   │   └── auth.ts             # JWT Guard & Context Injector
    │   ├── routes/
    │   │   ├── auth.ts             # Autentikasi, Refresh Token, Rate Limiter
    │   │   ├── master.ts           # CRUD Master Barang, Kategori, Cabang, dll.
    │   │   ├── hrd.ts              # Engine Absensi, Cuti, & Payroll Bisyaroh
    │   │   ├── penjualan.ts        # Checkout POS Transaksional & Invoice Lock
    │   │   ├── pembelian.ts        # PO, Faktur Beli & Hutang Dagang
    │   │   ├── distribusi.ts       # Algoritma ADS, Safety Stock & DMS DC
    │   │   ├── akuntansi.ts        # Jurnal, Posting Buku Besar & Financial Report
    │   │   ├── promo.ts            # 11 Skema Evaluasi Diskon & Hadiah
    │   │   ├── voucher.ts          # Validasi Kupon Belanja
    │   │   ├── pengaturan.ts       # App Config & Matriks Role Menu
    │   │   ├── user.ts             # Profil & Session Info
    │   │   └── mobile.ts           # Endpoint Khusus Mobile App (Geofencing GPS)
    │   └── lib/
    │       ├── auth/               # JWT Engine (HS256) & Password Hasher
    │       └── db/
    │           ├── index.ts        # Koneksi Pool Database Drizzle PostgreSQL
    │           └── schema.ts       # Definisi Tabel Relasional Drizzle
    └── scripts/                    # Script Maintenance, Seeding & Migrasi DB
```

---

## 4. Skema Database & ERD

Sistem menggunakan relasi data terstruktur dengan integritas referensial (Foreign Key) yang dikelola melalui **Drizzle ORM**.

```mermaid
erDiagram
    CABANG ||--o{ USERS : "memiliki"
    JABATAN ||--o{ USERS : "mengelompokkan"
    JABATAN ||--o{ ROLE_MENU : "mengatur hak akses"
    JABATAN ||--o{ ROLE_MENU_SUB : "mengatur hak sub-menu"
    
    USERS ||--o{ ABSENSI : "mencatat"
    USERS ||--o{ IZIN_CUTI : "mengajukan"
    USERS ||--o{ HUTANG_KARYAWAN : "memiliki pinjaman"
    USERS ||--o{ BISYAROH : "menerima gaji"

    KATEGORI_BARANG ||--o{ BARANG : "mengelompokkan"
    SUPPLIER ||--o{ BARANG : "memasok"
    BARANG ||--o{ STOK_BARANG : "dicatat di cabang"
    CABANG ||--o{ STOK_BARANG : "menyimpan stok"

    PELANGGAN ||--o{ PENJUALAN : "melakukan"
    USERS ||--o{ PENJUALAN : "kasir bertugas"
    CABANG ||--o{ PENJUALAN : "lokasi toko"
    PENJUALAN ||--|{ PENJUALAN_DETAIL : "terdiri dari"
    BARANG ||--o{ PENJUALAN_DETAIL : "item terjual"
    PELANGGAN ||--o{ RIWAYAT_POIN : "akumulasi poin"

    SUPPLIER ||--o{ PESAN_BELI : "menerima PO"
    PESAN_BELI ||--|{ PESAN_BELI_DETAIL : "item PO"
    PESAN_BELI ||--o{ FAKTUR_BELI : "diterbitkan invoice"
    FAKTUR_BELI ||--|{ FAKTUR_BELI_DETAIL : "item diterima"
    SUPPLIER ||--o{ BAYAR_HUTANG : "pembayaran hutang"

    CABANG ||--o{ PENGIRIMAN : "cabang asal / tujuan"
    PENGIRIMAN ||--|{ PENGIRIMAN_DETAIL : "muatan barang"
    PENGIRIMAN ||--o{ PENGIRIMAN_SELISIH : "laporan selisih"
    BARANG ||--o{ SALES_VELOCITY : "performa penjualan"
    BARANG ||--o{ FORECAST_STOK : "proyeksi habis"

    TIPE_AKUN ||--|{ DAFTAR_AKUN : "kategori COA"
    DAFTAR_AKUN ||--|{ JURNAL_UMUM : "transaksi debet/kredit"
    CABANG ||--o{ JURNAL_UMUM : "entitas cabang"
```

### Ringkasan Entitas & Tabel Utama

| Kategori Tabel | Nama Tabel | Deskripsi & Kegunaan |
|---|---|---|
| **Identitas & Role** | `cabang` | Data cabang toko & DC, alamat, no telepon, koordinat GPS (`lat`, `long`), flag `is_dc`. |
| | `jabatan` | Daftar posisi/role (misal: Direktur, HRD, Kasir, Kepala Gudang, Driver). |
| | `users` | Master akun Abdi/karyawan, NIK, No HP, password bcrypt, foto profil, jabatan & penempatan cabang. |
| | `menu_main`, `menu_sub` | Hierarki navigasi sistem ERP. |
| | `role_menu`, `role_menu_sub`| Matriks hak akses per jabatan: `can_create`, `can_read`, `can_update`, `can_delete`. |
| **HRD & Kepegawaian** | `absensi` | Catatan kehadiran GPS, jam masuk/pulang, selfie base64, status verifikasi radius. |
| | `jam_kerja` | Master shift kerja, batas toleransi awal & akhir. |
| | `hari_libur` | Kalender libur nasional & jadwal libur pesantren. |
| | `izin_cuti` | Pengajuan sakit/izin/cuti, bukti surat dokter, status approval. |
| | `hutang_karyawan` | Catatan pinjaman abdi yang dipotong otomatis saat penggajian. |
| | `daftar_gaji_jabatan` | Standar gaji pokok, gaji harian/per jam, dan tarif lembur per jabatan. |
| | `bisyaroh` | Rekapitulasi penggajian bulanan (Gaji pokok + kehadiran + lembur + tunjangan - potongan hutang). |
| **Master Produk & Stok** | `kategori_barang` | Kategori produk. |
| | `supplier` | Data rekanan pemasok, hari kunjungan, nomor rekening, NPWP. |
| | `barang` | Master SKU, barcode, nama barang, konversi 3 satuan bertingkat (`satuan_1`, `satuan_2`, `satuan_3`), matriks 9 harga jual, harga beli & HPP rata-rata. |
| | `stok_barang` | Kuantitas stok realtime per cabang, posisi rak, stok minimum & maksimum. |
| **Penjualan & Kasir** | `pelanggan` | Data member/pelanggan, level harga khusus, saldo poin reward. |
| | `penjualan` | Header transaksi POS, nomor invoice otomatis, subtotal, diskon, voucher, infaq, total akhir, metode bayar. |
| | `penjualan_detail` | Detail item per transaksi POS, kuantitas, harga jual, HPP saat transaksi, subtotal. |
| | `riwayat_poin` | Mutasi perolehan dan penukaran poin loyalitas pelanggan. |
| | `infaq` | Catatan sedekah/infaq sukarela dari pembulatan atau donasi struk kasir. |
| | `vouchers` | Master kupon voucher potongan belanja. |
| **Pengadaan / Pembelian** | `pesan_beli` | Header Purchase Order (PO) ke supplier. |
| | `pesan_beli_detail` | Detail barang dan kuantitas yang dipesan ke supplier. |
| | `faktur_beli` | Penerimaan barang dari supplier, nomor surat jalan/faktur, status bayar hutang. |
| | `faktur_beli_detail` | Detail barang diterima, kuantitas, harga beli netto (memperbarui HPP rata-rata). |
| | `bayar_hutang` | Transaksi pelunasan hutang dagang supplier. |
| **Distribusi & DMS** | `stok_setting_cabang` | Parameter safety stock, target buffer days, dan lead time pengiriman per cabang. |
| | `sales_velocity` | Kecepatan penjualan harian rata-rata (ADS: 7, 30, dan 90 hari). |
| | `forecast_stok` | Prediksi sisa hari stok bertahan sebelum habis dan status urgensi (`KRITIS`, `PERINGATAN`, `AMAN`). |
| | `rekomendasi_pengiriman` | Draft replenishment cerdas dari DC ke cabang berdasarkan analisis ADS. |
| | `pengiriman` | Surat jalan resmi pengiriman DC ke toko cabang / transfer antar cabang. |
| | `pengiriman_detail` | Rincian barang dalam surat jalan (qty kirim vs qty terima). |
| | `pengiriman_selisih` | Laporan dan investigasi barang kurang/rusak saat serah terima di cabang. |
| **Akuntansi** | `tipe_akun` | Klasifikasi akun (Aset Lancar, Aset Tetap, Kewajiban, Ekuitas, Pendapatan, HPP, Beban). |
| | `daftar_akun` | Chart of Accounts (COA) nomor akun & nama akun. |
| | `jurnal_umum` | Transaksi buku harian akuntansi (*double-entry balancing*). |
| **Promosi & Diskon** | `promo` & tabel syarat | Konfigurasi diskon bertingkat, gratis produk (Beli X Gratis Y), tebus murah, dan poin ganda. |
| **Konfigurasi** | `pengaturan_aplikasi` | Key-value setting (nama institusi, alamat cabang utama, template struk kasir). |

---

## 5. Sistem Keamanan, Autentikasi & Hak Akses (RBAC)

### 5.1 Mekanisme Autentikasi JWT
1. **Login:** User mengirim `no_hp` dan `password` ke `/api/auth/login`.
2. **Password Verification:** Password diverifikasi menggunakan `bcryptjs` (salt rounds 10).
3. **Token Issuance:** Backend menerbitkan JWT token menggunakan library `jose` (algoritma `HS256`, masa berlaku 8 jam) berisi klaim payload:
   ```json
   {
     "id": 1,
     "kode_user": "ADM001",
     "nama_user": "Ahmad Fauzi",
     "id_jabatan": 1,
     "id_cabang": 1,
     "role": "Super Admin"
   }
   ```
4. **Cookie & Header Storage:** Token disimpan dalam HTTP-Only cookie `auth_token` untuk aplikasi web, serta dikembalikan sebagai `access_token` JSON untuk mobile/API client.
5. **Next.js Middleware Guard:** `middleware.ts` memeriksa token di setiap navigasi halaman, memvalidasi masa aktifnya, menginjeksi identitas user ke request header (`x-user-id`, `x-cabang-id`), dan me-redirect user yang belum login ke `/login`.

### 5.2 Perlindungan Keamanan Tambahan
- **Brute Force Protection:** Percobaan login salah dicatat di tabel `login_attempts`. Jika melebihi 5 kali dalam waktu singkat, akun terkunci sementara.
- **Audit Logging:** Setiap keberhasilan dan kegagalan login dicatat dalam tabel `log_login` lengkap beserta alamat IP dan waktu akses.
- **Security Headers:** Response dilengkapi header `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan `Referrer-Policy: strict-origin-when-cross-origin`.

### 5.3 Granular Role-Based Access Control (RBAC)
Hak akses diatur dinamis melalui menu **Pengaturan > Role Menu** tanpa perlu mengubah kode sumber:
- Setiap **Jabatan** memiliki hak akses spesifik terhadap `Menu Utama` dan `Sub Menu`.
- Memiliki 4 level izin (CRUD):
  - `can_read` (Melihat menu & data)
  - `can_create` (Menambah data baru)
  - `can_update` (Mengedit data)
  - `can_delete` (Menghapus data)
- Di sisi frontend, `PermissionProvider` menyediakan hook `useMenuPermissions()` untuk otomatis menyembunyikan tombol `Tambah`, `Edit`, atau `Hapus` jika user tidak memiliki hak akses.

---

## 6. Modul & Fitur Aplikasi

### 6.1 Dashboard Utama & Statistik
- **KPI Realtime:** Total penjualan hari ini, omzet bulanan, jumlah transaksi POS, total barang berstatus stok kritis, dan ringkasan kehadiran abdi.
- **Grafik Tren Penjualan:** Grafik interaktif menggunakan Recharts yang menampilkan perbandingan omzet 7 hari terakhir vs minggu sebelumnya.
- **Shortcut Cepat:** Akses 1-klik menuju Kasir POS, Input Absensi, dan Rekomendasi Restock DC.

---

### 6.2 Master Data

#### 📦 Master Barang & Konversi Multi-Satuan
Sistem mendukung struktur 3 tingkat satuan dan 9 tingkatan harga per SKU:
- **Konversi Satuan:**
  - `satuan_1` (misal: *Dus*, isi 24 pcs)
  - `satuan_2` (misal: *Pack*, isi 6 pcs)
  - `satuan_3` (misal: *Pcs*, satuan terkecil)
- **Matriks Harga Jual:**
  - Level 1 (Harga Konsumen Umum) untuk Satuan 1, 2, 3
  - Level 2 (Harga Grosir / Reseller) untuk Satuan 1, 2, 3
  - Level 3 (Harga Mitra Khusus / Santri) untuk Satuan 1, 2, 3
- **Metode HPP Rata-Rata (Moving Average Cost):** Setiap terjadi penerimaan faktur beli baru, HPP barang otomatis dihitung ulang:
  $$\text{HPP Baru} = \frac{(\text{Stok Lama} \times \text{HPP Lama}) + (\text{Qty Masuk} \times \text{Harga Beli Netto})}{\text{Stok Lama} + \text{Qty Masuk}}$$

#### 👥 Master Supplier, Kategori, Pelanggan, & Cabang
- **Supplier:** Rekap data vendor, riwayat hutang berjalan, serta penjadwalan hari kunjungan sales.
- **Pelanggan:** Klasifikasi level harga default (1, 2, atau 3) dan rekap saldo poin loyalitas.
- **Cabang:** Penentuan cabang toko retail atau **Distribution Center (DC)**, disertai koordinat peta (Latitude & Longitude) untuk batas geofencing absensi karyawan.

---

### 6.3 Modul HRD & Manajemen Abdi

```text
┌─────────────────────────────────────────────────────────────┐
│                    ALUR HRD & PENGGAJIAN                    │
│                                                             │
│   Jadwal Shift ──► Absensi Mobile GPS ──► Rekap Kehadiran   │
│                          │                       │          │
│                          ▼                       ▼          │
│   Pengajuan Izin ──► Approval HRD ───────► PERHITUNGAN      │
│                                            BISYAROH         │
│   Pinjaman Abdi  ──► Potong Gaji ────────► (Payroll Slip)   │
└─────────────────────────────────────────────────────────────┘
```

1. **Absensi Geofencing GPS & Selfie:**
   - Menghitung jarak realtime antara posisi GPS karyawan dengan koordinat cabang menggunakan formula **Haversine**:
     $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
   - Radius absensi valid dibatasi maksimal 500 meter dari titik koordinat cabang.
   - Dilengkapi pengambilan foto selfie sebagai bukti kehadiran anti-titip absen.
2. **Manajemen Shift & Toleransi:** Pengaturan jam masuk, batas akhir keterlambatan, jam pulang, dan toleransi lembur.
3. **Izin, Sakit & Cuti:** Alur pengajuan digital oleh karyawan disertai upload foto surat keterangan dan tombol persetujuan (Approve/Reject) oleh HRD.
4. **Hutang / Pinjaman Abdi:** Pencatatan kasbon yang otomatis terpotong saat generate slip gaji bulanan.
5. **Penggajian Bisyaroh Otomatis:**
   $$\text{Total Bisyaroh} = \text{Gaji Pokok} + (\text{Hari Hadir} \times \text{Gaji Harian}) + (\text{Jam Lembur} \times \text{Tarif Lembur}) + \text{Tunjangan} - \text{Potongan Hutang}$$
   - Tersedia fitur cetak slip gaji format standar dan ekspor Excel.

---

### 6.4 Modul Penjualan (POS, Riwayat, Promo & Diskon)

#### 🛒 Kasir Point-of-Sale (POS) Modern
- **Pencarian Cepat:** Support scan barcode menggunakan scanner fisik USB/Bluetooth maupun kamera laptop/HP via `jsQR`.
- **Keyboard Shortcuts Kasir:**
  - `F1` : Buka dialog pencarian barang
  - `F2` : Ganti jumlah / kuantitas barang
  - `F3` : Pilih / Ganti pelanggan
  - `F4` : Input kupon / voucher belanja
  - `F8` : Bayar / Selesaikan transaksi
  - `F9` : Simpan transaksi sementara (Pending/Hold)
- **Multi-Level Price Trigger:** Harga otomatis berganti berdasarkan level member pelanggan (Umum, Grosir, Khusus).
- **Tukar Poin & Voucher:** Poin belanja pelanggan dapat langsung dipotongkan sebagai nominal diskon (misal: 100 poin = Rp 10.000).
- **Kotak Infaq Sukarela:** Fitur pembulatan kembalian atau sedekah kasir yang langsung tercatat ke kas infaq terpisah.
- **Transaksi Aman (Atomic Transaction):** Dikelola menggunakan Postgres Advisory Lock per cabang (`pg_advisory_xact_lock`) untuk mencegah duplikasi nomor nota saat kasir checkout serentak di waktu yang sama.

#### 🏷️ Engine Promosi & Diskon (11 Skema)
Sistem mendukung beragam jenis promosi dinamis yang dievaluasi otomatis di keranjang kasir:
1. Diskon Total Belanja (persen atau nominal)
2. Bonus Poin Belanja
3. Hadiah Barang Belanja
4. Diskon Kategori Produk
5. Diskon Brand / Supplier Tertentu
6. Diskon Barang Tertentu (Diskon coret)
7. Diskon Grosir Bertingkat (Beli $\ge N$ dapat potongan harga)
8. Poin Ekstra per Barang
9. Beli X Gratis Y (Buy 1 Get 1 / Buy X Get Free Product)
10. Hadiah Merchandise Pembelian Produk Tertentu
11. Promo Tebus Murah (Belanja minimal Rp $X$ berhak membeli produk $Y$ seharga Rp $Z$)

---

### 6.5 Modul Pembelian & Hutang Supplier
1. **Purchase Order (PO):** Pembuatan surat pesanan resmi ke supplier lengkap dengan estimasi total biaya dan kuantitas per satuan.
2. **Faktur Pembelian (Receiving):**
   - Penerimaan barang fisik dari supplier berdasarkan nomor PO.
   - Stok barang cabang otomatis bertambah.
   - HPP rata-rata barang otomatis diperbarui di database.
   - Jika pembayaran bertipe tempo/kredit, saldo hutang supplier otomatis bertambah.
3. **Manajemen Hutang Supplier:** Rekapitulasi jatuh tempo hutang dagang dan form pembayaran cicilan/lunas dengan metode Kas/Transfer Bank.

---

### 6.6 Modul DMS & Distribusi Multi-Cabang

Distribution Management System (DMS) mengubah paradigma pengiriman barang dari **Reaktif** (menunggu cabang minta) menjadi **Proaktif Berbasis Data (Smart Replenishment)**:

```text
┌─────────────────────────────────────────────────────────────┐
│                    ALUR DISTRIBUSI DMS                      │
│                                                             │
│   Data Penjualan POS Cabang                                 │
│             │                                               │
│             ▼                                               │
│   Perhitungan Sales Velocity (ADS 7, 30, 90 Hari)           │
│             │                                               │
│             ▼                                               │
│   Forecast Ketersediaan & Estimasi Hari Habis               │
│             │                                               │
│             ▼                                               │
│   Rekomendasi Restock DC Otomatis (Smart Replenishment)     │
│             │                                               │
│             ▼                                               │
│   Penerbitan Surat Jalan DC ──► Pengiriman Driver           │
│                                       │                     │
│                                       ▼                     │
│   Verifikasi Cabang ◄── Investigasi Selisih Penerimaan      │
└─────────────────────────────────────────────────────────────┘
```

#### 📊 Formula & Algoritma DMS
1. **Average Daily Sales (ADS):**
   $$\text{ADS}_{7} = \frac{\sum \text{Penjualan 7 Hari Terakhir}}{7}, \quad \text{ADS}_{30} = \frac{\sum \text{Penjualan 30 Hari Terakhir}}{30}$$
2. **Estimasi Hari Habis (Runout Days):**
   $$\text{Estimasi Hari Habis} = \frac{\text{Stok Saat Ini}}{\text{ADS}}$$
   - $\le 3\text{ Hari}$ : Status **KRITIS** (Merah)
   - $4 - 7\text{ Hari}$ : Status **PERINGATAN** (Kuning)
   - $> 7\text{ Hari}$ : Status **AMAN** (Hijau)
3. **Kuantitas Rekomendasi Kirim:**
   $$\text{Target Stok} = (\text{ADS} \times \text{Target Days Stock}) + \text{Safety Stock}$$
   $$\text{Qty Rekomendasi} = \max(0, \text{Target Stok} - \text{Stok Saat Ini})$$
4. **Penyeimbangan Stok Antar Cabang (Inter-branch Transfer):** Jika Cabang A mengalami kekosongan (*stockout*) sementara Cabang B mengalami *overstock* (> 30 hari buffer) dan DC sedang kehabisan stok, sistem menyarankan pemindahan barang dari Cabang B ke Cabang A.
5. **Manajemen Selisih Pengiriman:** Form pencatatan barang rusak/hilang di jalan saat cabang menerima kiriman, lengkap dengan upload foto bukti fisik dan persetujuan penyesuaian stok oleh admin DC.

---

### 6.7 Modul Akuntansi & Keuangan
- **Chart of Accounts (COA):** Kode rekening standar akuntansi terstruktur (1-Aset, 2-Kewajiban, 3-Ekuitas, 4-Pendapatan, 5-HPP, 6-Beban Operasional).
- **Jurnal Umum:** Form input jurnal memorial *double-entry* dengan validasi otomatis agar total Debet sama dengan total Kredit.
- **Buku Besar (General Ledger):** Filter transaksi per nomor akun dalam rentang tanggal tertentu beserta saldo awal dan mutasi.
- **Laporan Keuangan Otomatis:**
  - **Laba Rugi (Income Statement):** Pendapatan Penjualan - HPP = Laba Kotor - Total Beban = Laba Bersih.
  - **Neraca (Balance Sheet):** Posisi Total Aset = Total Kewajiban + Total Ekuitas.

---

### 6.8 Modul Pengaturan & Konfigurasi
- **Pengaturan Role Menu:** Konfigurasi matriks perizinan CRUD per jabatan.
- **Pengaturan Aplikasi:** Penggantian nama institusi, nomor izin usaha, alamat toko utama, kontak customer care, dan teks kustom di bagian footer struk kasir.
- **Manajemen Profil & Keamanan:** Penggantian foto profil, biodata diri, dan update kata sandi akun yang terenkripsi.

---

### 6.9 API Layanan Mobile (Absensi & Self-Service)
Layanan API terisolasi di `/api/mobile/*` untuk integrasi aplikasi mobile karyawan Android/iOS:
- `GET /api/mobile/profil` : Data profil & status penempatan karyawan.
- `GET /api/mobile/absensi/status` : Status absensi hari ini (sudah masuk / belum).
- `POST /api/mobile/absensi/check-in` : Absen masuk via GPS + selfie.
- `POST /api/mobile/absensi/check-out` : Absen pulang via GPS + selfie.
- `GET /api/mobile/absensi/riwayat` : Riwayat presensi bulanan.
- `POST /api/mobile/izin-cuti/ajukan` : Pengajuan izin/sakit dari HP.
- `GET /api/mobile/slip-gaji` : Melihat rincian bisyaroh bulanan digital.
- `GET /api/mobile/jadwal-shift` : Informasi jadwal jam kerja.

---

## 7. Dokumentasi API Endpoints

Semua endpoint dilayani melalui Hono API pada base URL `/api`. Request yang memerlukan autentikasi harus menyertakan header `Authorization: Bearer <token>` atau memiliki cookie `auth_token`.

### 🔑 Autentikasi (`/api/auth`)
| Method | Endpoint | Keterangan | Akses |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login user web & terima cookie auth | Publik |
| `POST` | `/api/auth/mobile-login` | Login user mobile & terima access_token JSON | Publik |
| `POST` | `/api/auth/refresh` | Refresh masa aktif token | User Login |
| `POST` | `/api/auth/logout` | Hapus token & session | User Login |
| `GET` | `/api/auth/app-settings` | Informasi publik konfigurasi aplikasi | Publik |

---

### 👥 HRD & Kepegawaian (`/api/hrd`)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/hrd/dashboard-stats` | Statistik rekap jumlah abdi, absensi hari ini, dan izin pending |
| `GET` / `POST` | `/api/hrd/users` | List seluruh data abdi / Tambah abdi baru |
| `GET` / `PUT` / `DELETE` | `/api/hrd/users/:id` | Detail, Update, atau Hapus abdi |
| `GET` / `POST` | `/api/hrd/jabatan` | List & Tambah jabatan |
| `PUT` / `DELETE` | `/api/hrd/jabatan/:id` | Update & Hapus jabatan |
| `GET` / `POST` | `/api/hrd/absensi` | Rekap kehadiran seluruh cabang / Input manual absensi |
| `GET` / `POST` | `/api/hrd/jam-kerja` | Master shift kerja |
| `GET` / `POST` | `/api/hrd/hari-libur` | Master kalender hari libur |
| `GET` / `POST` | `/api/hrd/izin-cuti` | Daftar pengajuan izin & cuti / Ajukan izin baru |
| `PUT` | `/api/hrd/izin-cuti/:id` | Persetujuan izin (`approved` / `rejected`) oleh HRD |
| `GET` / `POST` | `/api/hrd/hutang` | Daftar pinjaman abdi / Input pinjaman baru |
| `PATCH` | `/api/hrd/hutang/:id` | Update status pelunasan pinjaman |
| `GET` / `POST` | `/api/hrd/gaji-jabatan` | Konfigurasi tarif gaji pokok & lembur per jabatan |
| `GET` / `POST` | `/api/hrd/bisyaroh` | Rekap bisyaroh bulanan / Generate kalkulasi gaji otomatis |

---

### 📦 Master Data (`/api/master` atau `/api`)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` / `POST` | `/api/barang` | Daftar katalog barang / Tambah SKU barang baru |
| `PUT` / `DELETE` | `/api/barang/:id` | Update rincian harga/satuan / Hapus barang |
| `GET` / `POST` | `/api/kategori` | List & Tambah kategori barang |
| `PUT` / `DELETE` | `/api/kategori/:id` | Update & Hapus kategori |
| `GET` / `POST` | `/api/supplier` | List & Tambah data supplier |
| `PUT` / `DELETE` | `/api/supplier/:id` | Update & Hapus supplier |
| `GET` / `POST` | `/api/cabang` | List & Tambah data cabang toko & DC |
| `PUT` / `DELETE` | `/api/cabang/:id` | Update & Hapus cabang |
| `GET` / `POST` | `/api/pelanggan` | List & Tambah pelanggan/member |
| `PUT` / `DELETE` | `/api/pelanggan/:id` | Update & Hapus data pelanggan |
| `GET` / `POST` | `/api/stok` | Monitoring stok per cabang / Form penyesuaian stok opname |

---

### 🛒 Penjualan POS & Promo (`/api/penjualan` & `/api/promo`)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/penjualan` | Riwayat transaksi nota POS cabang |
| `GET` | `/api/penjualan?id=:id` | Detail faktur nota transaksi dan item belanja |
| `POST` | `/api/penjualan` | **Checkout Kasir POS** (Atomic lock, potong stok, catat poin, HPP) |
| `GET` | `/api/penjualan/promo` | Daftar promo aktif untuk divalidasi pada keranjang kasir |
| `GET` / `POST` | `/api/promo` | Manajemen konfigurasi master promosi & diskon |
| `GET` | `/api/voucher` | Validasi kupon voucher belanja |

---

### 🚚 Distribusi & DMS (`/api/distribusi`)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/distribusi/dashboard` | Statistik stok kritis seluruh cabang & top fast-moving SKU |
| `GET` / `POST` | `/api/distribusi/forecast` | Lihat hasil proyeksi habis / Trigger kalkulasi ulang ADS |
| `GET` / `POST` / `PUT`| `/api/distribusi/rekomendasi`| Rekomendasi restock DC / Buat draft / Approve rekomendasi |
| `GET` / `POST` / `PUT`| `/api/distribusi/pengiriman` | List surat jalan DC / Buat pengiriman / Konfirmasi penerimaan |
| `GET` / `POST` | `/api/distribusi/setting` | Konfigurasi minimum buffer days & lead time cabang |
| `GET` / `PUT` | `/api/distribusi/transfer` | Saran transfer antar cabang overstock-understock |
| `GET` | `/api/distribusi/monitoring` | Pelacakan status armada pengiriman realtime |
| `GET` / `POST` / `PUT`| `/api/distribusi/selisih` | Laporan selisih kirim vs terima / Resolusi persetujuan |

---

### 📚 Akuntansi (`/api/akuntansi`)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` / `POST` | `/api/akuntansi/tipe-akun` | List & Tambah tipe akun COA |
| `PUT` / `DELETE` | `/api/akuntansi/tipe-akun/:id` | Update & Hapus tipe akun |
| `GET` / `POST` | `/api/akuntansi/daftar-akun` | List Chart of Accounts (COA) / Tambah kode akun baru |
| `PUT` / `DELETE` | `/api/akuntansi/daftar-akun/:id` | Update & Hapus akun COA |
| `GET` / `POST` | `/api/akuntansi/jurnal` | List transaksi jurnal / Input entri jurnal memorial |
| `GET` | `/api/akuntansi/laporan` | Laporan Buku Besar, Laba Rugi, dan Neraca Saldo |

---

## 8. Panduan Instalasi, Setup & Deployment

### 8.1 Kebutuhan Lingkungan (Prerequisites)
- **Node.js:** Versi `v20.x` atau lebih baru (LTS disarankan)
- **Database:** PostgreSQL `v14+` atau SQLite3
- **Package Manager:** `npm` versi `9+`

### 8.2 Konfigurasi Environment Variable (`.env`)

#### 1. Backend Server (`erp-almubarok-api/.env`)
```env
PORT=3001
DATABASE_URL="postgresql://postgres:password_db@localhost:5432/erp_almubarok"
JWT_SECRET="ganti_dengan_kunci_rahasia_jwt_sangat_panjang_dan_aman_12345"
CORS_ORIGIN="http://localhost:3000,http://localhost:8081"
```

#### 2. Frontend Next.js (`erp-almubarok-nextjs/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
JWT_SECRET="ganti_dengan_kunci_rahasia_jwt_sangat_panjang_dan_aman_12345"
```

---

### 8.3 Langkah Menjalankan di Mode Development

Buka dua terminal terpisah:

#### Terminal 1 — Backend Hono API (Port 3001):
```bash
cd erp-almubarok-api
npm install
# Sinkronisasi skema ke database PostgreSQL
npm run db:push
# Jalankan server API dengan live reload
npm run dev
```

#### Terminal 2 — Frontend Next.js (Port 3000):
```bash
cd erp-almubarok-nextjs
npm install
# Jalankan frontend web dev server
npm run dev
```
Akses aplikasi melalui peramban: `http://localhost:3000`

---

### 8.4 Build & Production Deployment

#### 1. Build Backend API:
```bash
cd erp-almubarok-api
npm run build
npm run start
```
*(Direkomendasikan dijalankan dengan process manager seperti **PM2**: `pm2 start dist/index.js --name "erp-api"`)*

#### 2. Build Frontend Next.js:
```bash
cd erp-almubarok-nextjs
npm run build
npm run start
```
*(Direkomendasikan dijalankan via PM2: `pm2 start npm --name "erp-web" -- start`)*

#### 3. Reverse Proxy Nginx (Opsional di Server Produksi):
```nginx
server {
    listen 80;
    server_name erp.almubarok.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 9. Standar & Konvensi Pengembangan

1. **TypeScript First:** Semua komponen UI, API handler, dan query database wajib memiliki deklarasi *type* yang ketat tanpa mengabaikan tipe data (`no implicit any`).
2. **Kueri Database Terisolasi:** Kueri database transaksi POS, inventory, dan mutasi saldo wajib berada dalam `db.transaction()` untuk menjamin integritas data (ACID).
3. **Format Uang & Tanggal:**
   - Gunakan utility `formatRupiah(number)` dari `src/lib/utils.ts` untuk menampilkan format nominal mata uang `Rp 1.250.000`.
   - Gunakan `date-fns` atau fungsi utilitas lokal untuk format tanggal standar bahasa Indonesia (`dd MMMM yyyy`).
4. **Respon API Seragam:** Setiap endpoint API mengembalikan payload JSON dengan format standar:
   ```json
   {
     "success": true,
     "data": [],
     "message": "Operasi berhasil"
   }
   ```
   Atau jika terjadi error:
   ```json
   {
     "success": false,
     "error": "Pesan deskripsi kesalahan"
   }
   ```

---
*Dokumentasi ini dikelola secara berkala mengikuti pembaruan fitur sistem ERP Al Mubarok.*
