# 🚀 ERP Al Mubarok (Next.js 16 Frontend)

Sistem Enterprise Resource Planning modern berbasis **Next.js 16 (App Router)**, **React 19**, **TailwindCSS v4**, **TypeScript**, dan terintegrasi dengan **Hono RESTful API Backend**.

---

## 📚 Dokumentasi Lengkap
Dokumentasi teknis, skema database, ERD, arsitektur, dan rincian modul dapat dibaca pada file:
- **[DOKUMENTASI_ERP_ALMUBAROK.md](../DOKUMENTASI_ERP_ALMUBAROK.md)**
- **[Dokumentasi Teknis — ERP Almubarok.md](./Dokumentasi%20Teknis%20%E2%80%94%20ERP%20Almubarok.md)**

---

## ⚡ Quick Start

### 1. Jalankan Backend API
Pastikan backend Hono API di folder `../erp-almubarok-api` telah berjalan pada port `3001`:
```bash
cd ../erp-almubarok-api
npm install
npm run dev
```

### 2. Jalankan Frontend Next.js
```bash
cd erp-almubarok-nextjs
npm install
npm run dev
```
Akses aplikasi melalui browser di **`http://localhost:3000`**.

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
