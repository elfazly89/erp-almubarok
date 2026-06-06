"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftRight,
  RefreshCw,
  Search,
  CheckCircle,
  Truck,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface TransferSuggestion {
  id: number;
  id_barang: number;
  barang: string;
  barcode: string;
  cabangAsal: string;
  id_cabang_asal: number;
  stokAsal: number;
  adsAsal: number;
  cabangTujuan: string;
  id_cabang_tujuan: number;
  stokTujuan: number;
  adsTujuan: number;
  qtyTransfer: number;
  potensiCoverHari: number;
  status: "PENDING" | "PROCESSED" | "IGNORED";
}

export default function TransferAntarCabangPage() {
  const [list, setList] = useState<TransferSuggestion[]>([]);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/transfer");
      const json = await res.json();
      if (json.success) {
        setList(json.data || []);
      } else {
        triggerNotification("error", json.message || "Gagal memuat rekomendasi transfer.");
      }
    } catch {
      triggerNotification("error", "Gagal menghubungi server untuk memuat transfer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleProcessTransfer = async (item: TransferSuggestion) => {
    setProcessingId(item.id);
    try {
      const res = await fetch("/api/distribusi/transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process",
          idBarang: item.id_barang,
          idCabangAsal: item.id_cabang_asal,
          idCabangTujuan: item.id_cabang_tujuan,
          qtyTransfer: item.qtyTransfer,
          userId: 1,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setList((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "PROCESSED" as const } : i))
        );
        triggerNotification(
          "success",
          `Rekomendasi transfer ${item.barang} (${item.qtyTransfer} pcs) dari ${item.cabangAsal} ke ${item.cabangTujuan} berhasil diajukan dengan kode: ${json.kode}.`
        );
      } else {
        triggerNotification("error", json.message || "Gagal memproses transfer.");
      }
    } catch {
      triggerNotification("error", "Gagal menghubungi server.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleIgnoreTransfer = (id: number) => {
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "IGNORED" as const } : item))
    );
  };

  const triggerNotification = (type: "success" | "error", msg: string) => {
    setNotification({ type, message: msg });
    setTimeout(() => setNotification(null), 6000);
  };

  const filteredList = list.filter((item) =>
    item.barang.toLowerCase().includes(search.toLowerCase()) && item.status !== "IGNORED"
  );

  return (
    <div className="flex flex-col space-y-4 text-on-background">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-primary" /> Penyeimbangan Stok Pintar (Transfer Antarcabang)
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Algoritma otomatis mendeteksi cabang kelebihan stok (overstock) untuk menyuplai cabang kekurangan stok (understock) sebelum melakukan PO baru.
          </p>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="bg-surface hover:bg-surface-container-high border border-outline-variant/60 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Info card */}
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed text-on-surface-variant">
        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
        <div>
          <strong className="text-on-surface block mb-0.5">Mengapa Fitur Ini Penting?</strong>
          Metode transfer antarcabang memindahkan modal mati (kelebihan stok) ke cabang yang berpotensi mengalami kehilangan penjualan (lost sales). Hal ini meminimalkan biaya penyimpanan stok keseluruhan di jaringan ERP Almubarok.
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl animate-in fade-in duration-250 border ${
            notification.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">{notification.message}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-surface-container/40 px-4 py-2 border border-outline-variant/30 rounded-xl shrink-0">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
          />
        </div>
        <span className="text-on-surface-variant text-xs font-semibold">
          {list.filter((t) => t.status === "PENDING").length} Usulan Menunggu
        </span>
      </div>

      {/* Transfer cards grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-surface border border-outline-variant/30 py-24 text-center text-on-surface-variant text-sm rounded-2xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            Memuat saran transfer antarcabang...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-surface border border-outline-variant/30 py-12 text-center text-on-surface-variant text-sm rounded-2xl">
            Tidak ada rekomendasi penyeimbangan stok saat ini.
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className={`bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm transition-all duration-200 ${
                item.status !== "PENDING" ? "opacity-60 bg-surface-container-low/40" : "hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {/* Header card */}
              <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-on-surface text-sm">{item.barang}</h3>
                  <span className="text-[10px] text-on-surface-variant font-mono">{item.barcode}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.status === "PENDING"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : item.status === "PROCESSED"
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {item.status === "PENDING" ? "MENUNGGU" : item.status === "PROCESSED" ? "DIPROSES" : "DIABAIKAN"}
                </span>
              </div>

              {/* Transfer Details */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center text-xs">
                
                {/* Cabang Asal (Overstock) */}
                <div className="md:col-span-2 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-semibold">
                    <TrendingDown className="w-3.5 h-3.5 text-error" /> Cabang Pengirim (Kelebihan Stok)
                  </div>
                  <span className="font-extrabold text-on-surface text-sm block mt-1">{item.cabangAsal}</span>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">Stok saat ini</span>
                      <span className="text-on-surface font-semibold">{item.stokAsal} pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">Rata-rata Jual (ADS)</span>
                      <span className="text-on-surface font-semibold">{item.adsAsal} pcs</span>
                    </div>
                  </div>
                </div>

                {/* Transfer Vector */}
                <div className="flex flex-col items-center justify-center md:col-span-3 py-2">
                  <span className="text-[10px] text-on-surface-variant/80 font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/25 flex items-center gap-1">
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer {item.qtyTransfer} pcs
                  </span>
                  <div className="flex items-center justify-center gap-1.5 w-full mt-2">
                    <div className="h-0.5 bg-outline-variant/60 flex-1" />
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    <div className="h-0.5 bg-outline-variant/60 flex-1" />
                  </div>
                  <span className="text-[10px] text-success font-semibold mt-1">Potensi Penyelamatan Kehilangan Penjualan: {item.potensiCoverHari} Hari</span>
                </div>

                {/* Cabang Tujuan (Understock) */}
                <div className="md:col-span-2 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-success" /> Cabang Penerima (Kekurangan Stok)
                  </div>
                  <span className="font-extrabold text-on-surface text-sm block mt-1">{item.cabangTujuan}</span>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">Stok saat ini</span>
                      <span className="text-error font-extrabold">{item.stokTujuan} pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">Rata-rata Jual (ADS)</span>
                      <span className="text-on-surface font-semibold">{item.adsTujuan} pcs</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              {item.status === "PENDING" && (
                <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-outline-variant/20">
                  <button
                    disabled={processingId !== null}
                    onClick={() => handleIgnoreTransfer(item.id)}
                    className="bg-surface hover:bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Abaikan
                  </button>
                  <button
                    disabled={processingId !== null}
                    onClick={() => handleProcessTransfer(item)}
                    className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                    Proses Mutasi Transfer
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
