import { pgTable, text, integer, serial, boolean, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── JABATAN ─────────────────────────────────────────────────────────────────
export const jabatan = pgTable("jabatan", {
  id_jabatan: serial("id_jabatan").primaryKey(),
  jabatan: text("jabatan").notNull(),
});

// ─── CABANG ──────────────────────────────────────────────────────────────────
export const cabang = pgTable("cabang", {
  id_cabang: serial("id_cabang").primaryKey(),
  kode_cabang: text("kode_cabang").notNull(),
  nama_cabang: text("nama_cabang").notNull(),
  alamat: text("alamat").notNull(),
  telepon: text("telepon"),
  email: text("email"),
  admin: integer("admin"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  data_kode: text("data_kode"),
  is_dc: boolean("is_dc").default(false).notNull(),
  jenis_cabang: text("jenis_cabang").default("INTERNAL").notNull(),
  nisbah_pengelola: numeric("nisbah_pengelola").default("0"),
  nisbah_investor: numeric("nisbah_investor").default("0"),
  total_modal_investor: numeric("total_modal_investor").default("0"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── CABANG INVESTOR (KONSORSIUM MULTI-INVESTOR) ─────────────────────────────
export const cabang_investor = pgTable("cabang_investor", {
  id_cabang_investor: serial("id_cabang_investor").primaryKey(),
  id_cabang: integer("id_cabang").notNull(),
  nama_investor: text("nama_investor").notNull(),
  telepon: text("telepon"),
  email: text("email"),
  nilai_investasi: numeric("nilai_investasi").default("0").notNull(),
  porsi_kepemilikan: numeric("porsi_kepemilikan").default("0").notNull(),
  nama_bank: text("nama_bank"),
  no_rekening: text("no_rekening"),
  atas_nama_rekening: text("atas_nama_rekening"),
  tanggal_bergabung: text("tanggal_bergabung"),
  status: text("status").default("AKTIF").notNull(),
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  kode_user: text("kode_user").notNull(),
  nama_user: text("nama_user").notNull(),
  tempat_lahir: text("tempat_lahir"),
  tanggal_lahir: text("tanggal_lahir"),
  no_ktp: text("no_ktp"),
  pendidikan_terakhir: text("pendidikan_terakhir"),
  riwayat_lembaga: text("riwayat_lembaga"),
  riwayat_pekerjaan: text("riwayat_pekerjaan"),
  status: text("status").default("Kontrak"), // default to string status
  no_hp: text("no_hp").notNull(),
  foto: text("foto"),
  password: text("password").notNull(),
  id_jabatan: integer("id_jabatan"),
  id_cabang: integer("id_cabang"),
  tanggal_masuk: text("tanggal_masuk"),
  refresh_token: text("refresh_token"),
  refresh_token_expires: text("refresh_token_expires"),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── ABSENSI ─────────────────────────────────────────────────────────────────
export const absensi = pgTable("absensi", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  tanggal: text("tanggal").notNull(),
  jam: text("jam").notNull(),
  jenis: text("jenis").notNull(), // default to string for flexbility
  shift: text("shift"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  status_lokasi: text("status_lokasi").default("valid"),
  foto_selfie: text("foto_selfie"),
  id_shift: integer("id_shift"),
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── JAM KERJA ───────────────────────────────────────────────────────────────
export const jam_kerja = pgTable("jam_kerja", {
  id: serial("id").primaryKey(),
  nama_shift: text("nama_shift").notNull(),
  jam_masuk: text("jam_masuk").notNull(),
  jam_masuk_batas_akhir: text("jam_masuk_batas_akhir").notNull(),
  jam_pulang: text("jam_pulang").notNull(),
  jam_pulang_batas_awal: text("jam_pulang_batas_awal").notNull(),
  keterangan: text("keterangan"),
});

// ─── HARI LIBUR ──────────────────────────────────────────────────────────────
export const hari_libur = pgTable("hari_libur", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  nama_libur: text("nama_libur").notNull(),
  keterangan: text("keterangan"),
});

// ─── IZIN / CUTI ─────────────────────────────────────────────────────────────
export const izin_cuti = pgTable("izin_cuti", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  jenis: text("jenis").notNull(),
  tanggal_mulai: text("tanggal_mulai").notNull(),
  tanggal_selesai: text("tanggal_selesai").notNull(),
  keterangan: text("keterangan"),
  bukti_file: text("bukti_file"),
  status: text("status").default("pending"),
  tanggal_pengajuan: text("tanggal_pengajuan").default(
    sql`(CURRENT_TIMESTAMP)`
  ),
  tanggal_approval: text("tanggal_approval"),
  approver_id: integer("approver_id"),
  catatan_approval: text("catatan_approval"),
});

// ─── HUTANG KARYAWAN ─────────────────────────────────────────────────────────
export const hutang_karyawan = pgTable("hutang_karyawan", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  nominal: integer("nominal").notNull(),
  tanggal: text("tanggal").notNull(),
  keterangan: text("keterangan"),
  status: text("status").default("aktif"),
});

// ─── DAFTAR GAJI JABATAN ─────────────────────────────────────────────────────
export const daftar_gaji_jabatan = pgTable("daftar_gaji_jabatan", {
  id: serial("id").primaryKey(),
  id_jabatan: integer("id_jabatan").notNull(),
  gaji_pokok: integer("gaji_pokok").notNull(),
  gaji_per_jam: integer("gaji_per_jam").notNull(),
  lembur_per_jam: integer("lembur_per_jam").notNull().default(0),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── BISYAROH (PENGGAJIAN) ───────────────────────────────────────────────────
export const bisyaroh = pgTable("bisyaroh", {
  id: serial("id").primaryKey(),
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
  status: text("status").default("Draft"),
  tanggal_bayar: text("tanggal_bayar"),
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── MENU MAIN ───────────────────────────────────────────────────────────────
export const menu_main = pgTable("menu_main", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  link: text("link").notNull().default("#"),
  icon: text("icon"),
  urutan: integer("urutan").default(0),
  aktif: boolean("aktif").default(true),
});

// ─── MENU SUB ────────────────────────────────────────────────────────────────
export const menu_sub = pgTable("menu_sub", {
  id: serial("id").primaryKey(),
  id_menu_main: integer("id_menu_main").notNull(),
  nama: text("nama").notNull(),
  link: text("link").notNull(),
  urutan: integer("urutan").default(0),
  aktif: boolean("aktif").default(true),
});

// ─── ROLE MENU ───────────────────────────────────────────────────────────────
export const role_menu = pgTable("role_menu", {
  id: serial("id").primaryKey(),
  id_jabatan: integer("id_jabatan").notNull(),
  id_menu_main: integer("id_menu_main").notNull(),
  aktif: boolean("aktif").default(true),
  can_create: boolean("can_create").default(false),
  can_read: boolean("can_read").default(true),
  can_update: boolean("can_update").default(false),
  can_delete: boolean("can_delete").default(false),
});

// ─── ROLE MENU SUB ───────────────────────────────────────────────────────────
export const role_menu_sub = pgTable("role_menu_sub", {
  id: serial("id").primaryKey(),
  id_jabatan: integer("id_jabatan").notNull(),
  id_menu_sub: integer("id_menu_sub").notNull(),
  aktif: boolean("aktif").default(true),
  can_create: boolean("can_create").default(false),
  can_read: boolean("can_read").default(true),
  can_update: boolean("can_update").default(false),
  can_delete: boolean("can_delete").default(false),
});

// ─── LOGIN ATTEMPTS ──────────────────────────────────────────────────────────
export const login_attempts = pgTable("login_attempts", {
  identifier: text("identifier").primaryKey(),
  attempts: integer("attempts").notNull().default(1),
  last_attempt: text("last_attempt").notNull(),
});

// ─── LOG LOGIN ───────────────────────────────────────────────────────────────
export const log_login = pgTable("log_login", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  waktu: text("waktu").notNull(),
  status: text("status").notNull(),
  ip_address: text("ip_address"),
});

// ─── KATEGORI BARANG ─────────────────────────────────────────────────────────
export const kategori_barang = pgTable("kategori_barang", {
  id_kategori: serial("id_kategori").primaryKey(),
  kode_kategori: text("kode_kategori").notNull(),
  nama_kategori: text("nama_kategori").notNull(),
});

// ─── SUPPLIER ────────────────────────────────────────────────────────────────
export const supplier = pgTable("supplier", {
  id_supplier: serial("id_supplier").primaryKey(),
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
export const barang = pgTable("barang", {
  id_barang: serial("id_barang").primaryKey(),
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
  barcode_satuan_2: text("barcode_satuan_2"),
  barcode_satuan_3: text("barcode_satuan_3"),
  tipe_barang: text("tipe_barang").default("STOK"), // 'STOK' | 'JASA' | 'HABIS_PAKAI'
  lacak_kadaluarsa: boolean("lacak_kadaluarsa").default(false),
  keterangan_1: text("keterangan_1"),
  keterangan_2: text("keterangan_2"),
});

// ─── STOK BARANG ─────────────────────────────────────────────────────────────
export const stok_barang = pgTable("stok_barang", {
  id: serial("id").primaryKey(),
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
export const pelanggan = pgTable("pelanggan", {
  id_pelanggan: serial("id_pelanggan").primaryKey(),
  kode_pelanggan: text("kode_pelanggan").notNull(),
  nama_lengkap: text("nama_lengkap").notNull(),
  email: text("email"),
  alamat: text("alamat"),
  telepon: text("telepon"),
  level_harga: integer("level_harga").default(1),
  total_poin: integer("total_poin").default(0),
});

// ─── PENJUALAN ───────────────────────────────────────────────────────────────
export const penjualan = pgTable("penjualan", {
  id_penjualan: serial("id_penjualan").primaryKey(),
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
export const penjualan_detail = pgTable("penjualan_detail", {
  id: serial("id").primaryKey(),
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
export const riwayat_poin = pgTable("riwayat_poin", {
  id: serial("id").primaryKey(),
  id_pelanggan: integer("id_pelanggan").references(() => pelanggan.id_pelanggan),
  jenis_transaksi: text("jenis_transaksi").notNull(),
  jumlah_poin: integer("jumlah_poin").notNull(),
  keterangan: text("keterangan"),
  id_referensi_transaksi: text("id_referensi_transaksi"),
  waktu: text("waktu").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── INFAQ ───────────────────────────────────────────────────────────────────
export const infaq = pgTable("infaq", {
  id: serial("id").primaryKey(),
  id_penjualan: integer("id_penjualan").references(() => penjualan.id_penjualan),
  no_invoice: text("no_invoice").notNull(),
  jumlah_infaq: integer("jumlah_infaq").notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang),
  id_user: integer("id_user").references(() => users.id),
  waktu: text("waktu").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── VOUCHERS ────────────────────────────────────────────────────────────────
export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  kode_voucher: text("kode_voucher").notNull(),
  nilai: integer("nilai").notNull(),
  status: text("status").default("AKTIF"),
});

// ─── PEMESANAN PEMBELIAN (PO) ────────────────────────────────────────────────
export const pesan_beli = pgTable("pesan_beli", {
  id_pesan_beli: serial("id_pesan_beli").primaryKey(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
  tanggal_pesan_beli: text("tanggal_pesan_beli").notNull(),
  nomor_pesan_beli: text("nomor_pesan_beli").notNull(),
  keterangan: text("keterangan"),
  total_harga_pesan_beli: integer("total_harga_pesan_beli").notNull(),
  status: text("status").default("PENDING"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PEMESANAN PEMBELIAN DETAIL ───────────────────────────────────────────────
export const pesan_beli_detail = pgTable("pesan_beli_detail", {
  id: serial("id").primaryKey(),
  id_pesan_beli: integer("id_pesan_beli").references(() => pesan_beli.id_pesan_beli).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  nama_barang: text("nama_barang").notNull(),
  jumlah_barang: integer("jumlah_barang").notNull(),
  jumlah_diterima: integer("jumlah_diterima").default(0).notNull(),
  harga_satuan: integer("harga_satuan").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// ─── FAKTUR PEMBELIAN (RECEIVING) ────────────────────────────────────────────
export const faktur_beli = pgTable("faktur_beli", {
  id_faktur: serial("id_faktur").primaryKey(),
  id_po: integer("id_po").references(() => pesan_beli.id_pesan_beli),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
  tanggal_faktur: text("tanggal_faktur").notNull(),
  nomor_faktur: text("nomor_faktur").notNull(),
  total_faktur: integer("total_faktur").notNull(),
  diskon_total: integer("diskon_total").default(0),
  ppn_rate: integer("ppn_rate").default(0),
  biaya_ongkir: integer("biaya_ongkir").default(0),
  biaya_bongkar: integer("biaya_bongkar").default(0),
  biaya_asuransi: integer("biaya_asuransi").default(0),
  metode_alokasi_landed_cost: text("metode_alokasi_landed_cost").default("NILAI"),
  total_biaya_tambahan: integer("total_biaya_tambahan").default(0),
  grand_total: integer("grand_total"),
  status_pembayaran: text("status_pembayaran").default("Belum Dibayar"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── FAKTUR PEMBELIAN DETAIL ──────────────────────────────────────────────────
export const faktur_beli_detail = pgTable("faktur_beli_detail", {
  id: serial("id").primaryKey(),
  id_faktur: integer("id_faktur").references(() => faktur_beli.id_faktur).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  nama_barang: text("nama_barang"),
  jumlah_beli: integer("jumlah_beli").notNull(),
  harga_satuan: integer("harga_satuan").notNull(),
  subtotal: integer("subtotal").notNull(),
  nomor_batch: text("nomor_batch"),
  tanggal_kadaluarsa: text("tanggal_kadaluarsa"),
  alokasi_biaya_tambahan: integer("alokasi_biaya_tambahan").default(0),
  hpp_efektif_satuan: integer("hpp_efektif_satuan"),
});

// ─── RIWAYAT BAYAR HUTANG SUPPLIER ────────────────────────────────────────────
export const bayar_hutang = pgTable("bayar_hutang", {
  id: serial("id").primaryKey(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
  tanggal_bayar: text("tanggal_bayar").notNull(),
  jumlah_bayar: integer("jumlah_bayar").notNull(),
  metode_pembayaran: text("metode_pembayaran").notNull(),
  keterangan: text("keterangan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PERMINTAAN BARANG ANTAR CABANG (PESAN CABANG) ───────────────────────────
export const pesan_cabang = pgTable("pesan_cabang", {
  id_request: serial("id_request").primaryKey(),
  kode_request: text("kode_request").notNull(),
  id_cabang_peminta: integer("id_cabang_peminta").references(() => cabang.id_cabang).notNull(),
  id_cabang_sumber: integer("id_cabang_sumber").references(() => cabang.id_cabang).notNull(),
  id_user_peminta: integer("id_user_peminta").references(() => users.id).notNull(),
  status: text("status").default("Pending"),
  tanggal_request: text("tanggal_request").notNull(),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── PERMINTAAN BARANG DETAIL ──────────────────────────────────────────────────
export const pesan_cabang_detail = pgTable("pesan_cabang_detail", {
  id: serial("id").primaryKey(),
  id_request: integer("id_request").references(() => pesan_cabang.id_request).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_satuan: integer("id_satuan"),
  jumlah_diminta: integer("jumlah_diminta").notNull(),
  status_item: text("status_item").default("Diproses"),
});

// ─── PENGIRIMAN BARANG ANTAR CABANG ──────────────────────────────────────────
export const pengiriman = pgTable("pengiriman", {
  id_pengiriman: serial("id_pengiriman").primaryKey(),
  kode_pengiriman: text("kode_pengiriman").notNull(),
  id_cabang_sumber: integer("id_cabang_sumber").references(() => cabang.id_cabang).notNull(),
  id_cabang_tujuan: integer("id_cabang_tujuan").references(() => cabang.id_cabang).notNull(),
  id_user_pengirim: integer("id_user_pengirim").references(() => users.id).notNull(),
  id_user_penerima: integer("id_user_penerima").references(() => users.id),
  jenis_pengiriman: text("jenis_pengiriman").default("CABANG"),
  id_rekomendasi: integer("id_rekomendasi"),
  armada: text("armada"),
  driver: text("driver"),
  status: text("status").default("Draft"),
  tanggal_kirim: text("tanggal_kirim").notNull(),
  tanggal_terima: text("tanggal_terima"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── DETAIL PENGIRIMAN BARANG ─────────────────────────────────────────────────
export const pengiriman_detail = pgTable("pengiriman_detail", {
  id_detail_kirim: serial("id_detail_kirim").primaryKey(),
  id_pengiriman: integer("id_pengiriman").references(() => pengiriman.id_pengiriman).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_dikirim: integer("jumlah_dikirim").notNull(),
  jumlah_diterima: integer("jumlah_diterima"),
  id_request_detail: integer("id_request_detail").references(() => pesan_cabang_detail.id),
  status_selisih: text("status_selisih"),
  catatan_penerima: text("catatan_penerima"),
});

// ─── DMS: STOK SETTING PER CABANG ────────────────────────────────────────────
export const stok_setting_cabang = pgTable("stok_setting_cabang", {
  id: serial("id").primaryKey(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  minimum_stock: integer("minimum_stock").default(0).notNull(),
  safety_stock: integer("safety_stock").default(0).notNull(),
  target_days_stock: integer("target_days_stock").default(14).notNull(),
  lead_time_days: integer("lead_time_days").default(2).notNull(),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── DMS: SALES VELOCITY (KECEPATAN PENJUALAN) ───────────────────────────────
export const sales_velocity = pgTable("sales_velocity", {
  id: serial("id").primaryKey(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  ads_7: integer("ads_7").default(0),
  ads_30: integer("ads_30").default(0),
  ads_90: integer("ads_90").default(0),
  last_calculated: text("last_calculated"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── DMS: FORECAST STOK ──────────────────────────────────────────────────────
export const forecast_stok = pgTable("forecast_stok", {
  id: serial("id").primaryKey(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  stok_sekarang: integer("stok_sekarang").default(0).notNull(),
  ads: integer("ads").default(0),
  estimasi_habis_hari: integer("estimasi_habis_hari").default(0),
  tanggal_habis: text("tanggal_habis"),
  status: text("status").default("AMAN"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── DMS: REKOMENDASI PENGIRIMAN (HEADER) ────────────────────────────────────
export const rekomendasi_pengiriman = pgTable("rekomendasi_pengiriman", {
  id: serial("id").primaryKey(),
  kode_rekomendasi: text("kode_rekomendasi").notNull(),
  tanggal_rekomendasi: text("tanggal_rekomendasi").notNull(),
  status: text("status").default("DRAFT"),
  dibuat_oleh: integer("dibuat_oleh").references(() => users.id),
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── DMS: REKOMENDASI PENGIRIMAN DETAIL ──────────────────────────────────────
export const rekomendasi_pengiriman_detail = pgTable("rekomendasi_pengiriman_detail", {
  id: serial("id").primaryKey(),
  id_rekomendasi: integer("id_rekomendasi").references(() => rekomendasi_pengiriman.id).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_cabang_tujuan: integer("id_cabang_tujuan").references(() => cabang.id_cabang).notNull(),
  stok_sekarang: integer("stok_sekarang").default(0).notNull(),
  ads: integer("ads").default(0),
  qty_rekomendasi: integer("qty_rekomendasi").default(0).notNull(),
  target_stock: integer("target_stock").default(0).notNull(),
  prioritas_score: integer("prioritas_score").default(0),
  qty_approved: integer("qty_approved"),
});

// ─── DMS: PENGIRIMAN SELISIH ──────────────────────────────────────────────────
export const pengiriman_selisih = pgTable("pengiriman_selisih", {
  id: serial("id").primaryKey(),
  id_pengiriman: integer("id_pengiriman").references(() => pengiriman.id_pengiriman).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_dikirim: integer("jumlah_dikirim").notNull(),
  jumlah_diterima: integer("jumlah_diterima").notNull(),
  selisih: integer("selisih").notNull(),
  jenis_selisih: text("jenis_selisih").notNull(),
  alasan: text("alasan"),
  foto_bukti: text("foto_bukti"),
  status: text("status").default("MENUNGGU_PEMERIKSAAN"),
  dibuat_oleh: text("dibuat_oleh"),
  disetujui_oleh: integer("disetujui_oleh").references(() => users.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── TIPE AKUN ───────────────────────────────────────────────────────────────
export const tipe_akun = pgTable("tipe_akun", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  posisi_saldo_normal: text("posisi_saldo_normal").notNull(),
});

// ─── DAFTAR AKUN / COA ────────────────────────────────────────────────────────
export const daftar_akun = pgTable("daftar_akun", {
  id: serial("id").primaryKey(),
  kode_akun: text("kode_akun").notNull(),
  nama_akun: text("nama_akun").notNull(),
  deskripsi: text("deskripsi"),
  tipe_akun_id: integer("tipe_akun_id").references(() => tipe_akun.id).notNull(),
  status: text("status").default("Aktif"),
});

// ─── JURNAL UMUM ─────────────────────────────────────────────────────────────
export const jurnal_umum = pgTable("jurnal_umum", {
  id: serial("id").primaryKey(),
  tanggal_transaksi: text("tanggal_transaksi").notNull(),
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
export const promo = pgTable("promo", {
  id_promo: serial("id_promo").primaryKey(),
  nama_promo: text("nama_promo").notNull(),
  tipe_promo: text("tipe_promo").notNull(),
  deskripsi: text("deskripsi"),
  berlaku_untuk: text("berlaku_untuk").notNull(),
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

export const promo_cabang = pgTable("promo_cabang", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
});

export const promo_syarat_pembelanjaan = pgTable("promo_syarat_pembelanjaan", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  minimum_pembelanjaan: integer("minimum_pembelanjaan").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
});

export const promo_syarat_kategori = pgTable("promo_syarat_kategori", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_kategori: integer("id_kategori").references(() => kategori_barang.id_kategori).notNull(),
});

export const promo_syarat_supplier = pgTable("promo_syarat_supplier", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_supplier: integer("id_supplier").references(() => supplier.id_supplier).notNull(),
});

export const promo_hadiah_poin = pgTable("promo_hadiah_poin", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  jumlah_poin: integer("jumlah_poin").notNull(),
});

export const promo_hadiah_diskon = pgTable("promo_hadiah_diskon", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  jenis_diskon: text("jenis_diskon").notNull(),
  nilai_diskon: integer("nilai_diskon").notNull(),
});

export const promo_syarat_barang_tertentu = pgTable("promo_syarat_barang_tertentu", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
});

export const promo_syarat_beli = pgTable("promo_syarat_beli", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
});

export const promo_hadiah_gratis = pgTable("promo_hadiah_gratis", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
});

export const promo_diskon_barang = pgTable("promo_diskon_barang", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
  jenis_diskon: text("jenis_diskon").notNull(),
  nilai_diskon: integer("nilai_diskon").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
});

export const promo_poin_barang = pgTable("promo_poin_barang", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah_barang: integer("jumlah_barang").notNull(),
  id_satuan: integer("id_satuan").notNull(),
  jumlah_poin: integer("jumlah_poin").notNull(),
  berlaku_kelipatan: integer("berlaku_kelipatan").default(0).notNull(),
});

export const promo_hadiah_barang = pgTable("promo_hadiah_barang", {
  id: serial("id").primaryKey(),
  id_promo: integer("id_promo").references(() => promo.id_promo).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  jumlah: integer("jumlah").notNull(),
  id_satuan: integer("id_satuan").notNull(),
});

export const promo_barang_tebus_murah = pgTable("promo_barang_tebus_murah", {
  id: serial("id").primaryKey(),
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

// ─── DMS TYPES ───────────────────────────────────────────────────────────────
export type StokSettingCabang = typeof stok_setting_cabang.$inferSelect;
export type SalesVelocity = typeof sales_velocity.$inferSelect;
export type ForecastStok = typeof forecast_stok.$inferSelect;
export type RekomendasiPengiriman = typeof rekomendasi_pengiriman.$inferSelect;
export type RekomendasiPengirimanDetail = typeof rekomendasi_pengiriman_detail.$inferSelect;
export type PengirimanSelisih = typeof pengiriman_selisih.$inferSelect;

// ─── PENGATURAN APLIKASI ──────────────────────────────────────────────────────
export const pengaturan_aplikasi = pgTable("pengaturan_aplikasi", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export type PengaturanAplikasi = typeof pengaturan_aplikasi.$inferSelect;

// ─── REKENING KAS ────────────────────────────────────────────────────────────
export const rekening_kas = pgTable("rekening_kas", {
  id: serial("id").primaryKey(),
  kode: text("kode").notNull(),
  nama: text("nama").notNull(),
  jenis: text("jenis").notNull(), // 'KAS_TOKO' | 'KAS_DC' | 'BANK' | 'PETTY_CASH'
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  saldo_awal: integer("saldo_awal").default(0).notNull(),
  saldo: integer("saldo").default(0).notNull(),
  id_akun_coa: integer("id_akun_coa").references(() => daftar_akun.id),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── KAS TRANSAKSI ───────────────────────────────────────────────────────────
export const kas_transaksi = pgTable("kas_transaksi", {
  id: serial("id").primaryKey(),
  nomor_transaksi: text("nomor_transaksi").notNull().unique(),
  id_rekening: integer("id_rekening").references(() => rekening_kas.id).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  tipe: text("tipe").notNull(), // 'MASUK' | 'KELUAR' | 'TRANSFER'
  kategori: text("kategori"),   // 'PENJUALAN' | 'OPERASIONAL' | 'GAJI' | 'PEMBELIAN' | 'LAIN'
  nominal: integer("nominal").notNull(),
  tanggal: text("tanggal").notNull(),
  keterangan: text("keterangan"),
  referensi_type: text("referensi_type"), // 'PENJUALAN' | 'FAKTUR_BELI' | 'SHIFT' | 'MANUAL'
  referensi_id: integer("referensi_id"),
  id_rekening_tujuan: integer("id_rekening_tujuan").references(() => rekening_kas.id),
  bukti: text("bukti"),
  status: text("status").default("APPROVED"), // 'PENDING' | 'APPROVED' | 'REVERSED'
  id_jurnal: integer("id_jurnal"),
  created_by: integer("created_by").references(() => users.id),
  approved_by: integer("approved_by").references(() => users.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── KASIR SHIFT ─────────────────────────────────────────────────────────────
export const kasir_shift = pgTable("kasir_shift", {
  id: serial("id").primaryKey(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_kasir: integer("id_kasir").references(() => users.id).notNull(),
  id_rekening: integer("id_rekening").references(() => rekening_kas.id).notNull(),
  waktu_buka: text("waktu_buka").notNull(),
  waktu_tutup: text("waktu_tutup"),
  saldo_awal: integer("saldo_awal").default(0).notNull(),
  total_sistem: integer("total_sistem").default(0),
  total_tunai: integer("total_tunai").default(0),
  total_transfer: integer("total_transfer").default(0),
  uang_fisik: integer("uang_fisik"),
  selisih: integer("selisih"),
  setoran: integer("setoran").default(0),
  catatan: text("catatan"),
  status: text("status").default("OPEN"), // 'OPEN' | 'CLOSING' | 'VERIFIED'
  verified_by: integer("verified_by").references(() => users.id),
  verified_at: text("verified_at"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── KASIR JADWAL ────────────────────────────────────────────────────────────
export const kasir_jadwal = pgTable("kasir_jadwal", {
  id: serial("id").primaryKey(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_kasir: integer("id_kasir").references(() => users.id).notNull(),
  id_shift: integer("id_shift").references(() => jam_kerja.id).notNull(),
  tanggal: text("tanggal").notNull(), // Format YYYY-MM-DD
  catatan: text("catatan"),
  aktif: boolean("aktif").default(true).notNull(),
  created_by: integer("created_by").references(() => users.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── REKONSILIASI KAS ────────────────────────────────────────────────────────
export const rekonsiliasi_kas = pgTable("rekonsiliasi_kas", {
  id: serial("id").primaryKey(),
  id_rekening: integer("id_rekening").references(() => rekening_kas.id).notNull(),
  tanggal: text("tanggal").notNull(),
  saldo_sistem: integer("saldo_sistem").notNull(),
  saldo_fisik: integer("saldo_fisik").notNull(),
  selisih: integer("selisih").notNull(),
  alasan: text("alasan"),
  bukti: text("bukti"),
  status: text("status").default("PENDING"), // 'PENDING' | 'APPROVED' | 'REJECTED'
  approved_by: integer("approved_by").references(() => users.id),
  approved_at: text("approved_at"),
  created_by: integer("created_by").references(() => users.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export type RekeningKas = typeof rekening_kas.$inferSelect;
export type KasTransaksi = typeof kas_transaksi.$inferSelect;
export type KasirShift = typeof kasir_shift.$inferSelect;
export type KasirJadwal = typeof kasir_jadwal.$inferSelect;
export type RekonsiliasiKas = typeof rekonsiliasi_kas.$inferSelect;

// ─── PERIODE AKUNTANSI & CLOSING LOCK ─────────────────────────────────────────
export const periode_akuntansi = pgTable("periode_akuntansi", {
  id: serial("id").primaryKey(),
  bulan: integer("bulan").notNull(),                         // 1 - 12
  tahun: integer("tahun").notNull(),                         // Contoh: 2026
  tanggal_mulai: text("tanggal_mulai").notNull(),            // YYYY-MM-DD
  tanggal_akhir: text("tanggal_akhir").notNull(),            // YYYY-MM-DD
  status: text("status").default("OPEN").notNull(),          // 'OPEN' | 'SOFT_LOCKED' | 'HARD_CLOSED'
  lock_date: text("lock_date"),                              // Tanggal batas transaksi yang dikunci
  closed_by: integer("closed_by").references(() => users.id),
  closed_at: text("closed_at"),
  reopen_reason: text("reopen_reason"),                      // Alasan re-open oleh Super User
  reopened_by: integer("reopened_by").references(() => users.id),
  reopened_at: text("reopened_at"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── MASTER MULTI-PAJAK ──────────────────────────────────────────────────────
export const master_pajak = pgTable("master_pajak", {
  id: serial("id").primaryKey(),
  kode_pajak: text("kode_pajak").notNull().unique(),         // Misal: "PPN11", "PPN12", "PB1", "PPH23"
  nama_pajak: text("nama_pajak").notNull(),                  // Contoh: "PPN Dalam Negeri 12%"
  tipe_pajak: text("tipe_pajak").notNull(),                  // 'PPN' | 'PPH' | 'PAJAK_DAERAH'
  tarif_persen: numeric("tarif_persen", { precision: 5, scale: 2 }).notNull(), // Contoh: 11.00, 12.00, 2.00
  akun_pajak_keluaran: integer("akun_pajak_keluaran").references(() => daftar_akun.id), // Hutang Pajak (CoA)
  akun_pajak_masukan: integer("akun_pajak_masukan").references(() => daftar_akun.id),   // Piutang Pajak (CoA)
  is_aktif: boolean("is_aktif").default(true).notNull(),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const barang_pajak = pgTable("barang_pajak", {
  id: serial("id").primaryKey(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_pajak: integer("id_pajak").references(() => master_pajak.id).notNull(),
  is_include_harga: boolean("is_include_harga").default(true).notNull(), // True: Harga jual sudah termasuk PPN
});

// ─── ASET TETAP & DEPRESIASI ──────────────────────────────────────────────────
export const aset_tetap = pgTable("aset_tetap", {
  id: serial("id").primaryKey(),
  kode_aset: text("kode_aset").notNull().unique(),           // "AST-FREEZER-001"
  nama_aset: text("nama_aset").notNull(),                    // "Freezer Es Krim Toko Sukosari"
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  kategori_aset: text("kategori_aset").notNull(),            // "Peralatan", "Kendaraan", "Elektronik", "Bangunan"
  tanggal_perolehan: text("tanggal_perolehan").notNull(),    // YYYY-MM-DD
  harga_perolehan: integer("harga_perolehan").notNull(),     // Modal beli
  nilai_residu: integer("nilai_residu").default(0).notNull(),// Nilai sisa di akhir masa manfaat
  masa_manfaat_bulan: integer("masa_manfaat_bulan").notNull(), // Umur ekonomis dalam bulan (misal 48 bulan = 4 thn)
  metode_penyusutan: text("metode_penyusutan").default("GARIS_LURUS").notNull(),
  beban_penyusutan_per_bulan: integer("beban_penyusutan_per_bulan").notNull(),
  akumulasi_penyusutan: integer("akumulasi_penyusutan").default(0).notNull(),
  nilai_buku: integer("nilai_buku").notNull(),               // harga_perolehan - akumulasi_penyusutan
  akun_aset_id: integer("akun_aset_id").references(() => daftar_akun.id).notNull(),
  akun_akumulasi_id: integer("akun_akumulasi_id").references(() => daftar_akun.id).notNull(),
  akun_beban_id: integer("akun_beban_id").references(() => daftar_akun.id).notNull(),
  status: text("status").default("AKTIF").notNull(),         // 'AKTIF' | 'DIHAPUSKAN' | 'TERJUAL'
  tanggal_disposal: text("tanggal_disposal"),
  nilai_disposal: integer("nilai_disposal"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const riwayat_penyusutan = pgTable("riwayat_penyusutan", {
  id: serial("id").primaryKey(),
  id_aset: integer("id_aset").references(() => aset_tetap.id).notNull(),
  periode_bulan: integer("periode_bulan").notNull(),
  periode_tahun: integer("periode_tahun").notNull(),
  nominal_penyusutan: integer("nominal_penyusutan").notNull(),
  id_jurnal: integer("id_jurnal").references(() => jurnal_umum.id),
  tanggal_eksekusi: text("tanggal_eksekusi").notNull(),
  dieksekusi_oleh: integer("dieksekusi_oleh").references(() => users.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export type PeriodeAkuntansi = typeof periode_akuntansi.$inferSelect;
export type MasterPajak = typeof master_pajak.$inferSelect;
export type BarangPajak = typeof barang_pajak.$inferSelect;
export type AsetTetap = typeof aset_tetap.$inferSelect;
export type RiwayatPenyusutan = typeof riwayat_penyusutan.$inferSelect;

// ==========================================
// 4. BATCH NUMBER & EXPIRED DATE TRACKING
// ==========================================
export const barang_batch = pgTable("barang_batch", {
  id_batch: serial("id_batch").primaryKey(),
  nomor_batch: text("nomor_batch").notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  tanggal_masuk: text("tanggal_masuk").notNull(),
  tanggal_kadaluarsa: text("tanggal_kadaluarsa").notNull(),
  stok_batch: integer("stok_batch").notNull().default(0),
  hpp_batch: integer("hpp_batch").notNull().default(0),
  status: text("status").notNull().default("AKTIF"), // 'AKTIF' | 'KADALUARSA' | 'HABIS'
  catatan: text("catatan"),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ==========================================
// 5. MODUL STOCK OPNAME FISIK & SELISIH
// ==========================================
export const stok_opname = pgTable("stok_opname", {
  id_opname: serial("id_opname").primaryKey(),
  nomor_opname: text("nomor_opname").notNull().unique(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  tanggal_opname: text("tanggal_opname").notNull(),
  id_petugas: integer("id_petugas").references(() => users.id).notNull(),
  status: text("status").notNull().default("DRAFT"), // 'DRAFT' | 'MENUNGGU_APPROVAL' | 'DISETUJUI' | 'DIBATALKAN'
  total_selisih_item: integer("total_selisih_item").default(0),
  total_selisih_rupiah: integer("total_selisih_rupiah").default(0),
  catatan: text("catatan"),
  id_approver: integer("id_approver").references(() => users.id),
  approved_at: text("approved_at"),
  id_jurnal: integer("id_jurnal").references(() => jurnal_umum.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const stok_opname_detail = pgTable("stok_opname_detail", {
  id: serial("id").primaryKey(),
  id_opname: integer("id_opname").references(() => stok_opname.id_opname, { onDelete: "cascade" }).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  stok_sistem: integer("stok_sistem").notNull(),
  stok_fisik: integer("stok_fisik").notNull(),
  selisih_qty: integer("selisih_qty").notNull(),
  hpp_satuan: integer("hpp_satuan").notNull(),
  selisih_rupiah: integer("selisih_rupiah").notNull(),
  alasan_selisih: text("alasan_selisih"), // 'Barang Rusak/Bocor' | 'Hilang/Kurang' | 'Salah Input Kasir' | 'Barang Lebih'
  catatan: text("catatan"),
});

export type BarangBatch = typeof barang_batch.$inferSelect;
export type StokOpname = typeof stok_opname.$inferSelect;
export type StokOpnameDetail = typeof stok_opname_detail.$inferSelect;

// ==========================================
// 6. MULTI-BIN SUB-LOKASI GUDANG CABANG
// ==========================================
export const gudang_lokasi = pgTable("gudang_lokasi", {
  id_lokasi: serial("id_lokasi").primaryKey(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  kode_lokasi: text("kode_lokasi").notNull(),
  nama_lokasi: text("nama_lokasi").notNull(),
  tipe_lokasi: text("tipe_lokasi").default("DISPLAY").notNull(), // 'DISPLAY' | 'GUDANG_UTAMA' | 'KARANTINA'
  keterangan: text("keterangan"),
  is_aktif: boolean("is_aktif").default(true).notNull(),
});

export const stok_lokasi = pgTable("stok_lokasi", {
  id: serial("id").primaryKey(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_lokasi: integer("id_lokasi").references(() => gudang_lokasi.id_lokasi).notNull(),
  stok_qty: integer("stok_qty").default(0).notNull(),
  posisi_rak: text("posisi_rak"),
});

// ==========================================
// 7. UNIVERSAL STOCK LEDGER (KARTU STOK)
// ==========================================
export const kartu_stok = pgTable("kartu_stok", {
  id_kartu: serial("id_kartu").primaryKey(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  id_lokasi: integer("id_lokasi").references(() => gudang_lokasi.id_lokasi),
  tanggal_transaksi: text("tanggal_transaksi").notNull(),
  tipe_transaksi: text("tipe_transaksi").notNull(),
  nomor_referensi: text("nomor_referensi").notNull(),
  saldo_awal: integer("saldo_awal").notNull(),
  masuk: integer("masuk").default(0).notNull(),
  keluar: integer("keluar").default(0).notNull(),
  saldo_akhir: integer("saldo_akhir").notNull(),
  hpp_satuan: integer("hpp_satuan").default(0).notNull(),
  total_nilai: integer("total_nilai").default(0).notNull(),
  keterangan: text("keterangan"),
  id_user: integer("id_user").references(() => users.id).notNull(),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// ==========================================
// 8. QUICK ADJUSTMENT (PENYESUAIAN CEPAT STOK)
// ==========================================
export const stok_adjustment = pgTable("stok_adjustment", {
  id_adj: serial("id_adj").primaryKey(),
  nomor_adj: text("nomor_adj").notNull().unique(),
  id_cabang: integer("id_cabang").references(() => cabang.id_cabang).notNull(),
  tanggal_adj: text("tanggal_adj").notNull(),
  id_petugas: integer("id_petugas").references(() => users.id).notNull(),
  tipe_alasan: text("tipe_alasan").notNull(),
  tindakan_stok: text("tindakan_stok").default("PINDAH_KE_KARANTINA").notNull(),
  total_item: integer("total_item").default(1).notNull(),
  total_nilai_kerugian: integer("total_nilai_kerugian").default(0).notNull(),
  keterangan: text("keterangan"),
  id_jurnal: integer("id_jurnal").references(() => jurnal_umum.id),
  created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const stok_adjustment_detail = pgTable("stok_adjustment_detail", {
  id: serial("id").primaryKey(),
  id_adj: integer("id_adj").references(() => stok_adjustment.id_adj, { onDelete: "cascade" }).notNull(),
  id_barang: integer("id_barang").references(() => barang.id_barang).notNull(),
  id_lokasi_asal: integer("id_lokasi_asal").references(() => gudang_lokasi.id_lokasi),
  id_lokasi_tujuan: integer("id_lokasi_tujuan").references(() => gudang_lokasi.id_lokasi),
  stok_sebelum: integer("stok_sebelum").notNull(),
  qty_penyesuaian: integer("qty_penyesuaian").notNull(),
  stok_setelah: integer("stok_setelah").notNull(),
  hpp_satuan: integer("hpp_satuan").notNull(),
  subtotal_nilai: integer("subtotal_nilai").notNull(),
  id_batch: integer("id_batch").references(() => barang_batch.id_batch),
});

export type GudangLokasi = typeof gudang_lokasi.$inferSelect;
export type StokLokasi = typeof stok_lokasi.$inferSelect;
export type KartuStok = typeof kartu_stok.$inferSelect;
export type StokAdjustment = typeof stok_adjustment.$inferSelect;
export type StokAdjustmentDetail = typeof stok_adjustment_detail.$inferSelect;



