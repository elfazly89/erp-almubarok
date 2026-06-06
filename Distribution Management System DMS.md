# 📦 Distribution Management System (DMS) & Smart Replenishment

## ERP Almubarok

> Versi: 1.0
> Tujuan: Menambahkan sistem distribusi pintar dari DC (Distribution Center) ke cabang berdasarkan forecasting penjualan dan kondisi stok cabang.

---

# 1. Tujuan Pengembangan

Saat ini modul mutasi pada ERP Almubarok masih menggunakan model:

```text
Cabang Request Barang
        ↓
DC Proses Request
        ↓
Kirim Barang
```

Model ini bersifat reaktif.

Sistem baru harus mengubah pola menjadi:

```text
Penjualan Cabang
        ↓
Forecast Penjualan
        ↓
Analisa Stok
        ↓
Rekomendasi Pengiriman
        ↓
DC Approval
        ↓
Pengiriman
```

DC menjadi pihak yang proaktif menjaga ketersediaan stok seluruh cabang.

---

# 2. Konsep Sistem

Sistem harus mampu:

1. Melihat stok seluruh cabang secara realtime.
2. Menghitung kecepatan penjualan setiap barang per cabang.
3. Menghitung estimasi stok habis.
4. Membuat rekomendasi jumlah kirim otomatis.
5. Membuat draft pengiriman otomatis.
6. Memberikan prioritas cabang yang harus dilayani terlebih dahulu.
7. Memberikan rekomendasi transfer antar cabang jika terjadi overstock dan understock.

---

# 3. Dashboard Distribution Center (DC)

Buat menu baru:

```text
Distribusi
├── Dashboard Distribusi
├── Forecast Stok
├── Rekomendasi Pengiriman
├── Transfer Antar Cabang
├── Pengiriman DC
└── Monitoring Distribusi
```

---

# 4. Dashboard Distribusi

## Widget 1 - Barang Kritis

Menampilkan:

| Cabang | Barang | Stok Saat Ini | ADS | Estimasi Habis |
| ------ | ------ | ------------- | --- | -------------- |

Urutkan berdasarkan estimasi habis tercepat.

---

## Widget 2 - Cabang Kritis

Menampilkan:

| Cabang | Jumlah Barang Kritis |
| ------ | -------------------- |

Urutkan dari terbesar.

---

## Widget 3 - Top Fast Moving

Menampilkan:

| Barang | Rata-rata Jual Harian |
| ------ | --------------------- |

Per cabang.

---

## Widget 4 - Prioritas Distribusi

Menampilkan ranking cabang yang harus segera dikirim.

---

# 5. Penambahan Tabel Database

## Tabel stok_setting_cabang

Menyimpan parameter distribusi per barang per cabang.

```sql
id
id_barang
id_cabang

minimum_stock
safety_stock

target_days_stock

lead_time_days

created_at
updated_at
```

Keterangan:

minimum_stock
= stok minimal yang boleh tersedia

safety_stock
= stok pengaman

target_days_stock
= target cakupan stok

lead_time_days
= waktu rata-rata pengiriman

---

## Tabel sales_velocity

Menyimpan hasil kalkulasi penjualan.

```sql
id

id_barang
id_cabang

ads_7
ads_30
ads_90

last_calculated

created_at
updated_at
```

Keterangan:

ADS = Average Daily Sales

---

## Tabel forecast_stok

Menyimpan hasil forecasting.

```sql
id

id_barang
id_cabang

stok_sekarang

ads

estimasi_habis_hari

tanggal_habis

status

created_at
```

Status:

```text
AMAN
PERHATIAN
KRITIS
```

---

## Tabel rekomendasi_pengiriman

Header rekomendasi.

```sql
id

tanggal_rekomendasi

status

created_at
```

Status:

```text
DRAFT
APPROVED
REJECTED
GENERATED_TO_SHIPMENT
```

---

## Tabel rekomendasi_pengiriman_detail

```sql
id

id_rekomendasi

id_barang

id_cabang_tujuan

stok_sekarang

ads

qty_rekomendasi

target_stock

prioritas_score
```

---

# 6. Perhitungan Sales Velocity

Menggunakan data:

penjualan
penjualan_detail

Perhitungan dilakukan setiap malam.

---

## ADS 7 Hari

```text
Total Penjualan 7 Hari Terakhir
÷
7
```

---

## ADS 30 Hari

```text
Total Penjualan 30 Hari Terakhir
÷
30
```

---

## ADS 90 Hari

```text
Total Penjualan 90 Hari Terakhir
÷
90
```

---

Prioritaskan ADS 30 sebagai default.

---

# 7. Perhitungan Forecast

## Stock Cover

```text
Stock Cover
=
Stok Saat Ini
÷
ADS
```

Contoh:

```text
Stok = 60

ADS = 20

Stock Cover = 3 Hari
```

---

## Penentuan Status

### KRITIS

```text
Stock Cover <= Lead Time
```

### PERHATIAN

```text
Stock Cover <= Safety Stock
```

### AMAN

Selain kondisi di atas.

---

# 8. Logika Smart Replenishment

Tujuan:

Menghitung jumlah kirim otomatis.

Formula:

```text
Target Stock
=
ADS
×
Target Days Stock
```

---

Contoh:

```text
ADS = 20

Target Days = 14

Target Stock = 280
```

---

Qty Kirim:

```text
Qty Kirim
=
Target Stock
-
Stok Saat Ini
```

---

Contoh:

```text
280
-
50

=
230 pcs
```

Munculkan ke rekomendasi pengiriman.

---

# 9. Prioritas Distribusi

Hitung skor prioritas.

Formula:

```text
Prioritas =
(
40% × Faktor Estimasi Habis
)
+
(
30% × Faktor Omset
)
+
(
20% × Faktor ADS
)
+
(
10% × Faktor Jarak
)
```

Hasil:

0 - 100

Semakin tinggi semakin prioritas.

---

# 10. Transfer Antar Cabang

Buat engine distribusi tambahan.

Kasus:

Cabang A:

```text
Stok = 500

ADS = 5
```

Overstock.

---

Cabang B:

```text
Stok = 20

ADS = 30
```

Understock.

---

Sistem otomatis membuat rekomendasi:

```text
Transfer Aqua 200 pcs
Dari Cabang A
Ke Cabang B
```

Sebelum membuat rekomendasi pembelian atau pengiriman dari DC.

---

# 11. Generate Draft Pengiriman

Admin DC dapat menekan tombol:

```text
Generate Pengiriman
```

Sistem otomatis:

1. Membuat record pengiriman.
2. Mengisi detail pengiriman.
3. Mengambil qty dari rekomendasi.
4. Mengubah status rekomendasi menjadi GENERATED_TO_SHIPMENT.

---

# 12. Workflow Distribusi

```text
Penjualan Cabang
        ↓
Update ADS
        ↓
Hitung Forecast
        ↓
Hitung Prioritas
        ↓
Generate Rekomendasi
        ↓
Approval DC
        ↓
Generate Pengiriman
        ↓
Picking
        ↓
Packing
        ↓
Dikirim
        ↓
Diterima Cabang
```

---

# 13. Integrasi Dengan Struktur ERP Almubarok Saat Ini

Gunakan tabel existing:

```text
barang
stok_barang
penjualan
penjualan_detail
cabang
pengiriman
pengiriman_detail
```

Tidak perlu mengubah struktur existing.

Cukup menambah tabel:

```text
stok_setting_cabang
sales_velocity
forecast_stok
rekomendasi_pengiriman
rekomendasi_pengiriman_detail
```

Sehingga seluruh fitur lama tetap berjalan tanpa perubahan besar.

---

# 14. Tujuan Akhir Sistem

1. Mengurangi stok kosong.
2. Mengurangi overstock.
3. Meningkatkan service level cabang.
4. Mengurangi ketergantungan request manual.
5. Membuat distribusi berbasis data penjualan.
6. Membantu DC mengambil keputusan lebih cepat.
7. Menjadikan ERP Almubarok memiliki sistem distribusi setara minimarket modern.

# 15. Pengelolaan Selisih Pengiriman Barang

## Latar Belakang

Dalam proses pengiriman barang dari Gudang Pusat (DC) ke cabang atau transfer antar cabang, sering terjadi kondisi:

* Barang kurang saat diterima.
* Barang lebih saat diterima.
* Barang rusak saat perjalanan.
* Barang tertukar.
* Kesalahan perhitungan saat pengambilan barang.
* Kesalahan perhitungan saat penerimaan barang.

Karena itu sistem harus memiliki proses pengecekan dan investigasi selisih yang jelas.

---

# 16. Perubahan Alur Pengiriman Barang

Alur lama:

```text
Rekomendasi Kirim
↓
Pengiriman
↓
Penerimaan
↓
Selesai
```

Alur baru:

```text
Rekomendasi Kirim
↓
Persiapan Pengambilan Barang
↓
Pengecekan Gudang
↓
Pengiriman
↓
Penerimaan Sementara
↓
Pengecekan Cabang
↓
Sesuai / Ada Selisih
↓
Selesai
```

---

# 17. Status Pengiriman

Tambahkan status berikut pada pengiriman barang.

| Status             | Keterangan                             |
| ------------------ | -------------------------------------- |
| Draft              | Pengiriman baru dibuat                 |
| Pengambilan Barang | Petugas gudang sedang mengambil barang |
| Pengepakan         | Barang sedang dikemas                  |
| Sudah Dicek Gudang | Barang sudah diverifikasi supervisor   |
| Dalam Perjalanan   | Barang sudah keluar gudang             |
| Diterima Sementara | Barang sudah sampai cabang             |
| Sedang Dicek       | Cabang sedang menghitung barang        |
| Diterima Lengkap   | Barang sesuai                          |
| Ada Selisih        | Ada perbedaan jumlah                   |
| Selesai            | Proses sudah selesai                   |

---

# 18. Penerimaan Barang Di Cabang

Saat barang sampai:

Status otomatis berubah menjadi:

```text
Dalam Perjalanan
↓
Diterima Sementara
```

Pada tahap ini:

* Stok cabang belum bertambah.
* Barang belum masuk persediaan.
* Menunggu proses pengecekan.

---

# 19. Pengecekan Barang Cabang

Petugas cabang wajib:

1. Menghitung ulang seluruh barang.
2. Membandingkan dengan surat jalan.
3. Memastikan kondisi barang baik.
4. Melaporkan jika ada selisih.

---

Jika sesuai:

```text
Sedang Dicek
↓
Diterima Lengkap
```

Sistem:

* Menambah stok cabang.
* Mengurangi stok gudang pusat.
* Menutup transaksi pengiriman.

---

# 20. Jika Ada Selisih

Jika ditemukan selisih:

```text
Sedang Dicek
↓
Ada Selisih
```

Sistem meminta pengguna memilih:

### Barang Kurang

Contoh:

Dikirim 100

Diterima 95

Selisih 5

---

### Barang Lebih

Contoh:

Dikirim 100

Diterima 105

Selisih 5

---

### Barang Rusak

Contoh:

Dikirim 50

Baik 48

Rusak 2

---

### Barang Tidak Sesuai

Contoh:

Seharusnya Aqua

Yang diterima Le Minerale

---

# 21. Bukti Selisih

Untuk setiap selisih wajib menyimpan:

* Foto barang.
* Foto surat jalan.
* Catatan penerima.
* Nama petugas penerima.
* Tanggal dan jam pemeriksaan.

---

# 22. Tabel Selisih Pengiriman

Tambahkan tabel baru:

pengiriman_selisih

Field:

```text
id

id_pengiriman

id_barang

jumlah_dikirim

jumlah_diterima

selisih

jenis_selisih

alasan

foto_bukti

status

dibuat_oleh

disetujui_oleh

created_at
updated_at
```

---

Jenis Selisih:

```text
KURANG
LEBIH
RUSAK
SALAH_BARANG
```

---

Status:

```text
MENUNGGU_PEMERIKSAAN
DISETUJUI
DITOLAK
SELESAI
```

---

# 23. Pemeriksaan Selisih Oleh Gudang Pusat

Supervisor gudang dapat melihat:

* Surat jalan.
* Riwayat pengiriman.
* Data barang yang dikirim.
* Foto bukti dari cabang.
* Riwayat pengecekan.

---

Supervisor dapat memilih:

### Setujui

Jika memang terjadi kesalahan.

---

### Tolak

Jika data pengiriman dianggap sudah benar.

---

# 24. Pengiriman Susulan

Jika barang memang kurang:

Contoh:

```text
Dikirim = 100
Diterima = 95
Kurang = 5
```

Sistem otomatis membuat:

```text
Kekurangan Pengiriman = 5
```

Yang akan muncul pada daftar pengiriman berikutnya.

---

# 25. Rekomendasi Transfer Antar Cabang

Selain rekomendasi kirim dari Gudang Pusat, sistem juga harus dapat mendeteksi:

### Cabang Kelebihan Stok

Contoh:

```text
Stok = 500
Penjualan = 5 per hari
```

---

### Cabang Kekurangan Stok

Contoh:

```text
Stok = 20
Penjualan = 30 per hari
```

---

Sistem memberikan rekomendasi:

```text
Pindahkan 200 pcs
Dari Cabang A
Ke Cabang B
```

Agar tidak selalu mengambil stok dari Gudang Pusat.

---

# 26. Pemindaian Barcode

Untuk mengurangi kesalahan manusia.

Saat pengambilan barang:

* Barang dipindai barcode.
* Jumlah barang otomatis tercatat.

Saat penerimaan barang:

* Barang dipindai barcode kembali.
* Sistem membandingkan hasil pengiriman dan penerimaan.

---

# 27. Tujuan Fitur Selisih Pengiriman

1. Mengurangi kehilangan barang.
2. Mengurangi kesalahan pengiriman.
3. Mempermudah audit stok.
4. Mempermudah investigasi.
5. Memastikan stok cabang akurat.
6. Mengetahui petugas yang bertanggung jawab.
7. Membuat proses distribusi lebih profesional.
