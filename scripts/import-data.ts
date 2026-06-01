import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";

const DB_PATH = path.join(process.cwd(), "erp-almubarok.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF"); // Disable foreign keys for bulk import

const db = drizzle(sqlite, { schema });

async function importData() {
  console.log("📂 Reading data.json...");
  const dataPath = path.join(process.cwd(), "data.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ File data.json not found at: ${dataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw);

  const getTableData = (name: string): any[] => {
    const table = parsed.find((item: any) => item.type === "table" && item.name === name);
    return table ? table.data : [];
  };

  console.log("🧹 Clearing existing data in tables...");
  // Clear tables in general reverse dependency order
  const tablesToClear = [
    schema.jurnal_umum,
    schema.daftar_akun,
    schema.tipe_akun,
    schema.pengiriman_detail,
    schema.pengiriman,
    schema.pesan_cabang_detail,
    schema.pesan_cabang,
    schema.faktur_beli_detail,
    schema.faktur_beli,
    schema.pesan_beli_detail,
    schema.pesan_beli,
    schema.infaq,
    schema.riwayat_poin,
    schema.penjualan_detail,
    schema.penjualan,
    schema.vouchers,
    schema.pelanggan,
    schema.stok_barang,
    schema.barang,
    schema.supplier,
    schema.kategori_barang,
    schema.log_login,
    schema.login_attempts,
    schema.role_menu_sub,
    schema.role_menu,
    schema.menu_sub,
    schema.menu_main,
    schema.daftar_gaji_jabatan,
    schema.hutang_karyawan,
    schema.izin_cuti,
    schema.hari_libur,
    schema.jam_kerja,
    schema.absensi,
    schema.users,
    schema.cabang,
    schema.jabatan,
  ];

  for (const table of tablesToClear) {
    await db.delete(table);
  }
  console.log("✅ Tables cleared successfully.");

  // Helper function to insert in chunks to avoid SQLite parameter limit (999 variables)
  async function insertInChunks(table: any, values: any[], name: string, chunkSize = 50) {
    if (values.length === 0) return;
    console.log(`📥 Inserting ${values.length} rows into ${name}...`);
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      await db.insert(table).values(chunk);
    }
  }

  // 1. JABATAN
  const jabatanRows = getTableData("jabatan").map(row => ({
    id_jabatan: Number(row.id_jabatan),
    jabatan: row.jabatan,
  }));
  await insertInChunks(schema.jabatan, jabatanRows, "jabatan");

  // 2. CABANG
  const cabangRows = getTableData("cabang").map(row => ({
    id_cabang: Number(row.id_cabang),
    kode_cabang: row.kode_cabang,
    nama_cabang: row.nama_cabang,
    alamat: row.alamat,
    telepon: row.telepon,
    email: row.email,
    admin: row.admin ? Number(row.admin) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
  await insertInChunks(schema.cabang, cabangRows, "cabang");

  // 3. USERS
  const usersRows = getTableData("users").map(row => ({
    id: Number(row.id),
    kode_user: row.kode_user,
    nama_user: row.nama_user,
    tempat_lahir: row.tempat_lahir,
    tanggal_lahir: row.tanggal_lahir,
    no_ktp: row.no_ktp,
    pendidikan_terakhir: row.pendidikan_terakhir,
    riwayat_lembaga: row.riwayat_lembaga,
    riwayat_pekerjaan: row.riwayat_pekerjaan,
    status: row.status,
    no_hp: row.no_hp,
    foto: row.foto,
    password: row.password,
    id_jabatan: row.id_jabatan ? Number(row.id_jabatan) : null,
    id_cabang: row.id_cabang ? Number(row.id_cabang) : null,
    tanggal_masuk: row.tanggal_masuk,
    updated_at: row.updated_at,
  }));
  await insertInChunks(schema.users, usersRows, "users");

  // 4. ABSENSI
  const absensiRows = getTableData("absensi").map(row => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    tanggal: row.tanggal,
    jam: row.jam,
    jenis: row.jenis,
    shift: row.shift,
    latitude: row.latitude,
    longitude: row.longitude,
    status_lokasi: row.status_lokasi,
    catatan: row.catatan,
    created_at: row.created_at,
  }));
  await insertInChunks(schema.absensi, absensiRows, "absensi");

  // 5. JAM KERJA
  const jamKerjaRows = getTableData("jam_kerja").map(row => ({
    id: Number(row.id),
    nama_shift: row.nama_shift,
    jam_masuk: row.jam_masuk,
    jam_masuk_batas_akhir: row.jam_masuk_batas_akhir,
    jam_pulang: row.jam_pulang,
    jam_pulang_batas_awal: row.jam_pulang_batas_awal,
    keterangan: row.keterangan,
  }));
  await insertInChunks(schema.jam_kerja, jamKerjaRows, "jam_kerja");

  // 6. HARI LIBUR
  const hariLiburRows = getTableData("hari_libur").map(row => ({
    id: Number(row.id),
    tanggal: row.tanggal,
    nama_libur: row.nama_libur,
    keterangan: row.keterangan,
  }));
  await insertInChunks(schema.hari_libur, hariLiburRows, "hari_libur");

  // 7. IZIN CUTI
  const izinCutiRows = getTableData("izin_cuti").map(row => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    jenis: row.jenis,
    tanggal_mulai: row.tanggal_mulai,
    tanggal_selesai: row.tanggal_selesai,
    keterangan: row.keterangan,
    bukti_file: row.bukti_file,
    status: row.status,
    tanggal_pengajuan: row.tanggal_pengajuan,
    tanggal_approval: row.tanggal_approval,
    approver_id: row.approver_id ? Number(row.approver_id) : null,
    catatan_approval: row.catatan_approval,
  }));
  await insertInChunks(schema.izin_cuti, izinCutiRows, "izin_cuti");

  // 8. HUTANG KARYAWAN
  const hutangKaryawanRows = getTableData("hutang_karyawan").map(row => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    nominal: Number(row.nominal),
    tanggal: row.tanggal,
    keterangan: row.keterangan,
    status: row.status,
  }));
  await insertInChunks(schema.hutang_karyawan, hutangKaryawanRows, "hutang_karyawan");

  // 9. DAFTAR GAJI JABATAN
  const daftarGajiJabatanRows = getTableData("daftar_gaji_jabatan").map(row => ({
    id: Number(row.id),
    id_jabatan: Number(row.id_jabatan),
    gaji_pokok: Number(row.gaji_pokok),
    gaji_per_jam: Number(row.gaji_per_jam),
    lembur_per_jam: Number(row.lembur_per_jam),
    updated_at: row.updated_at,
  }));
  await insertInChunks(schema.daftar_gaji_jabatan, daftarGajiJabatanRows, "daftar_gaji_jabatan");

  // 10. MENU MAIN
  const menuMainRows = getTableData("menu_main").map(row => ({
    id: Number(row.id),
    nama: row.nama,
    link: row.link,
    icon: row.icon,
    urutan: Number(row.urutan),
    aktif: row.aktif === "1" || row.aktif === true || row.aktif === 1,
  }));
  await insertInChunks(schema.menu_main, menuMainRows, "menu_main");

  // 11. MENU SUB
  const menuSubRows = getTableData("menu_sub").map(row => ({
    id: Number(row.id),
    id_menu_main: Number(row.id_menu_main),
    nama: row.nama,
    link: row.link,
    urutan: Number(row.urutan),
    aktif: row.aktif === "1" || row.aktif === true || row.aktif === 1,
  }));
  await insertInChunks(schema.menu_sub, menuSubRows, "menu_sub");

  // 12. ROLE MENU
  const roleMenuRows = getTableData("role_menu").map(row => ({
    id: Number(row.id),
    id_jabatan: Number(row.id_jabatan),
    id_menu_main: Number(row.id_menu_main),
    aktif: row.aktif === "1" || row.aktif === true || row.aktif === 1,
  }));
  await insertInChunks(schema.role_menu, roleMenuRows, "role_menu");

  // 13. ROLE MENU SUB
  const roleMenuSubRows = getTableData("role_menu_sub").map(row => ({
    id: Number(row.id),
    id_jabatan: Number(row.id_jabatan),
    id_menu_sub: Number(row.id_menu_sub),
    aktif: row.aktif === "1" || row.aktif === true || row.aktif === 1,
  }));
  await insertInChunks(schema.role_menu_sub, roleMenuSubRows, "role_menu_sub");

  // 14. LOGIN ATTEMPTS
  const loginAttemptsRows = getTableData("login_attempts").map(row => ({
    identifier: row.identifier,
    attempts: Number(row.attempts),
    last_attempt: row.last_attempt,
  }));
  await insertInChunks(schema.login_attempts, loginAttemptsRows, "login_attempts");

  // 15. LOG LOGIN
  const logLoginRows = getTableData("log_login").map(row => ({
    id: Number(row.id),
    user_id: row.user_id ? Number(row.user_id) : null,
    waktu: row.waktu,
    status: row.status,
    ip_address: row.ip_address,
  }));
  await insertInChunks(schema.log_login, logLoginRows, "log_login");

  // 16. KATEGORI BARANG
  const kategoriBarangRows = getTableData("kategori_barang").map(row => ({
    id_kategori: Number(row.id_kategori),
    kode_kategori: row.kode_kategori,
    nama_kategori: row.nama_kategori,
  }));
  await insertInChunks(schema.kategori_barang, kategoriBarangRows, "kategori_barang");

  // 17. SUPPLIER
  const supplierRows = getTableData("supplier").map(row => ({
    id_supplier: Number(row.id_supplier),
    nama_supplier: row.nama_supplier,
    alamat: row.alamat,
    telepon: row.telepon,
    email: row.email,
    bank: row.bank,
    no_rek_bank: row.no_rek_bank,
    hari_kunjungan: row.hari_kunjungan,
    periode_kunjungan: row.periode_kunjungan,
    hutang: row.hutang ? Number(row.hutang) : 0,
    status_pajak: row.status_pajak,
    npwp: row.npwp,
    keterangan_1: row.keterangan_1,
    keterangan_2: row.keterangan_2,
  }));
  await insertInChunks(schema.supplier, supplierRows, "supplier");

  // 18. BARANG (depends on barcode lookup from barang_barcode)
  const barcodeMap = new Map<number, string>();
  getTableData("barang_barcode").forEach(row => {
    barcodeMap.set(Number(row.id_barang), row.barcode);
  });

  const barangRows = getTableData("barang").map(row => {
    const id = Number(row.id_barang);
    const barcode = barcodeMap.get(id) || `BRG-${id}`;
    return {
      id_barang: id,
      barcode: barcode,
      nama_barang: row.nama_barang,
      id_kategori: row.id_kategori ? Number(row.id_kategori) : null,
      id_supplier: row.id_supplier ? Number(row.id_supplier) : null,
      satuan_1: row.satuan_1,
      satuan_2: row.satuan_2,
      satuan_3: row.satuan_3,
      isi_1: row.isi_1 ? Number(row.isi_1) : null,
      isi_2: row.isi_2 ? Number(row.isi_2) : null,
      isi_3: row.isi_3 ? Number(row.isi_3) : null,
      harga_beli: row.harga_beli ? Number(row.harga_beli) : null,
      harga_rata: row.harga_rata ? Number(row.harga_rata) : null,
      harga_jual_1_1: row.harga_jual_1_1 ? Number(row.harga_jual_1_1) : null,
      harga_jual_1_2: row.harga_jual_1_2 ? Number(row.harga_jual_1_2) : null,
      harga_jual_1_3: row.harga_jual_1_3 ? Number(row.harga_jual_1_3) : null,
      harga_jual_2_1: row.harga_jual_2_1 ? Number(row.harga_jual_2_1) : null,
      harga_jual_2_2: row.harga_jual_2_2 ? Number(row.harga_jual_2_2) : null,
      harga_jual_2_3: row.harga_jual_2_3 ? Number(row.harga_jual_2_3) : null,
      harga_jual_3_1: row.harga_jual_3_1 ? Number(row.harga_jual_3_1) : null,
      harga_jual_3_2: row.harga_jual_3_2 ? Number(row.harga_jual_3_2) : null,
      harga_jual_3_3: row.harga_jual_3_3 ? Number(row.harga_jual_3_3) : null,
      jual_rugi: row.jual_rugi ? Number(row.jual_rugi) : 0,
      status: row.status || "Aktif",
      status_pajak: row.kd_pajak === "1" ? "PPn" : "Non PPn",
      keterangan_1: row.keterangan_1,
      keterangan_2: row.keterangan_2,
    };
  });
  await insertInChunks(schema.barang, barangRows, "barang");

  // 19. STOK BARANG
  const stokBarangRows = getTableData("stok_barang").map((row, idx) => ({
    id: idx + 1,
    id_barang: Number(row.id_barang),
    id_cabang: Number(row.id_cabang),
    stok_akhir: row.stok_akhir ? Number(row.stok_akhir) : 0,
    penjualan: row.penjualan ? Number(row.penjualan) : 0,
    transfer_masuk: row.transfer_masuk ? Number(row.transfer_masuk) : 0,
    transfer_keluar: row.transfer_keluar ? Number(row.transfer_keluar) : 0,
    posisi_rak: row.posisi_rak,
    minimal_stok: row.minimal_stok ? Number(row.minimal_stok) : 0,
    maksimal_stok: row.maksimal_stok ? Number(row.maksimal_stok) : 0,
  }));
  await insertInChunks(schema.stok_barang, stokBarangRows, "stok_barang");

  // 20. PELANGGAN
  const pelangganRows = getTableData("pelanggan").map(row => {
    const id = Number(row.id_pelanggan);
    return {
      id_pelanggan: id,
      kode_pelanggan: `PLG-${String(id).padStart(3, '0')}`,
      nama_lengkap: row.nama_lengkap,
      alamat: row.alamat,
      telepon: row.telepon,
      total_poin: row.total_poin ? Number(row.total_poin) : 0,
    };
  });
  await insertInChunks(schema.pelanggan, pelangganRows, "pelanggan");

  // 21. VOUCHERS
  const vouchersRows = getTableData("vouchers").map(row => ({
    id: Number(row.id),
    kode_voucher: row.kode_voucher,
    nilai: Number(row.nilai),
    status: row.status || "AKTIF",
  }));
  await insertInChunks(schema.vouchers, vouchersRows, "vouchers");

  // 22. PENJUALAN
  const penjualanRows = getTableData("penjualan").map(row => ({
    id_penjualan: Number(row.id_penjualan),
    no_invoice: row.no_invoice,
    tanggal_invoice: row.tanggal_invoice,
    jam_invoice: row.jam_invoice,
    id_pelanggan: row.id_pelanggan ? Number(row.id_pelanggan) : null,
    nama_pelanggan: row.nama_pelanggan,
    id_user: row.id_user ? Number(row.id_user) : null,
    id_cabang: row.id_cabang ? Number(row.id_cabang) : null,
    subtotal: Number(row.subtotal),
    diskon: row.diskon ? Number(row.diskon) : 0,
    nominal_voucher: row.nominal_voucher ? Number(row.nominal_voucher) : 0,
    potongan_poin: row.potongan_poin ? Number(row.potongan_poin) : 0,
    infaq: row.infaq ? Number(row.infaq) : 0,
    total_akhir: Number(row.total_akhir),
    jenis_pembayaran: row.jenis_pembayaran || "Tunai",
    jumlah_bayar: row.jumlah_bayar ? Number(row.jumlah_bayar) : 0,
    id_voucher: row.id_voucher ? Number(row.id_voucher) : null,
    poin_didapat: row.poin_didapat ? Number(row.poin_didapat) : 0,
    created_at: row.created_at,
  }));
  await insertInChunks(schema.penjualan, penjualanRows, "penjualan");

  // 23. PENJUALAN DETAIL
  const penjualanDetailRows = getTableData("penjualan_detail").map(row => ({
    id: Number(row.id_detail),
    id_penjualan: Number(row.id_penjualan),
    id_barang: Number(row.id_barang),
    nama_barang: row.nama_barang,
    jumlah: Number(row.jumlah),
    satuan: row.satuan,
    isi_satuan: Number(row.isi_satuan),
    harga_jual: Number(row.harga_jual),
    harga_rata_saat_transaksi: Number(row.harga_rata_saat_transaksi),
    diskon: row.diskon ? Number(row.diskon) : 0,
    subtotal: Number(row.subtotal),
    jenis_item: row.jenis_item || "TRANSAKSI",
  }));
  await insertInChunks(schema.penjualan_detail, penjualanDetailRows, "penjualan_detail");

  // 24. RIWAYAT POIN
  const riwayatPoinRows = getTableData("riwayat_poin").map(row => ({
    id: Number(row.id_riwayat_poin),
    id_pelanggan: Number(row.id_pelanggan),
    jenis_transaksi: row.jenis_transaksi,
    jumlah_poin: Number(row.jumlah_poin),
    keterangan: row.keterangan,
    id_referensi_transaksi: row.id_referensi_transaksi,
    waktu: row.tanggal_transaksi,
  }));
  await insertInChunks(schema.riwayat_poin, riwayatPoinRows, "riwayat_poin");

  // 25. INFAQ
  const infaqRows = getTableData("infaq").map(row => ({
    id: Number(row.id_infaq),
    id_penjualan: Number(row.id_penjualan),
    no_invoice: row.no_invoice,
    jumlah_infaq: Number(row.jumlah_infaq),
    id_cabang: Number(row.id_cabang),
    id_user: Number(row.id_user),
    waktu: row.tanggal_infaq,
  }));
  await insertInChunks(schema.infaq, infaqRows, "infaq");

  // 26. PESAN BELI & DETAIL (lookup item name & price from barang data)
  const barangLookup = new Map<number, { nama: string; harga_beli: number }>();
  barangRows.forEach(b => {
    barangLookup.set(b.id_barang, {
      nama: b.nama_barang,
      harga_beli: b.harga_beli || 0,
    });
  });

  const pesanBeliDetailRows = getTableData("pesan_beli_detail").map(row => {
    const idBarang = Number(row.id_barang);
    const info = barangLookup.get(idBarang) || { nama: "Barang Tidak Dikenal", harga_beli: 0 };
    const qty = Number(row.jumlah_diusulkan);
    const price = info.harga_beli;
    const subtotal = qty * price;
    return {
      id: Number(row.id_detail),
      id_pesan_beli: Number(row.id_pesan_beli),
      id_barang: idBarang,
      nama_barang: info.nama,
      jumlah_barang: qty,
      harga_satuan: price,
      subtotal: subtotal,
    };
  });

  const pesanBeliTotals = new Map<number, number>();
  pesanBeliDetailRows.forEach(det => {
    const current = pesanBeliTotals.get(det.id_pesan_beli) || 0;
    pesanBeliTotals.set(det.id_pesan_beli, current + det.subtotal);
  });

  const pesanBeliRows = getTableData("pesan_beli").map(row => {
    const id = Number(row.id_pesan_beli);
    const total = pesanBeliTotals.get(id) || 0;
    return {
      id_pesan_beli: id,
      id_cabang: Number(row.id_cabang),
      id_supplier: Number(row.id_supplier),
      tanggal_pesan_beli: row.tanggal_transaksi,
      nomor_pesan_beli: row.kode_pesan_beli,
      keterangan: row.keterangan,
      total_harga_pesan_beli: total,
      status: row.status || "PENDING",
      created_at: row.created_at,
    };
  });

  await insertInChunks(schema.pesan_beli, pesanBeliRows, "pesan_beli");
  await insertInChunks(schema.pesan_beli_detail, pesanBeliDetailRows, "pesan_beli_detail");

  // 27. FAKTUR BELI (PEMBELIAN) & DETAIL
  const fakturBeliRows = getTableData("pembelian").map(row => ({
    id_faktur: Number(row.id_pembelian),
    id_po: row.id_pesan_beli ? Number(row.id_pesan_beli) : null,
    id_cabang: Number(row.id_cabang),
    id_supplier: Number(row.id_supplier),
    tanggal_faktur: row.tanggal_pembelian,
    nomor_faktur: row.no_faktur_supplier || row.kode_pembelian || `FB-${row.id_pembelian}`,
    total_faktur: Number(row.total_final),
    diskon_total: row.diskon_rupiah ? Number(row.diskon_rupiah) : 0,
    ppn_rate: row.ppn_persen ? Number(row.ppn_persen) : 0,
    status_pembayaran: row.status_bayar || "Belum Dibayar",
    created_at: row.created_at,
  }));

  const fakturBeliDetailRows = getTableData("pembelian_detail").map(row => ({
    id: Number(row.id_detail),
    id_faktur: Number(row.id_pembelian),
    id_barang: Number(row.id_barang),
    jumlah_beli: Number(row.jumlah),
    harga_satuan: Number(row.harga_beli),
    subtotal: Number(row.subtotal),
  }));

  await insertInChunks(schema.faktur_beli, fakturBeliRows, "faktur_beli");
  await insertInChunks(schema.faktur_beli_detail, fakturBeliDetailRows, "faktur_beli_detail");

  // 28. BAYAR HUTANG (PEMBAYARAN HUTANG)
  const bayarHutangRows = getTableData("pembayaran_hutang").map(row => ({
    id: Number(row.id_pembayaran),
    id_supplier: Number(row.id_supplier),
    tanggal_bayar: row.tanggal_bayar,
    jumlah_bayar: Number(row.jumlah_bayar),
    metode_pembayaran: row.metode_pembayaran || "Tunai",
    keterangan: row.keterangan,
    created_at: row.created_at,
  }));
  await insertInChunks(schema.bayar_hutang, bayarHutangRows, "bayar_hutang");

  // 29. PESAN CABANG & DETAIL
  const pesanCabangRows = getTableData("pesan_cabang").map(row => ({
    id_request: Number(row.id_request),
    kode_request: row.kode_request,
    id_cabang_peminta: Number(row.id_cabang_peminta),
    id_cabang_sumber: Number(row.id_cabang_sumber),
    id_user_peminta: Number(row.id_user_peminta),
    status: row.status || "Pending",
    tanggal_request: row.tanggal_request,
    created_at: row.created_at,
  }));

  const pesanCabangDetailRows = getTableData("pesan_cabang_detail").map(row => ({
    id: Number(row.id_detail),
    id_request: Number(row.id_request),
    id_barang: Number(row.id_barang),
    jumlah_diminta: Number(row.jumlah_diminta),
    status_item: row.status_item || "Diproses",
  }));

  await insertInChunks(schema.pesan_cabang, pesanCabangRows, "pesan_cabang");
  await insertInChunks(schema.pesan_cabang_detail, pesanCabangDetailRows, "pesan_cabang_detail");

  // 30. PENGIRIMAN & DETAIL
  const pengirimanRows = getTableData("pengiriman").map(row => ({
    id_pengiriman: Number(row.id_pengiriman),
    kode_pengiriman: row.kode_pengiriman,
    id_cabang_sumber: Number(row.id_cabang_sumber),
    id_cabang_tujuan: Number(row.id_cabang_tujuan),
    id_user_pengirim: Number(row.id_user_pengirim),
    id_user_penerima: row.id_user_penerima ? Number(row.id_user_penerima) : null,
    status: row.status || "Dikirim",
    tanggal_kirim: row.tanggal_kirim,
    tanggal_terima: row.tanggal_terima,
  }));

  const pengirimanDetailRows = getTableData("pengiriman_detail").map(row => ({
    id_detail_kirim: Number(row.id_detail_kirim),
    id_pengiriman: Number(row.id_pengiriman),
    id_barang: Number(row.id_barang),
    jumlah_dikirim: Number(row.jumlah_dikirim),
    jumlah_diterima: row.jumlah_diterima ? Number(row.jumlah_diterima) : null,
    id_request_detail: row.id_request_detail ? Number(row.id_request_detail) : null,
    status_selisih: row.status_selisih,
    catatan_penerima: row.catatan_penerima,
  }));

  await insertInChunks(schema.pengiriman, pengirimanRows, "pengiriman");
  await insertInChunks(schema.pengiriman_detail, pengirimanDetailRows, "pengiriman_detail");

  // 31. TIPE AKUN
  const tipeAkunRows = getTableData("tipe_akun").map(row => ({
    id: Number(row.id),
    nama: row.nama,
    posisi_saldo_normal: row.posisi_saldo_normal,
  }));
  await insertInChunks(schema.tipe_akun, tipeAkunRows, "tipe_akun");

  // 32. DAFTAR AKUN / COA
  const daftarAkunRows = getTableData("daftar_akun").map(row => ({
    id: Number(row.id),
    kode_akun: row.kode_akun,
    nama_akun: row.nama_akun,
    deskripsi: row.deskripsi,
    tipe_akun_id: Number(row.tipe_akun_id),
    status: row.status || "Aktif",
  }));
  await insertInChunks(schema.daftar_akun, daftarAkunRows, "daftar_akun");

  // 33. JURNAL UMUM
  const jurnalUmumRows = getTableData("jurnal_umum").map(row => ({
    id: Number(row.id),
    tanggal_transaksi: row.tanggal_transaksi,
    no_referensi_bukti: row.no_referensi_bukti,
    deskripsi: row.deskripsi,
    akun_id: Number(row.akun_id),
    cabang_id: Number(row.cabang_id),
    debit: Number(row.debit),
    kredit: Number(row.kredit),
    dibuat_oleh: row.dibuat_oleh ? Number(row.dibuat_oleh) : null,
    created_at: row.created_at,
  }));
  await insertInChunks(schema.jurnal_umum, jurnalUmumRows, "jurnal_umum");

  console.log("🚀 Re-enabling foreign key checks...");
  sqlite.pragma("foreign_keys = ON");

  console.log("✅ Data import successfully completed!");
  sqlite.close();
}

importData().catch(err => {
  console.error("❌ Import failed:", err);
  sqlite.close();
  process.exit(1);
});
