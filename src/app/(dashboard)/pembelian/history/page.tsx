"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Eye, Search, RefreshCw, ShoppingBag, DollarSign, Calendar } from "lucide-react";

interface Invoice {
  id_faktur: number;
  nomor_faktur: string;
  tanggal_faktur: string;
  nama_supplier: string;
  total_faktur: number;
  status_pembayaran: string;
}

export default function PurchaseHistoryPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pembelian/invoice");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const viewDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/pembelian/invoice?id=${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch {
      alert("Gagal memuat detail faktur");
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredList = list.filter(
    (inv) =>
      inv.nomor_faktur.toLowerCase().includes(search.toLowerCase()) ||
      inv.nama_supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> Riwayat Faktur Pembelian
          </h1>
          <p className="text-on-background/70 text-sm mt-1">
            Daftar penerimaan barang masuk dan faktur pembelian dari supplier.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Faktur / Supplier..."
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/80"
            />
          </div>
        </div>
      </div>

      {/* Ringkasan Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Total Faktur Beli</span>
            <span className="text-on-surface text-2xl font-bold">{list.length} Faktur</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Total Nilai Pembelian</span>
            <span className="text-on-surface text-2xl font-bold">
              {formatRupiah(list.reduce((sum, item) => sum + item.total_faktur, 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat riwayat...
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <ShoppingBag className="w-12 h-12 mb-3 opacity-30 text-primary" />
            <p>Belum ada data Faktur Pembelian</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-2.5 w-12">#</th>
                  <th className="px-5 py-2.5">No. Faktur</th>
                  <th className="px-5 py-2.5">Tanggal</th>
                  <th className="px-5 py-2.5">Supplier</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Total Netto</th>
                  <th className="px-5 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {filteredList.map((inv, idx) => (
                  <tr key={inv.id_faktur} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-2.5 text-on-surface-variant/70">{idx + 1}</td>
                    <td className="px-5 py-2.5 text-on-surface font-mono text-xs font-semibold">{inv.nomor_faktur}</td>
                    <td className="px-5 py-2.5 text-on-surface/80">{inv.tanggal_faktur}</td>
                    <td className="px-5 py-2.5 text-on-surface font-medium">{inv.nama_supplier}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status_pembayaran === "Lunas"
                            ? "bg-primary/15 text-primary border border-primary/20"
                            : "bg-error/15 text-error border border-error/20"
                        }`}
                      >
                        {inv.status_pembayaran}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-primary font-bold">{formatRupiah(inv.total_faktur)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => viewDetail(inv.id_faktur)}
                        className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/35 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">Detail Faktur Pembelian</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-on-surface-variant block">No. Faktur</span>
                  <span className="text-on-surface font-semibold">{selectedInvoice.invoice.nomor_faktur}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Tanggal Penerimaan</span>
                  <span className="text-on-surface font-semibold">{selectedInvoice.invoice.tanggal_faktur}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Supplier</span>
                  <span className="text-on-surface font-semibold">{selectedInvoice.invoice.nama_supplier}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-1">Status Pembayaran</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedInvoice.invoice.status_pembayaran === "Lunas"
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "bg-error/15 text-error border border-error/20"
                    }`}
                  >
                    {selectedInvoice.invoice.status_pembayaran}
                  </span>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-3">
                <h3 className="text-xs text-on-surface font-semibold mb-2">Barang yang Diterima</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedInvoice.details.map((item: any) => (
                    <div key={item.id} className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex justify-between text-xs">
                      <div>
                        <span className="text-on-surface font-medium">{item.nama_barang}</span>
                        <span className="text-on-surface-variant block text-[9px] mt-0.5">{item.jumlah_beli} pcs @ {formatRupiah(item.harga_satuan)}</span>
                      </div>
                      <strong className="text-primary self-center">{formatRupiah(item.subtotal)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-2 space-y-1 text-right text-xs">
                {selectedInvoice.invoice.diskon_total > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Diskon Faktur:</span>
                    <span>-{formatRupiah(selectedInvoice.invoice.diskon_total)}</span>
                  </div>
                )}
                {selectedInvoice.invoice.ppn_rate > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Pajak PPn ({selectedInvoice.invoice.ppn_rate}%):</span>
                    <span>Hitung Terbawa</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold border-t border-outline-variant/30 pt-2 text-on-surface">
                  <span>TOTAL NETTO INVOICE:</span>
                  <span className="text-primary text-sm">{formatRupiah(selectedInvoice.invoice.total_faktur)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setShowDetailModal(false)} className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
