"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Package,
  DollarSign,
  Search,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Inbox,
  XCircle,
  CheckCircle,
  Truck,
  Calendar,
  AlertCircle,
  X,
  Phone,
  FileText
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface BackorderItem {
  id: number;
  id_pesan_beli: number;
  id_barang: number;
  barcode: string;
  nama_barang: string;
  qty_pesan: number;
  qty_diterima: number;
  sisa_backorder: number;
  harga_satuan: number;
  subtotal_pesan: number;
  subtotal_sisa: number;
  satuan_1: string;
  satuan_2: string | null;
  satuan_3: string | null;
  isi_2: number;
  isi_3: number;
}

interface BackorderPO {
  id_pesan_beli: number;
  id_cabang: number;
  nama_cabang: string;
  nomor_pesan_beli: string;
  tanggal_pesan_beli: string;
  status: string;
  keterangan: string | null;
  total_harga_pesan_beli: number;
  id_supplier: number;
  nama_supplier: string;
  telepon_supplier: string | null;
  tanggal_terima_terakhir: string | null;
  total_faktur_tercatat: string | number;
  total_pesan_pcs: number;
  total_diterima_pcs: number;
  total_sisa_pcs: number;
  total_nilai_sisa: number;
  progress_percent: number;
  items: BackorderItem[];
  unfulfilled_items: BackorderItem[];
  is_partial: boolean;
}

interface SummaryData {
  total_po_backorder: number;
  total_po_sebagian: number;
  total_sku_backorder: number;
  estimasi_nilai_backorder: number;
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

export default function BackorderPage() {
  const router = useRouter();
  const { can_read, can_update, loading: permissionsLoading } = useMenuPermissions();

  const [list, setList] = useState<BackorderPO[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Expand state for PO cards
  const [expandedPoIds, setExpandedPoIds] = useState<Set<number>>(new Set());

  // Force close modal
  const [selectedPoToClose, setSelectedPoToClose] = useState<BackorderPO | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  // 1. Fetch Suppliers
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

  // 2. Fetch Backorder Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (supplierFilter !== "all") {
        params.set("id_supplier", supplierFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/pembelian/backorder?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data sisa pesanan (backorder)");

      const json = await res.json();
      if (json.success) {
        setList(json.data || []);
        setSummary(json.summary || null);

        // Auto expand all POs by default if <= 5 items
        if ((json.data || []).length <= 5) {
          const allIds = new Set<number>((json.data || []).map((p: BackorderPO) => p.id_pesan_beli));
          setExpandedPoIds(allIds);
        }
      } else {
        throw new Error(json.error || "Gagal memproses data");
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [supplierFilter, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle expand
  const toggleExpand = (id: number) => {
    const next = new Set(expandedPoIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedPoIds(next);
  };

  // Force close PO action
  const handleForceClose = async () => {
    if (!selectedPoToClose) return;

    setClosing(true);
    try {
      const res = await fetch(`/api/pembelian/po/${selectedPoToClose.id_pesan_beli}/force-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alasan: closeReason.trim() || "Sisa barang ditiadakan oleh pengguna",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Sisa pesanan ${selectedPoToClose.nomor_pesan_beli} berhasil ditutup resmi.`, "success");
        setSelectedPoToClose(null);
        setCloseReason("");
        fetchData();
      } else {
        throw new Error(data.error || "Gagal menutup PO");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal menutup sisa pesanan", "error");
    } finally {
      setClosing(false);
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
    <div className="space-y-6 text-on-background pb-20">
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-surface border border-rose-500/20 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-2">
              <Clock className="w-3.5 h-3.5" />
              Kontrol Pengiriman Bertahap & Penagihan Sisa Barang
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Pantau Sisa Pesanan (Backorder PO)
            </h1>
            <p className="text-on-surface-variant text-sm mt-1 max-w-2xl">
              Memantau surat pesanan (PO) yang belum dikirim atau baru dikirim sebagian oleh pihak supplier. Cegah hilangnya pasokan barang dagangan untuk seluruh cabang.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 bg-surface hover:bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${loading ? "animate-spin" : ""}`} />
              <span>Perbarui Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: PO Belum Lengkap */}
        <div className="bg-surface border border-rose-500/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              PO Belum Lengkap
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 flex items-baseline gap-2">
              {summary ? summary.total_po_backorder : "-"}
              <span className="text-xs font-normal text-on-surface-variant">surat pesanan</span>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              {summary ? `${summary.total_po_sebagian} PO sudah masuk sebagian` : "Memuat data..."}
            </p>
          </div>
        </div>

        {/* Card 2: Produk Tertahan (SKU) */}
        <div className="bg-surface border border-amber-500/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Variasi Produk Kurang Kirim
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-amber-500 flex items-baseline gap-2">
              {summary ? summary.total_sku_backorder : "-"}
              <span className="text-xs font-normal text-on-surface-variant">macam produk</span>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              Menunggu kedatangan fisik dari distributor
            </p>
          </div>
        </div>

        {/* Card 3: Nilai Tagihan Tertahan */}
        <div className="bg-surface border border-emerald-500/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Estimasi Nilai Barang Belum Tiba
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary ? formatCurrency(summary.estimasi_nilai_backorder) : "Rp 0"}
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1">
              Nilai modal barang yang belum terkirim
            </p>
          </div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-surface border border-outline-variant/30 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor PO, nama supplier, barcode atau nama barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Building2 className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-surface-container-low border border-outline-variant text-on-surface rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all">-- Semua Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id_supplier} value={s.id_supplier}>
                  {s.nama_supplier}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List of Incomplete POs */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium">Memeriksa status sisa pesanan barang...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-on-surface">Seluruh Pesanan PO Sudah Lengkap!</h3>
          <p className="text-xs text-on-surface-variant max-w-md mt-1">
            Tidak ada pesanan barang yang tertahan atau kurang kirim dari pihak supplier. Pasokan persediaan barang saat ini dalam kondisi optimal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((po) => {
            const isExpanded = expandedPoIds.has(po.id_pesan_beli);
            return (
              <div
                key={po.id_pesan_beli}
                className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-primary/40"
              >
                {/* PO Card Header */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-low/40">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {po.nomor_pesan_beli}
                      </span>

                      {po.status === "Sebagian" || po.is_partial ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Diterima Sebagian ({po.progress_percent}% Tiba)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          <Clock className="w-3 h-3" />
                          Belum Ada Kiriman
                        </span>
                      )}

                      <span className="text-xs text-on-surface-variant/80 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
                        PO: {po.tanggal_pesan_beli}
                      </span>

                      {po.tanggal_terima_terakhir && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Terima Terakhir: {po.tanggal_terima_terakhir}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-sm font-bold text-on-surface">
                        {po.nama_supplier}
                      </span>
                      {po.telepon_supplier && (
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {po.telepon_supplier}
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant">
                        Toko/Tujuan: <strong className="text-on-surface">{po.nama_cabang}</strong>
                      </span>
                    </div>

                    {po.keterangan && (
                      <p className="text-xs text-on-surface-variant/90 italic pt-0.5">
                        &quot;{po.keterangan}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions & Progress Summary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Progress Bar & Stats */}
                    <div className="w-full sm:w-48 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-on-surface-variant">Keterisian Fisik:</span>
                        <span className="font-bold font-mono text-primary">
                          {po.total_diterima_pcs} / {po.total_pesan_pcs} Pcs
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant/20">
                        <div
                          className={`h-full rounded-full transition-all ${
                            po.progress_percent > 0 ? "bg-amber-500" : "bg-outline-variant/40"
                          }`}
                          style={{ width: `${Math.max(3, po.progress_percent)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-rose-500 font-semibold text-right">
                        Sisa: {po.total_sisa_pcs} Pcs ({formatCurrency(po.total_nilai_sisa)})
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => router.push(`/pembelian/invoice?id_po=${po.id_pesan_beli}`)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Terima Barang</span>
                      </button>

                      {can_update && (
                        <button
                          onClick={() => setSelectedPoToClose(po)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 border border-outline-variant/40 rounded-xl transition-colors text-xs font-medium"
                          title="Tutup sisa pesanan jika vendor tidak akan mengirim lagi"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(po.id_pesan_beli)}
                        className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Items Details Table */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/30 p-4 md:p-5 bg-surface text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-on-surface text-xs flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-primary" /> Rincian Barang Kurang Kirim ({po.unfulfilled_items.length} Item)
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-outline-variant/20 bg-surface-container-low/60 text-on-surface-variant font-semibold">
                            <th className="py-2.5 px-3">Nama Produk & Barcode</th>
                            <th className="py-2.5 px-3 text-center w-24">Dipesan</th>
                            <th className="py-2.5 px-3 text-center w-24">Sudah Tiba</th>
                            <th className="py-2.5 px-3 text-center w-28 text-rose-600 dark:text-rose-400">
                              Sisa Belum Tiba
                            </th>
                            <th className="py-2.5 px-3 text-right w-28">Harga Satuan</th>
                            <th className="py-2.5 px-3 text-right w-32">Nilai Sisa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                          {po.items.map((item) => {
                            const isFulfilled = item.sisa_backorder <= 0;
                            return (
                              <tr
                                key={item.id}
                                className={isFulfilled ? "opacity-50 bg-surface-container-low/30" : ""}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="font-medium text-on-surface">
                                    {item.nama_barang}
                                  </div>
                                  <span className="font-mono text-[10px] text-on-surface-variant/70">
                                    {item.barcode}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-center font-mono">
                                  {item.qty_pesan} {item.satuan_1}
                                </td>

                                <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {item.qty_diterima} {item.satuan_1}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {isFulfilled ? (
                                    <span className="text-[10px] text-emerald-600 font-semibold">
                                      Lengkap
                                    </span>
                                  ) : (
                                    <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                                      {item.sisa_backorder} {item.satuan_1}
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">
                                  {formatCurrency(item.harga_satuan)}
                                </td>

                                <td className="py-2.5 px-3 text-right font-mono font-bold text-on-surface">
                                  {formatCurrency(item.subtotal_sisa)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FORCE CLOSE MODAL */}
      {selectedPoToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Tutup Sisa Pesanan PO</h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {selectedPoToClose.nomor_pesan_beli}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoToClose(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Tindakan ini akan menandai status PO menjadi <strong className="text-on-surface">Selesai</strong> dan menghapus sisa barang ({selectedPoToClose.total_sisa_pcs} Pcs) dari antrean backorder. Gunakan jika supplier mengonfirmasi bahwa sisa barang tidak akan dikirimkan lagi.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                Pilih Alasan Penutupan Sisa:
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  "Stok pabrik vendor kosong",
                  "Disepakati batal kirim",
                  "Diganti jenis barang lain",
                  "Kedaluwarsa / Melewati batas waktu",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCloseReason(reason)}
                    className="px-2.5 py-1 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-[11px] text-on-surface transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Tuliskan catatan pembatalan sisa kiriman..."
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPoToClose(null)}
                disabled={closing}
                className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleForceClose}
                disabled={closing}
                className="flex items-center gap-1.5 bg-error hover:bg-error/90 text-on-error px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {closing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menutup...</span>
                  </>
                ) : (
                  <span>Konfirmasi Tutup Sisa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
