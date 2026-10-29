# IMPLEMENTATION PLAN — MODUL MANAJEMEN SHIFT KASIR
## ERP AL MUBAROK — STRICT ANTIGRAVITY SPEC

## 1. TUJUAN

Implementasikan Modul **Manajemen Shift Kasir** ke dalam ERP Al Mubarok yang sudah berjalan.

Modul harus:
- Terintegrasi dengan POS.
- Terintegrasi dengan Manajemen Kas jika sudah tersedia.
- Menggunakan `users`, `jabatan`, `cabang`, dan `penjualan` existing.
- Mengikuti RBAC existing.
- Mengikuti standar API existing.
- Menggunakan transaksi database ACID.
- Tidak merusak modul existing.

Dokumentasi ERP saat ini sudah memiliki modul POS, HRD, cabang, stok, pembelian, distribusi, akuntansi, dan RBAC.

---

# 2. ATURAN WAJIB ANTIGRAVITY

### JANGAN langsung coding.

Sebelum melakukan perubahan:

1. Baca dokumentasi ERP.
2. Audit source code frontend.
3. Audit source code backend.
4. Audit `schema.ts`.
5. Audit tabel POS.
6. Audit tabel `users`, `jabatan`, dan `cabang`.
7. Audit API penjualan.
8. Audit RBAC.
9. Audit apakah modul Manajemen Kas sudah dibuat.
10. Cari apakah sudah ada fungsi/tabel yang memiliki tujuan sama.

### DILARANG

- Membuat tabel duplikat.
- Membuat API duplikat.
- Membuat sistem saldo kas baru jika modul Manajemen Kas sudah tersedia.
- Mengubah struktur POS secara besar-besaran.
- Mengubah mekanisme autentikasi.
- Mengubah RBAC existing.
- Menghapus data existing.
- Menghapus endpoint existing.
- Mengubah behavior transaksi POS yang sudah berjalan tanpa alasan teknis yang jelas.
- Melakukan migration destruktif.
- Menggunakan mock data pada production code.

Jika terdapat konflik dengan implementasi existing, **berhenti dan jelaskan konflik terlebih dahulu** sebelum melakukan perubahan besar.

---

# 3. ANALISIS EXISTING SYSTEM

Buat checklist audit berikut sebelum implementasi:

```text
[ ] users
[ ] jabatan
[ ] cabang
[ ] penjualan
[ ] penjualan_detail
[ ] stok_barang
[ ] rekening kas
[ ] transaksi kas
[ ] RBAC
[ ] audit log
[ ] API POS
[ ] frontend POS
[ ] database transaction
```

Output analisis internal harus menentukan:

- Tabel yang dapat direuse.
- Tabel baru yang benar-benar diperlukan.
- API existing yang perlu diperluas.
- API baru yang diperlukan.
- Komponen frontend yang dapat direuse.
- Integrasi yang diperlukan.

**Jangan membuat tabel baru apabila struktur existing masih dapat digunakan.**

---

# 4. ARSITEKTUR MODUL

Gunakan arsitektur existing:

```text
Next.js
   ↓
Hono REST API
   ↓
Service / Business Logic
   ↓
Drizzle ORM
   ↓
PostgreSQL
```

Ikuti struktur project existing dan jangan membuat arsitektur baru.

---

# 5. DATABASE DESIGN

Jika hasil audit menunjukkan belum tersedia tabel shift, buat:

## `shift_kasir`

Minimal:

```text
id
id_cabang
id_user
id_shift
tanggal
waktu_buka
waktu_tutup
saldo_awal
total_sistem
uang_fisik
selisih
status
catatan
verified_by
verified_at
created_at
updated_at
```

Status:

```text
OPEN
CLOSING
VERIFIED
DISCREPANCY
```

Jika master shift belum tersedia, buat:

## `master_shift`

```text
id
nama_shift
jam_mulai
jam_selesai
toleransi_menit
is_active
created_at
updated_at
```

### Constraint penting

Implementasikan constraint agar:

- Satu kasir tidak memiliki dua shift aktif.
- Satu cash drawer tidak memiliki dua shift aktif.
- Shift verified tidak dapat diubah.
- `id_cabang` harus valid.
- Semua foreign key menggunakan relasi existing.

Gunakan index pada field yang sering digunakan untuk pencarian:

```text
id_cabang
id_user
tanggal
status
```

---

# 6. INTEGRASI POS — WAJIB

Setiap transaksi POS harus dapat diketahui berasal dari shift mana.

Jika tabel `penjualan` belum memiliki `shift_id`:

Tambahkan:

```text
penjualan.shift_id
```

Jangan membuat tabel transaksi POS baru.

Saat checkout:

```text
Kasir Login
    ↓
Cari Shift Aktif
    ↓
Validasi Shift
    ↓
Checkout POS
    ↓
Simpan shift_id
    ↓
Commit Transaction
```

Jika tidak ada shift aktif:

**Tolak transaksi POS dan tampilkan pesan:**

> Kasir belum membuka shift. Silakan buka shift terlebih dahulu.

---

# 7. OPEN SHIFT

Endpoint:

```text
POST /api/shift-kasir/buka
```

Validasi:

```text
1. User sudah login.
2. User memiliki role kasir.
3. Cabang berasal dari session.
4. Tidak ada shift aktif.
5. Cash drawer tidak sedang digunakan.
6. Saldo awal valid.
```

Jika berhasil:

```text
status = OPEN
waktu_buka = server time
id_user = session user
id_cabang = session cabang
```

**Jangan menerima `id_user` dan `id_cabang` dari client sebagai sumber kebenaran.**

Gunakan data dari session/JWT.

---

# 8. TRANSAKSI SELAMA SHIFT

Setiap checkout POS harus:

```text
BEGIN TRANSACTION

Validasi shift aktif
↓
Lock transaksi/counter
↓
Simpan penjualan
↓
Simpan detail penjualan
↓
Update stok
↓
Update HPP
↓
Hubungkan shift_id
↓
Commit
```

Gunakan mekanisme atomic transaction existing pada POS. Dokumentasi existing memang mensyaratkan transaksi POS menggunakan locking untuk mencegah konflik checkout.

---

# 9. SHIFT SUMMARY

Sistem harus menghitung otomatis:

```text
Total Transaksi
Total Penjualan
Total Tunai
Total Non-Tunai
Total Diskon
Total Voucher
Total Refund
Total Void
```

Jika metode pembayaran sudah tersedia di tabel POS, **gunakan data existing**.

Jangan membuat tabel payment baru hanya untuk kebutuhan shift.

---

# 10. CLOSING SHIFT

Endpoint:

```text
POST /api/shift-kasir/:id/closing
```

Kasir memasukkan:

```text
uang_fisik
catatan
```

Sistem menghitung:

```text
Selisih = Uang Fisik - Saldo Kas Sistem
```

Kemudian:

```text
Jika selisih = 0
→ VERIFIED / menunggu verifikasi sesuai konfigurasi

Jika selisih != 0
→ DISCREPANCY
→ wajib alasan
→ wajib verifikasi supervisor
```

---

# 11. VERIFIKASI SUPERVISOR

Endpoint:

```text
POST /api/shift-kasir/:id/verify
```

Hanya role yang memiliki permission dapat melakukan verifikasi.

Saat verified:

```text
verified_by = current_user
verified_at = server_time
status = VERIFIED
```

Setelah VERIFIED:

**DILARANG EDIT.**

Jika terjadi kesalahan:

```text
REVERSAL / ADJUSTMENT
```

bukan edit data historis.

---

# 12. API

Gunakan pola API existing.

Endpoint minimal:

```text
GET    /api/shift-kasir
GET    /api/shift-kasir/:id

POST   /api/shift-kasir/buka
POST   /api/shift-kasir/:id/closing
POST   /api/shift-kasir/:id/verify

GET    /api/shift-kasir/:id/summary
GET    /api/shift-kasir/laporan

GET    /api/shift-kasir/master
POST   /api/shift-kasir/master
PUT    /api/shift-kasir/master/:id
```

Sebelum membuat endpoint, periksa apakah endpoint dengan fungsi sama sudah tersedia.

Gunakan format response existing:

```json
{
  "success": true,
  "data": {},
  "message": "Operasi berhasil"
}
```

---

# 13. FRONTEND

Tambahkan modul:

```text
penjualan/
└── shift-kasir/
    ├── dashboard/
    ├── jadwal/
    ├── buka/
    ├── closing/
    ├── riwayat/
    └── detail/
```

### Dashboard

Tampilkan:

```text
Shift Aktif
Nama Kasir
Cabang
Waktu Buka
Saldo Awal
Total Transaksi
Total Penjualan
Total Tunai
Total Non-Tunai
Estimasi Saldo
Status
```

### Kasir

Berikan tombol utama:

```text
BUKA SHIFT
CLOSING SHIFT
```

Jika shift sudah aktif:

```text
Tampilkan SHIFT AKTIF
```

Jangan tampilkan tombol BUKA SHIFT lagi.

---

# 14. RBAC

Gunakan RBAC existing yang sudah menggunakan permission CRUD berdasarkan jabatan.

Tambahkan permission:

```text
shift-kasir.read
shift-kasir.create
shift-kasir.update
shift-kasir.verify
shift-kasir.report
```

Jika struktur permission existing hanya mendukung CRUD:

Map:

```text
READ     → melihat
CREATE   → buka shift
UPDATE   → closing
VERIFY   → gunakan permission khusus jika sistem mendukung
```

**Jangan membuat sistem permission kedua.**

---

# 15. AUDIT TRAIL

Catat minimal:

```text
OPEN SHIFT
CLOSING SHIFT
VERIFY SHIFT
REJECT SHIFT
ADJUSTMENT
REVERSAL
```

Simpan:

```text
user
cabang
timestamp
action
record_id
old_value
new_value
reason
```

Jika audit log existing tersedia, gunakan tabel tersebut.

---

# 16. LAPORAN

Filter:

```text
Tanggal
Cabang
Kasir
Shift
Status
```

Laporan:

```text
1. Rekap Shift
2. Penjualan per Shift
3. Kas Tunai per Shift
4. Selisih Kas
5. Shift Belum Closing
6. Shift Discrepancy
7. Riwayat Verifikasi
```

Gunakan library export existing untuk Excel.

---

# 17. TESTING WAJIB

Sebelum menyatakan selesai, lakukan test:

### Open Shift

```text
[ ] Kasir dapat membuka shift
[ ] Kasir kedua tidak dapat membuka drawer yang sama
[ ] Kasir tidak dapat membuka shift kedua
[ ] Saldo awal tersimpan
```

### POS

```text
[ ] POS menolak transaksi tanpa shift
[ ] POS menyimpan shift_id
[ ] Transaksi tetap atomic
[ ] Stok tetap benar
[ ] HPP tetap benar
```

### Closing

```text
[ ] Closing berhasil
[ ] Sistem menghitung selisih
[ ] Selisih wajib diberi alasan
[ ] Supervisor dapat verify
[ ] Shift verified tidak dapat diedit
```

### Multi-Cabang

```text
[ ] Kasir Cabang A tidak dapat melihat shift Cabang B
[ ] Supervisor sesuai permission dapat melihat cabang yang diizinkan
[ ] Data laporan terfilter berdasarkan cabang
```

### Security

```text
[ ] Tidak dapat manipulasi id_user melalui request
[ ] Tidak dapat manipulasi id_cabang melalui request
[ ] Tidak dapat bypass permission
[ ] Tidak dapat melakukan double closing
[ ] Tidak dapat melakukan hard delete transaksi
```

---

# 18. MIGRATION SAFETY

Migration harus:

- Non-destructive.
- Tidak menghapus data existing.
- Tidak mengubah data POS existing secara sembarangan.
- Memiliki default/null strategy untuk `shift_id` pada transaksi lama.

Transaksi POS lama **tidak boleh rusak** setelah migration.

---

# 19. DEFINITION OF DONE

Modul hanya boleh dinyatakan **SELESAI** jika:

```text
[✓] Database migration berhasil
[✓] API berhasil
[✓] Frontend berhasil
[✓] POS terintegrasi
[✓] RBAC terintegrasi
[✓] Audit trail aktif
[✓] Multi-cabang aman
[✓] Closing berjalan
[✓] Selisih kas berjalan
[✓] Approval berjalan
[✓] Laporan berjalan
[✓] Existing POS tetap berjalan
[✓] Tidak ada duplicate feature
[✓] Tidak ada error TypeScript
[✓] Tidak ada error build
[✓] Tidak ada migration destructive
```

---

# 20. OUTPUT YANG WAJIB DIBERIKAN ANTIGRAVITY

Setelah implementasi selesai, tampilkan ringkasan:

```text
1. File yang dibuat
2. File yang diubah
3. Database migration
4. API baru
5. API yang diubah
6. Integrasi POS
7. Integrasi RBAC
8. Integrasi Audit Trail
9. Test yang dilakukan
10. Error yang ditemukan
11. Error yang belum terselesaikan
12. Potensi risiko/regression
```

**Jangan mengatakan "selesai" jika salah satu acceptance criteria belum terpenuhi.**