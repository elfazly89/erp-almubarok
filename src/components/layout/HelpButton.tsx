"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Lightbulb, X, BookOpen, CheckCircle, Info, HelpCircle } from "lucide-react";

interface PageGuide {
  title: string;
  description: string;
  workflow: string[];
  features: string[];
  tips?: string;
}

const guides: Record<string, PageGuide> = {
  "/dashboard": {
    title: "Dashboard Utama",
    description: "Halaman ringkasan operasional ERP Al-Mubarok yang menampilkan data metrik cepat, aktivitas terbaru, dan ringkasan grafik.",
    workflow: [
      "Tinjau widget ringkasan metrik di bagian atas (total pengguna, absensi, dll) untuk memantau status harian.",
      "Periksa log aktivitas terbaru untuk melihat tindakan yang baru saja dilakukan.",
      "Gunakan menu sidebar di kiri untuk berpindah ke modul operasional lainnya."
    ],
    features: [
      "Metrik Kehadiran Harian",
      "Statistik Cepat Pengguna & Jabatan",
      "Pintasan Navigasi Sistem"
    ],
    tips: "Tema gelap/terang dapat diubah melalui tombol ikon matahari/bulan di sudut kanan atas header."
  },
  "/hrd/users": {
    title: "Daftar Abdi",
    description: "Modul pengelolaan data profil abdi serta status keaktifan mereka di perusahaan.",
    workflow: [
      "Pilih 'Tambah Abdi' untuk mendaftarkan abdi baru dengan mengisi data pribadi, jabatan, dan cabang tempat bertugas.",
      "Gunakan tombol pencarian di bagian atas untuk memfilter data abdi berdasarkan nama atau kode.",
      "Gunakan tombol edit di sebelah kanan baris tabel untuk memperbarui data, atau hapus jika diperlukan."
    ],
    features: [
      "Registrasi Akun Abdi & Hashing Password Aman",
      "Filter pencarian multi-kolom",
      "Pencatatan Riwayat Lembaga & Pendidikan"
    ],
    tips: "Pastikan kode user unik karena digunakan sebagai identitas login utama ke dalam sistem."
  },
  "/hrd/absensi": {
    title: "Absensi Abdi",
    description: "Halaman untuk melacak kehadiran, jam masuk, jam pulang, istirahat, dan lembur abdi.",
    workflow: [
      "Gunakan tombol 'Scan QR' untuk melakukan absensi otomatis bagi abdi menggunakan kamera.",
      "Pilih 'Input Manual' jika ingin merekam absensi secara manual (seperti izin khusus atau kendala teknis).",
      "Gunakan filter tanggal di bagian atas untuk melihat log kehadiran pada hari tertentu."
    ],
    features: [
      "Scan QR Code Scanner Kamera terintegrasi",
      "Pencatatan jam kerja presisi (Masuk, Pulang, Istirahat, Lembur)",
      "Pencatatan koordinat GPS lokasi absensi"
    ],
    tips: "Klik koordinat latitude/longitude di tabel untuk membuka peta lokasi absensi abdi di Google Maps secara langsung."
  },
  "/hrd/jabatan": {
    title: "Daftar Jabatan",
    description: "Mengelola struktur jabatan organisasi di lingkungan pondok pesantren.",
    workflow: [
      "Klik 'Tambah Jabatan' untuk mendefinisikan peran baru.",
      "Edit nama jabatan jika ada perubahan struktur.",
      "Hapus jabatan jika sudah tidak digunakan dalam organisasi."
    ],
    features: [
      "Pengelolaan Jabatan Dinamis",
      "Penyelarasan Hak Akses Menu berdasarkan Jabatan"
    ],
    tips: "Setelah membuat jabatan baru, jangan lupa atur skema gajinya pada tab Konfigurasi di menu Bisyaroh."
  },
  "/hrd/jam-kerja": {
    title: "Jam Kerja & Shift",
    description: "Mengatur jam masuk, jam pulang, batas keterlambatan, dan toleransi kehadiran masing-masing shift.",
    workflow: [
      "Tentukan rentang jam masuk dan jam pulang yang diperbolehkan.",
      "Tentukan shift kerja (Pagi, Siang, Kantor) dan kaitkan dengan absensi.",
      "Pantau kepatuhan shift pada data absensi harian."
    ],
    features: [
      "Pengaturan Jam Masuk & Batas Keterlambatan",
      "Pengaturan Jam Pulang & Batas Awal Checkout"
    ],
    tips: "Pastikan pengaturan jam kerja realistis agar sistem tidak salah mengkategorikan absensi sebagai tidak valid."
  },
  "/hrd/hari-libur": {
    title: "Hari Libur",
    description: "Pencatatan tanggal merah atau hari libur internal pondok pesantren.",
    workflow: [
      "Daftarkan hari libur nasional atau libur khusus pesantren dengan memilih tanggal.",
      "Hapus hari libur jika terjadi pembatalan jadwal."
    ],
    features: [
      "Kalender Libur Nasional & Pesantren",
      "Pengaruh otomatis pada perhitungan kalkulasi lembur harian"
    ],
    tips: "Hari libur akan otomatis mempengaruhi perhitungan kerja lembur jika abdi masuk di hari tersebut."
  },
  "/hrd/izin-cuti": {
    title: "Pengajuan Izin & Cuti",
    description: "Manajemen permohonan izin sakit, cuti tahunan, atau kepentingan keluarga abdi.",
    workflow: [
      "Abdi mengajukan permohonan dengan menyertakan alasan dan bukti pendukung (jika ada).",
      "HRD/Admin menyetujui (Approve) atau menolak (Reject) pengajuan melalui detail persetujuan.",
      "Status pengajuan akan otomatis terupdate secara real-time."
    ],
    features: [
      "Unggah file bukti izin (surat sakit/dokumen)",
      "Pemberian catatan persetujuan / penolakan",
      "Sistem filter status (Pending, Approved, Rejected)"
    ],
    tips: "Selalu tinjau alasan dan bukti file secara seksama sebelum menekan tombol Approve."
  },
  "/hrd/hutang": {
    title: "Hutang Abdi",
    description: "Modul pencatatan kewajiban finansial abdi kepada pesantren, termasuk pinjaman tunai, iuran seragam, dan potongan stok opname.",
    workflow: [
      "Klik 'Tambah Hutang' dan pilih nama abdi yang bersangkutan.",
      "Isi nominal hutang, tanggal, dan keterangan (atau pilih dari preset kategori: Pinjaman Tunai, Iuran Seragam, dll).",
      "Simpan. Data akan otomatis terhubung ke modul Bisyaroh saat memproses gaji abdi tersebut.",
      "Saat memproses gaji di Bisyaroh, masukkan nominal angsuran hutang di kolom 'Potong Gaji'. Sistem akan otomatis mengurangi saldo hutang aktif.",
      "Tandai hutang sebagai 'Lunas' secara manual bila sudah sepenuhnya terlunasi."
    ],
    features: [
      "Pencatatan Pinjaman, Iuran & Potongan Abdi",
      "Integrasi otomatis ke modul Bisyaroh (Potongan Gaji)",
      "Filter status Aktif / Lunas",
      "Preset kategori cepat (Iuran Seragam, Stok Opname, dll)",
      "CRUD penuh dengan konfirmasi hapus"
    ],
    tips: "Hutang dengan status Aktif akan muncul sebagai peringatan di form Proses Bisyaroh. Masukkan angsuran di kolom 'Potong Gaji' agar saldo hutang berkurang secara otomatis."
  },
  "/hrd/bisyaroh": {
    title: "Bisyaroh (Penggajian Abdi)",
    description: "Pusat pemrosesan gaji bulanan abdi dalem dan staf pesantren terintegrasi dengan absensi, utang, dan jurnal akuntansi.",
    workflow: [
      "Di tab 'Bisyaroh Bulanan', pilih Bulan dan Tahun target, lalu klik Refresh.",
      "Klik 'Proses Gaji' pada abdi yang ingin dihitung gajinya. Sistem akan otomatis memuat gaji pokok, kalkulasi kehadiran (per jam), dan jam lembur dari data absensi asli.",
      "Jika abdi memiliki hutang aktif, masukkan jumlah angsuran pada input potongan hutang.",
      "Pilih sumber dana pembayaran (Kas Toko, BCA, dll), lalu klik 'Bayar & Simpan'. Sistem akan otomatis memotong hutang dan mencatat jurnal akuntansi penyeimbang.",
      "Gunakan tombol 'Detail Slip' untuk mencetak slip gaji abdi secara print-friendly."
    ],
    features: [
      "Kalkulasi Gaji Otomatis Berbasis Absensi",
      "Integrasi Potongan Hutang Abdi terkomputerisasi",
      "Auto-Journaling Akuntansi (Debit Beban Gaji, Kredit Kas/Bank)",
      "Desain Slip Gaji Siap Cetak (Print-Ready)"
    ],
    tips: "Buka tab 'Konfigurasi Gaji Jabatan' terlebih dahulu untuk menyetel gaji pokok, gaji per jam, dan upah lembur per jabatan agar kalkulasi berjalan sempurna."
  },
  "/barang": {
    title: "Katalog Data Barang",
    description: "Modul utama pendataan stok produk toko (Pujasera/Kantin) yang dikelompokkan berdasarkan kategori dan supplier.",
    workflow: [
      "Klik 'Tambah Barang' untuk mendaftarkan barang baru dengan barcode dan nama.",
      "Gunakan input struktur satuan untuk menentukan konversi grosir (contoh: Satuan 1 = pcs, Satuan 2 = pak isi 10 pcs, Satuan 3 = dus isi 120 pcs).",
      "Set harga beli, HPP rata-rata, dan susunan harga jual retail/grosir di kolom yang disediakan.",
      "Klik simpan. Barang baru akan terdaftar dalam katalog."
    ],
    features: [
      "Konversi Satuan 3 Tingkat (Multi-UOM)",
      "Struktur Harga Jual Bertingkat (Retail, Grosir, Khusus)",
      "Filter pencarian cepat nama / barcode"
    ],
    tips: "Dilarang mematikan opsi 'Jual Rugi' kecuali memang diizinkan menjual produk di bawah harga beli dasar."
  },
  "/kategori": {
    title: "Kategori Barang",
    description: "Mengelompokkan barang dagangan agar laporan penjualan dan pengawasan stok lebih terstruktur.",
    workflow: [
      "Buat kategori baru dengan mengisi kode unik dan nama kategori (contoh: Makanan, Minuman).",
      "Kategorikan barang-barang terkait saat mendaftarkan barang."
    ],
    features: [
      "Manajemen Kategori Terpusat",
      "Pencarian kode/nama kategori"
    ],
    tips: "Pengelompokkan kategori yang baik memudahkan analisis produk terlaris di menu akuntansi."
  },
  "/supplier": {
    title: "Daftar Supplier Partner",
    description: "Kelola data distributor partner penyedia stok barang dagangan toko.",
    workflow: [
      "Daftarkan nama supplier, alamat, kontak, dan info rekening bank untuk keperluan pemesanan stok.",
      "Atur jadwal kunjungan rutin sales supplier agar manajemen kedatangan barang tertata."
    ],
    features: [
      "Pencatatan data pajak supplier (NPWP, PKP)",
      "Pengaturan jadwal kunjungan sales (hari & periode)",
      "Log hutang dagang supplier"
    ],
    tips: "Informasi rekening bank supplier sangat berguna sebagai referensi saat melakukan pelunasan hutang dagang."
  },
  "/stok": {
    title: "Stok Barang Toko & Cabang",
    description: "Memantau kuantitas stok akhir barang dagangan di setiap cabang secara real-time.",
    workflow: [
      "Pilih cabang pada filter di bagian atas untuk melihat kondisi stok di cabang tersebut.",
      "Gunakan kolom pencarian untuk memantau stok barang tertentu.",
      "Tinjau status minimal stok untuk mendeteksi barang yang hampir habis."
    ],
    features: [
      "Stok Opname & Monitoring Cabang",
      "Detektor Minimal & Maksimal Stok",
      "Catatan Posisi Rak Penyimpanan Barang"
    ],
    tips: "Warna stok akan berubah menjadi peringatan jika kuantitas barang di bawah batas minimal stok."
  },
  "/penjualan/pos": {
    title: "Kasir POS (Point of Sale)",
    description: "Layar kasir utama untuk transaksi penjualan produk kepada pembeli retail maupun grosir.",
    workflow: [
      "Klik pada produk di katalog atau ketik nama/barcode di pencarian untuk memasukkan ke keranjang belanja.",
      "Hubungkan dengan pelanggan terdaftar untuk pengumpulan poin loyalitas.",
      "Masukkan voucher belanja jika ada, atau infaq sukarela dari pembeli.",
      "Pilih metode pembayaran (Tunai/Transfer), ketik uang yang diterima, lalu klik 'Selesaikan Transaksi'.",
      "Nota belanja akan keluar dan siap dicetak."
    ],
    features: [
      "Barcode Scanner Kamera Cepat",
      "Sistem Loyalitas Poin & Penukaran Potongan Belanja",
      "Validasi Kode Voucher Kupon",
      "Cetak Nota Kasir Fisik"
    ],
    tips: "Gunakan tombol shortcut pada keyboard atau klik produk langsung untuk transaksi yang lebih cepat."
  },
  "/penjualan/history": {
    title: "Riwayat Nota Penjualan",
    description: "Daftar arsip nota penjualan toko yang telah selesai diproses.",
    workflow: [
      "Gunakan pencarian no nota atau filter tanggal untuk membatasi hasil.",
      "Klik detail pada baris transaksi untuk melihat daftar barang yang dibeli pada nota tersebut."
    ],
    features: [
      "Arsip Nota Penjualan Digital",
      "Detail detail item belanja & metode bayar"
    ],
    tips: "Jika ada komplain barang bawaan dari pembeli, cocokkan no nota di kertas dengan riwayat digital di halaman ini."
  },
  "/pembelian/po": {
    title: "Purchase Order (PO)",
    description: "Formulir pemesanan barang dagangan secara resmi ke supplier sebelum faktur dikirim.",
    workflow: [
      "Pilih supplier tujuan dan isi nomor PO.",
      "Tambahkan daftar barang beserta kuantitas dan harga satuan yang disepakati.",
      "Kirim PO dan pantau statusnya hingga barang diterima."
    ],
    features: [
      "Pembuatan Lembar PO Resmi",
      "Filter status pemesanan (Pending, Selesai)"
    ],
    tips: "Selalu buat PO sebelum memesan agar tidak terjadi selisih harga saat supplier mengirimkan faktur tagihan."
  },
  "/pembelian/invoice": {
    title: "Faktur Beli (Receiving)",
    description: "Penerimaan barang fisik dari supplier sekaligus pencatatan hutang dagang baru.",
    workflow: [
      "Isi detail faktur pembelian dari supplier berdasarkan PO yang telah dibuat.",
      "Verifikasi jumlah barang yang masuk secara fisik dengan yang tertulis di faktur.",
      "Simpan transaksi untuk memasukkan stok ke gudang dan menerbitkan hutang baru."
    ],
    features: [
      "Pencatatan Faktur Pembelian",
      "Konversi PO menjadi Faktur",
      "Penambahan stok otomatis ke gudang"
    ],
    tips: "Periksa expired date barang saat menerima fisik sebelum menekan tombol simpan faktur."
  },
  "/pembelian/hutang": {
    title: "Hutang Dagang Supplier",
    description: "Memantau sisa saldo hutang usaha perusahaan kepada pihak supplier distributor.",
    workflow: [
      "Lihat daftar supplier yang memiliki saldo hutang aktif.",
      "Pilih 'Bayar Hutang' untuk mencatat cicilan atau pelunasan.",
      "Pilih metode pembayaran dan masukkan nominal bayar."
    ],
    features: [
      "Kartu Hutang Supplier Terpadu",
      "Pencatatan Pelunasan Hutang Usaha"
    ],
    tips: "Lakukan pelunasan tepat waktu sesuai kesepakatan tempo agar hubungan bisnis dengan supplier tetap terjaga."
  },
  "/akuntansi/jurnal": {
    title: "Jurnal Umum",
    description: "Buku jurnal utama mencatat semua transaksi keuangan secara double-entry (Debit & Kredit).",
    workflow: [
      "Klik 'Tambah Jurnal' untuk mencatat transaksi keuangan manual.",
      "Isi tanggal, nomor bukti, deskripsi transaksi.",
      "Tambahkan minimal 2 entri akun (Debit dan Kredit) dan pastikan nilainya seimbang (balance).",
      "Simpan jurnal transaksi."
    ],
    features: [
      "Pencatatan Double-Entry Terkomputerisasi",
      "Detektor Validasi Keseimbangan (Debit = Kredit)",
      "Penyimpanan Transaksional Database Aman"
    ],
    tips: "Apabila tombol Simpan tidak aktif, pastikan jumlah total kolom Debit sama persis dengan Kredit."
  },
  "/akuntansi/coa": {
    title: "Daftar Akun (Chart of Accounts)",
    description: "Mengelola nomor kode akun keuangan yang digunakan dalam pembukuan jurnal.",
    workflow: [
      "Buat akun baru dengan mengisi kode akun (e.g. 1.101.03), nama akun, dan pilih tipe akunnya.",
      "Gunakan kode akun ini saat mencatat jurnal umum."
    ],
    features: [
      "Pengelolaan Struktur Rekening (COA)",
      "Pengelompokkan Tipe Akun Keuangan"
    ],
    tips: "Susun kode akun secara teratur mengikuti standar akuntansi (1 untuk Aset, 2 Kewajiban, 3 Ekuitas, 4 Pendapatan, 5/6 Beban)."
  },
  "/akuntansi/tipe": {
    title: "Tipe Akun",
    description: "Mengelola kategori tipe akun utama seperti Aset, Kewajiban, Ekuitas, Pendapatan, dan Beban.",
    workflow: [
      "Lihat tipe akun yang terdaftar beserta arah saldo normalnya (Debit/Kredit).",
      "Gunakan tipe akun ini saat mendaftarkan nomor rekening baru di CoA."
    ],
    features: [
      "Pengaturan Saldo Normal Akun",
      "Klasifikasi Laporan Keuangan"
    ],
    tips: "Arah saldo normal menentukan apakah akun tersebut akan bertambah di posisi Debit atau Kredit."
  },
  "/akuntansi/laporan": {
    title: "Laporan Keuangan & Buku Besar",
    description: "Menyusun laporan Buku Besar, Neraca Saldo, Laporan Laba Rugi, dan Neraca secara otomatis.",
    workflow: [
      "Pilih jenis laporan yang ingin ditampilkan pada tab navigasi.",
      "Tentukan rentang tanggal laporan untuk membatasi periode pencatatan.",
      "Klik cetak atau ekspor jika ingin menyimpan dalam bentuk fisik."
    ],
    features: [
      "Buku Besar Interaktif per Rekening",
      "Kalkulator Laba Rugi Real-Time",
      "Neraca Keuangan Otomatis"
    ],
    tips: "Lakukan pemeriksaan berkala pada Laba Rugi untuk memantau performa pengeluaran beban dan pendapatan operasional."
  },
  "/cabang": {
    title: "Daftar Cabang",
    description: "Mengelola identitas unit usaha atau cabang fisik perusahaan Al-Mubarok.",
    workflow: [
      "Daftarkan unit cabang baru dengan kode unik, nama, alamat, dan kontak telepon.",
      "Edit data jika terjadi perubahan lokasi atau admin penanggung jawab cabang."
    ],
    features: [
      "Multi-Branch System Support",
      "Pengkaitan Stok & Transaksi Kasir per Cabang"
    ],
    tips: "Setiap cabang memiliki penyimpanan stok barang mandiri yang diatur di menu stok barang."
  },
  "/pengaturan/role-menu": {
    title: "Role & Hak Akses Menu",
    description: "Membatasi hak akses menu dashboard bagi setiap jabatan abdi demi keamanan sistem.",
    workflow: [
      "Pilih Jabatan (Role) yang ingin diatur hak aksesnya.",
      "Centang menu utama dan sub-menu yang boleh dibuka oleh jabatan tersebut.",
      "Klik simpan. Hak akses baru akan langsung berlaku saat user dengan jabatan tersebut login."
    ],
    features: [
      "Manajemen Menu Dinamis",
      "Pengaturan Keamanan Hak Akses (RBAC)"
    ],
    tips: "Selalu batasi menu Akuntansi dan Pengaturan hanya untuk jabatan pimpinan, bendahara, atau IT admin."
  },
  "default": {
    title: "Panduan Pengguna ERP Al-Mubarok",
    description: "Selamat datang di Sistem ERP Al-Mubarok. Sistem ini mempermudah manajemen HRD, Stok Toko, POS Kasir, dan Akuntansi secara terpadu.",
    workflow: [
      "Pilih menu di sidebar sebelah kiri untuk mulai mengelola modul operasional.",
      "Gunakan tombol lampu kuning ini kapan saja untuk membaca petunjuk penggunaan halaman aktif."
    ],
    features: [
      "Keamanan Role-Based Access Control",
      "Sistem Akuntansi Double-Entry Otomatis",
      "Pelacakan Stok Multi-Cabang"
    ],
    tips: "Jika Anda mengalami kendala teknis, silakan hubungi tim administrator IT."
  },
  "/distribusi/dashboard": {
    title: "Dasbor Distribusi",
    description: "Pusat kendali Smart Distribution Management System (DMS). Memantau ketersediaan stok cabang, barang kritis, produk terlaris, dan prioritas pengiriman secara real-time.",
    workflow: [
      "Tinjau KPI utama di bagian atas: total cabang dipantau, barang berstatus kritis, tingkat pemenuhan stok, dan rekomendasi yang menunggu.",
      "Periksa tabel 'Barang Kritis' untuk mengetahui item yang paling mendesak untuk segera dikirim.",
      "Lihat skor 'Prioritas Pengiriman Cabang' untuk menentukan urutan pengiriman berikutnya.",
      "Klik tombol 'Hitung Ulang Forecast' (di halaman Proyeksi) agar data dashboard selalu up-to-date."
    ],
    features: [
      "Widget KPI Distribusi Real-time",
      "Daftar Barang & Cabang Kritis",
      "Top Produk Terlaris (Fast Moving)",
      "Skor Prioritas Pengiriman Otomatis"
    ],
    tips: "Jalankan 'Hitung Ulang Forecast' dari halaman Proyeksi Ketersediaan setiap pagi hari untuk memastikan data dashboard akurat berdasarkan penjualan terkini."
  },
  "/distribusi/forecast": {
    title: "Proyeksi Ketersediaan Stok",
    description: "Analisis ketahanan stok per SKU per cabang. Menampilkan rata-rata penjualan harian (ADS), estimasi hari habis, dan status AMAN/PERHATIAN/KRITIS.",
    workflow: [
      "Klik tombol 'Hitung Ulang Forecast' untuk memperbarui seluruh data ADS dan proyeksi berdasarkan data penjualan 30 hari terakhir.",
      "Gunakan filter Cabang dan Kategori untuk mempersempit tampilan data.",
      "Klik ikon 'Grafik' di kolom Aksi untuk melihat simulasi proyeksi penurunan stok harian.",
      "Prioritaskan item berstatus KRITIS untuk segera dimasukkan ke halaman Rekomendasi Pengiriman."
    ],
    features: [
      "Kalkulasi ADS (Average Daily Sales) dari data penjualan aktual",
      "Status AMAN / PERHATIAN / KRITIS otomatis",
      "Estimasi tanggal habis stok",
      "Filter multi-dimensi (Cabang, Kategori, Nama Barang)"
    ],
    tips: "Status KRITIS berarti stok kurang dari Lead Time pengiriman (default 2 hari). Segera buat rekomendasi pengiriman untuk item-item ini."
  },
  "/distribusi/rekomendasi": {
    title: "Rekomendasi Pengiriman Pintar",
    description: "Engine Smart Replenishment yang menghitung otomatis kebutuhan kirim ke setiap cabang berdasarkan ADS × Target Hari. Fitur utama manajemen distribusi DC.",
    workflow: [
      "Klik 'Generate Rekomendasi Baru' untuk membiarkan sistem menghitung secara otomatis seluruh item yang perlu dikirim (dari data forecast KRITIS & PERHATIAN).",
      "Tinjau daftar rekomendasi DRAF. Anda dapat mengubah jumlah kiriman dengan klik ikon pensil.",
      "Klik 'Setujui' pada masing-masing baris, atau 'Setujui Semua Draf' untuk persetujuan massal.",
      "Setelah ada item berstatus DISETUJUI, klik 'Buat Surat Jalan' untuk mengkonversinya menjadi pengiriman nyata."
    ],
    features: [
      "Auto-generate rekomendasi dari data forecast real",
      "Edit jumlah kiriman secara manual per item",
      "Persetujuan individual atau massal",
      "Konversi langsung ke Surat Jalan DC",
      "Skor prioritas per item (0-100)"
    ],
    tips: "Pastikan halaman Proyeksi Ketersediaan sudah diperbarui sebelum men-generate rekomendasi baru, agar skor prioritas akurat."
  },
  "/distribusi/transfer": {
    title: "Penyeimbangan Stok Antarcabang",
    description: "Fitur Smart Transfer yang mendeteksi otomatis cabang dengan kelebihan stok (overstock) untuk menyuplai cabang yang kekurangan stok (understock), sebelum perlu PO baru ke supplier.",
    workflow: [
      "Sistem akan menampilkan saran transfer otomatis berdasarkan analisis data forecast seluruh cabang.",
      "Tinjau kartu transfer: bandingkan Cabang Pengirim (overstock > 60 hari) dan Cabang Penerima (status KRITIS).",
      "Klik 'Proses Mutasi Transfer' untuk membuat surat jalan transfer antarcabang.",
      "Klik 'Abaikan' jika saran transfer tidak sesuai dengan kondisi lapangan."
    ],
    features: [
      "Deteksi otomatis overstock & understock",
      "Kalkulasi qty transfer optimal (40% dari kelebihan stok)",
      "Estimasi potensi penyelamatan hari cover",
      "Generate surat jalan TRANSFER otomatis"
    ],
    tips: "Transfer antarcabang memindahkan modal yang mengendap (kelebihan stok) ke lokasi yang menghasilkan penjualan, meminimalkan lost sales tanpa harus menambah PO ke supplier."
  },
  "/distribusi/pengiriman": {
    title: "Surat Jalan DC & Status Pengiriman",
    description: "Kelola semua surat jalan yang dibuat oleh Distribution Center (DC). Pantau alur status dari Draf → Pengambilan Barang → Pengepakan → Dalam Perjalanan → Diterima.",
    workflow: [
      "Surat jalan otomatis muncul di sini setelah rekomendasi di-generate dari menu Rekomendasi Pengiriman.",
      "Klik salah satu surat jalan di sebelah kiri untuk melihat rincian item dan panel kontrol status di sebelah kanan.",
      "Gunakan tombol status (AMBIL → KEMAS → KIRIM) untuk memperbarui progres pengiriman secara real-time.",
      "Klik 'Cetak Surat Jalan (PDF)' untuk mencetak dokumen resmi pengiriman."
    ],
    features: [
      "Daftar surat jalan DC dengan status real-time",
      "Panel detail item per surat jalan",
      "Kontrol alur status pengiriman (stepper)",
      "Preview & cetak surat jalan PDF"
    ],
    tips: "Setelah driver berangkat, ubah status ke 'Dalam Perjalanan' agar pemantauan GPS di halaman Monitoring dapat melacak pengiriman ini."
  },
  "/distribusi/monitoring": {
    title: "Pemantauan Distribusi & GPS",
    description: "Pantau secara langsung posisi pengiriman aktif (simulasi GPS) dan evaluasi tingkat pemenuhan stok (service level) per cabang dalam 30 hari terakhir.",
    workflow: [
      "Tabel kiri menampilkan semua pengiriman yang sedang aktif (status Dalam Perjalanan / Bongkar Muat).",
      "Klik salah satu pengiriman untuk melihat timeline GPS detail di panel kanan.",
      "Monitor progress bar tiap kiriman — bar bergerak otomatis setiap beberapa detik.",
      "Tabel Service Level di bawah menunjukkan persentase pemenuhan kebutuhan stok per cabang."
    ],
    features: [
      "Simulasi GPS real-time tracking (update otomatis)",
      "Timeline status pengiriman (5 tahap)",
      "Tabel tingkat pemenuhan stok 30 hari",
      "Status badge dinamis per kiriman"
    ],
    tips: "Tingkat pemenuhan stok (service level) di atas 95% adalah target ideal. Jika ada cabang di bawah 90%, segera review jadwal distribusi."
  },
  "/distribusi/selisih": {
    title: "Pengelolaan Selisih Pengiriman",
    description: "Sistem investigasi dan rekonsiliasi selisih barang saat pengiriman tiba di cabang. Ada dua peran: Pemeriksa Cabang (input) dan Supervisor DC (approval).",
    workflow: [
      "Tab 'Pemeriksaan Cabang': Pilih surat jalan yang baru diterima, masukkan nama pemeriksa, lalu isi jumlah fisik yang diterima per item.",
      "Gunakan tombol 'Scan' untuk simulasi verifikasi barcode per item.",
      "Jika ada selisih, pilih jenis selisih (Kurang/Lebih/Rusak/Salah Barang) dan lampirkan foto bukti.",
      "Klik 'Simpan Hasil Pengecekan' untuk mengirim laporan ke Supervisor DC.",
      "Tab 'Persetujuan DC': Supervisor tinjau laporan dan klik 'Setuju' atau 'Tolak' untuk setiap kasus selisih."
    ],
    features: [
      "Formulir pengecekan fisik per item",
      "Simulasi scan barcode verifikasi",
      "Upload foto bukti selisih",
      "Sistem approval dua level (Cabang → DC)",
      "Auto-update status pengiriman setelah pengecekan"
    ],
    tips: "Dokumentasikan setiap selisih dengan foto bukti yang jelas. Selisih yang disetujui DC akan otomatis memicu pembuatan pengiriman susulan untuk item yang kurang."
  }
};

export default function HelpButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Match the longest matching path first
  const getActiveGuide = (): PageGuide => {
    if (!pathname) return guides["default"];
    const sortedKeys = Object.keys(guides).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (pathname === key || pathname.startsWith(key + "/")) {
        return guides[key];
      }
    }
    return guides["default"];
  };

  const guide = getActiveGuide();

  return (
    <>
      {/* Floating Yellow Lightbulb Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-yellow-400 text-yellow-950 p-3.5 rounded-full shadow-lg hover:bg-yellow-350 transition-all hover:scale-110 active:scale-95 animate-pulse hover:animate-none flex items-center justify-center cursor-pointer group border-2 border-yellow-200/50"
        title="Panduan Halaman Ini"
        aria-label="Panduan Pengguna"
      >
        <Lightbulb className="w-6 h-6 text-yellow-950 group-hover:rotate-12 transition-transform duration-200" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-xs whitespace-nowrap pl-0 group-hover:pl-2">
          Panduan
        </span>
      </button>

      {/* Modal Guide */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-yellow-400 text-yellow-950 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-yellow-950" />
                <div>
                  <h2 className="font-bold text-base leading-tight">Panduan: {guide.title}</h2>
                  <p className="text-[10px] text-yellow-900 font-semibold mt-0.5">Petunjuk Alur Kerja Halaman</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-yellow-950 hover:bg-yellow-500/30 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Description */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Tentang Halaman
                </span>
                <p className="text-on-surface-variant text-sm font-medium leading-relaxed mt-1">
                  {guide.description}
                </p>
              </div>

              {/* Workflow / Steps */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block mb-1">
                  Alur Kerja & Instruksi
                </span>
                <div className="space-y-3">
                  {guide.workflow.map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[10px] shrink-0 border border-secondary/15">
                        {idx + 1}
                      </span>
                      <p className="text-on-surface/90 leading-relaxed font-medium mt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block mb-1">
                  Fitur Utama Halaman
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface-variant font-medium">
                  {guide.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important Tip */}
              {guide.tips && (
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4 flex gap-3 text-yellow-800">
                  <Lightbulb className="w-5 h-5 shrink-0 text-yellow-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs block text-yellow-900">Tips Penting:</span>
                    <p className="text-[11px] leading-relaxed mt-1 font-medium">{guide.tips}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-low flex justify-end shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-yellow-400 hover:bg-yellow-350 text-yellow-950 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-yellow-400/10 cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
