import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── JABATAN ─────────────────────────────────────────────────────────────────
export const jabatan = sqliteTable("jabatan", {
  id_jabatan: integer("id_jabatan").primaryKey({ autoIncrement: true }),
  jabatan: text("jabatan").notNull(),
});

// ─── CABANG ──────────────────────────────────────────────────────────────────
export const cabang = sqliteTable("cabang", {
  id_cabang: integer("id_cabang").primaryKey({ autoIncrement: true }),
  kode_cabang: text("kode_cabang").notNull(),
  nama_cabang: text("nama_cabang").notNull(),
  alamat: text("alamat").notNull(),
  telepon: text("telepon"),
  email: text("email"),
  admin: integer("admin"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  data_kode: text("data_kode"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kode_user: text("kode_user").notNull(),
  nama_user: text("nama_user").notNull(),
  tempat_lahir: text("tempat_lahir"),
  tanggal_lahir: text("tanggal_lahir"),
  no_ktp: text("no_ktp"),
  pendidikan_terakhir: text("pendidikan_terakhir"),
  riwayat_lembaga: text("riwayat_lembaga"),
  riwayat_pekerjaan: text("riwayat_pekerjaan"),
  status: text("status", {
    enum: ["Abdi Tetap", "Kontrak", "Training", "Non-Aktif"],
  }).default("Kontrak"),
  no_hp: text("no_hp").notNull(),
  foto: text("foto"),
  password: text("password").notNull(),
  id_jabatan: integer("id_jabatan"),
  id_cabang: integer("id_cabang"),
  tanggal_masuk: text("tanggal_masuk"),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── ABSENSI ─────────────────────────────────────────────────────────────────
export const absensi = sqliteTable("absensi", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  tanggal: text("tanggal").notNull(),
  jam: text("jam").notNull(),
  jenis: text("jenis", {
    enum: [
      "masuk",
      "pulang",
      "istirahat_keluar",
      "istirahat_masuk",
      "lembur_mulai",
      "lembur_selesai",
    ],
  }).notNull(),
  shift: text("shift"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  status_lokasi: text("status_lokasi", { enum: ["valid", "invalid"] }).default(
    "valid"
  ),
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── JAM KERJA ───────────────────────────────────────────────────────────────
export const jam_kerja = sqliteTable("jam_kerja", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama_shift: text("nama_shift").notNull(),
  jam_masuk: text("jam_masuk").notNull(),
  jam_masuk_batas_akhir: text("jam_masuk_batas_akhir").notNull(),
  jam_pulang: text("jam_pulang").notNull(),
  jam_pulang_batas_awal: text("jam_pulang_batas_awal").notNull(),
  keterangan: text("keterangan"),
});

// ─── HARI LIBUR ──────────────────────────────────────────────────────────────
export const hari_libur = sqliteTable("hari_libur", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tanggal: text("tanggal").notNull(),
  nama_libur: text("nama_libur").notNull(),
  keterangan: text("keterangan"),
});

// ─── IZIN / CUTI ─────────────────────────────────────────────────────────────
export const izin_cuti = sqliteTable("izin_cuti", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  jenis: text("jenis", {
    enum: ["izin", "cuti", "sakit", "lainnya"],
  }).notNull(),
  tanggal_mulai: text("tanggal_mulai").notNull(),
  tanggal_selesai: text("tanggal_selesai").notNull(),
  keterangan: text("keterangan"),
  bukti_file: text("bukti_file"),
  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  }).default("pending"),
  tanggal_pengajuan: text("tanggal_pengajuan").default(
    sql`(CURRENT_TIMESTAMP)`
  ),
  tanggal_approval: text("tanggal_approval"),
  approver_id: integer("approver_id"),
  catatan_approval: text("catatan_approval"),
});

// ─── HUTANG KARYAWAN ─────────────────────────────────────────────────────────
export const hutang_karyawan = sqliteTable("hutang_karyawan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  nominal: integer("nominal").notNull(),
  tanggal: text("tanggal").notNull(),
  keterangan: text("keterangan"),
  status: text("status", { enum: ["aktif", "lunas"] }).default("aktif"),
});

// ─── DAFTAR GAJI JABATAN ─────────────────────────────────────────────────────
export const daftar_gaji_jabatan = sqliteTable("daftar_gaji_jabatan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_jabatan: integer("id_jabatan").notNull(),
  gaji_pokok: integer("gaji_pokok").notNull(),
  gaji_per_jam: integer("gaji_per_jam").notNull(),
  lembur_per_jam: integer("lembur_per_jam").notNull().default(0),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── BISYAROH (PENGGAJIAN) ───────────────────────────────────────────────────
export const bisyaroh = sqliteTable("bisyaroh", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  bulan: integer("bulan").notNull(),
  tahun: integer("tahun").notNull(),
  gaji_pokok: integer("gaji_pokok").notNull().default(0),
  gaji_per_jam: integer("gaji_per_jam").notNull().default(0),
  lembur_per_jam: integer("lembur_per_jam").notNull().default(0),
  hari_kerja: integer("hari_kerja").notNull().default(0),
  total_jam_kerja: integer("total_jam_kerja").notNull().default(0),
  total_jam_lembur: integer("total_jam_lembur").notNull().default(0),
  gaji_kehadiran: integer("gaji_kehadiran").notNull().default(0),
  gaji_lembur: integer("gaji_lembur").notNull().default(0),
  tunjangan: integer("tunjangan").notNull().default(0),
  potongan: integer("potongan").notNull().default(0),
  total_diterima: integer("total_diterima").notNull().default(0),
  status: text("status", { enum: ["Draft", "Lunas"] }).default("Draft"),
  tanggal_bayar: text("tanggal_bayar"),
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── MENU MAIN ───────────────────────────────────────────────────────────────
export const menu_main = sqliteTable("menu_main", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  link: text("link").notNull().default("#"),
  icon: text("icon"),
  urutan: integer("urutan").default(0),
  aktif: integer("aktif", { mode: "boolean" }).default(true),
});

// ─── MENU SUB ────────────────────────────────────────────────────────────────
export const menu_sub = sqliteTable("menu_sub", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_menu_main: integer("id_menu_main").notNull(),
  nama: text("nama").notNull(),
  link: text("link").notNull(),
  urutan: integer("urutan").default(0),
  aktif: integer("aktif", { mode: "boolean" }).default(true),
});

// ─── ROLE MENU ───────────────────────────────────────────────────────────────
export const role_menu = sqliteTable("role_menu", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_jabatan: integer("id_jabatan").notNull(),
  id_menu_main: integer("id_menu_main").notNull(),
  aktif: integer("aktif", { mode: "boolean" }).default(true),
  can_create: integer("can_create", { mode: "boolean" }).default(false),
  can_read: integer("can_read", { mode: "boolean" }).default(true),
  can_update: integer("can_update", { mode: "boolean" }).default(false),
  can_delete: integer("can_delete", { mode: "boolean" }).default(false),
});

// ─── ROLE MENU SUB ───────────────────────────────────────────────────────────
export const role_menu_sub = sqliteTable("role_menu_sub", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_jabatan: integer("id_jabatan").notNull(),
  id_menu_sub: integer("id_menu_sub").notNull(),
  aktif: integer("aktif", { mode: "boolean" }).default(true),
  can_create: integer("can_create", { mode: "boolean" }).default(false),
  can_read: integer("can_read", { mode: "boolean" }).default(true),
  can_update: integer("can_update", { mode: "boolean" }).default(false),
  can_delete: integer("can_delete", { mode: "boolean" }).default(false),
});

// ─── LOGIN ATTEMPTS ──────────────────────────────────────────────────────────
export const login_attempts = sqliteTable("login_attempts", {
  identifier: text("identifier").primaryKey(),
  attempts: integer("attempts").notNull().default(1),
  last_attempt: text("last_attempt").notNull(),
});

// ─── LOG LOGIN ───────────────────────────────────────────────────────────────
export const log_login = sqliteTable("log_login", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id"),
  waktu: text("waktu").notNull(),
  status: text("status", { enum: ["sukses", "gagal"] }).notNull(),
  ip_address: text("ip_address"),
});

// ─── KATEGORI BARANG ─────────────────────────────────────────────────────────
export const kategori_barang = sqliteTable("kategori_barang", {
  id_kategori: integer("id_kategori").primaryKey({ autoIncrement: true }),
  kode_kategori: text("kode_kategori").notNull(),
  nama_kategori: text("nama_kategori").notNull(),
});

// ─── SUPPLIER ────────────────────────────────────────────────────────────────
export const supplier = sqliteTable("supplier", {
  id_supplier: integer("id_supplier").primaryKey({ autoIncrement: true }),
  nama_supplier: text("nama_supplier").notNull(),
  alamat: text("alamat"),
  telepon: text("telepon"),
  email: text("email"),
  bank: text("bank"),
  no_rek_bank: text("no_rek_bank"),
  hari_kunjungan: text("hari_kunjungan"),
  periode_kunjungan: text("periode_kunjungan"),
  hutang: integer("hutang").default(0),
  status_pajak: text("status_pajak"),
  npwp: text("npwp"),
  keterangan_1: text("keterangan_1"),
  keterangan_2: text("keterangan_2"),
});

// ─── BARANG ──────────────────────────────────────────────────────────────────
export const barang = sqliteTable("barang", {
  id_barang: integer("id_barang").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull(),
  nama_barang: text("nama_barang").notNull(),
  id_kategori: integer("id_kategori").references(() => kategori_barang.id_kategori),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier),
  satuan_1: text("satuan_1"),
  satuan_2: text("satuan_2"),
  satuan_3: text("satuan_3"),
  isi_1: integer("isi_1"),
  isi_2: integer("isi_2"),
  isi_3: integer("isi_3"),
  harga_beli: integer("harga_beli"),
  harga_rata: integer("harga_rata"),
  harga_jual_1_1: integer("harga_jual_1_1"),
  harga_jual_1_2: integer("harga_jual_1_2"),
  harga_jual_1_3: integer("harga_jual_1_3"),
  harga_jual_2_1: integer("harga_jual_2_1"),
  harga_jual_2_2: integer("harga_jual_2_2"),
  harga_jual_2_3: integer("harga_jual_2_3"),
  harga_jual_3_1: integer("harga_jual_3_1"),
  harga_jual_3_2: integer("harga_jual_3_2"),
  harga_jual_3_3: integer("harga_jual_3_3"),
  jual_rugi: integer("jual_rugi").default(0),
  status: text("status").default("Aktif"),
  status_pajak: text("status_pajak"),
  keterangan_1: text("keterangan_1"),
  keterangan_2: text("keterangan_2"),
});

// ─── STOK BARANG ─────────────────────────────────────────────────────────────
export const stok_barang = sqliteTable("stok_barang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_barang: integer("id_barang").references(() => barang.id_barang),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang),
  stok_akhir: integer("stok_akhir").default(0),
  penjualan: integer("penjualan").default(0),
  transfer_masuk: integer("transfer_masuk").default(0),
  transfer_keluar: integer("transfer_keluar").default(0),
  posisi_rak: text("posisi_rak"),
  minimal_stok: integer("minimal_stok").default(0),
  maksimal_stok: integer("maksimal_stok").default(0),
});

// ─── PELANGGAN ───────────────────────────────────────────────────────────────
export const pelanggan = sqliteTable("pelanggan", {
  id_pelanggan: integer("id_pelanggan").primaryKey({ autoIncrement: true }),
  kode_pelanggan: text("kode_pelanggan").notNull(),
  nama_lengkap: text("nama_lengkap").notNull(),
  email: text("email"),
  alamat: text("alamat"),
  telepon: text("telepon"),
  level_harga: integer("level_harga").default(1),
  total_poin: integer("total_poin").default(0),
});

// ─── PENJUALAN ───────────────────────────────────────────────────────────────
export const penjualan = sqliteTable("penjualan", {
  id_penjualan: integer("id_penjualan").primaryKey({ autoIncrement: true }),
  no_invoice: text("no_invoice").notNull(),
  tanggal_invoice: text("tanggal_invoice").notNull(),
  jam_invoice: text("jam_invoice").notNull(),
  id_pelanggan: integer("id_pelanggan"),
  nama_pelanggan: text("nama_pelanggan"),
  id_user: integer("id_user").references(() => users.id),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang),
  subtotal: integer("subtotal").notNull(),
  diskon: integer("diskon").default(0),
  nominal_voucher: integer("nominal_voucher").default(0),
  potongan_poin: integer("potongan_poin").default(0),
  infaq: integer("infaq").default(0),
  total_akhir: integer("total_akhir").notNull(),
  jenis_pembayaran: text("jenis_pembayaran").notNull(),
  jumlah_bayar: integer("jumlah_bayar").default(0),
  id_voucher: integer("id_voucher"),
  poin_didapat: integer("poin_didapat").default(0),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PENJUALAN DETAIL ────────────────────────────────────────────────────────
export const penjualan_detail = sqliteTable("penjualan_detail", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_penjualan: integer("id_penjualan").references(() => penjualan.id_penjualan),
  id_barang: integer("id_barang").references(() => barang.id_barang),
  nama_barang: text("nama_barang").notNull(),
  jumlah: integer("jumlah").notNull(),
  satuan: text("satuan").notNull(),
  isi_satuan: integer("isi_satuan").notNull(),
  harga_jual: integer("harga_jual").notNull(),
  harga_rata_saat_transaksi: integer("harga_rata_saat_transaksi").notNull(),
  diskon: integer("diskon").default(0),
  subtotal: integer("subtotal").notNull(),
  jenis_item: text("jenis_item").default("TRANSAKSI"),
});

// ─── RIWAYAT POIN ────────────────────────────────────────────────────────────
export const riwayat_poin = sqliteTable("riwayat_poin", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_pelanggan: integer("id_pelanggan").references(() => pelanggan.id_pelanggan),
  jenis_transaksi: text("jenis_transaksi").notNull(),
  jumlah_poin: integer("jumlah_poin").notNull(),
  keterangan: text("keterangan"),
  id_referensi_transaksi: text("id_referensi_transaksi"),
  waktu: text("waktu").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── INFAQ ───────────────────────────────────────────────────────────────────
export const infaq = sqliteTable("infaq", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_penjualan: integer("id_penjualan").references(() => penjualan.id_penjualan),
  no_invoice: text("no_invoice").notNull(),
  jumlah_infaq: integer("jumlah_infaq").notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang),
  id_user: integer("id_user").references(() => users.id),
  waktu: text("waktu").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── VOUCHERS ────────────────────────────────────────────────────────────────
export const vouchers = sqliteTable("vouchers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kode_voucher: text("kode_voucher").notNull(),
  nilai: integer("nilai").notNull(),
  status: text("status").default("AKTIF"),
});

// ─── PEMESANAN PEMBELIAN (PO) ────────────────────────────────────────────────
export const pesan_beli = sqliteTable("pesan_beli", {
  id_pesan_beli: integer("id_pesan_beli").primaryKey({ autoIncrement: true }),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
  tanggal_pesan_beli: text("tanggal_pesan_beli").notNull(),
  nomor_pesan_beli: text("nomor_pesan_beli").notNull(),
  keterangan: text("keterangan"),
  total_harga_pesan_beli: integer("total_harga_pesan_beli").notNull(),
  status: text("status").default("PENDING"), // PENDING, PROCESSED, CANCELLED
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PEMESANAN PEMBELIAN DETAIL ───────────────────────────────────────────────
export const pesan_beli_detail = sqliteTable("pesan_beli_detail", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_pesan_beli: integer("id_pesan_beli").references(() => pesan_beli.id_pesan_beli).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  nama_barang: text("nama_barang").notNull(),
  jumlah_barang: integer("jumlah_barang").notNull(), // in pcs
  harga_satuan: integer("harga_satuan").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// ─── FAKTUR PEMBELIAN (RECEIVING) ────────────────────────────────────────────
export const faktur_beli = sqliteTable("faktur_beli", {
  id_faktur: integer("id_faktur").primaryKey({ autoIncrement: true }),
  id_po: integer("id_po").references(() => pesan_beli.id_pesan_beli),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
  tanggal_faktur: text("tanggal_faktur").notNull(),
  nomor_faktur: text("nomor_faktur").notNull(),
  total_faktur: integer("total_faktur").notNull(),
  diskon_total: integer("diskon_total").default(0),
  ppn_rate: integer("ppn_rate").default(0),
  status_pembayaran: text("status_pembayaran").default("Belum Dibayar"), // Lunas, Belum Dibayar
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── FAKTUR PEMBELIAN DETAIL ──────────────────────────────────────────────────
export const faktur_beli_detail = sqliteTable("faktur_beli_detail", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_faktur: integer("id_faktur").references(() => faktur_beli.id_faktur).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_beli: integer("jumlah_beli").notNull(), // in pcs
  harga_satuan: integer("harga_satuan").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// ─── RIWAYAT BAYAR HUTANG SUPPLIER ────────────────────────────────────────────
export const bayar_hutang = sqliteTable("bayar_hutang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
  tanggal_bayar: text("tanggal_bayar").notNull(),
  jumlah_bayar: integer("jumlah_bayar").notNull(),
  metode_pembayaran: text("metode_pembayaran").notNull(), // Tunai, Transfer
  keterangan: text("keterangan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PERMINTAAN BARANG ANTAR CABANG (PESAN CABANG) ───────────────────────────
export const pesan_cabang = sqliteTable("pesan_cabang", {
  id_request: integer("id_request").primaryKey({ autoIncrement: true }),
  kode_request: text("kode_request").notNull(), // format TR-YYYYMMDDHHMMSS
  id_cabang_peminta: integer("id_cabang_peminta").references(() => cabang.id_cabang).notNull(),
  id_cabang_sumber: integer("id_cabang_sumber").references(() => cabang.id_cabang).notNull(),
  id_user_peminta: integer("id_user_peminta").references(() => users.id).notNull(),
  status: text("status").default("Pending"), // Pending, Diproses, Selesai, Dibatalkan
  tanggal_request: text("tanggal_request").notNull(),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PERMINTAAN BARANG DETAIL ──────────────────────────────────────────────────
export const pesan_cabang_detail = sqliteTable("pesan_cabang_detail", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_request: integer("id_request").references(() => pesan_cabang.id_request).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_diminta: integer("jumlah_diminta").notNull(), // in pcs
  status_item: text("status_item").default("Diproses"), // Diproses, Terkirim Sebagian, Terkirim, Over, Batal
});

// ─── PENGIRIMAN BARANG ANTAR CABANG ──────────────────────────────────────────
export const pengiriman = sqliteTable("pengiriman", {
  id_pengiriman: integer("id_pengiriman").primaryKey({ autoIncrement: true }),
  kode_pengiriman: text("kode_pengiriman").notNull(), // format KIRIM/YYYY/MM/KODE-CABANG/URUTAN
  id_cabang_sumber: integer("id_cabang_sumber").references(() => cabang.id_cabang).notNull(),
  id_cabang_tujuan: integer("id_cabang_tujuan").references(() => cabang.id_cabang).notNull(),
  id_user_pengirim: integer("id_user_pengirim").references(() => users.id).notNull(),
  id_user_penerima: integer("id_user_penerima").references(() => users.id),
  status: text("status").default("Dikirim"), // Dikirim, Diterima Penuh, Ada Selisih
  tanggal_kirim: text("tanggal_kirim").notNull(),
  tanggal_terima: text("tanggal_terima"),
});

// ─── DETAIL PENGIRIMAN BARANG ─────────────────────────────────────────────────
export const pengiriman_detail = sqliteTable("pengiriman_detail", {
  id_detail_kirim: integer("id_detail_kirim").primaryKey({ autoIncrement: true }),
  id_pengiriman: integer("id_pengiriman").references(() => pengiriman.id_pengiriman).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_dikirim: integer("jumlah_dikirim").notNull(), // in pcs
  jumlah_diterima: integer("jumlah_diterima"), // in pcs
  id_request_detail: integer("id_request_detail").references(() => pesan_cabang_detail.id),
  status_selisih: text("status_selisih"), // Null, Pending, Approved
  catatan_penerima: text("catatan_penerima"),
});

// ─── TIPE AKUN ───────────────────────────────────────────────────────────────
export const tipe_akun = sqliteTable("tipe_akun", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(), // Aset, Kewajiban, Ekuitas, Pendapatan, Beban
  posisi_saldo_normal: text("posisi_saldo_normal", { enum: ["DEBIT", "KREDIT"] }).notNull(),
});

// ─── DAFTAR AKUN / COA ────────────────────────────────────────────────────────
export const daftar_akun = sqliteTable("daftar_akun", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kode_akun: text("kode_akun").notNull(), // format unik: e.g., 1.101.01
  nama_akun: text("nama_akun").notNull(), // e.g., Kas Toko, Bank Mandiri
  deskripsi: text("deskripsi"),
  tipe_akun_id: integer("tipe_akun_id").references(() => tipe_akun.id).notNull(),
  status: text("status", { enum: ["Aktif", "Non-Aktif"] }).default("Aktif"),
});

// ─── JURNAL UMUM ─────────────────────────────────────────────────────────────
export const jurnal_umum = sqliteTable("jurnal_umum", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tanggal_transaksi: text("tanggal_transaksi").notNull(), // YYYY-MM-DD
  no_referensi_bukti: text("no_referensi_bukti").notNull(),
  deskripsi: text("deskripsi").notNull(),
  akun_id: integer("akun_id").references(() => daftar_akun.id).notNull(),
  cabang_id: integer("cabang_id").references(() => cabang.id_cabang).notNull(),
  debit: integer("debit").default(0).notNull(),
  kredit: integer("kredit").default(0).notNull(),
  dibuat_oleh: integer("dibuat_oleh").references(() => users.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PROMO ───────────────────────────────────────────────────────────────────
export const promo = sqliteTable("promo", {
  id_promo: integer("id_promo").primaryKey({ autoIncrement: true }),
  nama_promo: text("nama_promo").notNull(),
  tipe_promo: text("tipe_promo").notNull(),
  deskripsi: text("deskripsi"),
  berlaku_untuk: text("berlaku_untuk").notNull(), // e.g. "UMUM,1,2,3"
  tanggal_mulai: text("tanggal_mulai").notNull(),
  tanggal_selesai: text("tanggal_selesai").notNull(),
  status: text("status").default("Aktif").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
  created_by: integer("created_by"),
  updated_by: integer("updated_by"),
  id_cabang_pembuat: integer("id_cabang_pembuat"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const promo_cabang = sqliteTable("promo_cabang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
});

export const promo_syarat_pembelanjaan = sqliteTable("promo_syarat_pembelanjaan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  minimum_pembelanjaan: integer("minimum_pembelanjaan").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
});

export const promo_syarat_kategori = sqliteTable("promo_syarat_kategori", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_kategori: integer("id_kategori").references(() => kategori_barang.id_kategori).notNull(),
});

export const promo_syarat_supplier = sqliteTable("promo_syarat_supplier", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
});

export const promo_hadiah_poin = sqliteTable("promo_hadiah_poin", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  jumlah_poin: integer("jumlah_poin").notNull(),
});

export const promo_hadiah_diskon = sqliteTable("promo_hadiah_diskon", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  jenis_diskon: text("jenis_diskon").notNull(), // "PERSEN" or "NOMINAL"
  nilai_diskon: integer("nilai_diskon").notNull(),
});

export const promo_syarat_barang_tertentu = sqliteTable("promo_syarat_barang_tertentu", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
});

export const promo_syarat_beli = sqliteTable("promo_syarat_beli", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
});

export const promo_hadiah_gratis = sqliteTable("promo_hadiah_gratis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
});

export const promo_diskon_barang = sqliteTable("promo_diskon_barang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
  jenis_diskon: text("jenis_diskon").notNull(), // "PERSEN" or "NOMINAL"
  nilai_diskon: integer("nilai_diskon").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
});

export const promo_poin_barang = sqliteTable("promo_poin_barang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_barang: integer("jumlah_barang").notNull(),
  id_satuan: integer("id_satuan").notNull(),
  jumlah_poin: integer("jumlah_poin").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
});

export const promo_hadiah_barang = sqliteTable("promo_hadiah_barang", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
});

export const promo_barang_tebus_murah = sqliteTable("promo_barang_tebus_murah", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
  harga_tebus: integer("harga_tebus").notNull(),
});

export type Promo = typeof promo.$inferSelect;
export type PromoCabang = typeof promo_cabang.$inferSelect;
export type PromoSyaratPembelanjaan = typeof promo_syarat_pembelanjaan.$inferSelect;
export type PromoSyaratKategori = typeof promo_syarat_kategori.$inferSelect;
export type PromoSyaratSupplier = typeof promo_syarat_supplier.$inferSelect;
export type PromoHadiahPoin = typeof promo_hadiah_poin.$inferSelect;
export type PromoHadiahDiskon = typeof promo_hadiah_diskon.$inferSelect;
export type PromoSyaratBarangTertentu = typeof promo_syarat_barang_tertentu.$inferSelect;
export type PromoSyaratBeli = typeof promo_syarat_beli.$inferSelect;
export type PromoHadiahGratis = typeof promo_hadiah_gratis.$inferSelect;
export type PromoDiskonBarang = typeof promo_diskon_barang.$inferSelect;
export type PromoPoinBarang = typeof promo_poin_barang.$inferSelect;
export type PromoHadiahBarang = typeof promo_hadiah_barang.$inferSelect;
export type PromoBarangTebusMurah = typeof promo_barang_tebus_murah.$inferSelect;

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Jabatan = typeof jabatan.$inferSelect;
export type Cabang = typeof cabang.$inferSelect;
export type Absensi = typeof absensi.$inferSelect;
export type JamKerja = typeof jam_kerja.$inferSelect;
export type HariLibur = typeof hari_libur.$inferSelect;
export type IzinCuti = typeof izin_cuti.$inferSelect;
export type HutangKaryawan = typeof hutang_karyawan.$inferSelect;
export type DaftarGajiJabatan = typeof daftar_gaji_jabatan.$inferSelect;
export type Bisyaroh = typeof bisyaroh.$inferSelect;
export type NewBisyaroh = typeof bisyaroh.$inferInsert;


export type KategoriBarang = typeof kategori_barang.$inferSelect;
export type Supplier = typeof supplier.$inferSelect;
export type Barang = typeof barang.$inferSelect;
export type StokBarang = typeof stok_barang.$inferSelect;
export type Pelanggan = typeof pelanggan.$inferSelect;
export type Penjualan = typeof penjualan.$inferSelect;
export type PenjualanDetail = typeof penjualan_detail.$inferSelect;
export type RiwayatPoin = typeof riwayat_poin.$inferSelect;
export type Infaq = typeof infaq.$inferSelect;
export type Vouchers = typeof vouchers.$inferSelect;

export type PesanBeli = typeof pesan_beli.$inferSelect;
export type PesanBeliDetail = typeof pesan_beli_detail.$inferSelect;
export type FakturBeli = typeof faktur_beli.$inferSelect;
export type FakturBeliDetail = typeof faktur_beli_detail.$inferSelect;
export type BayarHutang = typeof bayar_hutang.$inferSelect;

export type PesanCabang = typeof pesan_cabang.$inferSelect;
export type PesanCabangDetail = typeof pesan_cabang_detail.$inferSelect;
export type Pengiriman = typeof pengiriman.$inferSelect;
export type PengirimanDetail = typeof pengiriman_detail.$inferSelect;

export type TipeAkun = typeof tipe_akun.$inferSelect;
export type DaftarAkun = typeof daftar_akun.$inferSelect;
export type JurnalUmum = typeof jurnal_umum.$inferSelect;

