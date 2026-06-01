"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, CheckCircle2, Search, Calendar, FileText, ArrowRight } from "lucide-react";

interface DiscrepancyItem {
  id_detail_kirim: number;
  id_pengiriman: number;
  kode_pengiriman: string;
  id_barang: number;
  nama_barang: string;
  barcode: string;
  jumlah_dikirim: number;
  jumlah_diterima: number;
  status_selisih: string;
  catatan_penerima: string | null;
  tanggal_kirim: string;
  tanggal_terima: string;
  cabang_tujuan: string;
}

export default function SelisihMutasiPage() {
  const [items, setItems] = useState<DiscrepancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mutasi/selisih");
      setItems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveDiscrepancy = async (item: DiscrepancyItem) => {
    const diff = item.jumlah_dikirim - item.jumlah_diterima;
    const confirmApprove = window.confirm(
      `Apakah Anda yakin menyetujui selisih ini?\nSisa ${diff} pcs Indomie/Barang ini akan otomatis DIKEMBALIKAN (REFUND) ke stok cabang Anda.`
    );
    if (!confirmApprove) return;

    setApprovingId(item.id_detail_kirim);
    try {
      const res = await fetch("/api/mutasi/selisih", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_detail_kirim: item.id_detail_kirim }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Persetujuan berhasil! ${data.refunded_amount} pcs dikreditkan kembali ke stok asal.`);
        loadData();
      } else {
        alert("Gagal menyetujui selisih: " + data.error);
      }
    } catch {
      alert("Error memproses persetujuan selisih.");
    } finally {
      setApprovingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      item.cabang_tujuan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <div>
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-secondary animate-pulse" /> Persetujuan Selisih Pengiriman
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Daftar selisih barang yang dilaporkan oleh cabang penerima. Setujui untuk mengembalikan sisa barang ke stok Anda.
        </p>
      </div>

      {/* Info metrik & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="bg-surface border border-outline-variant/30 p-4 rounded-xl flex items-center gap-3.5 flex-1 max-w-sm shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Outstanding Kasus Selisih</span>
            <span className="text-on-surface text-lg font-bold font-mono">{items.length} Barang</span>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari surat jalan, barang..."
            className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">
            Tidak ada selisih pengiriman barang yang outstanding! Semua bersih.
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-2.5">Surat Jalan</th>
                  <th className="px-5 py-2.5">Nama Barang</th>
                  <th className="px-5 py-2.5">Cabang Tujuan</th>
                  <th className="px-5 py-2.5 text-center">Fisik (Kirim ➔ Terima)</th>
                  <th className="px-5 py-2.5 text-center">Selisih Hilang</th>
                  <th className="px-5 py-2.5">Catatan Penerima</th>
                  <th className="px-5 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {filteredItems.map((item) => {
                  const diff = item.jumlah_dikirim - item.jumlah_diterima;
                  return (
                    <tr key={item.id_detail_kirim} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-xs font-semibold text-on-surface">
                        <div className="flex items-center gap-1 font-mono">
                          <FileText className="w-3.5 h-3.5 text-primary" /> {item.kode_pengiriman}
                        </div>
                        <span className="text-[10px] text-on-surface-variant block mt-1 flex items-center gap-0.5 font-mono">
                          <Calendar className="w-3 h-3" /> {item.tanggal_terima.slice(0, 10)}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-on-surface font-semibold block">{item.nama_barang}</span>
                        <span className="text-on-surface-variant font-mono text-xs bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">{item.barcode}</span>
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant font-semibold">{item.cabang_tujuan}</td>
                      <td className="px-5 py-2.5 text-center font-medium font-mono">
                        <span className="text-on-surface-variant">{item.jumlah_dikirim} pcs</span>
                        <ArrowRight className="w-3 h-3 inline-block mx-1.5 text-on-surface-variant" />
                        <span className="text-primary font-bold">{item.jumlah_diterima} pcs</span>
                      </td>
                      <td className="px-5 py-2.5 text-center font-bold text-error bg-error/5 font-mono">
                        -{diff} pcs
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs italic">
                        {item.catatan_penerima ? `"${item.catatan_penerima}"` : "-"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          onClick={() => handleApproveDiscrepancy(item)}
                          disabled={approvingId === item.id_detail_kirim}
                          className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-colors"
                        >
                          {approvingId === item.id_detail_kirim ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Setujui & Refund
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
