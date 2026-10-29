# IMPLEMENTATION PLAN — DASHBOARD PROFIT PER CABANG
## ERP AL MUBAROK

### 1. TUJUAN
Membangun dashboard profitabilitas seluruh cabang berdasarkan data **POS dan Akuntansi ERP Al Mubarok**, tanpa membuat sistem perhitungan akuntansi baru.

Prioritas: **akurasi akuntansi, konsistensi data, dan kemudahan analisis manajemen.**

---

### 2. WAJIB AUDIT SEBELUM CODING

Antigravity wajib memeriksa implementasi existing:

- `cabang`
- `penjualan`
- `penjualan_detail`
- `jurnal_umum`
- `daftar_akun / COA`
- `tipe_akun`
- HPP
- Beban
- Laporan Laba Rugi
- General Ledger
- RBAC

**Dilarang membuat tabel, API, COA, atau perhitungan profit yang duplikat.**

Jika data existing tidak mendukung suatu indikator, **jangan membuat angka estimasi.**

---

### 3. KOMPONEN PROFIT

Gunakan kaidah:

```text
Penjualan Bersih
= Penjualan Bruto - Retur Penjualan - Diskon

Laba Kotor
= Penjualan Bersih - HPP

Laba Operasional
= Laba Kotor - Beban Operasional

Laba Sebelum Pajak
= Laba Operasional
  + Pendapatan Non-Operasional
  - Beban Non-Operasional

Laba Bersih
= Laba Sebelum Pajak - Pajak
```

Jika data pajak belum tersedia, jangan menghitung laba bersih secara asumtif.

---

### 4. KPI UTAMA

Dashboard wajib menampilkan:

- Penjualan Bruto
- Retur
- Diskon
- Penjualan Bersih
- HPP
- Laba Kotor
- Gross Profit Margin
- Beban Operasional
- Laba Operasional
- Operating Margin
- Pendapatan Non-Operasional
- Beban Non-Operasional
- Laba Sebelum Pajak
- Pajak jika tersedia
- Laba Bersih jika tersedia
- Net Profit Margin
- Jumlah Transaksi
- Average Transaction Value

Formula margin:

```text
Gross Margin = Laba Kotor / Penjualan Bersih × 100%

Operating Margin = Laba Operasional / Penjualan Bersih × 100%

Net Margin = Laba Bersih / Penjualan Bersih × 100%
```

Hindari division by zero.

---

### 5. PROFIT PER CABANG

Tampilkan tabel:

| Cabang | Penjualan Bersih | HPP | Laba Kotor | Beban Operasional | Laba Operasional | Margin |
|---|---:|---:|---:|---:|---:|---:|

Fitur:

- Ranking omzet
- Ranking laba
- Ranking margin
- Filter cabang
- Total seluruh cabang
- Perbandingan antar cabang

**Jangan menggunakan omzet sebagai satu-satunya indikator keberhasilan cabang.**

---

### 6. PERBANDINGAN PERIODE

Filter:

- Hari ini
- Minggu ini
- Bulan ini
- Tahun ini
- Custom Date Range

Bandingkan:

- Current Period
- Previous Period
- Selisih nominal
- Pertumbuhan %

```text
Growth % =
(Current - Previous) / Previous × 100%
```

Jika periode pembanding = 0, tampilkan `N/A`.

---

### 7. ANALISIS BEBAN

Gunakan klasifikasi akun dari **COA existing**.

Tampilkan:

- Beban per kelompok akun
- Beban per akun
- Beban per cabang
- Persentase beban terhadap penjualan
- Perubahan beban dibanding periode sebelumnya

```text
Beban terhadap Penjualan
= Beban Operasional / Penjualan Bersih × 100%
```

---

### 8. SUMBER DATA

Prioritas sumber:

```text
Akuntansi
↓
Jurnal Umum + COA
↓
Laporan Laba Rugi

POS
↓
Penjualan + Detail Penjualan
↓
Analisis Operasional

Cabang
↓
Segmentasi Profit
```

Untuk laporan profit resmi, gunakan **data jurnal/akuntansi existing** sebagai sumber utama apabila transaksi sudah diposting ke jurnal.

---

### 9. REKONSILIASI

Sediakan pemeriksaan:

```text
Penjualan POS
        VS
Penjualan Akuntansi
```

Jika terdapat perbedaan:

- Tampilkan nominal selisih
- Cabang
- Periode
- Status `PERLU REKONSILIASI`

Dashboard **tidak boleh menyembunyikan perbedaan data**.

---

### 10. DRILL-DOWN

Setiap angka utama harus dapat ditelusuri:

```text
Dashboard Profit
      ↓
Profit Cabang
      ↓
Laporan Laba Rugi
      ↓
Akun
      ↓
General Ledger
      ↓
Jurnal
      ↓
Transaksi
```

Tujuannya agar setiap angka dapat dipertanggungjawabkan.

---

### 11. API

Ikuti pola API ERP Al Mubarok existing.

Minimal:

```text
GET /api/akuntansi/dashboard-profit
GET /api/akuntansi/dashboard-profit/cabang
GET /api/akuntansi/dashboard-profit/trend
GET /api/akuntansi/dashboard-profit/beban
GET /api/akuntansi/dashboard-profit/reconciliation
```

Parameter:

```text
start_date
end_date
id_cabang
comparison_period
```

Gunakan **SQL aggregation**, hindari N+1 query dan jangan mengirim seluruh jurnal ke frontend.

---

### 12. FRONTEND

Tambahkan dashboard pada modul Akuntansi dengan komponen:

```text
Profit Summary
Branch Profit Table
Profit Trend
Margin Analysis
Expense Breakdown
Reconciliation Alert
```

Dashboard harus responsive dan mengikuti design system ERP existing.

---

### 13. RBAC

Gunakan RBAC existing.

Minimal permission:

```text
dashboard-profit.read
dashboard-profit.detail
dashboard-profit.export
```

User hanya boleh melihat cabang sesuai hak aksesnya.

**Jangan mempercayai `id_cabang` dari frontend tanpa validasi server.**

---

### 14. EXPORT

Sediakan:

- Excel
- PDF

Export mengikuti filter:

```text
Periode
Cabang
Comparison Period
```

---

### 15. TESTING

```text
[ ] Penjualan Bersih benar
[ ] HPP benar
[ ] Laba Kotor benar
[ ] Beban benar
[ ] Laba Operasional benar
[ ] Margin benar
[ ] Total cabang benar
[ ] Filter periode benar
[ ] Filter cabang benar
[ ] POS vs Akuntansi dapat direkonsiliasi
[ ] Drill-down berjalan
[ ] RBAC berjalan
[ ] Export berjalan
[ ] Laporan Laba Rugi existing tidak berubah
[ ] Tidak ada data existing yang rusak
```

---

### 16. ACCEPTANCE CRITERIA

Modul dinyatakan selesai jika:

1. Profit setiap cabang dapat ditampilkan.
2. Perhitungan mengikuti struktur akuntansi existing.
3. Penjualan, HPP, laba, dan beban dapat ditelusuri.
4. Gross Margin dan Operating Margin tersedia.
5. Perbandingan cabang dan periode tersedia.
6. Rekonsiliasi POS dan Akuntansi tersedia.
7. Drill-down sampai jurnal/transaksi tersedia.
8. RBAC berjalan.
9. Export berjalan.
10. Tidak membuat sistem akuntansi paralel.
11. Modul existing tetap berjalan normal.

---

### 17. ATURAN ANTIGRAVITY

**Jangan langsung coding.**

Lakukan:

```text
AUDIT EXISTING
→ TENTUKAN REUSE
→ TENTUKAN GAP
→ IMPLEMENTASI MINIMAL
→ INTEGRASI
→ TESTING
→ VALIDASI AKUNTANSI
```

Setelah selesai, laporkan:

- File dibuat/diubah
- Database migration
- API
- Query utama
- Sumber data setiap KPI
- Integrasi POS
- Integrasi Akuntansi
- Integrasi RBAC
- Hasil testing
- Risiko/regression

**Jika terdapat kekurangan struktur data, laporkan terlebih dahulu. Jangan membuat angka atau logika akuntansi berdasarkan asumsi.**