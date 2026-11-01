"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Search,
  RefreshCw,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  ShoppingCart,
  Send,
  Building2,
  Calendar,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  Truck
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface CabangAllocation {
  id_cabang: number;
  nama_cabang: string;
  stok_fisik: number;
  min_stok: number;
  total_terjual: number;
  ads_cabang: number;
  runout_days: number;
  status_urgensi: "KRITIS" | "PERHATIAN" | "AMAN";
  saran_alokasi_pcs: number;
  saran_alokasi_kemasan: number;
}

interface SaranOrderItem {
  id_barang: number;
  barcode: string;
  nama_barang: string;
  id_supplier: number | null;
  nama_supplier: string;
  level_barang: "FAST" | "MEDIUM" | "SLOW" | "DEAD";
  safety_factor: number;
  warning_note?: string;
  satuan_1: string;
  total_stok: number;
  total_min_stok: number;
  total_on_order: number;
  total_qty_sold: number;
  lookback_days: number;
  ads: number;
  runout_days: number;
  status_urgensi: "KRITIS" | "PERHATIAN" | "AMAN";
  nama_kemasan: string;
  isi_kemasan: number;
  saran_qty_pcs_raw: number;
  saran_qty_kemasan: number;
  final_qty_pcs: number;
  harga_beli_pcs: number;
  harga_beli_kemasan: number;
  estimasi_subtotal: number;
  cabang_allocations: CabangAllocation[];
}

interface SummaryData {
  target_buffer_days: number;
  lead_time_days: number;
  lookback_days: number;
  total_sku: number;
  fast_moving_count: number;
  kritis_count: number;
  perhatian_count: number;
  aman_count: number;
  estimasi_total_anggaran: number;
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

export default function SaranOrderPage() {
  const router = useRouter();
  const { can_read, can_create, loading: permissionsLoading } = useMenuPermissions();

  const [items, setItems] = useState<SaranOrderItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Parameters
  const [lookbackDays, setLookbackDays] = useState<number>(30);
  const [targetBufferDays, setTargetBufferDays] = useState<number>(14);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "perhatian" | "kritis">("perhatian");
  const [search, setSearch] = useState<string>("");

  // Selection & Custom Overrides
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [customQuantities, setCustomQuantities] = useState<Record<number, number>>({});
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());

  // Modal & Generation
  const [generating, setGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [keteranganPo, setKeteranganPo] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  // 1. Load Suppliers
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch("/api/supplier");
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data);
        }
      } catch (err) {
        console.error("Gagal memuat supplier:", err);
      }
    }
    fetchSuppliers();
  }, []);

  // 2. Fetch Saran Order
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("lookback_days", lookbackDays.toString());
      params.set("target_buffer_days", targetBufferDays.toString());
      params.set("lead_time_days", leadTimeDays.toString());
      if (selectedSupplier !== "all") {
        params.set("id_supplier", selectedSupplier);
      }
      if (levelFilter !== "ALL") {
        params.set("level_barang", levelFilter);
      }
      if (urgencyFilter !== "all") {
        params.set("urgency", urgencyFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/pembelian/saran-order?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data analisis kemampuan jual & saran order");
      }
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setSummary(data.summary || null);
        // By default, select all items that are KRITIS or have saran_qty_kemasan > 0, except DEAD moving
        const autoSelected = new Set<number>();
        (data.items || []).forEach((it: SaranOrderItem) => {
          if (it.level_barang !== "DEAD" && (it.status_urgensi === "KRITIS" || it.saran_qty_kemasan > 0)) {
            autoSelected.add(it.id_barang);
          }
        });
        setSelectedIds(autoSelected);
      } else {
        throw new Error(data.error || "Gagal memproses data");
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan saat memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [lookbackDays, targetBufferDays, leadTimeDays, selectedSupplier, levelFilter, urgencyFilter, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle Row Expansion
  const toggleExpandRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRowIds(next);
  };

  // Selection helpers
  const handleToggleSelect = (id: number) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.filter(i => i.level_barang !== "DEAD").map((i) => i.id_barang)));
    }
  };

  const handleSelectCriticalOnly = () => {
    const criticalOnly = new Set<number>();
    items.forEach((it) => {
      if (it.level_barang !== "DEAD" && it.status_urgensi === "KRITIS" && it.saran_qty_kemasan > 0) {
        criticalOnly.add(it.id_barang);
      }
    });
    setSelectedIds(criticalOnly);
  };

  // Selected items calculation
  const selectedItemsList = useMemo(() => {
    return items.filter((it) => selectedIds.has(it.id_barang));
  }, [items, selectedIds]);

  const selectedTotalBudget = useMemo(() => {
    return selectedItemsList.reduce((sum, it) => {
      const qtyKemasan = customQuantities[it.id_barang] !== undefined ? customQuantities[it.id_barang] : it.saran_qty_kemasan;
      return sum + (qtyKemasan * it.harga_beli_kemasan);
    }, 0);
  }, [selectedItemsList, customQuantities]);

  // Count unique suppliers in selection
  const uniqueSelectedSuppliers = useMemo(() => {
    const map = new Map<number | string, string>();
    selectedItemsList.forEach((it) => {
      const sId = it.id_supplier || "unknown";
      if (!map.has(sId)) {
        map.set(sId, it.nama_supplier);
      }
    });
    return Array.from(map.entries());
  }, [selectedItemsList]);

  // Generate PO
  const handleGeneratePO = async () => {
    if (selectedItemsList.length === 0) {
      showToast("Pilih minimal satu barang untuk membuat PO", "error");
      return;
    }

    setGenerating(true);
    try {
      const payloadItems = selectedItemsList.map((it) => {
        const qtyKemasan = customQuantities[it.id_barang] !== undefined ? customQuantities[it.id_barang] : it.saran_qty_kemasan;
        const finalPcs = qtyKemasan * it.isi_kemasan;
        const subtotal = qtyKemasan * it.harga_beli_kemasan;

        return {
          id_barang: it.id_barang,
          nama_barang: it.nama_barang,
          id_supplier: it.id_supplier,
          jumlah_barang: finalPcs,
          harga_satuan: it.harga_beli_pcs,
          subtotal: subtotal,
        };
      });

      const res = await fetch("/api/pembelian/saran-order/generate-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keterangan:
            keteranganPo ||
            `Generated otomatis dari Analisis Kemampuan Jual PO Multi-Cabang (Buffer ${targetBufferDays}hr + Lead Time ${leadTimeDays}hr)`,
          items: payloadItems,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowConfirmModal(false);
        showToast(
          `Berhasil membuat ${data.count || 1} Purchase Order baru! Mengalihkan ke daftar PO...`,
          "success"
        );
        setTimeout(() => {
          router.push("/pembelian/po");
        }, 1200);
      } else {
        throw new Error(data.error || "Gagal membuat dokumen PO");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal membuat Purchase Order", "error");
    } finally {
      setGenerating(false);
    }
  };

  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <AlertTriangle className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk melihat halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-on-background pb-28">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-surface border border-primary/20 p-5 md:p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Peramalan Daya Jual Multi-Cabang & Smart Procurement
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-on-surface tracking-tight">
              Analisis Kemampuan Jual & Saran PO Distributor
            </h1>
            <p className="text-on-surface-variant text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Mengkonsolidasikan kemampuan jual seluruh cabang toko, lead time vendor, dan tingkat perputaran produk (Fast/Medium/Slow) untuk pemesanan kuantiti karton ke distributor secara presisi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 bg-surface hover:bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
              <span>Hitung Ulang</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Fast Moving Kritis */}
        <div className="bg-surface border border-error/25 p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Fast Moving Kritis
            </span>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-error flex items-baseline gap-1.5">
              {summary ? summary.kritis_count : "-"}
              <span className="text-xs font-normal text-on-surface-variant">SKU</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              Stok &le; 3 hari, harus segera di-PO ke vendor
            </p>
          </div>
        </div>

        {/* Perhatian */}
        <div className="bg-surface border border-amber-500/25 p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              SKU Perhatian
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-500 flex items-baseline gap-1.5">
              {summary ? summary.perhatian_count : "-"}
              <span className="text-xs font-normal text-on-surface-variant">SKU</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              Ketahanan stok 4 s/d 7 hari ke depan
            </p>
          </div>
        </div>

        {/* Total Estimasi Anggaran */}
        <div className="bg-surface border border-emerald-500/25 p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Estimasi Total PO
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
              {summary ? formatCurrency(summary.estimasi_total_anggaran) : "Rp 0"}
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              Kebutuhan cover {targetBufferDays + leadTimeDays} hari (Buffer + Lead Time)
            </p>
          </div>
        </div>

        {/* Total Teranalisis */}
        <div className="bg-surface border border-outline-variant/30 p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Total Teranalisis
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-on-surface flex items-baseline gap-1.5">
              {summary ? summary.total_sku : "-"}
              <span className="text-xs font-normal text-on-surface-variant">SKU</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              {summary ? `${summary.aman_count} SKU aman stok` : "Memuat..."}
            </p>
          </div>
        </div>
      </div>

      {/* Control & Filter Panel */}
      <div className="bg-surface border border-outline-variant/30 p-4 rounded-2xl shadow-xs space-y-3.5">
        {/* Row 1: Parameters (Lookback, Buffer, Lead Time, Level) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Lookback History Period */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              📅 Periode Analisis Daya Jual:
            </label>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              <option value={7}>7 Hari Terakhir (Tren Cepat / Promo)</option>
              <option value={14}>14 Hari Terakhir (2 Minggu)</option>
              <option value={30}>30 Hari Terakhir (1 Bulan - Standar)</option>
              <option value={60}>60 Hari Terakhir (2 Bulan)</option>
              <option value={90}>90 Hari Terakhir (Kuartal / Musiman)</option>
            </select>
          </div>

          {/* Target Buffer Days */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              🛡️ Target Buffer Toko:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="90"
                value={targetBufferDays}
                onChange={(e) => setTargetBufferDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface font-semibold text-center focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium">Hari</span>
            </div>
          </div>

          {/* Lead Time Vendor */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-primary" /> Lead Time Kirim:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="30"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface font-semibold text-center focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium">Hari</span>
            </div>
          </div>

          {/* Level Barang Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              🏷️ Filter Level Barang:
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              <option value="ALL">Semua Level Produk</option>
              <option value="FAST">⚡ Fast Moving (Buffer +20%)</option>
              <option value="MEDIUM">🔄 Medium Moving (Buffer Standar)</option>
              <option value="SLOW">⏳ Slow Moving (Buffer Ramping -30%)</option>
              <option value="DEAD">🛑 Dead Moving (Blokir Order Ulang)</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              Status Urgensi:
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              <option value="perhatian">Kritis & Perhatian</option>
              <option value="kritis">Kritis Saja</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
        </div>

        {/* Row 2: Search, Supplier, Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-outline-variant/20 items-center">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari barcode atau nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-4">
            <div className="relative">
              <Building2 className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant text-on-surface rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">-- Seluruh Supplier / Prinsipal --</option>
                {suppliers.map((s) => (
                  <option key={s.id_supplier} value={s.id_supplier}>
                    {s.nama_supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Select Actions */}
          <div className="md:col-span-4 flex items-center justify-end gap-2 text-xs">
            <button
              onClick={handleSelectCriticalOnly}
              className="px-3 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/20 rounded-xl font-medium transition-colors"
            >
              Pilih Kritis
            </button>
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded-xl font-medium transition-colors"
            >
              {selectedIds.size === items.length && items.length > 0
                ? "Batal Pilih"
                : "Pilih Semua Tampil"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-semibold">Menganalisis Daya Jual Konsolidasi Multi-Cabang...</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Menghitung ADS per cabang, level perputaran produk, dan pembulatan kemasan vendor
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-on-surface">Stok Aman & Terpenuhi!</h3>
            <p className="text-xs text-on-surface-variant/80 mt-1 max-w-sm text-center">
              Tidak ada barang yang memerlukan restock untuk kriteria filter dan target buffer {targetBufferDays} hari saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {selectedIds.size === items.length && items.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 min-w-[240px]">Barang, Supplier & Level</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Stok Global</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Daya Jual Global</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Ketahanan Stok</th>
                  <th className="py-3 px-3 text-center min-w-[180px]">Saran Order Kemasan</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Estimasi Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {items.map((it) => {
                  const isSelected = selectedIds.has(it.id_barang);
                  const isExpanded = expandedRowIds.has(it.id_barang);
                  const currentQtyKemasan = customQuantities[it.id_barang] !== undefined ? customQuantities[it.id_barang] : it.saran_qty_kemasan;
                  const currentSubtotal = currentQtyKemasan * it.harga_beli_kemasan;

                  return (
                    <div key={it.id_barang} className="contents">
                      <tr
                        onClick={() => it.level_barang !== "DEAD" && handleToggleSelect(it.id_barang)}
                        className={`transition-colors ${
                          it.level_barang === "DEAD"
                            ? "bg-rose-500/5 opacity-80 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                            : "hover:bg-surface-container-low/60 cursor-pointer"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={it.level_barang === "DEAD"}
                            onClick={() => handleToggleSelect(it.id_barang)}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-outline-variant" />
                            )}
                          </button>
                        </td>

                        {/* Product Name, Supplier, Level Badge & Expand Button */}
                        <td className="py-3 px-3">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => toggleExpandRow(it.id_barang, e)}
                              className="p-1 rounded-md hover:bg-surface-container-high text-on-surface-variant mt-0.5 transition-colors"
                              title="Buka rincian alokasi per cabang"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                              )}
                            </button>
                            <div>
                              <div className="font-semibold text-on-surface text-[13px] flex items-center gap-2">
                                <span>{it.nama_barang}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="font-mono text-[10px] text-on-surface-variant/80 bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/30">
                                  {it.barcode}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                                  it.level_barang === "FAST"
                                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                                    : it.level_barang === "SLOW"
                                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                    : it.level_barang === "DEAD"
                                    ? "bg-rose-500/15 text-rose-600 border border-rose-500/30 line-through"
                                    : "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                                }`}>
                                  {it.level_barang === "FAST" && "⚡ FAST"}
                                  {it.level_barang === "MEDIUM" && "🔄 MEDIUM"}
                                  {it.level_barang === "SLOW" && "⏳ SLOW"}
                                  {it.level_barang === "DEAD" && "🛑 DEAD"}
                                </span>
                                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium truncate max-w-[140px]">
                                  {it.nama_supplier}
                                </span>
                              </div>
                              {it.warning_note && (
                                <p className="text-[10px] text-error font-medium mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-error shrink-0" />
                                  {it.warning_note}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Consolidated Stock */}
                        <td className="py-3 px-3 text-center">
                          <div className="font-bold text-[13px]">
                            {it.total_stok}{" "}
                            <span className="text-[10px] font-normal text-on-surface-variant">
                              {it.satuan_1}
                            </span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                            Min: {it.total_min_stok} | PO: {it.total_on_order}
                          </div>
                        </td>

                        {/* Sales Velocity (ADS) */}
                        <td className="py-3 px-3 text-center">
                          <div className="font-bold text-primary text-[13px]">
                            {it.ads}{" "}
                            <span className="text-[10px] font-normal text-on-surface-variant">
                              /hari
                            </span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                            {it.lookback_days}hr: {it.total_qty_sold} {it.satuan_1}
                          </div>
                        </td>

                        {/* Runout Projection & Urgency Badge */}
                        <td className="py-3 px-3 text-center">
                          {it.level_barang === "DEAD" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                              TIDAK ADA JUAL
                            </span>
                          ) : it.status_urgensi === "KRITIS" ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-error/15 text-error border border-error/30 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                                KRITIS ({it.runout_days} hr)
                              </span>
                              <span className="text-[9px] text-error/80 mt-0.5">Habis &le; 3 hari</span>
                            </div>
                          ) : it.status_urgensi === "PERHATIAN" ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                PERHATIAN ({it.runout_days} hr)
                              </span>
                              <span className="text-[9px] text-amber-500/80 mt-0.5">Tahan &le; 7 hari</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              AMAN ({it.runout_days > 90 ? ">90" : it.runout_days} hr)
                            </span>
                          )}
                        </td>

                        {/* Smart Packaging Recommendation & Inline Override */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {it.level_barang === "DEAD" ? (
                            <span className="text-on-surface-variant/50 italic text-[11px]">
                              0 (Produk Mati)
                            </span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  value={currentQtyKemasan}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setCustomQuantities((prev) => ({ ...prev, [it.id_barang]: val }));
                                  }}
                                  className="w-16 px-2 py-1 text-center font-extrabold text-sm text-primary bg-surface border border-outline-variant/60 rounded-lg focus:border-primary focus:outline-none shadow-xs"
                                />
                                <span className="font-semibold text-xs text-on-surface">
                                  {it.nama_kemasan}
                                </span>
                              </div>
                              <div className="text-[10px] text-on-surface-variant/80 mt-1">
                                {it.isi_kemasan > 1 ? (
                                  <span>
                                    = {currentQtyKemasan * it.isi_kemasan} {it.satuan_1} (@{it.isi_kemasan})
                                  </span>
                                ) : (
                                  <span>Kebutuhan nett: {it.saran_qty_pcs_raw} {it.satuan_1}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Estimated Subtotal */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-[13px] text-on-surface">
                            {formatCurrency(currentSubtotal)}
                          </div>
                          <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                            @{formatCurrency(it.harga_beli_pcs)} / {it.satuan_1}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Branch Allocation Matrix */}
                      {isExpanded && (
                        <tr className="bg-surface-container-lowest/80 border-b border-outline-variant/30">
                          <td colSpan={7} className="p-3 pl-12 pr-6">
                            <div className="bg-surface rounded-xl border border-outline-variant/40 p-4 space-y-3 shadow-inner">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-on-surface">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-primary" />
                                  <span>Rincian Daya Jual & Kebutuhan Stok di Tiap Cabang ({it.cabang_allocations.length} Toko)</span>
                                </div>
                                <span className="text-[11px] font-normal text-on-surface-variant">
                                  Cover: {targetBufferDays} hr buffer + {leadTimeDays} hr lead time | Kemasan: {it.nama_kemasan} (@{it.isi_kemasan} {it.satuan_1})
                                </span>
                              </div>

                              {it.cabang_allocations.length === 0 ? (
                                <p className="text-xs text-on-surface-variant/70 italic py-2">
                                  Belum ada catatan transaksi maupun stok produk ini di cabang manapun.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                      <tr className="border-b border-outline-variant/30 text-on-surface-variant font-semibold bg-surface-container-low">
                                        <th className="py-2 px-3">Nama Cabang Toko</th>
                                        <th className="py-2 px-2 text-center">Stok Fisik Saat Ini</th>
                                        <th className="py-2 px-2 text-center">Terjual ({it.lookback_days}hr)</th>
                                        <th className="py-2 px-2 text-center">ADS Cabang (/hari)</th>
                                        <th className="py-2 px-2 text-center">Ketahanan Stok</th>
                                        <th className="py-2 px-2 text-center">Status Toko</th>
                                        <th className="py-2 px-3 text-right">Saran Alokasi Cabang</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                                      {it.cabang_allocations.map((cab) => (
                                        <tr key={cab.id_cabang} className="hover:bg-surface-container-high/40">
                                          <td className="py-2 px-3 font-medium">
                                            {cab.nama_cabang}
                                          </td>
                                          <td className="py-2 px-2 text-center font-bold">
                                            {cab.stok_fisik} {it.satuan_1}
                                          </td>
                                          <td className="py-2 px-2 text-center text-on-surface-variant">
                                            {cab.total_terjual} {it.satuan_1}
                                          </td>
                                          <td className="py-2 px-2 text-center font-mono text-primary font-semibold">
                                            {cab.ads_cabang}
                                          </td>
                                          <td className="py-2 px-2 text-center">
                                            {cab.runout_days > 90 ? ">90 hr" : `${cab.runout_days} hr`}
                                          </td>
                                          <td className="py-2 px-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                              cab.status_urgensi === "KRITIS"
                                                ? "bg-error/15 text-error border border-error/30"
                                                : cab.status_urgensi === "PERHATIAN"
                                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                            }`}>
                                              {cab.status_urgensi}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-right">
                                            {cab.saran_alokasi_kemasan > 0 ? (
                                              <span className="font-bold text-primary">
                                                {cab.saran_alokasi_kemasan} {it.nama_kemasan}{" "}
                                                <span className="text-[10px] font-normal text-on-surface-variant">
                                                  ({cab.saran_alokasi_pcs} {it.satuan_1})
                                                </span>
                                              </span>
                                            ) : (
                                              <span className="text-on-surface-variant/50 italic text-[10px]">Stok Cukup</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Selected Items */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-4xl bg-surface/95 backdrop-blur-md border border-primary/30 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>{selectedIds.size} Produk Terpilih</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  {uniqueSelectedSuppliers.length} Supplier
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Total Estimasi Modal PO:{" "}
                <span className="font-bold text-primary">{formatCurrency(selectedTotalBudget)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Batalkan Pilihan
            </button>
            {can_create && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all active:scale-95"
              >
                <span>Generate Dokumen PO Resmi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Konfirmasi Pembuatan Purchase Order</h3>
                  <p className="text-xs text-on-surface-variant">
                    Sistem akan menerbitkan dokumen Purchase Order resmi ke sistem pengadaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 text-xs">
              <div className="flex justify-between items-center text-on-surface">
                <span className="text-on-surface-variant">Jumlah Barang:</span>
                <span className="font-bold">{selectedItemsList.length} item</span>
              </div>
              <div className="flex justify-between items-center text-on-surface">
                <span className="text-on-surface-variant">Jumlah Supplier Terkait:</span>
                <span className="font-bold">{uniqueSelectedSuppliers.length} supplier</span>
              </div>
              <div className="flex justify-between items-center text-on-surface pt-2 border-t border-outline-variant/20">
                <span className="text-on-surface-variant">Estimasi Total Tagihan PO:</span>
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(selectedTotalBudget)}
                </span>
              </div>
            </div>

            {/* List Supplier Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                Supplier Yang Akan Diterbitkan PO:
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {uniqueSelectedSuppliers.map(([sId, sName]) => {
                  const countForSupplier = selectedItemsList.filter(
                    (i) => (i.id_supplier || "unknown") === sId
                  ).length;
                  return (
                    <div
                      key={sId}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface border border-outline-variant/20 text-xs"
                    >
                      <span className="font-medium text-on-surface">{sName}</span>
                      <span className="text-on-surface-variant text-[11px]">
                        {countForSupplier} item
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Memo / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                Catatan / Keterangan PO (Opsional)
              </label>
              <textarea
                value={keteranganPo}
                onChange={(e) => setKeteranganPo(e.target.value)}
                placeholder={`Otomatis dari Analisis Daya Jual Multi-Cabang (Buffer ${targetBufferDays}hr + Lead Time ${leadTimeDays}hr)`}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={generating}
                className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGeneratePO}
                disabled={generating}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan PO...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Terbitkan PO Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
