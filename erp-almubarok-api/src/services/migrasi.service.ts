import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "../lib/db";
import {
  barang,
  stok_barang,
  kategori_barang,
  supplier,
  pelanggan,
  penjualan,
  penjualan_detail,
  users,
  kartu_stok,
  migrasi_log
} from "../lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

export interface ParsedBarangItem {
  no?: number;
  kode_barang?: string;
  nama_barang: string;
  barcode: string;
  satuan_1: string;
  satuan_2?: string;
  satuan_3?: string;
  satuan_4?: string;
  isi_1: number;
  isi_2?: number;
  isi_3?: number;
  isi_4?: number;
  stock: number;
  departement?: string;
  supplier?: string;
  harga_beli: number;
  hbt?: number;
  pembelian_terakhir?: string;
  penjualan_terakhir?: string;
  level: "FAST" | "MEDIUM" | "SLOW" | "DEAD";
  lapor_pajak: boolean;
  keterangan_1?: string;
  keterangan_2?: string;
}

export interface ParsedTransaksiItem {
  no_jual: string;
  tanggal: string;
  jam: string;
  tgl1?: string;
  kd_cust?: string;
  nm_cust?: string;
  nm_user?: string;
  cara_bayar: string;
  subtotal: number;
  potongan_rp: number;
  bayar: number;
  piutang: number;
  // Detail
  kd_brg?: string;
  nm_brg: string;
  jumlah: number;
  satuan: string;
  isi: number;
  harga: number;
  hbt: number;
  diskon: number;
  total: number;
  jasa: boolean;
}

export interface TransaksiGrouped {
  no_invoice: string;
  tanggal_invoice: string;
  jam_invoice: string;
  kd_cust?: string;
  nama_pelanggan: string;
  nm_user?: string;
  jenis_pembayaran: string;
  subtotal: number;
  diskon: number;
  total_akhir: number;
  jumlah_bayar: number;
  items: {
    kd_brg?: string;
    nama_barang: string;
    jumlah: number;
    satuan: string;
    isi_satuan: number;
    harga_jual: number;
    harga_rata: number;
    diskon: number;
    subtotal: number;
    jenis_item: string;
  }[];
}

export interface MigrationPreviewData {
  job_id: string;
  nama_file: string;
  ukuran_file_kb: number;
  id_cabang: number;
  tipe_terdeteksi: "MASTER_STOK" | "TRANSAKSI" | "COMBINED" | "UNKNOWN";
  barang_belum_terdaftar: number;
  master_barang: {
    total: number;
    valid: number;
    tanpa_barcode: number;
    sudah_ada_di_db: number;
    kategori_ditemukan: string[];
    kategori_baru: string[];
    supplier_ditemukan: string[];
    supplier_baru: string[];
    sample: ParsedBarangItem[];
  };
  stok_cabang: {
    total_item: number;
    total_qty: number;
    sample: { barcode: string; nama_barang: string; stock: number }[];
  };
  transaksi_historis: {
    total_transaksi: number;
    total_item_detail: number;
    total_omset: number;
    tanggal_terawal: string | null;
    tanggal_terakhir: string | null;
    metode_pembayaran: Record<string, number>;
    kasir_ditemukan: string[];
    sample: TransaksiGrouped[];
  };
  warnings: string[];
}

export interface MigrationCommitOptions {
  job_id: string;
  id_cabang: number;
  id_user: number;
  import_master: boolean;
  import_stok: boolean;
  import_transaksi: boolean;
  mode_duplikat: "SKIP" | "UPDATE";
}

export interface MigrationResult {
  job_id: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  total_baris: number;
  berhasil: number;
  gagal: number;
  master_inserted: number;
  master_updated: number;
  master_skipped: number;
  stok_updated: number;
  transaksi_inserted: number;
  transaksi_skipped: number;
  kategori_created: number;
  supplier_created: number;
  errors: string[];
}

// ─── TEMP STORAGE FOR JOBS ───────────────────────────────────────────────────

const TEMP_DIR = path.join(process.cwd(), "temp_migrasi");
if (!fs.existsSync(TEMP_DIR)) {
  try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  } catch (e) {
    console.warn("Gagal membuat folder temp_migrasi:", e);
  }
}

// In-memory cache + file backup
interface CachedJob {
  preview: MigrationPreviewData;
  barangList: ParsedBarangItem[];
  transaksiList: TransaksiGrouped[];
  expiresAt: number;
}

const jobCache = new Map<string, CachedJob>();

// Clean up expired jobs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobCache.entries()) {
    if (job.expiresAt < now) {
      jobCache.delete(jobId);
      const filePath = path.join(TEMP_DIR, `${jobId}.json`);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  }
}, 15 * 60 * 1000);

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────

function cleanKey(k: string): string {
  return k.replace(/^\uFEFF/, "").toLowerCase().replace(/[\s_\-`'"\[\]\(\)]/g, "");
}

function normalizeDate(raw?: string): string {
  if (!raw) return new Date().toISOString().substring(0, 10);
  const clean = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.substring(0, 10);
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }
  // YYYYMMDD
  if (/^\d{8}$/.test(clean)) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
  }
  return clean.substring(0, 10);
}

function normalizeTime(raw?: string): string {
  if (!raw) return "12:00:00";
  const clean = raw.trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(clean)) {
    return clean.padStart(8, "0");
  }
  if (/^\d{1,2}:\d{2}$/.test(clean)) {
    return `${clean.padStart(5, "0")}:00`;
  }
  return "12:00:00";
}

export function parseNumberSafe(val: any, def: number = 0): number {
  if (val === null || val === undefined) return def;
  if (typeof val === "number") return isNaN(val) ? def : Math.round(val * 100) / 100;

  let str = String(val).trim();
  if (!str) return def;

  // Strip currency prefixes and whitespace
  str = str.replace(/^[^\d\-+]+/, "").replace(/[^\d]+$/, "").trim();
  if (!str) return def;

  if (/^-?\d+$/.test(str)) {
    const n = Number(str);
    return isNaN(n) ? def : n;
  }

  const hasComma = str.includes(",");
  const hasDot = str.includes(".");

  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Format 1.234.567,89
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Format 1,234,567.89
      str = str.replace(/,/g, "");
    }
  } else if (hasComma) {
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1) {
      str = str.replace(/,/g, "");
    } else {
      // Indonesian/Excel single comma decimal (e.g. 6553,356091 -> 6553.356091)
      str = str.replace(",", ".");
    }
  } else if (hasDot) {
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      str = str.replace(/\./g, "");
    } else {
      const parts = str.split(".");
      if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        str = str.replace(".", "");
      }
    }
  }

  const n = parseFloat(str);
  if (isNaN(n)) return def;
  return Math.round(n * 100) / 100;
}

export function parseIntSafe(val: any, def: number = 0): number {
  const n = Math.round(parseNumberSafe(val, def));
  return Number.isFinite(n) ? n : def;
}

/**
 * Membatasi nilai agar muat di PostgreSQL 32-bit signed integer (maks ~2.14 Miliar)
 */
export function clampSafeInt32(val: number, fallback: number = 0, max: number = 1_000_000_000): number {
  if (!Number.isFinite(val) || isNaN(val)) return fallback;
  const rounded = Math.round(val);
  if (rounded > max || rounded < -max) return fallback;
  return rounded;
}

/**
 * Defensive sanitizer: Memulihkan angka harga jika terdapat anomali warisan parser lama
 * atau angka desimal tanpa pemisah (contoh: 5782886725 -> 5782.89, 1633333333 -> 16333.33).
 * Jika refExpected tersedia (mis. total/qty atau harga_jual), memilih pembagi 10^k yang paling mendekati.
 */
export function sanitizeHpp(
  hpp: number,
  refExpected?: number,
  maxAllowed: number = 50_000_000,
  isiSatuan: number = 1
): number {
  if (!Number.isFinite(hpp) || isNaN(hpp) || hpp < 0) return 0;

  const isSuspiciousAgainstRef =
    refExpected &&
    refExpected > 0 &&
    hpp > Math.max(refExpected * Math.max(isiSatuan, 1) * 2.5, 100_000) &&
    (hpp > maxAllowed || hpp % 100 !== 0 || hpp > refExpected * Math.max(isiSatuan, 1) * 5);

  if (hpp <= maxAllowed && !isSuspiciousAgainstRef) {
    return Math.round(hpp * 100) / 100;
  }

  const divisors = [10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1e9, 1e12];

  if (refExpected && refExpected > 0 && refExpected <= maxAllowed) {
    let bestCandidate = -1;
    let bestScore = Infinity;
    for (const div of divisors) {
      const cand = hpp / div;
      if (cand > 0 && cand <= maxAllowed) {
        const ratio = cand / refExpected;
        if (ratio >= 0.2 && ratio <= 3.0) {
          const diff = Math.abs(cand - refExpected * 0.85) + (ratio > 1.05 ? refExpected : 0);
          if (diff < bestScore) {
            bestScore = diff;
            bestCandidate = cand;
          }
        }
      }
    }
    if (bestCandidate > 0) {
      return Math.round(bestCandidate * 100) / 100;
    }
  }

  const strHpp = String(Math.round(hpp));
  if (strHpp.length >= 8) {
    const intPart = strHpp.substring(0, strHpp.length - 6);
    const decPart = strHpp.substring(strHpp.length - 6);
    const candidate = parseFloat(`${intPart}.${decPart}`);
    if (candidate > 0 && candidate < 10_000_000) {
      return Math.round(candidate * 100) / 100;
    }
  }

  for (const div of [100_000, 1e12, 1e9, 1e8, 1e7, 1e4]) {
    const cand = hpp / div;
    if (cand >= 100 && cand <= 10_000_000) {
      return Math.round(cand * 100) / 100;
    }
  }

  return refExpected && refExpected > 0 && refExpected <= maxAllowed ? Math.round(refExpected * 100) / 100 : 0;
}

/**
 * Sanitasi nominal pembayaran (jumlah_bayar):
 * Mencegah kasus angka ekstrem (misal salah tekan nol puluhan kali 5000000000000000 atau scan barcode ke kotak bayar)
 * agar tidak memicu overflow dan tidak merusak laporan tutup kasir.
 */
export function sanitizeBayar(rawBayar: number, totalAkhir: number): number {
  if (!Number.isFinite(rawBayar) || isNaN(rawBayar) || rawBayar < 0) return Math.max(0, Math.round(totalAkhir));
  const roundedBayar = Math.round(rawBayar);
  const safeTotal = Math.max(0, Math.round(totalAkhir));

  // Transaksi normal (<= 100 juta) atau transaksi grosir sah di mana nominal bayar proporsional dengan total nota
  if (
    roundedBayar <= 100_000_000 ||
    (safeTotal > 10_000_000 && roundedBayar <= safeTotal * 5 && roundedBayar <= 10_000_000_000)
  ) {
    return roundedBayar;
  }

  // Pulihkan hanya jika benar-benar angka dengan deretan nol berlebih di belakang (misal 5000000000000000 -> 5000)
  for (const div of [1e12, 1e11, 1e10, 1e9, 1e8, 1e7, 1e6, 1e5, 1e4, 1e3]) {
    if (roundedBayar % div === 0) {
      const cand = roundedBayar / div;
      if (cand >= safeTotal && cand <= Math.max(safeTotal * 50, 2_000_000)) {
        return cand;
      }
    }
  }

  // Normalkan menjadi uang pas = totalAkhir
  return safeTotal;
}

/**
 * Sanitasi menyeluruh pada 1 grup nota transaksi (header & seluruh item detail)
 */
export function sanitizeTransaksiGrouped(tr: TransaksiGrouped): TransaksiGrouped {
  let calculatedSubtotal = 0;
  const cleanItems = (tr.items || []).map((it) => {
    const qty = Math.max(1, clampSafeInt32(it.jumlah, 1, 100_000));
    const isi = Math.max(1, clampSafeInt32(it.isi_satuan, 1, 100_000));
    const rawTotal = Number(it.subtotal) || 0;
    const rawHarga = Number(it.harga_jual) || 0;
    const rawRata = Number(it.harga_rata) || 0;
    const rawDisc = Number(it.diskon) || 0;

    const validRefTotal = rawTotal > 0 && rawTotal <= 100_000_000 ? rawTotal : undefined;
    const expectedUnit = validRefTotal ? validRefTotal / qty : undefined;

    const cleanHarga = Math.round(sanitizeHpp(rawHarga, expectedUnit));
    const cleanDisc = Math.round(sanitizeHpp(rawDisc, undefined, 50_000_000));

    let cleanTotal = rawTotal;
    if (cleanTotal > 100_000_000 || cleanTotal < 0 || !Number.isFinite(cleanTotal)) {
      cleanTotal = Math.max(0, Math.round(qty * cleanHarga - cleanDisc));
    } else {
      cleanTotal = Math.round(cleanTotal);
    }

    const finalHarga =
      cleanHarga > 50_000_000 && cleanTotal <= 50_000_000
        ? Math.round((cleanTotal + cleanDisc) / qty)
        : cleanHarga;

    const cleanRata = Math.round(sanitizeHpp(rawRata, finalHarga > 0 ? finalHarga : undefined, 50_000_000, isi));

    calculatedSubtotal += cleanTotal;

    return {
      ...it,
      jumlah: qty,
      isi_satuan: isi,
      harga_jual: finalHarga,
      harga_rata: cleanRata,
      diskon: cleanDisc,
      subtotal: cleanTotal,
    };
  });

  let subtotalHeader = Number(tr.subtotal) || 0;
  if (subtotalHeader > 100_000_000 && calculatedSubtotal > 0 && calculatedSubtotal <= 100_000_000) {
    subtotalHeader = calculatedSubtotal;
  } else if (subtotalHeader > 100_000_000) {
    subtotalHeader = sanitizeHpp(subtotalHeader, calculatedSubtotal > 0 ? calculatedSubtotal : undefined, 500_000_000);
    if (subtotalHeader > 100_000_000 && calculatedSubtotal <= 100_000_000) {
      subtotalHeader = calculatedSubtotal;
    }
  } else {
    subtotalHeader = Math.round(Math.max(0, subtotalHeader));
  }

  let potonganRp = Number(tr.diskon) || 0;
  if (potonganRp > 100_000_000 || potonganRp < 0) {
    potonganRp = Math.round(sanitizeHpp(potonganRp, undefined, subtotalHeader || 50_000_000));
  } else {
    potonganRp = Math.round(potonganRp);
  }

  const totalAkhir = Math.max(0, Math.round(subtotalHeader - potonganRp));
  const cleanBayar = sanitizeBayar(Number(tr.jumlah_bayar) || 0, totalAkhir);

  return {
    ...tr,
    subtotal: Math.round(subtotalHeader),
    diskon: Math.round(potonganRp),
    total_akhir: totalAkhir,
    jumlah_bayar: cleanBayar,
    items: cleanItems,
  };
}

// ─── SQL VALUE PARSER ────────────────────────────────────────────────────────

/**
 * Tokenize SQL tuple: (val1, 'val2', NULL, 123)
 */
function parseSqlValuesTuple(tupleStr: string): string[] {
  const result: string[] = [];
  let current = "";
  let inString = false;
  let quoteChar = "";
  let escapeNext = false;

  const trimmed = tupleStr.trim();
  // Remove outer parentheses
  const content = trimmed.startsWith("(") && trimmed.endsWith(")")
    ? trimmed.substring(1, trimmed.length - 1)
    : trimmed;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (!inString && (char === "'" || char === '"' || char === "`")) {
      inString = true;
      quoteChar = char;
      continue;
    }

    if (inString && char === quoteChar) {
      // Check for doubled quote escape in SQL: '' or ""
      if (i + 1 < content.length && content[i + 1] === quoteChar) {
        current += quoteChar;
        i++; // skip next quote
        continue;
      }
      inString = false;
      quoteChar = "";
      continue;
    }

    if (!inString && char === ",") {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());

  // Clean values: 'NULL' -> null, strip quotes
  return result.map((v) => {
    const lower = v.toLowerCase();
    if (lower === "null" || v === "") return "";
    return v;
  });
}

/**
 * Splits standard multi-row INSERT INTO statement into individual value tuples.
 * e.g. VALUES (1, 'A'), (2, 'B'); -> ["(1, 'A')", "(2, 'B')"]
 */
function splitSqlTuples(valuesBlock: string): string[] {
  const tuples: string[] = [];
  let current = "";
  let inString = false;
  let quoteChar = "";
  let escapeNext = false;
  let parenDepth = 0;

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];

    if (escapeNext) {
      if (parenDepth > 0) current += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      if (parenDepth > 0) current += char;
      continue;
    }

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      quoteChar = char;
      if (parenDepth > 0) current += char;
      continue;
    }

    if (inString && char === quoteChar) {
      if (i + 1 < valuesBlock.length && valuesBlock[i + 1] === quoteChar) {
        if (parenDepth > 0) current += char + quoteChar;
        i++;
        continue;
      }
      inString = false;
      quoteChar = "";
      if (parenDepth > 0) current += char;
      continue;
    }

    if (!inString) {
      if (char === "(") {
        if (parenDepth === 0) {
          current = "(";
        } else {
          current += char;
        }
        parenDepth++;
        continue;
      } else if (char === ")") {
        parenDepth--;
        current += ")";
        if (parenDepth === 0) {
          tuples.push(current.trim());
          current = "";
        }
        continue;
      }
    }

    if (parenDepth > 0) {
      current += char;
    }
  }

  return tuples;
}

// ─── SQL DUMP PARSER ─────────────────────────────────────────────────────────

export function parseSqlDump(sqlContent: string): {
  barangRows: Record<string, string>[];
  transaksiRows: Record<string, string>[];
} {
  const barangRows: Record<string, string>[] = [];
  const transaksiRows: Record<string, string>[] = [];

  // 1. First, parse CREATE TABLE to detect column names if table has no explicit column list in INSERT
  const tableColumnsMap = new Map<string, string[]>();
  const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`"']?([a-zA-Z0-9_\-]+)[`"']?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi;
  let ctMatch;
  while ((ctMatch = createTableRegex.exec(sqlContent)) !== null) {
    const tableName = ctMatch[1].toLowerCase();
    const tableBody = ctMatch[2];
    const colLines = tableBody.split("\n");
    const cols: string[] = [];
    for (const line of colLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("PRIMARY") || trimmed.startsWith("KEY") || trimmed.startsWith("UNIQUE") || trimmed.startsWith("CONSTRAINT")) {
        continue;
      }
      const colMatch = trimmed.match(/^[`"']?([a-zA-Z0-9_\-]+)[`"']?\s+/);
      if (colMatch) {
        cols.push(colMatch[1]);
      }
    }
    if (cols.length > 0) {
      tableColumnsMap.set(tableName, cols);
    }
  }

  // 2. Parse INSERT INTO statements
  // Handles: INSERT INTO `table` (`col1`, `col2`) VALUES (...) or INSERT INTO `table` VALUES (...)
  const insertRegex = /INSERT\s+INTO\s+[`"']?([a-zA-Z0-9_\-]+)[`"']?\s*(?:\(([^)]+)\))?\s+VALUES\s*([\s\S]*?);/gi;
  let insertMatch;

  while ((insertMatch = insertRegex.exec(sqlContent)) !== null) {
    const tableName = insertMatch[1].toLowerCase();
    const explicitColsRaw = insertMatch[2];
    const valuesContent = insertMatch[3];

    let columnNames: string[] = [];
    if (explicitColsRaw) {
      columnNames = explicitColsRaw
        .split(",")
        .map((c) => c.trim().replace(/[`"']/g, ""));
    } else if (tableColumnsMap.has(tableName)) {
      columnNames = tableColumnsMap.get(tableName)!;
    }

    const tuples = splitSqlTuples(valuesContent);

    for (const tuple of tuples) {
      const values = parseSqlValuesTuple(tuple);
      const row: Record<string, string> = {};

      if (columnNames.length > 0) {
        for (let i = 0; i < columnNames.length && i < values.length; i++) {
          row[columnNames[i]] = values[i];
        }
      } else {
        // Positional fallback
        for (let i = 0; i < values.length; i++) {
          row[`col_${i + 1}`] = values[i];
        }
      }

      // Classify row
      const keysNormalized = Object.keys(row).map(cleanKey);
      const hasNoJual = keysNormalized.some((k) => k.includes("nojual") || k === "noinvoice" || k === "nofaktur");
      const hasBarang = keysNormalized.some((k) => k.includes("kdbrg") || k.includes("nmbrg") || k === "barcode" || k.includes("stock"));

      if (hasNoJual) {
        transaksiRows.push(row);
      } else if (hasBarang) {
        barangRows.push(row);
      } else if (tableName.includes("transaksi") || tableName.includes("penjualan") || tableName.includes("jual")) {
        transaksiRows.push(row);
      } else if (tableName.includes("barang") || tableName.includes("produk") || tableName.includes("item") || tableName.includes("stok")) {
        barangRows.push(row);
      }
    }
  }

  return { barangRows, transaksiRows };
}

// ─── CSV / TSV PARSER ────────────────────────────────────────────────────────

export function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && i + 1 < line.length && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((v) => v.replace(/^["']|["']$/g, "").trim());
}

export function parseCsvContent(
  content: string,
  targetType: "AUTO" | "MASTER_STOK" | "TRANSAKSI" = "AUTO"
): {
  barangRows: Record<string, string>[];
  transaksiRows: Record<string, string>[];
} {
  const barangRows: Record<string, string>[] = [];
  const transaksiRows: Record<string, string>[] = [];

  const cleanContent = content.replace(/^\uFEFF/, "");
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { barangRows, transaksiRows };

  // Detect delimiter: tab, semicolon, or comma based on highest count in header sample
  const sample = lines.slice(0, 5).join("\n");
  const countTab = (sample.match(/\t/g) || []).length;
  const countSemi = (sample.match(/;/g) || []).length;
  const countComma = (sample.match(/,/g) || []).length;

  let delimiter = ",";
  if (countTab > countSemi && countTab > countComma) {
    delimiter = "\t";
  } else if (countSemi > countComma) {
    delimiter = ";";
  }

  const headers = splitCsvLine(lines[0], delimiter);
  const headerKeysClean = headers.map(cleanKey);

  let isTransaksi = false;
  if (targetType === "TRANSAKSI") {
    isTransaksi = true;
  } else if (targetType === "MASTER_STOK") {
    isTransaksi = false;
  } else {
    isTransaksi = headerKeysClean.some(
      (k) => k.includes("nojual") || k === "noinvoice" || k === "nofaktur" || k === "notransaksi"
    );
  }

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCsvLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const val = rawCols[c] !== undefined ? rawCols[c] : "";
      row[headers[c]] = val;
    }

    if (isTransaksi) {
      transaksiRows.push(row);
    } else {
      barangRows.push(row);
    }
  }

  return { barangRows, transaksiRows };
}

// ─── ROW TRANSFORMERS ────────────────────────────────────────────────────────

export function mapRowToBarang(raw: Record<string, any>): ParsedBarangItem | null {
  // Normalize row keys
  const lookup: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    lookup[cleanKey(k)] = v;
  }

  const namaBarang = (lookup["nmbrg"] || lookup["namabarang"] || lookup["nama"] || lookup["produk"] || "").toString().trim();
  if (!namaBarang) return null;

  const kdBrg = (lookup["kdbrg"] || lookup["kodebarang"] || lookup["kode"] || "").toString().trim();
  let barcode = (lookup["barcode"] || lookup["kodeproduk"] || "").toString().trim();

  // Fallback: If barcode is empty, use KDBRG
  if (!barcode && kdBrg) {
    barcode = kdBrg;
  }
  if (!barcode) return null;

  const sat1 = (lookup["sat1"] || lookup["satuan1"] || lookup["satuan"] || "PCS").toString().trim();
  const sat2 = (lookup["sat2"] || lookup["satuan2"] || "").toString().trim() || undefined;
  const sat3 = (lookup["sat3"] || lookup["satuan3"] || "").toString().trim() || undefined;
  const sat4 = (lookup["sat4"] || lookup["satuan4"] || "").toString().trim() || undefined;

  const isi2 = clampSafeInt32(parseIntSafe(lookup["isi2"] || lookup["isi_2"]), 0, 100_000);
  const isi3 = clampSafeInt32(parseIntSafe(lookup["isi3"] || lookup["isi_3"]), 0, 100_000);
  const isi4 = clampSafeInt32(parseIntSafe(lookup["isi4"] || lookup["isi_4"]), 0, 100_000);

  const stock = clampSafeInt32(parseIntSafe(lookup["stock"] || lookup["stok"] || lookup["saldo"] || lookup["qty"] || 0), 0, 10_000_000);

  const dept = (lookup["departement"] || lookup["departemen"] || lookup["dept"] || lookup["kategori"] || "").toString().trim() || undefined;
  const supp = (lookup["supplier"] || lookup["suplier"] || lookup["pemasok"] || "").toString().trim() || undefined;

  const hrgBeli = Math.round(sanitizeHpp(parseNumberSafe(lookup["hrgbeli"] || lookup["hargabeli"] || lookup["beli"] || lookup["hpp"] || 0)));
  const hbt = Math.round(sanitizeHpp(parseNumberSafe(lookup["hbt"] || lookup["hargabeliterakhir"] || 0), hrgBeli > 0 ? hrgBeli : undefined));
  const finalHrgBeli = hbt > 0 ? hbt : hrgBeli;

  const tglBeliTerakhir = lookup["pembelianterakhir"] || lookup["tglbeliterakhir"] || undefined;
  const tglJualTerakhir = lookup["penjualanterakhir"] || lookup["tgljualterakhir"] || undefined;

  // Level mapping: F -> FAST, M -> MEDIUM, S -> SLOW, D -> DEAD
  let levelVal: "FAST" | "MEDIUM" | "SLOW" | "DEAD" = "MEDIUM";
  const lvlRaw = (lookup["level"] || lookup["levelbarang"] || "").toString().trim().toUpperCase();
  if (lvlRaw.startsWith("F")) levelVal = "FAST";
  else if (lvlRaw.startsWith("S")) levelVal = "SLOW";
  else if (lvlRaw.startsWith("D")) levelVal = "DEAD";
  else if (lvlRaw.startsWith("M")) levelVal = "MEDIUM";

  // Pajak mapping
  let laporPajak = true;
  const lppjk = lookup["lppjk"] || lookup["laporpajak"];
  const ppn = lookup["ppn"];
  const taxCandidate = lppjk !== undefined ? lppjk : ppn;
  if (taxCandidate !== undefined && taxCandidate !== null) {
    const s = String(taxCandidate).trim().toLowerCase();
    if (s === "0" || s === "n" || s === "false" || s === "tidak") {
      laporPajak = false;
    }
  }

  // Preserve extra fields in keterangan
  let ket1: string | undefined = undefined;
  let ket2: string | undefined = undefined;
  if (sat4 || isi4) {
    ket1 = `SAT4: ${sat4 || "-"} (ISI: ${isi4 || 1})`;
  }
  if (tglBeliTerakhir) {
    ket2 = `Beli Terakhir: ${tglBeliTerakhir}`;
  }

  return {
    no: parseIntSafe(lookup["no"]),
    kode_barang: kdBrg || undefined,
    nama_barang: namaBarang,
    barcode,
    satuan_1: sat1,
    satuan_2: sat2,
    satuan_3: sat3,
    satuan_4: sat4,
    isi_1: 1,
    isi_2: isi2 > 0 ? isi2 : undefined,
    isi_3: isi3 > 0 ? isi3 : undefined,
    isi_4: isi4 > 0 ? isi4 : undefined,
    stock,
    departement: dept,
    supplier: supp,
    harga_beli: finalHrgBeli,
    hbt: hbt > 0 ? hbt : undefined,
    pembelian_terakhir: tglBeliTerakhir ? String(tglBeliTerakhir) : undefined,
    penjualan_terakhir: tglJualTerakhir ? normalizeDate(String(tglJualTerakhir)) : undefined,
    level: levelVal,
    lapor_pajak: laporPajak,
    keterangan_1: ket1,
    keterangan_2: ket2,
  };
}

export function groupTransaksiRows(rawRows: Record<string, any>[]): TransaksiGrouped[] {
  const groups = new Map<string, Record<string, any>[]>();

  for (const raw of rawRows) {
    const lookup: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      lookup[cleanKey(k)] = v;
    }
    const noJual = (lookup["nojual"] || lookup["noinvoice"] || lookup["nofaktur"] || "").toString().trim();
    if (!noJual) continue;

    if (!groups.has(noJual)) {
      groups.set(noJual, []);
    }
    groups.get(noJual)!.push(lookup);
  }

  const result: TransaksiGrouped[] = [];

  for (const [noJual, items] of groups.entries()) {
    const first = items[0];

    const tgl = normalizeDate(first["tanggal"] || first["tgl"] || first["tgl1"]);
    const jam = normalizeTime(first["jam"] || first["waktu"]);
    const nmcust = (first["nmcust"] || first["namapelanggan"] || first["pelanggan"] || "Umum").toString().trim();
    const nmuser = (first["nmuser"] || first["user"] || first["kasir"] || "").toString().trim() || undefined;

    // Payment method mapping
    const rawCara = (first["carabayar"] || first["metodebayar"] || "TUNAI").toString().trim().toUpperCase();
    let caraBayar = "Tunai";
    if (rawCara.includes("DEBIT") || rawCara === "D" || rawCara.includes("EDC")) caraBayar = "Debit";
    else if (rawCara.includes("KREDIT") || rawCara === "K") caraBayar = "Kredit";
    else if (rawCara.includes("TRANSFER") || rawCara === "TF") caraBayar = "Transfer";

    let calculatedSubtotal = 0;
    const detailItems = items.map((it) => {
      const nmbrg = (it["nmbrg"] || it["namabarang"] || "").toString().trim();
      const kdbrg = (it["kdbrg"] || it["kodebarang"] || it["barcode"] || "").toString().trim() || undefined;
      const jumlah = parseIntSafe(it["jumlah"] || it["qty"] || 1);
      const sat = (it["sat"] || it["satuan"] || "PCS").toString().trim();
      const isi = parseIntSafe(it["isi"] || 1) || 1;
      const harga = Math.round(parseNumberSafe(it["harga"] || it["hargajual"] || 0));
      const hbt = Math.round(parseNumberSafe(it["hbt"] || 0));
      const disc = Math.round(parseNumberSafe(it["disc"] || it["diskon"] || 0));
      const total = Math.round(parseNumberSafe(it["total"] || it["subtotal"] || (jumlah * harga - disc)));
      const jasaRaw = (it["jasa"] || "").toString().trim().toUpperCase();
      const isJasa = jasaRaw === "1" || jasaRaw === "Y" || jasaRaw === "JASA";

      calculatedSubtotal += total;

      return {
        kd_brg: kdbrg,
        nama_barang: nmbrg || "Item Tanpa Nama",
        jumlah: jumlah > 0 ? jumlah : 1,
        satuan: sat,
        isi_satuan: isi,
        harga_jual: harga,
        harga_rata: hbt,
        diskon: disc,
        subtotal: total,
        jenis_item: isJasa ? "JASA" : "TRANSAKSI",
      };
    });

    const subtotalHeader = Math.round(parseNumberSafe(first["subtotal"] || calculatedSubtotal));
    const potonganRp = Math.round(parseNumberSafe(first["potonganrp"] || first["potongan"] || 0));
    const totalAkhir = Math.max(0, subtotalHeader - potonganRp);
    const bayar = Math.round(parseNumberSafe(first["bayar"] || totalAkhir));

    // Format invoice with MIG- prefix
    const cleanInvoice = noJual.toUpperCase().startsWith("MIG-") ? noJual.toUpperCase() : `MIG-${noJual}`;

    result.push(
      sanitizeTransaksiGrouped({
        no_invoice: cleanInvoice,
        tanggal_invoice: tgl,
        jam_invoice: jam,
        kd_cust: first["kdcust"] ? String(first["kdcust"]).trim() : undefined,
        nama_pelanggan: nmcust,
        nm_user: nmuser,
        jenis_pembayaran: caraBayar,
        subtotal: subtotalHeader,
        diskon: potonganRp,
        total_akhir: totalAkhir,
        jumlah_bayar: bayar,
        items: detailItems,
      })
    );
  }

  return result;
}

// ─── PARSE & GENERATE PREVIEW ────────────────────────────────────────────────

export async function processUploadAndGeneratePreview(
  fileBuffer: Buffer,
  filename: string,
  idCabang: number,
  targetType: "AUTO" | "MASTER_STOK" | "TRANSAKSI" = "AUTO"
): Promise<MigrationPreviewData> {
  const content = fileBuffer.toString("utf8").replace(/^\uFEFF/, "");
  const isSql = filename.toLowerCase().endsWith(".sql") || content.includes("INSERT INTO");

  let rawBarang: Record<string, string>[] = [];
  let rawTransaksi: Record<string, string>[] = [];

  if (isSql) {
    const parsed = parseSqlDump(content);
    rawBarang = parsed.barangRows;
    rawTransaksi = parsed.transaksiRows;
  } else {
    const parsed = parseCsvContent(content, targetType);
    rawBarang = parsed.barangRows;
    rawTransaksi = parsed.transaksiRows;
  }

  // Filter based on user target type selection if specified
  if (targetType === "MASTER_STOK") {
    rawTransaksi = [];
  } else if (targetType === "TRANSAKSI") {
    rawBarang = [];
  }

  // Map to structured entities
  const barangList: ParsedBarangItem[] = [];
  let tanpaBarcode = 0;
  for (const b of rawBarang) {
    const item = mapRowToBarang(b);
    if (item) {
      barangList.push(item);
    } else {
      tanpaBarcode++;
    }
  }

  const transaksiList = groupTransaksiRows(rawTransaksi);

  // Determine detected type
  let tipeTerdeteksi: "MASTER_STOK" | "TRANSAKSI" | "COMBINED" | "UNKNOWN" = "UNKNOWN";
  if (barangList.length > 0 && transaksiList.length > 0) {
    tipeTerdeteksi = "COMBINED";
  } else if (barangList.length > 0) {
    tipeTerdeteksi = "MASTER_STOK";
  } else if (transaksiList.length > 0) {
    tipeTerdeteksi = "TRANSAKSI";
  }

  // 1. Cross-reference with existing DB for Master Barang
  const existingBarcodes = new Set<string>();
  if (barangList.length > 0) {
    const allBarcodes = barangList.map((b) => b.barcode);
    // Query existing barcodes in batches of 500
    for (let i = 0; i < allBarcodes.length; i += 500) {
      const slice = allBarcodes.slice(i, i + 500);
      const rows = await db
        .select({ barcode: barang.barcode })
        .from(barang)
        .where(inArray(barang.barcode, slice));
      rows.forEach((r) => existingBarcodes.add(r.barcode));
    }
  }

  // 2. Categories in file vs existing DB
  const detectedCategories = new Set<string>();
  barangList.forEach((b) => {
    if (b.departement) detectedCategories.add(b.departement);
  });
  const existingCategories = await db.select({ nama: kategori_barang.nama_kategori }).from(kategori_barang);
  const existingCatSet = new Set(existingCategories.map((c) => c.nama.toLowerCase().trim()));
  const newCategories = Array.from(detectedCategories).filter((c) => !existingCatSet.has(c.toLowerCase().trim()));

  // 3. Suppliers in file vs existing DB
  const detectedSuppliers = new Set<string>();
  barangList.forEach((b) => {
    if (b.supplier) detectedSuppliers.add(b.supplier);
  });
  const existingSuppliers = await db.select({ nama: supplier.nama_supplier }).from(supplier);
  const existingSuppSet = new Set(existingSuppliers.map((s) => s.nama.toLowerCase().trim()));
  const newSuppliers = Array.from(detectedSuppliers).filter((s) => !existingSuppSet.has(s.toLowerCase().trim()));

  // 4. Stok metrics
  let totalQty = 0;
  const stokSample: { barcode: string; nama_barang: string; stock: number }[] = [];
  barangList.forEach((b) => {
    totalQty += b.stock;
    if (stokSample.length < 50 && b.stock > 0) {
      stokSample.push({ barcode: b.barcode, nama_barang: b.nama_barang, stock: b.stock });
    }
  });

  // 5. Transaksi metrics
  let totalOmset = 0;
  let totalItemDetail = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;
  const paymentMethods: Record<string, number> = {};
  const cashiers = new Set<string>();

  transaksiList.forEach((t) => {
    totalOmset += t.total_akhir;
    totalItemDetail += t.items.length;
    paymentMethods[t.jenis_pembayaran] = (paymentMethods[t.jenis_pembayaran] || 0) + 1;
    if (t.nm_user) cashiers.add(t.nm_user);
    if (!minDate || t.tanggal_invoice < minDate) minDate = t.tanggal_invoice;
    if (!maxDate || t.tanggal_invoice > maxDate) maxDate = t.tanggal_invoice;
  });

  // 6. Cross-reference items in transaksi against master barang
  let barangBelumTerdaftar = 0;
  if (transaksiList.length > 0) {
    const transactionCodes = new Set<string>();
    for (const tr of transaksiList) {
      for (const it of tr.items) {
        if (it.kd_brg) {
          transactionCodes.add(it.kd_brg.trim());
        }
      }
    }

    const inMemoryCodes = new Set<string>();
    for (const b of barangList) {
      if (b.barcode) inMemoryCodes.add(b.barcode.trim());
      if (b.kode_barang) inMemoryCodes.add(b.kode_barang.trim());
    }

    const toCheckDb = Array.from(transactionCodes).filter((c) => !inMemoryCodes.has(c));
    const foundInDb = new Set<string>();
    if (toCheckDb.length > 0) {
      for (let i = 0; i < toCheckDb.length; i += 500) {
        const slice = toCheckDb.slice(i, i + 500);
        const rows = await db
          .select({ barcode: barang.barcode, kode_barang: barang.kode_barang })
          .from(barang)
          .where(sql`${barang.barcode} IN ${slice} OR ${barang.kode_barang} IN ${slice}`);
        rows.forEach((r) => {
          if (r.barcode) foundInDb.add(r.barcode.trim());
          if (r.kode_barang) foundInDb.add(r.kode_barang.trim());
        });
      }
    }

    for (const code of transactionCodes) {
      if (!inMemoryCodes.has(code) && !foundInDb.has(code)) {
        barangBelumTerdaftar++;
      }
    }
  }

  const warnings: string[] = [];
  if (existingBarcodes.size > 0) {
    warnings.push(`${existingBarcodes.size} dari ${barangList.length} barcode sudah terdaftar di database ERP Al Mubarok.`);
  }
  if (tanpaBarcode > 0) {
    warnings.push(`${tanpaBarcode} baris dilewati karena tidak memiliki Nama Barang atau Barcode valid.`);
  }
  if (barangBelumTerdaftar > 0) {
    warnings.push(
      `⚠️ PERHATIAN: Ditemukan ${barangBelumTerdaftar} kode item transaksi yang BELUM terdaftar di Master Barang ERP. Harap impor Master Barang & Stok terlebih dahulu agar data transaksi terhubung sempurna.`
    );
  }
  if (barangList.length === 0 && transaksiList.length === 0) {
    warnings.push("Tidak ditemukan data master barang maupun riwayat transaksi pada file ini. Pastikan format tabel sesuai.");
  }

  const jobId = crypto.randomUUID();
  const previewData: MigrationPreviewData = {
    job_id: jobId,
    nama_file: filename,
    ukuran_file_kb: Math.round(fileBuffer.length / 1024),
    id_cabang: idCabang,
    tipe_terdeteksi: tipeTerdeteksi,
    barang_belum_terdaftar: barangBelumTerdaftar,
    master_barang: {
      total: barangList.length,
      valid: barangList.length,
      tanpa_barcode: tanpaBarcode,
      sudah_ada_di_db: existingBarcodes.size,
      kategori_ditemukan: Array.from(detectedCategories),
      kategori_baru: newCategories,
      supplier_ditemukan: Array.from(detectedSuppliers),
      supplier_baru: newSuppliers,
      sample: barangList.slice(0, 50),
    },
    stok_cabang: {
      total_item: barangList.filter((b) => b.stock > 0).length,
      total_qty: totalQty,
      sample: stokSample,
    },
    transaksi_historis: {
      total_transaksi: transaksiList.length,
      total_item_detail: totalItemDetail,
      total_omset: totalOmset,
      tanggal_terawal: minDate,
      tanggal_terakhir: maxDate,
      metode_pembayaran: paymentMethods,
      kasir_ditemukan: Array.from(cashiers),
      sample: transaksiList.slice(0, 50),
    },
    warnings,
  };

  // Cache in memory and write backup file
  jobCache.set(jobId, {
    preview: previewData,
    barangList,
    transaksiList,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  try {
    fs.writeFileSync(path.join(TEMP_DIR, `${jobId}.json`), JSON.stringify({ preview: previewData, barangList, transaksiList }));
  } catch (err) {
    console.warn("Gagal menulis cache disk migrasi:", err);
  }

  return previewData;
}

// ─── COMMIT MIGRATION (ATOMIC TRANSACTION) ────────────────────────────────────

export async function commitMigration(opts: MigrationCommitOptions): Promise<MigrationResult> {
  const { job_id, id_cabang, id_user, import_master, import_stok, import_transaksi, mode_duplikat } = opts;

  let cached = jobCache.get(job_id);
  if (!cached) {
    // Try to load from disk
    const diskPath = path.join(TEMP_DIR, `${job_id}.json`);
    if (fs.existsSync(diskPath)) {
      try {
        const raw = fs.readFileSync(diskPath, "utf8");
        cached = JSON.parse(raw);
      } catch {}
    }
  }

  if (!cached) {
    throw new Error("Sesi migrasi telah kedaluwarsa atau tidak ditemukan. Silakan upload ulang file.");
  }

  const { preview, barangList, transaksiList } = cached;

  let masterInserted = 0;
  let masterUpdated = 0;
  let masterSkipped = 0;
  let stokUpdated = 0;
  let transaksiInserted = 0;
  let transaksiSkipped = 0;
  let kategoriCreated = 0;
  let supplierCreated = 0;
  const errors: string[] = [];

  const nowIso = new Date().toISOString();

  // Execute entire migration atomically inside PostgreSQL transaction
  await db.transaction(async (tx) => {
    // ─── 1. KATEGORI & SUPPLIER LOOKUP / SEED ────────────────────────────────
    const categoryMap = new Map<string, number>();
    const allCats = await tx.select().from(kategori_barang);
    allCats.forEach((c) => categoryMap.set(c.nama_kategori.toLowerCase().trim(), c.id_kategori));

    for (const catName of preview.master_barang.kategori_baru) {
      if (!catName || categoryMap.has(catName.toLowerCase().trim())) continue;
      const code = `KT-${String(categoryMap.size + 1).padStart(3, "0")}`;
      const [newCat] = await tx
        .insert(kategori_barang)
        .values({
          kode_kategori: code,
          nama_kategori: catName,
        })
        .returning();
      categoryMap.set(catName.toLowerCase().trim(), newCat.id_kategori);
      kategoriCreated++;
    }

    const supplierMap = new Map<string, number>();
    const allSupps = await tx.select().from(supplier);
    allSupps.forEach((s) => supplierMap.set(s.nama_supplier.toLowerCase().trim(), s.id_supplier));

    for (const suppName of preview.master_barang.supplier_baru) {
      if (!suppName || supplierMap.has(suppName.toLowerCase().trim())) continue;
      const [newSupp] = await tx
        .insert(supplier)
        .values({
          nama_supplier: suppName,
        })
        .returning();
      supplierMap.set(suppName.toLowerCase().trim(), newSupp.id_supplier);
      supplierCreated++;
    }

    // ─── 2. MASTER BARANG IMPORT ─────────────────────────────────────────────
    // Preload existing barang to resolve barcodes -> id_barang
    const barcodeToId = new Map<string, number>();
    const existingList = await tx.select({ id: barang.id_barang, barcode: barang.barcode, kode_barang: barang.kode_barang }).from(barang);
    existingList.forEach((b) => {
      if (b.barcode) barcodeToId.set(b.barcode.trim(), b.id);
      if (b.kode_barang) barcodeToId.set(b.kode_barang.trim(), b.id);
    });

    if (import_master && barangList.length > 0) {
      const toInsertBarang: { values: any; rawItem: ParsedBarangItem }[] = [];
      const pendingInsertBarcodes = new Set<string>();

      for (const item of barangList) {
        const bCode = item.barcode.trim();
        if (!bCode) continue;

        const catId = item.departement ? categoryMap.get(item.departement.toLowerCase().trim()) || null : null;
        const suppId = item.supplier ? supplierMap.get(item.supplier.toLowerCase().trim()) || null : null;
        const safeBeli = sanitizeHpp(Math.round(item.harga_beli));
        const safeRata = sanitizeHpp(Math.round(item.hbt || item.harga_beli), safeBeli > 0 ? safeBeli : undefined);
        const safeIsi2 = item.isi_2 ? clampSafeInt32(item.isi_2, 0, 100_000) || null : null;
        const safeIsi3 = item.isi_3 ? clampSafeInt32(item.isi_3, 0, 100_000) || null : null;

        const isExisting = barcodeToId.has(bCode) || pendingInsertBarcodes.has(bCode);

        if (isExisting) {
          if (mode_duplikat === "UPDATE" && barcodeToId.has(bCode)) {
            const existingId = barcodeToId.get(bCode)!;
            await tx
              .update(barang)
              .set({
                nama_barang: item.nama_barang,
                kode_barang: item.kode_barang || null,
                id_kategori: catId,
                id_supplier: suppId,
                satuan_1: item.satuan_1,
                satuan_2: item.satuan_2 || null,
                satuan_3: item.satuan_3 || null,
                isi_2: safeIsi2,
                isi_3: safeIsi3,
                harga_beli: safeBeli,
                level_barang: item.level,
                lapor_pajak: item.lapor_pajak,
                terakhir_terjual: item.penjualan_terakhir || null,
                keterangan_1: item.keterangan_1 || null,
                keterangan_2: item.keterangan_2 || null,
              })
              .where(eq(barang.id_barang, existingId));
            masterUpdated++;
          } else {
            masterSkipped++;
          }
        } else {
          pendingInsertBarcodes.add(bCode);
          toInsertBarang.push({
            rawItem: item,
            values: {
              kode_barang: item.kode_barang || null,
              barcode: bCode,
              nama_barang: item.nama_barang,
              id_kategori: catId,
              id_supplier: suppId,
              satuan_1: item.satuan_1,
              satuan_2: item.satuan_2 || null,
              satuan_3: item.satuan_3 || null,
              isi_1: 1,
              isi_2: safeIsi2,
              isi_3: safeIsi3,
              harga_beli: safeBeli,
              harga_rata: safeRata,
              harga_jual_1_1: Math.round(safeBeli * 1.15), // Default +15% margin if not set
              level_barang: item.level,
              lapor_pajak: item.lapor_pajak,
              terakhir_terjual: item.penjualan_terakhir || null,
              keterangan_1: item.keterangan_1 || null,
              keterangan_2: item.keterangan_2 || null,
              status: "Aktif",
            },
          });
        }
      }

      // Batch insert master barang baru dalam chunk 500
      const BARANG_CHUNK_SIZE = 500;
      for (let i = 0; i < toInsertBarang.length; i += BARANG_CHUNK_SIZE) {
        const slice = toInsertBarang.slice(i, i + BARANG_CHUNK_SIZE);
        try {
          const inserted = await tx
            .insert(barang)
            .values(slice.map((s) => s.values))
            .returning({ id_barang: barang.id_barang, barcode: barang.barcode, kode_barang: barang.kode_barang });
          inserted.forEach((newB) => {
            barcodeToId.set(newB.barcode.trim(), newB.id_barang);
            if (newB.kode_barang) barcodeToId.set(newB.kode_barang.trim(), newB.id_barang);
            masterInserted++;
          });
        } catch {
          // Fallback per baris jika ada 1 barang dalam batch yang bermasalah
          for (const s of slice) {
            try {
              const [newB] = await tx.insert(barang).values(s.values).returning();
              barcodeToId.set(newB.barcode.trim(), newB.id_barang);
              if (newB.kode_barang) barcodeToId.set(newB.kode_barang.trim(), newB.id_barang);
              masterInserted++;
            } catch (insertErr: any) {
              masterSkipped++;
              errors.push(`Gagal menyimpan barang [${s.rawItem.barcode}] ${s.rawItem.nama_barang}: ${insertErr.message}`);
            }
          }
        }
      }
    }

    // Refresh barcode -> id_barang map if master was not imported but barcodes need to be resolved for stock / sales
    if (!import_master) {
      const refreshedList = await tx.select({ id: barang.id_barang, barcode: barang.barcode, kode_barang: barang.kode_barang }).from(barang);
      refreshedList.forEach((b) => {
        if (b.barcode) barcodeToId.set(b.barcode.trim(), b.id);
        if (b.kode_barang) barcodeToId.set(b.kode_barang.trim(), b.id);
      });
    }

    // ─── 3. STOK CABANG IMPORT ───────────────────────────────────────────────
    if (import_stok && barangList.length > 0) {
      // Preload current branch stock records
      const branchStockMap = new Map<number, number>(); // id_barang -> stok_barang.id
      const currentStocks = await tx
        .select()
        .from(stok_barang)
        .where(eq(stok_barang.id_cabang, id_cabang));
      currentStocks.forEach((s) => {
        if (s.id_barang) branchStockMap.set(s.id_barang, s.id);
      });

      // Preload existing prices from database as fallback if file price is 0
      const dbPriceMap = new Map<number, number>();
      const existingBarangPrices = await tx.select({ id: barang.id_barang, harga_beli: barang.harga_beli }).from(barang);
      existingBarangPrices.forEach((b) => {
        if (b.harga_beli) dbPriceMap.set(b.id, Number(b.harga_beli) || 0);
      });

      const toUpdateStokMap = new Map<number, { id: number; stok_akhir: number; level_cabang: string; terakhir_terjual_cabang: string | null }>();
      const toInsertStokMap = new Map<number, any>();
      const toInsertKartuMap = new Map<number, any>();

      for (const item of barangList) {
        const idBarang = barcodeToId.get(item.barcode.trim());
        if (!idBarang) continue;

        const safeStock = clampSafeInt32(item.stock, 0, 10_000_000);
        const existingStockId = branchStockMap.get(idBarang);
        if (existingStockId) {
          toUpdateStokMap.set(existingStockId, {
            id: existingStockId,
            stok_akhir: safeStock,
            level_cabang: item.level,
            terakhir_terjual_cabang: item.penjualan_terakhir || null,
          });
        } else {
          toInsertStokMap.set(idBarang, {
            id_barang: idBarang,
            id_cabang: id_cabang,
            stok_akhir: safeStock,
            level_cabang: item.level,
            terakhir_terjual_cabang: item.penjualan_terakhir || null,
          });
        }

        // Determine safe HPP (dengan pemulihan mandiri jika ada angka desimal lama tanpa koma)
        let rawHpp = Math.round(item.harga_beli || 0);
        if (!rawHpp || rawHpp <= 0) {
          rawHpp = Math.round(dbPriceMap.get(idBarang) || 0);
        }
        const hpp = sanitizeHpp(rawHpp);

        // Catat ke kartu_stok HANYA jika stok > 0 (sesuai keputusan user)
        if (safeStock > 0) {
          const totalNilai = Math.round(safeStock * hpp);
          toInsertKartuMap.set(idBarang, {
            id_barang: idBarang,
            id_cabang: id_cabang,
            tanggal_transaksi: nowIso.substring(0, 10),
            tipe_transaksi: "SALDO_AWAL",
            nomor_referensi: `MIG-STOK-${id_cabang}`,
            saldo_awal: 0,
            masuk: safeStock,
            keluar: 0,
            saldo_akhir: safeStock,
            hpp_satuan: hpp,
            total_nilai: totalNilai,
            keterangan: "Migrasi Saldo Awal Toko Sistem Lama",
            id_user: id_user,
          });
        }

        stokUpdated++;
      }

      const toUpdateStok = Array.from(toUpdateStokMap.values());
      const toInsertStok = Array.from(toInsertStokMap.values());
      const toInsertKartu = Array.from(toInsertKartuMap.values());

      // Batch update existing stok_barang in chunks of 500
      const CHUNK_SIZE = 500;
      for (let i = 0; i < toUpdateStok.length; i += CHUNK_SIZE) {
        const slice = toUpdateStok.slice(i, i + CHUNK_SIZE);
        const valueTuples = slice.map(
          (u) => sql`(${u.id}::int, ${u.stok_akhir}::int, ${u.level_cabang}::text, ${u.terakhir_terjual_cabang}::text)`
        );
        await tx.execute(sql`
          UPDATE stok_barang AS sb
          SET stok_akhir = v.stok_akhir,
              level_cabang = v.level_cabang,
              terakhir_terjual_cabang = v.terakhir_terjual_cabang
          FROM (VALUES ${sql.join(valueTuples, sql`, `)}) AS v(id, stok_akhir, level_cabang, terakhir_terjual_cabang)
          WHERE sb.id = v.id
        `);
      }

      // Batch insert stok_barang in chunks of 500 (optimasi performa 30x lebih cepat)
      for (let i = 0; i < toInsertStok.length; i += CHUNK_SIZE) {
        const chunk = toInsertStok.slice(i, i + CHUNK_SIZE);
        await tx.insert(stok_barang).values(chunk);
      }

      // Batch insert kartu_stok in chunks of 500
      for (let i = 0; i < toInsertKartu.length; i += CHUNK_SIZE) {
        const chunk = toInsertKartu.slice(i, i + CHUNK_SIZE);
        await tx.insert(kartu_stok).values(chunk);
      }
    }

    // ─── 4. TRANSAKSI HISTORIS IMPORT ────────────────────────────────────────
    if (import_transaksi && transaksiList.length > 0) {
      // Preload users cache
      const userCache = new Map<string, number>();
      const allUsers = await tx.select({ id: users.id, nama: users.nama_user }).from(users);
      allUsers.forEach((u) => userCache.set(u.nama.toLowerCase().trim(), u.id));

      // Preload pelanggan cache
      const custCache = new Map<string, number>();
      const allCust = await tx.select({ id: pelanggan.id_pelanggan, kode: pelanggan.kode_pelanggan, nama: pelanggan.nama_lengkap }).from(pelanggan);
      allCust.forEach((c) => {
        custCache.set(c.nama.toLowerCase().trim(), c.id);
        if (c.kode) custCache.set(c.kode.toLowerCase().trim(), c.id);
      });

      // Preload existing invoices to avoid duplicate key constraint
      const existingInvoices = new Set<string>();
      const invRows = await tx.select({ no_invoice: penjualan.no_invoice }).from(penjualan);
      invRows.forEach((r) => existingInvoices.add(r.no_invoice.trim().toUpperCase()));

      const pendingSales: {
        header: {
          no_invoice: string;
          tanggal_invoice: string;
          jam_invoice: string;
          id_pelanggan: number | null;
          nama_pelanggan: string;
          id_user: number;
          id_cabang: number;
          subtotal: number;
          diskon: number;
          total_akhir: number;
          jenis_pembayaran: string;
          jumlah_bayar: number;
          created_at: string;
        };
        items: TransaksiGrouped["items"];
      }[] = [];

      for (const rawTr of transaksiList) {
        const tr = sanitizeTransaksiGrouped(rawTr);
        const invKey = tr.no_invoice.trim().toUpperCase();
        if (existingInvoices.has(invKey)) {
          transaksiSkipped++;
          continue;
        }
        existingInvoices.add(invKey);

        // Resolve user
        let userId = id_user;
        if (tr.nm_user && userCache.has(tr.nm_user.toLowerCase().trim())) {
          userId = userCache.get(tr.nm_user.toLowerCase().trim())!;
        }

        // Resolve customer
        let custId: number | null = null;
        if (tr.kd_cust && custCache.has(tr.kd_cust.toLowerCase().trim())) {
          custId = custCache.get(tr.kd_cust.toLowerCase().trim())!;
        } else if (tr.nama_pelanggan && custCache.has(tr.nama_pelanggan.toLowerCase().trim())) {
          custId = custCache.get(tr.nama_pelanggan.toLowerCase().trim())!;
        }

        pendingSales.push({
          header: {
            no_invoice: tr.no_invoice,
            tanggal_invoice: tr.tanggal_invoice,
            jam_invoice: tr.jam_invoice,
            id_pelanggan: custId,
            nama_pelanggan: tr.nama_pelanggan,
            id_user: userId,
            id_cabang: id_cabang,
            subtotal: tr.subtotal,
            diskon: tr.diskon,
            total_akhir: tr.total_akhir,
            jenis_pembayaran: tr.jenis_pembayaran,
            jumlah_bayar: tr.jumlah_bayar,
            created_at: `${tr.tanggal_invoice} ${tr.jam_invoice}`,
          },
          items: tr.items,
        });
      }

      // Batch insert penjualan (chunk 300) & penjualan_detail (chunk 500) -> 30x lebih cepat, bebas timeout proxy
      const SALE_CHUNK_SIZE = 300;
      const DETAIL_CHUNK_SIZE = 500;
      for (let i = 0; i < pendingSales.length; i += SALE_CHUNK_SIZE) {
        const saleChunk = pendingSales.slice(i, i + SALE_CHUNK_SIZE);
        const insertedHeaders = await tx
          .insert(penjualan)
          .values(saleChunk.map((s) => s.header))
          .returning({ id_penjualan: penjualan.id_penjualan, no_invoice: penjualan.no_invoice });

        const invoiceToSaleId = new Map<string, number>();
        insertedHeaders.forEach((h) => {
          invoiceToSaleId.set(h.no_invoice.trim().toUpperCase(), h.id_penjualan);
        });

        const detailRowsToInsert: any[] = [];
        for (const s of saleChunk) {
          const idPenjualan = invoiceToSaleId.get(s.header.no_invoice.trim().toUpperCase());
          if (!idPenjualan) continue;

          for (const item of s.items) {
            let resolvedIdBarang: number | null = null;
            if (item.kd_brg && barcodeToId.has(item.kd_brg.trim())) {
              resolvedIdBarang = barcodeToId.get(item.kd_brg.trim())!;
            }
            detailRowsToInsert.push({
              id_penjualan: idPenjualan,
              id_barang: resolvedIdBarang,
              nama_barang: item.nama_barang,
              jumlah: item.jumlah,
              satuan: item.satuan,
              isi_satuan: item.isi_satuan,
              harga_jual: Math.round(item.harga_jual),
              harga_rata_saat_transaksi: Math.round(item.harga_rata),
              diskon: Math.round(item.diskon),
              subtotal: Math.round(item.subtotal),
              jenis_item: item.jenis_item,
            });
          }
          transaksiInserted++;
        }

        for (let j = 0; j < detailRowsToInsert.length; j += DETAIL_CHUNK_SIZE) {
          const detChunk = detailRowsToInsert.slice(j, j + DETAIL_CHUNK_SIZE);
          await tx.insert(penjualan_detail).values(detChunk);
        }
      }
    }

    // ─── 5. RECORD AUDIT LOG ─────────────────────────────────────────────────
    const totalLines = barangList.length + transaksiList.length;
    const totalSuccess = masterInserted + masterUpdated + stokUpdated + transaksiInserted;
    const totalFailed = errors.length;

    const summaryJson = JSON.stringify({
      master_inserted: masterInserted,
      master_updated: masterUpdated,
      master_skipped: masterSkipped,
      stok_updated: stokUpdated,
      transaksi_inserted: transaksiInserted,
      transaksi_skipped: transaksiSkipped,
      kategori_created: kategoriCreated,
      supplier_created: supplierCreated,
    });

    const statusVal = errors.length === 0 ? "SUCCESS" : totalSuccess > 0 ? "PARTIAL" : "FAILED";

    await tx.insert(migrasi_log).values({
      id_cabang: id_cabang,
      id_user: id_user,
      nama_file: preview.nama_file,
      tipe_migrasi: import_transaksi && import_master ? "ALL" : import_master ? "MASTER" : "STOK",
      total_baris: totalLines,
      berhasil: totalSuccess,
      gagal: totalFailed,
      detail_error: errors.length > 0 ? JSON.stringify(errors) : null,
      detail_summary: summaryJson,
      status: statusVal,
    });
  });

  // Clean temp cache
  jobCache.delete(job_id);
  const diskPath = path.join(TEMP_DIR, `${job_id}.json`);
  if (fs.existsSync(diskPath)) {
    try { fs.unlinkSync(diskPath); } catch {}
  }

  return {
    job_id,
    status: errors.length === 0 ? "SUCCESS" : masterInserted + stokUpdated + transaksiInserted > 0 ? "PARTIAL" : "FAILED",
    total_baris: barangList.length + transaksiList.length,
    berhasil: masterInserted + masterUpdated + stokUpdated + transaksiInserted,
    gagal: errors.length,
    master_inserted: masterInserted,
    master_updated: masterUpdated,
    master_skipped: masterSkipped,
    stok_updated: stokUpdated,
    transaksi_inserted: transaksiInserted,
    transaksi_skipped: transaksiSkipped,
    kategori_created: kategoriCreated,
    supplier_created: supplierCreated,
    errors,
  };
}

// ─── CANCEL JOB ──────────────────────────────────────────────────────────────

export function cancelMigrationJob(job_id: string): boolean {
  jobCache.delete(job_id);
  const diskPath = path.join(TEMP_DIR, `${job_id}.json`);
  if (fs.existsSync(diskPath)) {
    try { fs.unlinkSync(diskPath); return true; } catch {}
  }
  return true;
}

// ─── ROLLBACK MIGRATION ──────────────────────────────────────────────────────

export async function rollbackMigration(
  idLog: number,
  idUser: number
): Promise<{ success: boolean; message: string; details: any }> {
  // 1. Fetch migrasi_log
  const [log] = await db
    .select()
    .from(migrasi_log)
    .where(eq(migrasi_log.id, idLog))
    .limit(1);

  if (!log) {
    throw new Error("Log migrasi tidak ditemukan.");
  }

  if (log.status === "ROLLED_BACK") {
    throw new Error("Migrasi data ini sudah pernah dibatalkan sebelumnya.");
  }

  let stokLedgerDeleted = 0;
  let transaksiDeleted = 0;

  await db.transaction(async (tx) => {
    const idCabang = log.id_cabang;

    // 1. Hapus catatan kartu_stok saldo awal cabang ini
    const ksRef = `MIG-STOK-${idCabang}`;
    const ksRows = await tx
      .select({ id: kartu_stok.id_kartu })
      .from(kartu_stok)
      .where(and(eq(kartu_stok.id_cabang, idCabang), eq(kartu_stok.nomor_referensi, ksRef)));

    if (ksRows.length > 0) {
      await tx
        .delete(kartu_stok)
        .where(and(eq(kartu_stok.id_cabang, idCabang), eq(kartu_stok.nomor_referensi, ksRef)));
      stokLedgerDeleted = ksRows.length;
    }

    // 2. Reset stok fisik cabang di stok_barang ke 0
    await tx
      .update(stok_barang)
      .set({
        stok_akhir: 0,
        terakhir_terjual_cabang: null,
      })
      .where(eq(stok_barang.id_cabang, idCabang));

    // 3. Hapus transaksi penjualan migrasi jika ada
    const sales = await tx
      .select({ id: penjualan.id_penjualan })
      .from(penjualan)
      .where(and(eq(penjualan.id_cabang, idCabang), sql`${penjualan.no_invoice} LIKE 'MIG-%'`));

    if (sales.length > 0) {
      const saleIds = sales.map((s) => s.id);
      for (let i = 0; i < saleIds.length; i += 500) {
        const slice = saleIds.slice(i, i + 500);
        await tx.delete(penjualan_detail).where(inArray(penjualan_detail.id_penjualan, slice));
        await tx.delete(penjualan).where(inArray(penjualan.id_penjualan, slice));
      }
      transaksiDeleted = sales.length;
    }

    // 4. Update status log menjadi ROLLED_BACK
    let oldSummary: Record<string, any> = {};
    try {
      if (log.detail_summary) oldSummary = JSON.parse(log.detail_summary);
    } catch {}

    const updatedSummary = {
      ...oldSummary,
      rolled_back_at: new Date().toISOString(),
      rolled_back_by: idUser,
      stok_ledger_deleted: stokLedgerDeleted,
      transaksi_deleted: transaksiDeleted,
    };

    await tx
      .update(migrasi_log)
      .set({
        status: "ROLLED_BACK",
        detail_summary: JSON.stringify(updatedSummary),
      })
      .where(eq(migrasi_log.id, idLog));
  });

  return {
    success: true,
    message: `Migrasi [${log.nama_file}] berhasil dibatalkan. Stok cabang di-reset ke 0, ${stokLedgerDeleted} riwayat mutasi ditarik kembali${transaksiDeleted > 0 ? `, dan ${transaksiDeleted} nota transaksi migrasi dihapus` : ""}.`,
    details: { stokLedgerDeleted, transaksiDeleted },
  };
}

