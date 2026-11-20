import {
  parseSqlDump,
  parseCsvContent,
  mapRowToBarang,
  groupTransaksiRows,
} from "../src/services/migrasi.service";

console.log("🧪 Memulai pengujian parser migrasi sistem lama...\n");

// ─── TEST 1: MySQL Dump Master Barang ────────────────────────────────────────
const sampleSqlMaster = `
-- Dump Master Barang
DROP TABLE IF EXISTS \`history_transaksi\`;
CREATE TABLE \`history_transaksi\` (
  \`NO\` int(11) DEFAULT NULL,
  \`KDBRG\` varchar(30) DEFAULT NULL,
  \`NMBRG\` varchar(100) DEFAULT NULL,
  \`BARCODE\` varchar(50) DEFAULT NULL,
  \`SAT 1\` varchar(20) DEFAULT NULL,
  \`SAT 2\` varchar(20) DEFAULT NULL,
  \`SAT 3\` varchar(20) DEFAULT NULL,
  \`SAT 4\` varchar(20) DEFAULT NULL,
  \`ISI 2\` int(11) DEFAULT NULL,
  \`ISI 3\` int(11) DEFAULT NULL,
  \`ISI 4\` int(11) DEFAULT NULL,
  \`STOCK\` int(11) DEFAULT NULL,
  \`DEPARTEMENT\` varchar(50) DEFAULT NULL,
  \`SUPPLIER\` varchar(50) DEFAULT NULL,
  \`HRGBELI\` int(11) DEFAULT NULL,
  \`HBT\` int(11) DEFAULT NULL,
  \`PEMBELIAN TERAKHIR\` varchar(30) DEFAULT NULL,
  \`PENJUALAN TERAKHIR\` varchar(30) DEFAULT NULL,
  \`LEVEL\` varchar(10) DEFAULT NULL,
  \`PPN\` varchar(5) DEFAULT NULL,
  \`LPPJK\` varchar(5) DEFAULT NULL
);

INSERT INTO \`history_transaksi\` VALUES 
(1, 'BRG-001', 'INDOMIE AYAM BAWANG 69G', '089686010118', 'PCS', 'DUS', '', 'KARTON', 40, 0, 80, 150, 'MIE INSTAN', 'PT INDOFOOD CBP', 2900, 3050, '2026-01-10', '2026-02-15', 'F', '1', '1'),
(2, 'BRG-002', 'AQUA AIR MINERAL 600ML', '8886008101053', 'BOTOL', 'DUS', '', '', 24, 0, 0, 48, 'MINUMAN', 'PT TIRTA INVESTAMA', 3200, 3200, '2026-01-05', '2026-02-18', 'FAST', 'Y', 'Y');
`;

const parsedMaster = parseSqlDump(sampleSqlMaster);
console.log(`[Test 1] Hasil ekstraksi baris barang dari SQL: ${parsedMaster.barangRows.length} baris`);
if (parsedMaster.barangRows.length !== 2) {
  throw new Error(`Test 1 Gagal: Diharapkan 2 baris, didapat ${parsedMaster.barangRows.length}`);
}

const item1 = mapRowToBarang(parsedMaster.barangRows[0]);
console.log("Barang 1 Terpetakan:", item1);
if (!item1 || item1.barcode !== "089686010118" || item1.harga_beli !== 3050 || item1.level !== "FAST" || item1.stock !== 150) {
  throw new Error("Test 1 Gagal: Pemetaan nilai barang 1 tidak sesuai spesifikasi!");
}
console.log("✅ Test 1 Master Barang MySQL Parser: BERHASIL!\n");

// ─── TEST 2: MySQL Dump History Transaksi Penjualan ─────────────────────────
const sampleSqlTransaksi = `
INSERT INTO \`penjualan_lama\` (\`NO\`, \`TGL1\`, \`NOJUAL\`, \`TANGGAL\`, \`KDCUST\`, \`NMCUST\`, \`ALAMAT\`, \`KDBRG\`, \`NMBRG\`, \`JUMLAH\`, \`SAT\`, \`HARGA\`, \`DISC\`, \`TOTAL\`, \`POTONGAN\`, \`PPN\`, \`CARABAYAR\`, \`SUBTOTAL\`, \`POTONGANRP\`, \`PPNRP\`, \`BAYAR\`, \`PIUTANG\`, \`KET\`, \`TGLJTP\`, \`TERMIN\`, \`NMUSER\`, \`JMLJUAL\`, \`HBT\`, \`KELOMPOK\`, \`JAM\`, \`KDHRG\`, \`ISI\`, \`KDLOKASI\`, \`KETERANGAN\`, \`KDSALES\`, \`NMSALES\`, \`NOMOR\`, \`JASA\`) VALUES
(1, '2026-02-10', 'NJ-2026-001', '2026-02-10', 'CUST01', 'BAPAK AHMAD', 'Jl. Merdeka No 1', 'BRG-001', 'INDOMIE AYAM BAWANG 69G', 5, 'PCS', 3500, 0, 17500, 0, 0, 'TUNAI', 24500, 500, 0, 24000, 0, '', '', '', 'KASIR_SITI', 1, 3000, '', '14:30:00', '1', 1, 'GUDANG', '', '', '', 1, '0'),
(2, '2026-02-10', 'NJ-2026-001', '2026-02-10', 'CUST01', 'BAPAK AHMAD', 'Jl. Merdeka No 1', 'BRG-002', 'AQUA AIR MINERAL 600ML', 2, 'BOTOL', 3500, 0, 7000, 0, 0, 'TUNAI', 24500, 500, 0, 24000, 0, '', '', '', 'KASIR_SITI', 1, 3200, '', '14:30:00', '1', 1, 'GUDANG', '', '', '', 2, '0'),
(3, '2026-02-11', 'NJ-2026-002', '2026-02-11', '', 'PELANGGAN UMUM', '', 'BRG-002', 'AQUA AIR MINERAL 600ML', 1, 'BOTOL', 3500, 0, 3500, 0, 0, 'DEBIT', 3500, 0, 0, 3500, 0, '', '', '', 'KASIR_BUDI', 1, 3200, '', '09:15:22', '1', 1, 'GUDANG', '', '', '', 1, '0');
`;

const parsedTransaksi = parseSqlDump(sampleSqlTransaksi);
console.log(`[Test 2] Hasil ekstraksi baris transaksi: ${parsedTransaksi.transaksiRows.length} baris`);
if (parsedTransaksi.transaksiRows.length !== 3) {
  throw new Error(`Test 2 Gagal: Diharapkan 3 baris detail transaksi, didapat ${parsedTransaksi.transaksiRows.length}`);
}

const grouped = groupTransaksiRows(parsedTransaksi.transaksiRows);
console.log(`[Test 2] Hasil grouping invoice: ${grouped.length} invoice`);
if (grouped.length !== 2) {
  throw new Error(`Test 2 Gagal: Diharapkan 2 invoice unik, didapat ${grouped.length}`);
}

const inv1 = grouped.find((g) => g.no_invoice === "MIG-NJ-2026-001");
if (!inv1) {
  throw new Error("Test 2 Gagal: Invoice MIG-NJ-2026-001 tidak ditemukan!");
}
console.log("Invoice 1 Terpetakan:", {
  no_invoice: inv1.no_invoice,
  nama_pelanggan: inv1.nama_pelanggan,
  cara_bayar: inv1.jenis_pembayaran,
  subtotal: inv1.subtotal,
  total_akhir: inv1.total_akhir,
  items_count: inv1.items.length,
});
if (inv1.items.length !== 2 || inv1.total_akhir !== 24000 || inv1.jenis_pembayaran !== "Tunai") {
  throw new Error("Test 2 Gagal: Nilai invoice 1 tidak sesuai!");
}
console.log("✅ Test 2 History Transaksi MySQL Parser: BERHASIL!\n");

// ─── TEST 3: CSV Format Support ──────────────────────────────────────────────
const sampleCsv = `NO,KDBRG,NMBRG,BARCODE,SAT 1,SAT 2,SAT 3,SAT 4,ISI 2,ISI 3,ISI 4,STOCK,DEPARTEMENT,SUPPLIER,HRGBELI,HBT,PEMBELIAN TERAKHIR,PENJUALAN TERAKHIR,LEVEL,PPN,LPPJK
1,BRG-CSV-1,TEH PUCUK 350ML,8991234567890,BOTOL,DUS,,,24,,,30,MINUMAN,MAYORA,2800,2800,2026-01-01,2026-02-01,M,1,1
`;

const parsedCsv = parseCsvContent(sampleCsv);
console.log(`[Test 3] Hasil ekstraksi CSV: ${parsedCsv.barangRows.length} baris`);
const itemCsv = mapRowToBarang(parsedCsv.barangRows[0]);
console.log("Barang CSV Terpetakan:", itemCsv);
if (!itemCsv || itemCsv.barcode !== "8991234567890" || itemCsv.departement !== "MINUMAN") {
  throw new Error("Test 3 Gagal: Pemetaan CSV gagal!");
}
console.log("✅ Test 3 CSV Format Support: BERHASIL!\n");

console.log("🎉 SELURUH PENGUJIAN PARSER BERHASIL 100%! FITUR SIAP DIGUNAKAN.");

