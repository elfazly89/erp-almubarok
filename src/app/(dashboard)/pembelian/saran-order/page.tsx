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
  X
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface SaranOrderItem {
  id_barang: number;
  barcode: string;
  nama_barang: string;
  id_supplier: number | null;
  nama_supplier: string;
  satuan_1: string;
  total_stok: number;
  total_min_stok: number;
  total_on_order: number;
  total_qty_sold_30: number;
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
}

interface SummaryData {
  target_days: number;
  total_sku: number;
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

  // Filters
  const [targetDays, setTargetDays] = useState<number>(14);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "perhatian" | "kritis">("perhatian");
  const [search, setSearch] = useState<string>("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
      params.set("target_days", targetDays.toString());
      if (selectedSupplier !== "all") {
        params.set("id_supplier", selectedSupplier);
      }
      if (urgencyFilter !== "all") {
        params.set("urgency", urgencyFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/pembelian/saran-order?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data saran order");
      }
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setSummary(data.summary || null);
        // By default, select all items that are KRITIS or have saran_qty_kemasan > 0
        const autoSelected = new Set<number>();
        (data.items || []).forEach((it: SaranOrderItem) => {
          if (it.status_urgensi === "KRITIS" && it.saran_qty_kemasan > 0) {
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
  }, [targetDays, selectedSupplier, urgencyFilter, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      setSelectedIds(new Set(items.map((i) => i.id_barang)));
    }
  };

  const handleSelectCriticalOnly = () => {
    const criticalOnly = new Set<number>();
    items.forEach((it) => {
      if (it.status_urgensi === "KRITIS" && it.saran_qty_kemasan > 0) {
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
    return selectedItemsList.reduce((sum, it) => sum + it.estimasi_subtotal, 0);
  }, [selectedItemsList]);

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
      const payloadItems = selectedItemsList.map((it) => ({
        id_barang: it.id_barang,
        nama_barang: it.nama_barang,
        id_supplier: it.id_supplier,
        jumlah_barang: it.final_qty_pcs,
        harga_satuan: it.harga_beli_pcs,
        subtotal: it.estimasi_subtotal,
      }));

      const res = await fetch("/api/pembelian/saran-order/generate-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keterangan:
            keteranganPo ||
            `Generated otomatis dari Saran Order Cerdas (Target ${targetDays} Hari)`,
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
    <div className="space-y-6 text-on-background pb-28">
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-surface border border-primary/20 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Algoritma Sales Velocity & Stok Minimum Konsolidasi
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Saran Order Pembelian Cerdas
            </h1>
            <p className="text-on-surface-variant text-sm mt-1 max-w-2xl">
              Rekomendasi pemesanan barang otomatis ke supplier berdasarkan riwayat daya jual (Average Daily Sales 30 Hari) seluruh cabang, pengamanan stok minimum, dan pembulatan kemasan karton vendor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 bg-surface hover:bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${loading ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kritis */}
        <div className="bg-surface border border-error/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              SKU Kritis
            </span>
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-error flex items-baseline gap-2">
              {summary ? summary.kritis_count : "-"}
              <span className="text-xs font-normal text-on-surface-variant">item</span>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              Stok habis atau ketahanan $\le$ 3 hari
            </p>
          </div>
        </div>

        {/* Perhatian */}
        <div className="bg-surface border border-amber-500/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              SKU Perhatian
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-amber-500 flex items-baseline gap-2">
              {summary ? summary.perhatian_count : "-"}
              <span className="text-xs font-normal text-on-surface-variant">item</span>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              Ketahanan stok 4 sampai 7 hari
            </p>
          </div>
        </div>

        {/* Total Estimasi Anggaran */}
        <div className="bg-surface border border-emerald-500/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Estimasi Anggaran
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary ? formatCurrency(summary.estimasi_total_anggaran) : "Rp 0"}
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              Nilai modal order target {targetDays} hari
            </p>
          </div>
        </div>

        {/* Total Teranalisis */}
        <div className="bg-surface border border-outline-variant/30 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              SKU Teranalisis
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-on-surface flex items-baseline gap-2">
              {summary ? summary.total_sku : "-"}
              <span className="text-xs font-normal text-on-surface-variant">produk</span>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              {summary ? `${summary.aman_count} item aman` : "Menganalisis..."}
            </p>
          </div>
        </div>
      </div>

      {/* Control & Filter Panel */}
      <div className="bg-surface border border-outline-variant/30 p-4 md:p-5 rounded-2xl shadow-sm space-y-4">
        {/* Row 1: Target Days Selector & Urgency Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Target Buffer Days */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-primary" /> Target Buffer Stok:
            </span>
            {[
              { days: 7, label: "7 Hari (1 Mgg)" },
              { days: 14, label: "14 Hari (2 Mgg)", badge: "Rekomendasi" },
              { days: 21, label: "21 Hari (3 Mgg)" },
              { days: 30, label: "30 Hari (1 Bln)" },
            ].map((option) => (
              <button
                key={option.days}
                onClick={() => setTargetDays(option.days)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  targetDays === option.days
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30"
                }`}
              >
                {option.label}
                {option.badge && targetDays !== option.days && (
                  <span className="ml-1.5 px-1 py-0.2 text-[9px] rounded-full bg-primary/20 text-primary font-bold">
                    ★
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs">
            <button
              onClick={() => setUrgencyFilter("perhatian")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                urgencyFilter === "perhatian"
                  ? "bg-surface text-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Kritis & Perhatian
            </button>
            <button
              onClick={() => setUrgencyFilter("kritis")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                urgencyFilter === "kritis"
                  ? "bg-surface text-error shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Kritis Saja
            </button>
            <button
              onClick={() => setUrgencyFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                urgencyFilter === "all"
                  ? "bg-surface text-on-surface shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Semua Status
            </button>
          </div>
        </div>

        {/* Row 2: Search & Supplier Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-outline-variant/20">
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
                <option value="all">-- Seluruh Supplier Distributor --</option>
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
              Pilih Semua Kritis
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
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium">Menganalisis data penjualan & stok konsolidasi...</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Menghitung ADS 30 hari dan pembulatan satuan kemasan vendor
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-on-surface">Semua Stok Terpenuhi!</h3>
            <p className="text-xs text-on-surface-variant/80 mt-1 max-w-sm text-center">
              Tidak ada barang yang memerlukan restock untuk kriteria filter dan target buffer {targetDays} hari saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
                  <th className="py-3 px-4 w-10 text-center">
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
                  <th className="py-3 px-4 min-w-[220px]">Barang & Supplier</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Stok Konsolidasi</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Daya Jual (ADS)</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Ketahanan & Urgensi</th>
                  <th className="py-3 px-4 min-w-[180px]">Saran Order Kemasan</th>
                  <th className="py-3 px-4 text-right min-w-[130px]">Estimasi Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {items.map((it) => {
                  const isSelected = selectedIds.has(it.id_barang);
                  return (
                    <tr
                      key={it.id_barang}
                      onClick={() => handleToggleSelect(it.id_barang)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-surface-container-low/60"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleSelect(it.id_barang)}
                          className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-outline-variant" />
                          )}
                        </button>
                      </td>

                      {/* Product Name & Supplier */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-on-surface text-[13px]">
                          {it.nama_barang}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-on-surface-variant/80 bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/30">
                            {it.barcode}
                          </span>
                          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium truncate max-w-[150px]">
                            {it.nama_supplier}
                          </span>
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
                          30hr: {it.total_qty_sold_30} {it.satuan_1}
                        </div>
                      </td>

                      {/* Runout Projection & Urgency Badge */}
                      <td className="py-3 px-3 text-center">
                        {it.status_urgensi === "KRITIS" ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/15 text-error border border-error/30 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-error" />
                              KRITIS ({it.runout_days} hr)
                            </span>
                            <span className="text-[9px] text-error/80 mt-0.5">Segera Pesan!</span>
                          </div>
                        ) : it.status_urgensi === "PERHATIAN" ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              PERHATIAN ({it.runout_days} hr)
                            </span>
                            <span className="text-[9px] text-amber-500/80 mt-0.5">Tahan &le; 1 mgg</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            AMAN ({it.runout_days > 90 ? ">90" : it.runout_days} hr)
                          </span>
                        )}
                      </td>

                      {/* Smart Packaging Recommendation */}
                      <td className="py-3 px-4">
                        {it.saran_qty_kemasan > 0 ? (
                          <div>
                            <div className="font-bold text-[13px] text-on-surface flex items-baseline gap-1">
                              <span className="text-primary font-extrabold text-sm">
                                {it.saran_qty_kemasan}
                              </span>{" "}
                              {it.nama_kemasan}
                              {it.isi_kemasan > 1 && (
                                <span className="text-[11px] font-normal text-on-surface-variant">
                                  (= {it.final_qty_pcs} {it.satuan_1})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                              {it.isi_kemasan > 1
                                ? `@ ${it.isi_kemasan} ${it.satuan_1} per ${it.nama_kemasan}`
                                : `Kebutuhan nett: ${it.saran_qty_pcs_raw} ${it.satuan_1}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/60 italic text-[11px]">
                            Stok masih cukup
                          </span>
                        )}
                      </td>

                      {/* Estimated Subtotal */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-[13px] text-on-surface">
                          {formatCurrency(it.estimasi_subtotal)}
                        </div>
                        <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                          @{formatCurrency(it.harga_beli_pcs)} / {it.satuan_1}
                        </div>
                      </td>
                    </tr>
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
                Total Estimasi Modal:{" "}
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
                <span>Generate PO Resmi</span>
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
                  <h3 className="text-lg font-bold text-on-surface">Konfirmasi Pembuatan PO</h3>
                  <p className="text-xs text-on-surface-variant">
                    Sistem akan membuat dokumen Purchase Order resmi
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
                placeholder={`Otomatis dari Saran Order Cerdas (Target Buffer ${targetDays} Hari)`}
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
