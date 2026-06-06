"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Edit2,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

interface RekomendasiDetail {
  id: number;
  id_barang: number;
  id_cabang_tujuan: number;
  stok_sekarang: number;
  ads: number;
  qty_rekomendasi: number;
  qty_approved: number | null;
  target_stock: number;
  prioritas_score: number | null;
  nama_barang: string | null;
  nama_cabang: string | null;
}

interface RekomendasiHeader {
  id: number;
  kode_rekomendasi: string;
  tanggal_rekomendasi: string;
  status: string;
  catatan: string | null;
  created_at: string | null;
  details: RekomendasiDetail[];
}

export default function RekomendasiPengirimanPage() {
  const [headers, setHeaders] = useState<RekomendasiHeader[]>([]);
  const [selected, setSelected] = useState<RekomendasiHeader | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingQty, setEditingQty] = useState<string>("");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/rekomendasi");
      const json = await res.json();
      if (json.success) {
        setHeaders(json.data || []);
        if (json.data?.length > 0 && !selected) {
          setSelected(json.data[0]);
        }
      }
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/distribusi/rekomendasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDays: 14 }),
      });
      const json = await res.json();
      if (json.success) {
        triggerNotification(`✅ ${json.message}`);
        await fetchData();
      } else {
        triggerNotification(`❌ ${json.message}`);
      }
    } catch {
      triggerNotification("❌ Gagal menghubungi server.");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch("/api/distribusi/rekomendasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id, newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        triggerNotification(`✅ ${json.message}`);
        await fetchData();
      }
    } catch {
      triggerNotification("❌ Gagal memperbarui status.");
    }
  };

  const handleSaveQty = async (detailId: number) => {
    const qty = parseInt(editingQty) || 0;
    try {
      const res = await fetch("/api/distribusi/rekomendasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_qty", detailId, qtyApproved: qty }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingId(null);
        await fetchData();
      }
    } catch {
      triggerNotification("❌ Gagal menyimpan perubahan.");
    }
  };

  const handleGenerateShipment = async (id: number) => {
    try {
      const res = await fetch("/api/distribusi/rekomendasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_shipment", id }),
      });
      const json = await res.json();
      if (json.success) {
        triggerNotification(`✅ ${json.message}`);
        await fetchData();
      } else {
        triggerNotification(`❌ ${json.message}`);
      }
    } catch {
      triggerNotification("❌ Gagal membuat surat jalan.");
    }
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const selectedDetails = selected?.details || [];
  const filteredDetails = selectedDetails.filter((item) =>
    !search || (item.nama_barang || "").toLowerCase().includes(search.toLowerCase())
  );

  const draftCount = selectedDetails.filter((d) => {
    // Draft = qty_approved belum ada atau rekId belum di-approve
    return true;
  }).length;

  const approvedCount = (selected?.status === "APPROVED") ? selectedDetails.length : 0;

  return (
    <div className="flex flex-col space-y-4 text-on-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Pengisian Stok Pintar &amp; Rekomendasi Pengiriman
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Hitung otomatis kebutuhan kirim cabang berdasarkan ADS × Target Hari. Tinjau dan setujui draf rekomendasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : "Generate Rekomendasi Baru"}
          </button>
          {selected?.status === "APPROVED" && (
            <button
              onClick={() => handleGenerateShipment(selected.id)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Truck className="w-4 h-4" /> Buat Surat Jalan
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold border animate-in fade-in ${
          notification.startsWith("✅") ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* List Rekomendasi - sidebar */}
        <div className="lg:col-span-1 bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col gap-3 h-fit">
          <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider">Daftar Rekomendasi</h3>
          {loading ? (
            <div className="py-6 text-center text-xs text-on-surface-variant">Memuat...</div>
          ) : headers.length === 0 ? (
            <div className="py-6 text-center text-xs text-on-surface-variant">
              Belum ada rekomendasi.<br />Klik 'Generate' untuk membuat baru.
            </div>
          ) : (
            headers.map((h) => (
              <div
                key={h.id}
                onClick={() => setSelected(h)}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                  selected?.id === h.id
                    ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                    : "border-outline-variant/30 hover:border-primary/30"
                }`}
              >
                <span className="font-extrabold font-mono text-on-surface block">{h.kode_rekomendasi}</span>
                <span className="text-on-surface-variant block mt-0.5">{h.tanggal_rekomendasi}</span>
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  h.status === "DRAFT" ? "bg-surface-container-high text-on-surface-variant border-outline-variant/60"
                  : h.status === "APPROVED" ? "bg-success/10 text-success border-success/20"
                  : h.status === "REJECTED" ? "bg-error/10 text-error border-error/20"
                  : "bg-primary/15 text-primary border-primary/25"
                }`}>
                  {h.status === "DRAFT" ? "DRAF"
                    : h.status === "APPROVED" ? "DISETUJUI"
                    : h.status === "REJECTED" ? "DITOLAK"
                    : "SUDAH JADI SURAT JALAN"}
                </span>
                <span className="text-on-surface-variant block mt-1">{h.details.length} item</span>
              </div>
            ))
          )}
        </div>

        {/* Detail tabel */}
        <div className="lg:col-span-3 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                <div>
                  <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {selected.kode_rekomendasi}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{selected.details.length} item rekomendasi</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari barang..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none w-44"
                    />
                  </div>
                  {selected.status === "DRAFT" && (
                    <button
                      onClick={() => handleUpdateStatus(selected.id, "APPROVED")}
                      className="flex items-center gap-1 bg-success/10 hover:bg-success/20 text-success px-3 py-1.5 rounded-lg font-semibold border border-success/10 cursor-pointer text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Setujui Semua
                    </button>
                  )}
                  {selected.status === "APPROVED" && (
                    <button
                      onClick={() => handleUpdateStatus(selected.id, "DRAFT")}
                      className="bg-surface hover:bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-lg font-semibold border border-outline-variant/60 cursor-pointer text-xs"
                    >
                      Batal Setuju
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold">
                      <th className="px-4 py-3 w-10">#</th>
                      <th className="px-4 py-3">Nama Barang</th>
                      <th className="px-4 py-3">Cabang Tujuan</th>
                      <th className="px-4 py-3 text-right">Stok Saat Ini</th>
                      <th className="px-4 py-3 text-right">ADS</th>
                      <th className="px-4 py-3 text-right">Target Stok</th>
                      <th className="px-4 py-3 text-right">Qty Kirim</th>
                      <th className="px-4 py-3">Prioritas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                    {filteredDetails.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">Tidak ada item rekomendasi.</td></tr>
                    ) : (
                      filteredDetails.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-surface-container-high/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-on-surface-variant">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold">{item.nama_barang || "—"}</td>
                          <td className="px-4 py-3 font-medium">{item.nama_cabang || "—"}</td>
                          <td className="px-4 py-3 text-right font-mono">{item.stok_sekarang} pcs</td>
                          <td className="px-4 py-3 text-right font-mono text-on-surface-variant">{(item.ads / 100).toFixed(1)} pcs</td>
                          <td className="px-4 py-3 text-right font-mono text-on-surface-variant">{item.target_stock} pcs</td>
                          <td className="px-4 py-3 text-right">
                            {editingId === item.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  value={editingQty}
                                  onChange={(e) => setEditingQty(e.target.value)}
                                  className="w-16 bg-surface border border-outline text-on-surface rounded px-1.5 py-0.5 text-center font-bold font-mono"
                                />
                                <button onClick={() => handleSaveQty(item.id)} className="p-1 bg-success/15 text-success rounded">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1 bg-error/15 text-error rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-bold text-primary">{item.qty_approved ?? item.qty_rekomendasi} pcs</span>
                                {selected.status === "DRAFT" && (
                                  <button
                                    onClick={() => { setEditingId(item.id); setEditingQty((item.qty_approved ?? item.qty_rekomendasi).toString()); }}
                                    className="p-1 text-on-surface-variant hover:text-primary rounded hover:bg-primary/5 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-primary">{item.prioritas_score ?? 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-on-surface-variant/70 text-xs">
              Pilih rekomendasi di sebelah kiri atau generate rekomendasi baru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
