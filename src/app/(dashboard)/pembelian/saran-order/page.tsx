"use client";

import React, { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Search,
  RefreshCw,
  ArrowRight,
  CheckSquare,
  Square,
  ShoppingCart,
  Send,
  Building2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RotateCcw,
  Plus,
  Minus,
  Truck,
  HelpCircle,
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";
import SupplierSearchSelect from "@/components/ui/SupplierSearchSelect";
import TablePagination from "@/components/ui/TablePagination";

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
  fsn_config?: {
    fast_days: number;
    medium_days: number;
    slow_days: number;
    incubation_days: number;
    fast_buffer_pct: number;
    slow_buffer_pct: number;
  };
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

type SortField =
  | "nama_barang"
  | "total_stok"
  | "ads"
  | "runout_days"
  | "saran_qty_kemasan"
  | "estimasi_subtotal";

type SortDirection = "asc" | "desc";

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

  // Interactive Sorting
  const [sortField, setSortField] = useState<SortField>("runout_days");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);

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
        throw new Error("Gagal mengambil data rekomendasi pesanan");
      }
      const data = await res.json();
      if (data.success) {
        const fetchedItems: SaranOrderItem[] = data.items || [];
        setItems(fetchedItems);
        setSummary(data.summary || null);

        // Otomatis centang barang yang hampir habis / kritis, punya pemasok, dan butuh pesan > 0
        const autoSelected = new Set<number>();
        fetchedItems.forEach((it) => {
          if (
            it.level_barang !== "DEAD" &&
            it.id_supplier &&
            it.saran_qty_kemasan > 0 &&
            it.status_urgensi === "KRITIS"
          ) {
            autoSelected.add(it.id_barang);
          }
        });
        setSelectedIds(autoSelected);
        setPage(1);
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

  // Reset Filters
  const handleResetFilters = () => {
    setLookbackDays(30);
    setTargetBufferDays(14);
    setLeadTimeDays(3);
    setSelectedSupplier("all");
    setLevelFilter("ALL");
    setUrgencyFilter("perhatian");
    setSearch("");
    setPage(1);
  };

  // Toggle Row Expansion
  const toggleExpandRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRowIds(next);
  };

  // Quantity Change Handler
  const handleQtyChange = (id: number, valStr: string) => {
    const val = valStr === "" ? 0 : Math.max(0, parseInt(valStr, 10) || 0);
    setCustomQuantities((prev) => ({ ...prev, [id]: val }));

    if (val === 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      const item = items.find((i) => i.id_barang === id);
      if (item && item.id_supplier && item.level_barang !== "DEAD") {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
    }
  };

  // Quick Step Quantity (+ / -)
  const handleStepQty = (id: number, currentQty: number, step: number) => {
    const nextVal = Math.max(0, currentQty + step);
    handleQtyChange(id, String(nextVal));
  };

  // Selection helpers
  const handleToggleSelect = (item: SaranOrderItem) => {
    if (!item.id_supplier || item.level_barang === "DEAD") return;

    const currentQty =
      customQuantities[item.id_barang] !== undefined
        ? customQuantities[item.id_barang]
        : item.saran_qty_kemasan;

    if (currentQty <= 0) {
      showToast(
        `Jumlah pesan "${item.nama_barang}" masih 0. Masukkan jumlah pesanan terlebih dahulu.`,
        "error"
      );
      return;
    }

    const updated = new Set(selectedIds);
    if (updated.has(item.id_barang)) {
      updated.delete(item.id_barang);
    } else {
      updated.add(item.id_barang);
    }
    setSelectedIds(updated);
  };

  // Select all selectable items in whole filter
  const handleSelectAll = () => {
    const selectableItems = items.filter((i) => {
      const qty =
        customQuantities[i.id_barang] !== undefined
          ? customQuantities[i.id_barang]
          : i.saran_qty_kemasan;
      return i.level_barang !== "DEAD" && i.id_supplier && qty > 0;
    });

    if (selectedIds.size >= selectableItems.length && selectableItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((i) => i.id_barang)));
    }
  };

  // Select only critical items
  const handleSelectCriticalOnly = () => {
    const criticalOnly = new Set<number>();
    items.forEach((it) => {
      const qty =
        customQuantities[it.id_barang] !== undefined
          ? customQuantities[it.id_barang]
          : it.saran_qty_kemasan;
      if (it.level_barang !== "DEAD" && it.id_supplier && it.status_urgensi === "KRITIS" && qty > 0) {
        criticalOnly.add(it.id_barang);
      }
    });

    if (criticalOnly.size === 0) {
      showToast("Tidak ada barang hampir habis dengan pemasok valid yang butuh dipesan", "error");
    } else {
      setSelectedIds(criticalOnly);
      showToast(`${criticalOnly.size} barang hampir habis berhasil dipilih`, "success");
    }
  };

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "runout_days" ? "asc" : "desc");
    }
  };

  // Sort and Paginate
  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let comparison = 0;
      const qtyA =
        customQuantities[a.id_barang] !== undefined
          ? customQuantities[a.id_barang]
          : a.saran_qty_kemasan;
      const qtyB =
        customQuantities[b.id_barang] !== undefined
          ? customQuantities[b.id_barang]
          : b.saran_qty_kemasan;

      const subtotalA = qtyA * a.harga_beli_kemasan;
      const subtotalB = qtyB * b.harga_beli_kemasan;

      if (sortField === "nama_barang") {
        comparison = a.nama_barang.localeCompare(b.nama_barang);
      } else if (sortField === "total_stok") {
        comparison = a.total_stok - b.total_stok;
      } else if (sortField === "ads") {
        comparison = a.ads - b.ads;
      } else if (sortField === "runout_days") {
        const runA = a.level_barang === "DEAD" ? 9999 : a.runout_days;
        const runB = b.level_barang === "DEAD" ? 9999 : b.runout_days;
        comparison = runA - runB;
      } else if (sortField === "saran_qty_kemasan") {
        comparison = qtyA - qtyB;
      } else if (sortField === "estimasi_subtotal") {
        comparison = subtotalA - subtotalB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
    return list;
  }, [items, sortField, sortDirection, customQuantities]);

  // Paginated Slice
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedItems.slice(start, start + limit);
  }, [sortedItems, page, limit]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / limit));

  // Toggle select on current page
  const handleToggleCurrentPageSelect = () => {
    const pageSelectable = paginatedItems.filter((i) => {
      const qty =
        customQuantities[i.id_barang] !== undefined
          ? customQuantities[i.id_barang]
          : i.saran_qty_kemasan;
      return i.level_barang !== "DEAD" && i.id_supplier && qty > 0;
    });

    const allPageSelected = pageSelectable.every((i) => selectedIds.has(i.id_barang));
    const next = new Set(selectedIds);

    if (allPageSelected) {
      pageSelectable.forEach((i) => next.delete(i.id_barang));
    } else {
      pageSelectable.forEach((i) => next.add(i.id_barang));
    }
    setSelectedIds(next);
  };

  // Valid selected items (memiliki supplier, tidak DEAD, dan qty > 0)
  const validSelectedItems = useMemo(() => {
    return items.filter((it) => {
      if (!selectedIds.has(it.id_barang)) return false;
      if (!it.id_supplier) return false;
      if (it.level_barang === "DEAD") return false;
      const qty =
        customQuantities[it.id_barang] !== undefined
          ? customQuantities[it.id_barang]
          : it.saran_qty_kemasan;
      return qty > 0;
    });
  }, [items, selectedIds, customQuantities]);

  const selectedTotalBudget = useMemo(() => {
    return validSelectedItems.reduce((sum, it) => {
      const qtyKemasan =
        customQuantities[it.id_barang] !== undefined
          ? customQuantities[it.id_barang]
          : it.saran_qty_kemasan;
      return sum + qtyKemasan * it.harga_beli_kemasan;
    }, 0);
  }, [validSelectedItems, customQuantities]);

  // Unique suppliers summary with subtotal per vendor
  const supplierSummary = useMemo(() => {
    const map = new Map<number | string, { name: string; count: number; subtotal: number }>();
    validSelectedItems.forEach((it) => {
      const sId = it.id_supplier || "unknown";
      const qtyKemasan =
        customQuantities[it.id_barang] !== undefined
          ? customQuantities[it.id_barang]
          : it.saran_qty_kemasan;
      const subtotal = qtyKemasan * it.harga_beli_kemasan;

      if (!map.has(sId)) {
        map.set(sId, { name: it.nama_supplier, count: 1, subtotal });
      } else {
        const cur = map.get(sId)!;
        cur.count += 1;
        cur.subtotal += subtotal;
      }
    });
    return Array.from(map.entries());
  }, [validSelectedItems, customQuantities]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const exportList = validSelectedItems.length > 0 ? validSelectedItems : sortedItems;
    if (exportList.length === 0) {
      showToast("Tidak ada data untuk diekspor", "error");
      return;
    }

    const headers = [
      "Barcode",
      "Nama Barang",
      "Pemasok",
      "Kategori Jual",
      "Sisa Stok (Pcs)",
      "Dalam PO (Pcs)",
      "Penjualan Harian (ADS)",
      "Ketahanan Stok (Hari)",
      "Kondisi",
      "Saran Pesan (Kemasan)",
      "Kemasan Vendor",
      "Total Pesan (Pcs)",
      "Harga Beli Pcs",
      "Estimasi Total Biaya",
    ];

    const rows = exportList.map((it) => {
      const qtyKemasan =
        customQuantities[it.id_barang] !== undefined
          ? customQuantities[it.id_barang]
          : it.saran_qty_kemasan;
      const finalPcs = qtyKemasan * it.isi_kemasan;
      const subtotal = qtyKemasan * it.harga_beli_kemasan;

      return [
        `"${it.barcode}"`,
        `"${(it.nama_barang || "").replace(/"/g, '""')}"`,
        `"${(it.nama_supplier || "Tanpa Pemasok").replace(/"/g, '""')}"`,
        `"${it.level_barang}"`,
        it.total_stok,
        it.total_on_order,
        it.ads,
        it.runout_days,
        `"${it.status_urgensi}"`,
        qtyKemasan,
        `"${it.nama_kemasan}"`,
        finalPcs,
        it.harga_beli_pcs,
        subtotal,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rekomendasi-pesanan-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Berhasil mengekspor ${exportList.length} barang ke file CSV!`, "success");
  };

  // Generate PO
  const handleGeneratePO = async () => {
    if (validSelectedItems.length === 0) {
      showToast("Pilih minimal satu barang yang memiliki pemasok dan jumlah pesan di atas 0", "error");
      return;
    }

    setGenerating(true);
    try {
      const payloadItems = validSelectedItems.map((it) => {
        const qtyKemasan =
          customQuantities[it.id_barang] !== undefined
            ? customQuantities[it.id_barang]
            : it.saran_qty_kemasan;
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
            `Dibuat otomatis dari Saran Order (Target Cadangan ${targetBufferDays} hari + Waktu Kirim ${leadTimeDays} hari)`,
          items: payloadItems,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowConfirmModal(false);
        showToast(
          `Berhasil membuat ${data.count || 1} Surat Pesanan (PO) baru! Mengalihkan ke daftar PO...`,
          "success"
        );
        setTimeout(() => {
          router.push("/pembelian/po");
        }, 1200);
      } else {
        throw new Error(data.error || "Gagal membuat dokumen PO");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal membuat Surat Pesanan (PO)", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Sort indicator helper
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-on-surface-variant/40 ml-1 inline-block" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary ml-1 inline-block" />
    );
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

  const pageSelectableItems = paginatedItems.filter((i) => {
    const qty =
      customQuantities[i.id_barang] !== undefined
        ? customQuantities[i.id_barang]
        : i.saran_qty_kemasan;
    return i.level_barang !== "DEAD" && i.id_supplier && qty > 0;
  });
  const isAllCurrentPageSelected =
    pageSelectableItems.length > 0 &&
    pageSelectableItems.every((i) => selectedIds.has(i.id_barang));

  return (
    <div className="space-y-4 text-on-background pb-28">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 backdrop-blur-md"
              : "bg-error/10 border-error/30 text-error backdrop-blur-md"
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

      {/* Header Banner - Compact & Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-lg md:text-xl font-bold text-on-surface">
              Saran Order Barang (Rekomendasi PO)
            </h1>
          </div>
          <p className="text-on-surface-variant text-xs mt-1">
            Rekomendasi jumlah pesanan ke pemasok berdasarkan riwayat penjualan dan stok seluruh toko.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-surface hover:bg-surface-container-high border border-outline-variant/50 text-on-surface px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Download daftar saran order ke file CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Muat ulang dan hitung kembali saran pesanan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Hitung Ulang</span>
          </button>
        </div>
      </div>

      {/* Interactive KPI Cards (Click to Filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Laris & Hampir Habis */}
        <div
          onClick={() => {
            setUrgencyFilter("kritis");
            setPage(1);
          }}
          className={`bg-surface border p-3.5 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-error hover:shadow-md ${
            urgencyFilter === "kritis"
              ? "border-error ring-2 ring-error/20 bg-error/[0.03]"
              : "border-error/25"
          }`}
          title="Klik untuk menyaring barang laris & hampir habis"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Laris & Hampir Habis
            </span>
            <div className="w-6 h-6 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-2xl font-bold text-error flex items-baseline gap-1">
              {summary ? summary.kritis_count : "-"}
              <span className="text-xs font-normal text-on-surface-variant">Barang</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              Stok &le; 3 hari, harus segera dipesan
            </p>
          </div>
        </div>

        {/* Perlu Perhatian */}
        <div
          onClick={() => {
            setUrgencyFilter("perhatian");
            setPage(1);
          }}
          className={`bg-surface border p-3.5 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-amber-500 hover:shadow-md ${
            urgencyFilter === "perhatian"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/[0.03]"
              : "border-amber-500/25"
          }`}
          title="Klik untuk menyaring barang yang butuh perhatian restock"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Perlu Perhatian
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-2xl font-bold text-amber-500 flex items-baseline gap-1">
              {summary ? summary.perhatian_count : "-"}
              <span className="text-xs font-normal text-on-surface-variant">Barang</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              Stok cukup untuk 4 s/d 7 hari ke depan
            </p>
          </div>
        </div>

        {/* Estimasi Total Belanja */}
        <div className="bg-surface border border-emerald-500/25 p-3.5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Estimasi Total Belanja
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
              {summary ? formatCurrency(summary.estimasi_total_anggaran) : "Rp 0"}
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              Untuk kebutuhan cadangan {targetBufferDays + leadTimeDays} hari
            </p>
          </div>
        </div>

        {/* Total Barang Dianalisis */}
        <div
          onClick={() => {
            setUrgencyFilter("all");
            setPage(1);
          }}
          className={`bg-surface border p-3.5 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-primary hover:shadow-md ${
            urgencyFilter === "all"
              ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03]"
              : "border-outline-variant/30"
          }`}
          title="Klik untuk melihat semua barang dianalisis"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Barang Dianalisis
            </span>
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-2xl font-bold text-on-surface flex items-baseline gap-1">
              {summary ? summary.total_sku : "-"}
              <span className="text-xs font-normal text-on-surface-variant">Barang</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
              {summary ? `${summary.aman_count} barang berstatus aman` : "Memuat..."}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Panel - Clean & Intuitive */}
      <div className="bg-surface border border-outline-variant/30 p-3.5 rounded-2xl shadow-xs space-y-3">
        {/* Row 1: Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-on-surface mb-1">
              Cek Penjualan Terakhir:
            </label>
            <select
              value={lookbackDays}
              onChange={(e) => {
                setLookbackDays(Number(e.target.value));
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              <option value={7}>7 Hari Terakhir (Tren Cepat)</option>
              <option value={14}>14 Hari Terakhir (2 Minggu)</option>
              <option value={30}>30 Hari Terakhir (1 Bulan - Standar)</option>
              <option value={60}>60 Hari Terakhir (2 Bulan)</option>
              <option value={90}>90 Hari Terakhir (3 Bulan / Musiman)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-on-surface mb-1" title="Target hari ketahanan stok di toko">
              Cadangan Stok:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="90"
                value={targetBufferDays}
                onChange={(e) => {
                  setTargetBufferDays(Math.max(1, parseInt(e.target.value) || 1));
                  setPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-2.5 py-2 text-xs text-on-surface font-semibold text-center focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium shrink-0">Hari</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-on-surface mb-1" title="Estimasi hari pengiriman dari supplier">
              Waktu Kirim:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="30"
                value={leadTimeDays}
                onChange={(e) => {
                  setLeadTimeDays(Math.max(0, parseInt(e.target.value) || 0));
                  setPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-2.5 py-2 text-xs text-on-surface font-semibold text-center focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant font-medium shrink-0">Hari</span>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-on-surface mb-1">
              Kategori Penjualan:
            </label>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              <option value="ALL">Semua Kategori Produk</option>
              <option value="FAST">
                Sangat Laris (+{summary?.fsn_config?.fast_buffer_pct ?? 20}% Cadangan)
              </option>
              <option value="MEDIUM">Penjualan Normal (Cadangan Standar)</option>
              <option value="SLOW">
                Penjualan Lambat (-{summary?.fsn_config?.slow_buffer_pct ?? 30}% Cadangan)
              </option>
              <option value="DEAD">Macet / Tidak Terjual</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-on-surface mb-1">
              Kondisi Stok:
            </label>
            <select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
            >
              <option value="perhatian">Hampir Habis & Perhatian</option>
              <option value="kritis">Hampir Habis Saja</option>
              <option value="all">Semua Kondisi</option>
            </select>
          </div>
        </div>

        {/* Row 2: Search, Supplier, Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2.5 border-t border-outline-variant/20 items-center">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari barcode atau nama barang..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-4">
            <SupplierSearchSelect
              suppliers={suppliers}
              value={selectedSupplier}
              onChange={(val) => {
                setSelectedSupplier(val);
                setPage(1);
              }}
              allowAll
              allLabel="Semua Pemasok (Supplier)"
              allValue="all"
            />
          </div>

          {/* Quick Select Actions */}
          <div className="md:col-span-4 flex items-center justify-end gap-2 text-xs flex-wrap">
            <button
              onClick={handleSelectCriticalOnly}
              className="px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error border border-error/25 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Pilih yang Hampir Habis
            </button>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded-xl font-medium transition-colors cursor-pointer"
            >
              {selectedIds.size >= validSelectedItems.length && validSelectedItems.length > 0
                ? "Batal Pilih"
                : "Pilih Semua"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-semibold">Menghitung Saran Pesanan Barang...</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Menganalisis penjualan harian, stok toko, dan kemasan karton
            </p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-center px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-on-surface">Stok Aman & Terpenuhi!</h3>
            <p className="text-xs text-on-surface-variant/80 mt-1 max-w-md">
              Tidak ada barang yang memerlukan restock untuk kriteria filter dan cadangan {targetBufferDays} hari saat ini.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-semibold border border-outline-variant/40 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold select-none">
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        onClick={handleToggleCurrentPageSelect}
                        className="p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title={
                          isAllCurrentPageSelected
                            ? "Lepas centang halaman ini"
                            : "Pilih semua di halaman ini"
                        }
                      >
                        {isAllCurrentPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th
                      className="py-3 px-3 min-w-[240px] cursor-pointer hover:text-on-surface transition-colors"
                      onClick={() => handleSort("nama_barang")}
                    >
                      <span>Barang & Pemasok</span>
                      {renderSortIcon("nama_barang")}
                    </th>
                    <th
                      className="py-3 px-3 text-center min-w-[110px] cursor-pointer hover:text-on-surface transition-colors"
                      onClick={() => handleSort("total_stok")}
                    >
                      <span>Sisa Stok Toko</span>
                      {renderSortIcon("total_stok")}
                    </th>
                    <th
                      className="py-3 px-3 text-center min-w-[110px] cursor-pointer hover:text-on-surface transition-colors"
                      onClick={() => handleSort("ads")}
                    >
                      <span>Laku per Hari</span>
                      {renderSortIcon("ads")}
                    </th>
                    <th
                      className="py-3 px-3 text-center min-w-[120px] cursor-pointer hover:text-on-surface transition-colors"
                      onClick={() => handleSort("runout_days")}
                    >
                      <span>Ketahanan Stok</span>
                      {renderSortIcon("runout_days")}
                    </th>
                    <th
                      className="py-3 px-3 text-center min-w-[190px] cursor-pointer hover:text-on-surface transition-colors"
                      onClick={() => handleSort("saran_qty_kemasan")}
                    >
                      <span>Jumlah Pesan</span>
                      {renderSortIcon("saran_qty_kemasan")}
                    </th>
                    <th
                      className="py-3 px-3 text-right min-w-[130px] cursor-pointer hover:text-on-surface transition-colors"
                      onClick={() => handleSort("estimasi_subtotal")}
                    >
                      <span>Total Biaya</span>
                      {renderSortIcon("estimasi_subtotal")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                  {paginatedItems.map((it) => {
                    const isSelected = selectedIds.has(it.id_barang);
                    const isExpanded = expandedRowIds.has(it.id_barang);
                    const currentQtyKemasan =
                      customQuantities[it.id_barang] !== undefined
                        ? customQuantities[it.id_barang]
                        : it.saran_qty_kemasan;
                    const currentSubtotal = currentQtyKemasan * it.harga_beli_kemasan;
                    const hasSupplier = Boolean(it.id_supplier);
                    const isDead = it.level_barang === "DEAD";
                    const canSelect = hasSupplier && !isDead && currentQtyKemasan > 0;

                    return (
                      <Fragment key={it.id_barang}>
                        <tr
                          onClick={() => canSelect && handleToggleSelect(it)}
                          className={`transition-colors ${
                            isDead
                              ? "bg-rose-500/5 opacity-75 cursor-not-allowed"
                              : !hasSupplier
                              ? "bg-amber-500/5 hover:bg-amber-500/10 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                              : "hover:bg-surface-container-low/60 cursor-pointer"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              disabled={!canSelect}
                              onClick={() => handleToggleSelect(it)}
                              className="p-1 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title={
                                !hasSupplier
                                  ? "Tidak dapat dipilih: Pemasok belum diset di Master Barang"
                                  : isDead
                                  ? "Produk tidak bergerak / macet (>60 hari tidak terjual)"
                                  : currentQtyKemasan <= 0
                                  ? "Jumlah pesan masih 0"
                                  : isSelected
                                  ? "Batalkan pilihan"
                                  : "Pilih barang ini untuk PO"
                              }
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
                                className="p-1 rounded-md hover:bg-surface-container-high text-on-surface-variant mt-0.5 transition-colors cursor-pointer"
                                title="Lihat rincian stok di tiap cabang toko"
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
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                                      it.level_barang === "FAST"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                        : it.level_barang === "SLOW"
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                        : it.level_barang === "DEAD"
                                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                    }`}
                                  >
                                    {it.level_barang === "FAST" && "⚡ Sangat Laris"}
                                    {it.level_barang === "MEDIUM" && "Normal"}
                                    {it.level_barang === "SLOW" && "Lambat"}
                                    {it.level_barang === "DEAD" && "🛑 Macet"}
                                  </span>

                                  {hasSupplier ? (
                                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium truncate max-w-[140px]">
                                      {it.nama_supplier}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Belum Ada Pemasok
                                    </span>
                                  )}
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

                          {/* Consolidated Stock + In Transit Indicator */}
                          <td className="py-3 px-3 text-center">
                            <div className="font-bold text-[13px]">
                              {it.total_stok}{" "}
                              <span className="text-[10px] font-normal text-on-surface-variant">
                                {it.satuan_1}
                              </span>
                            </div>
                            {it.total_min_stok > 0 && (
                              <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                                Batas min: {it.total_min_stok}
                              </div>
                            )}
                            {it.total_on_order > 0 && (
                              <div className="text-[10px] text-primary font-semibold mt-0.5 bg-primary/10 rounded px-1 py-0.2 inline-block">
                                Dalam PO: {it.total_on_order} {it.satuan_1}
                              </div>
                            )}
                          </td>

                          {/* Average Daily Sales */}
                          <td className="py-3 px-3 text-center">
                            <div className="font-bold text-primary text-[13px]">
                              {it.ads}{" "}
                              <span className="text-[10px] font-normal text-on-surface-variant">
                                /hari
                              </span>
                            </div>
                            <div className="text-[10px] text-on-surface-variant/80 mt-0.5">
                              Total {it.total_qty_sold} {it.satuan_1}
                            </div>
                          </td>

                          {/* Runout Projection */}
                          <td className="py-3 px-3 text-center">
                            {isDead ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                                Tidak Ada Jual
                              </span>
                            ) : it.status_urgensi === "KRITIS" ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-error/15 text-error border border-error/30 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                                  {it.runout_days} Hari (Kritis)
                                </span>
                                <span className="text-[9px] text-error/80 mt-0.5">Habis &le; 3 hari</span>
                              </div>
                            ) : it.status_urgensi === "PERHATIAN" ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Cukup {it.runout_days} Hari
                                </span>
                                <span className="text-[9px] text-amber-500/80 mt-0.5">Perlu perhatian</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Aman ({it.runout_days > 90 ? ">90" : it.runout_days} hr)
                              </span>
                            )}
                          </td>

                          {/* Quantity Controls (+ / -) & Packaging Unit */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isDead ? (
                              <span className="text-on-surface-variant/50 italic text-[11px]">
                                0 (Macet)
                              </span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStepQty(it.id_barang, currentQtyKemasan, -1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs cursor-pointer select-none transition-colors"
                                    title="Kurangi 1 kemasan"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentQtyKemasan}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleQtyChange(it.id_barang, e.target.value)}
                                    className="w-14 px-1 py-1 text-center font-extrabold text-xs text-primary bg-surface border border-outline-variant/60 rounded-lg focus:border-primary focus:outline-none shadow-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleStepQty(it.id_barang, currentQtyKemasan, 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs cursor-pointer select-none transition-colors"
                                    title="Tambah 1 kemasan"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <span className="font-semibold text-xs text-on-surface ml-0.5">
                                    {it.nama_kemasan}
                                  </span>
                                </div>
                                <div className="text-[10px] text-on-surface-variant/80 mt-1">
                                  {it.isi_kemasan > 1 ? (
                                    <span>
                                      = {currentQtyKemasan * it.isi_kemasan} {it.satuan_1} (@{it.isi_kemasan})
                                    </span>
                                  ) : (
                                    <span>Kebutuhan: {it.saran_qty_pcs_raw} {it.satuan_1}</span>
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
                              <div className="bg-surface rounded-xl border border-outline-variant/40 p-3.5 space-y-2.5 shadow-inner">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-on-surface">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    <span>
                                      Rincian Stok & Penjualan di Tiap Cabang ({it.cabang_allocations.length} Toko)
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-normal text-on-surface-variant">
                                    Kemasan: {it.nama_kemasan} (@{it.isi_kemasan} {it.satuan_1})
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
                                          <th className="py-2 px-3">Nama Toko</th>
                                          <th className="py-2 px-2 text-center">Sisa Stok</th>
                                          <th className="py-2 px-2 text-center">Terjual ({it.lookback_days} hr)</th>
                                          <th className="py-2 px-2 text-center">Laku/Hari</th>
                                          <th className="py-2 px-2 text-center">Ketahanan Stok</th>
                                          <th className="py-2 px-2 text-center">Kondisi</th>
                                          <th className="py-2 px-3 text-right">Saran Alokasi</th>
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
                                              <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                  cab.status_urgensi === "KRITIS"
                                                    ? "bg-error/15 text-error border border-error/30"
                                                    : cab.status_urgensi === "PERHATIAN"
                                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                }`}
                                              >
                                                {cab.status_urgensi === "KRITIS"
                                                  ? "Hampir Habis"
                                                  : cab.status_urgensi === "PERHATIAN"
                                                  ? "Menipis"
                                                  : "Aman"}
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
                                                <span className="text-on-surface-variant/50 italic text-[10px]">
                                                  Stok Aman
                                                </span>
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
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
              page={page}
              limit={limit}
              total={sortedItems.length}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => setLimit(newLimit)}
              isLoading={loading}
              pageSizeOptions={[25, 50, 100, 250]}
            />
          </>
        )}
      </div>

      {/* Floating Action Bar for Selected Items */}
      {validSelectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-4xl bg-surface/95 backdrop-blur-md border border-primary/30 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>{validSelectedItems.length} Barang Terpilih</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  {supplierSummary.length} Pemasok
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Total Estimasi Belanja:{" "}
                <span className="font-bold text-primary">{formatCurrency(selectedTotalBudget)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Batalkan Pilihan
            </button>
            {can_create && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-primary/20 transition-all active:scale-95 cursor-pointer"
              >
                <span>Buat Surat Pesanan (PO)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal with Supplier Breakdown */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Konfirmasi Pembuatan Surat Pesanan (PO)</h3>
                  <p className="text-xs text-on-surface-variant">
                    Sistem akan otomatis menerbitkan Purchase Order resmi yang dikelompokkan per pemasok
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 text-xs">
              <div className="flex justify-between items-center text-on-surface">
                <span className="text-on-surface-variant">Jumlah Barang Siap Pesan:</span>
                <span className="font-bold">{validSelectedItems.length} item</span>
              </div>
              <div className="flex justify-between items-center text-on-surface">
                <span className="text-on-surface-variant">Jumlah Pemasok Terkait:</span>
                <span className="font-bold">{supplierSummary.length} pemasok</span>
              </div>
              <div className="flex justify-between items-center text-on-surface pt-2 border-t border-outline-variant/20">
                <span className="text-on-surface-variant">Estimasi Total Tagihan PO:</span>
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(selectedTotalBudget)}
                </span>
              </div>
            </div>

            {/* List Supplier Target with Subtotal Breakdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                Pemasok Yang Akan Menerima PO:
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {supplierSummary.map(([sId, info]) => (
                  <div
                    key={sId}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-outline-variant/20 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-on-surface block">{info.name}</span>
                      <span className="text-on-surface-variant text-[10px]">
                        {info.count} barang pesanan
                      </span>
                    </div>
                    <span className="font-bold font-mono text-primary text-xs">
                      {formatCurrency(info.subtotal)}
                    </span>
                  </div>
                ))}
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
                placeholder={`Dibuat otomatis dari Saran Order (Cadangan ${targetBufferDays} hari + Waktu Kirim ${leadTimeDays} hari)`}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={generating}
                className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGeneratePO}
                disabled={generating}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
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
