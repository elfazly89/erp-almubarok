# IMPLEMENTATION PLAN — MODUL MANAJEMEN KAS
## ERP Al Mubarok

### 1. Tujuan
Membangun modul Manajemen Kas untuk mengontrol seluruh kas masuk, kas keluar, saldo kas cabang, setoran kasir, penarikan kas, dan rekonsiliasi kas secara terintegrasi dengan POS dan Akuntansi.

### 2. Integrasi Sistem
- POS → penerimaan kas dari transaksi penjualan.
- HRD → pembayaran bisyaroh/pengeluaran terkait karyawan bila diperlukan.
- Pembelian → pembayaran supplier.
- Akuntansi → otomatis membuat jurnal double-entry.
- Cabang → setiap kas terpisah berdasarkan `id_cabang`.
- RBAC → akses berdasarkan jabatan.

### 3. Fitur Utama

#### A. Kas & Rekening
- Master rekening kas/bank.
- Jenis: Kas Toko, Kas DC, Bank, Petty Cash.
- Saldo awal.
- Saldo berjalan realtime.
- Status aktif/nonaktif.

#### B. Kas Masuk
- Input penerimaan kas manual.
- Sumber: penjualan POS, setoran, transfer antar rekening, pendapatan lain.
- Nomor transaksi otomatis.
- Lampiran bukti.
- Approval jika diperlukan.

#### C. Kas Keluar
- Input pengeluaran kas.
- Kategori pengeluaran.
- Nominal, tanggal, penerima, keterangan.
- Upload bukti.
- Approval berdasarkan nominal.
- Otomatis masuk jurnal akuntansi.

#### D. Closing Kasir
- Buka shift kasir.
- Saldo awal drawer.
- Total penjualan per metode pembayaran.
- Uang fisik hasil closing.
- Selisih kas.
- Setoran ke kas cabang.
- Status: OPEN → CLOSING → VERIFIED.

#### E. Rekonsiliasi Kas
- Bandingkan saldo sistem dengan saldo fisik/bank.
- Catat selisih.
- Alasan selisih wajib diisi.
- Approval koreksi.
- Riwayat rekonsiliasi.

#### F. Transfer Kas
- Transfer kas antar rekening/cabang.
- Status: DRAFT → APPROVED → SENT → RECEIVED.
- Saldo pengirim berkurang dan penerima bertambah setelah transaksi dikonfirmasi.

### 4. Database

Tambahkan tabel:

**`rekening_kas`**
- id
- kode
- nama
- jenis
- id_cabang
- saldo_awal
- saldo
- is_active
- created_at
- updated_at

**`kas_transaksi`**
- id
- nomor_transaksi
- id_rekening
- id_cabang
- tipe (`MASUK`, `KELUAR`, `TRANSFER`)
- kategori
- nominal
- tanggal
- keterangan
- referensi_type
- referensi_id
- bukti
- status
- created_by
- approved_by
- created_at

**`kasir_shift`**
- id
- id_cabang
- id_kasir
- waktu_buka
- waktu_tutup
- saldo_awal
- total_sistem
- uang_fisik
- selisih
- status
- verified_by

**`rekonsiliasi_kas`**
- id
- id_rekening
- tanggal
- saldo_sistem
- saldo_fisik
- selisih
- alasan
- bukti
- status
- approved_by

### 5. API

Tambahkan route:

`/api/kas`

- `GET /api/kas/rekening`
- `POST /api/kas/rekening`
- `PUT /api/kas/rekening/:id`
- `GET /api/kas/transaksi`
- `POST /api/kas/transaksi/masuk`
- `POST /api/kas/transaksi/keluar`
- `POST /api/kas/transfer`
- `GET /api/kas/saldo`
- `POST /api/kas/shift/buka`
- `POST /api/kas/shift/closing`
- `GET /api/kas/shift`
- `POST /api/kas/rekonsiliasi`
- `GET /api/kas/laporan`

Semua mutasi wajib menggunakan database transaction/ACID.

### 6. UI Frontend

Tambahkan:

```text
(kas)/dashboard
(kas)/rekening
(kas)/transaksi
(kas)/kasir
(kas)/transfer
(kas)/rekonsiliasi
(kas)/laporan
```

Dashboard menampilkan:
- Saldo kas seluruh cabang.
- Saldo per cabang.
- Kas masuk hari ini.
- Kas keluar hari ini.
- Selisih kas.
- Kasir yang belum closing.
- Rekonsiliasi pending.

### 7. Aturan Bisnis

1. User hanya dapat melihat kas sesuai hak akses/cabang.
2. Kasir tidak boleh mengubah transaksi POS yang sudah closing.
3. Kas keluar nominal tertentu wajib approval supervisor/bendahara.
4. Setiap koreksi saldo wajib memiliki alasan dan audit trail.
5. Transfer antar rekening tidak boleh langsung mengubah saldo penerima sebelum dikonfirmasi.
6. Semua transaksi kas memiliki nomor unik.
7. Transaksi yang sudah approved tidak boleh dihapus; gunakan reversal/koreksi.
8. Semua transaksi kas yang berasal dari POS/pembelian harus memiliki referensi transaksi.
9. Setiap perubahan penting dicatat dalam audit log.
10. Saldo kas tidak boleh menjadi negatif kecuali rekening tersebut dikonfigurasi mengizinkan overdraft.

### 8. Integrasi Akuntansi

Kas Masuk:
`Debit Kas/Bank → Kredit Pendapatan/Akun terkait`

Kas Keluar:
`Debit Beban/Akun terkait → Kredit Kas/Bank`

Penjualan POS:
`Debit Kas/Bank/Piutang → Kredit Penjualan`

Transfer:
`Debit Rekening Tujuan → Kredit Rekening Asal`

Gunakan mekanisme jurnal yang sudah ada pada modul Akuntansi dan pastikan Debet = Kredit.

### 9. Laporan

- Laporan kas harian.
- Buku kas per rekening.
- Kas masuk/keluar.
- Rekap kas per cabang.
- Laporan closing kasir.
- Laporan selisih kas.
- Rekonsiliasi kas.
- Mutasi antar rekening.
- Export Excel/PDF.

### 10. Keamanan & Audit

- RBAC mengikuti `role_menu`.
- Approval berbasis jabatan/nominal.
- Audit log untuk create/update/approve/reversal.
- Tidak boleh hard delete transaksi keuangan.
- Validasi ownership `id_cabang`.
- Semua perubahan saldo dilakukan melalui service transaksi terpusat.

### 11. Acceptance Criteria

Modul dianggap selesai jika:
- Saldo kas realtime dan akurat.
- Closing kasir dapat dilakukan per shift.
- Selisih kas tercatat dan dapat di-approval.
- Kas masuk/keluar otomatis memengaruhi saldo.
- Transfer antar rekening tercatat dengan benar.
- Transaksi terhubung dengan jurnal akuntansi.
- Hak akses antar cabang berjalan.
- Semua transaksi memiliki audit trail.
- Laporan dapat difilter berdasarkan tanggal, cabang, rekening, dan jenis transaksi.
- Tidak ada perubahan saldo yang dapat dilakukan tanpa jejak transaksi.

### 12. Prioritas Implementasi

**P1:** Rekening Kas → Kas Masuk/Keluar → Saldo → Closing Kasir → Audit Trail.

**P2:** Transfer Antar Rekening → Rekonsiliasi → Approval → Laporan.

**P3:** Dashboard analitik → Notifikasi → Integrasi lanjutan.

### 13. Prinsip Pengembangan
Pertahankan arsitektur ERP Al Mubarok yang sudah ada: Next.js 16 + Hono + Drizzle ORM + PostgreSQL, RBAC, API JSON standar, dan transaksi database ACID.
