export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

export type WidgetCategory = "FINANSIAL" | "OPERASIONAL" | "GUDANG" | "HRD" | "AKSI";

export interface WidgetMeta {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  defaultColSpan: string;
  requiresAdmin?: boolean;
}

export const WIDGET_CATALOG: WidgetMeta[] = [
  {
    id: "kpi_stats",
    title: "Ringkasan Metrik KPI Bisnis",
    description: "Omzet hari ini, perputaran kas, margin kotor, dan total transaksi kasir",
    category: "FINANSIAL",
    defaultColSpan: "col-span-12",
    requiresAdmin: true,
  },
  {
    id: "quick_actions",
    title: "Pintasan Aksi Cepat (Quick Launcher)",
    description: "Tombol jalan pintas ke Kasir POS, Buat PO, Mutasi Kas, dan Cek Stok",
    category: "AKSI",
    defaultColSpan: "col-span-12",
  },
  {
    id: "sales_cashflow_chart",
    title: "Grafik Tren Penjualan & Arus Kas",
    description: "Visualisasi tren omzet 7 hari terakhir dan perbandingan kas masuk vs kas keluar",
    category: "FINANSIAL",
    defaultColSpan: "col-span-12 xl:col-span-8",
    requiresAdmin: true,
  },
  {
    id: "branch_leaderboard",
    title: "Leaderboard Performa Antar-Cabang",
    description: "Peringkat omzet dan kontribusi penjualan seluruh cabang ritel",
    category: "FINANSIAL",
    defaultColSpan: "col-span-12 xl:col-span-4",
    requiresAdmin: true,
  },
  {
    id: "actionable_critical_stock",
    title: "Peringatan Stok Kritis & Stok Habis",
    description: "Daftar barang di bawah buffer dengan aksi langsung Buat PO atau Minta Transfer",
    category: "GUDANG",
    defaultColSpan: "col-span-12 xl:col-span-8",
  },
  {
    id: "fefo_batch_expired",
    title: "Peringatan Batch Mendekati Expired (FEFO)",
    description: "Monitoring batch makanan/sembako kedaluwarsa dalam 60 hari ke depan",
    category: "GUDANG",
    defaultColSpan: "col-span-12 xl:col-span-4",
  },
  {
    id: "active_cashier_shifts",
    title: "Status Shift Kasir & Uang Laci",
    description: "Pantau kasir yang sedang buka shift, modal awal, dan saldo uang fisik laci",
    category: "OPERASIONAL",
    defaultColSpan: "col-span-12 xl:col-span-6",
  },
  {
    id: "cash_accounts_liquidity",
    title: "Likuiditas Rekening Kas & Bank",
    description: "Rincian saldo real-time per rekening kas toko, DC, dan rekening bank",
    category: "FINANSIAL",
    defaultColSpan: "col-span-12 xl:col-span-6",
    requiresAdmin: true,
  },
  {
    id: "dc_shipment_tracking",
    title: "Pelacak Pengiriman & Surat Jalan DC",
    description: "Status surat jalan logistik antar-cabang yang sedang OTW atau siap diterima",
    category: "GUDANG",
    defaultColSpan: "col-span-12 xl:col-span-6",
  },
  {
    id: "supplier_payable_due",
    title: "Jatuh Tempo Hutang Supplier (AP)",
    description: "Tagihan faktur pembelian yang belum lunas atau mendekati tempo",
    category: "FINANSIAL",
    defaultColSpan: "col-span-12 xl:col-span-6",
    requiresAdmin: true,
  },
  {
    id: "hrd_attendance_summary",
    title: "Presensi & Kehadiran Abdi Hari Ini",
    description: "Tingkat kehadiran karyawan/abdi hari ini dan persentase disiplin waktu",
    category: "HRD",
    defaultColSpan: "col-span-12 xl:col-span-6",
  },
];

/**
 * Template Preset Bawaan berdasarkan Peran / Jabatan Pengguna
 */
export const ROLE_PRESETS: Record<string, { name: string; widgets: WidgetConfig[] }> = {
  OWNER: {
    name: "Preset Owner & Pimpinan Eksekutif",
    widgets: [
      { id: "kpi_stats", visible: true, order: 1 },
      { id: "quick_actions", visible: true, order: 2 },
      { id: "sales_cashflow_chart", visible: true, order: 3 },
      { id: "branch_leaderboard", visible: true, order: 4 },
      { id: "cash_accounts_liquidity", visible: true, order: 5 },
      { id: "supplier_payable_due", visible: true, order: 6 },
      { id: "actionable_critical_stock", visible: true, order: 7 },
      { id: "active_cashier_shifts", visible: true, order: 8 },
      { id: "dc_shipment_tracking", visible: false, order: 9 },
      { id: "fefo_batch_expired", visible: false, order: 10 },
      { id: "hrd_attendance_summary", visible: true, order: 11 },
    ],
  },
  TOKO: {
    name: "Preset Kepala Toko & Kasir",
    widgets: [
      { id: "quick_actions", visible: true, order: 1 },
      { id: "active_cashier_shifts", visible: true, order: 2 },
      { id: "actionable_critical_stock", visible: true, order: 3 },
      { id: "dc_shipment_tracking", visible: true, order: 4 },
      { id: "fefo_batch_expired", visible: true, order: 5 },
      { id: "hrd_attendance_summary", visible: true, order: 6 },
      { id: "kpi_stats", visible: false, order: 7 },
      { id: "sales_cashflow_chart", visible: false, order: 8 },
      { id: "branch_leaderboard", visible: false, order: 9 },
      { id: "cash_accounts_liquidity", visible: false, order: 10 },
      { id: "supplier_payable_due", visible: false, order: 11 },
    ],
  },
  LOGISTIK: {
    name: "Preset Logistik & Gudang DC",
    widgets: [
      { id: "quick_actions", visible: true, order: 1 },
      { id: "actionable_critical_stock", visible: true, order: 2 },
      { id: "fefo_batch_expired", visible: true, order: 3 },
      { id: "dc_shipment_tracking", visible: true, order: 4 },
      { id: "supplier_payable_due", visible: true, order: 5 },
      { id: "active_cashier_shifts", visible: false, order: 6 },
      { id: "hrd_attendance_summary", visible: true, order: 7 },
      { id: "kpi_stats", visible: false, order: 8 },
      { id: "sales_cashflow_chart", visible: false, order: 9 },
      { id: "branch_leaderboard", visible: false, order: 10 },
      { id: "cash_accounts_liquidity", visible: false, order: 11 },
    ],
  },
  HRD: {
    name: "Preset HRD & Personalia",
    widgets: [
      { id: "quick_actions", visible: true, order: 1 },
      { id: "hrd_attendance_summary", visible: true, order: 2 },
      { id: "active_cashier_shifts", visible: true, order: 3 },
      { id: "kpi_stats", visible: false, order: 4 },
      { id: "sales_cashflow_chart", visible: false, order: 5 },
      { id: "branch_leaderboard", visible: false, order: 6 },
      { id: "cash_accounts_liquidity", visible: false, order: 7 },
      { id: "supplier_payable_due", visible: false, order: 8 },
      { id: "actionable_critical_stock", visible: false, order: 9 },
      { id: "fefo_batch_expired", visible: false, order: 10 },
      { id: "dc_shipment_tracking", visible: false, order: 11 },
    ],
  },
};

/**
 * Deteksi preset bawaan yang paling cocok berdasarkan nama jabatan
 */
export function getDefaultPresetForRole(jabatan?: string): { presetKey: string; widgets: WidgetConfig[] } {
  if (!jabatan) {
    return { presetKey: "OWNER", widgets: ROLE_PRESETS.OWNER.widgets };
  }

  const jLower = jabatan.toLowerCase();

  if (jLower.includes("owner") || jLower.includes("direktur") || jLower.includes("super admin") || jLower.includes("keuangan") || jLower.includes("akuntansi")) {
    return { presetKey: "OWNER", widgets: ROLE_PRESETS.OWNER.widgets };
  }

  if (jLower.includes("kasir") || jLower.includes("toko") || jLower.includes("supervisor")) {
    return { presetKey: "TOKO", widgets: ROLE_PRESETS.TOKO.widgets };
  }

  if (jLower.includes("gudang") || jLower.includes("logistik") || jLower.includes("distribusi") || jLower.includes("pengadaan")) {
    return { presetKey: "LOGISTIK", widgets: ROLE_PRESETS.LOGISTIK.widgets };
  }

  if (jLower.includes("hrd") || jLower.includes("personalia") || jLower.includes("abdi") || jLower.includes("tata usaha")) {
    return { presetKey: "HRD", widgets: ROLE_PRESETS.HRD.widgets };
  }

  return { presetKey: "OWNER", widgets: ROLE_PRESETS.OWNER.widgets };
}

