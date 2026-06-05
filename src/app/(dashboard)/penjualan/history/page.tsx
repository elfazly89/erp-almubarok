"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Printer, Search, RefreshCw, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Invoice {
  id_penjualan: number;
  no_invoice: string;
  tanggal_invoice: string;
  jam_invoice: string;
  nama_pelanggan: string;
  subtotal: number;
  diskon: number;
  nominal_voucher: number;
  potongan_poin: number;
  infaq: number;
  total_akhir: number;
  jenis_pembayaran: string;
  jumlah_bayar: number;
  poin_didapat: number;
}

export default function HistoryPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/penjualan");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const viewInvoiceDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/penjualan?id=${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch {
      alert("Gagal memuat detail transaksi.");
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredList = list.filter(
    (inv) =>
      inv.no_invoice.toLowerCase().includes(search.toLowerCase()) ||
      inv.nama_pelanggan.toLowerCase().includes(search.toLowerCase()) ||
      inv.jenis_pembayaran.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Riwayat Transaksi Penjualan
          </h1>
          <p className="text-on-background/70 text-sm mt-1">
            Melihat transaksi penjualan terbaru yang diproses di cabang ini.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Invoice / Pelanggan..."
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/80"
            />
          </div>
        </div>
      </div>

      {/* Ringkasan Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Total Transaksi</span>
            <span className="text-on-surface text-2xl font-bold">{list.length} Nota</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Omset Tunai</span>
            <span className="text-on-surface text-2xl font-bold">
              {formatRupiah(list.filter((i) => i.jenis_pembayaran === "Tunai").reduce((sum, item) => sum + item.total_akhir, 0))}
            </span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Omset Non-Tunai / QRIS</span>
            <span className="text-on-surface text-2xl font-bold">
              {formatRupiah(list.filter((i) => i.jenis_pembayaran !== "Tunai").reduce((sum, item) => sum + item.total_akhir, 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat riwayat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">No. Invoice</th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Tanggal & Waktu</th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Pelanggan</th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Metode</th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Total Tagihan</th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredList.map((inv, idx) => (
                  <tr key={inv.id_penjualan} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-2.5 text-on-surface-variant/70 text-sm">{idx + 1}</td>
                    <td className="px-5 py-2.5">
                      <span className="text-primary font-mono text-xs font-semibold">{inv.no_invoice}</span>
                    </td>
                    <td className="px-5 py-2.5 text-on-surface-variant text-xs">
                      {inv.tanggal_invoice} {inv.jam_invoice}
                    </td>
                    <td className="px-5 py-2.5 text-on-surface font-medium">{inv.nama_pelanggan}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          inv.jenis_pembayaran === "Tunai"
                            ? "bg-primary/15 text-primary border border-primary/20"
                            : "bg-secondary/15 text-secondary border border-secondary/20"
                        }`}
                      >
                        {inv.jenis_pembayaran}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-primary font-bold text-sm">
                      {formatRupiah(inv.total_akhir)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => viewInvoiceDetail(inv.id_penjualan)}
                        className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL & PRINT PREVIEW */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-sm my-8 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 print:border-0 print:bg-white print:max-w-full print:my-0 print:shadow-none">
            
            <div className="px-6 py-4 border-b border-outline-variant/35 flex items-center justify-between print:hidden">
              <h2 className="font-semibold text-on-surface text-sm">Detail Struk Penjualan</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl transition-colors">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white text-black p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-3 shadow-inner print:p-0 print:border-0 print:shadow-none">
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                  <h3 className="font-bold text-sm tracking-wider">ERP AL-MUBAROK</h3>
                  <p className="text-[10px]">Pondok Pesantren Al-Mubarok</p>
                  <p className="text-[9px]">Cabang Sukosari</p>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-gray-300 pb-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{selectedInvoice.invoice.no_invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{selectedInvoice.invoice.tanggal_invoice} {selectedInvoice.invoice.jam_invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>Kasir Toko</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{selectedInvoice.invoice.nama_pelanggan}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
                  {selectedInvoice.details.map((item: any) => (
                    <div key={item.id} className="space-y-0.5">
                      <span className="font-semibold">{item.nama_barang}</span>
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span>{item.jumlah} x {formatRupiah(item.harga_jual)} / {item.satuan}</span>
                        <span>{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="space-y-1 text-right text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal Belanja:</span>
                    <span>{formatRupiah(selectedInvoice.invoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.invoice.nominal_voucher > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Voucher Discount:</span>
                      <span>-{formatRupiah(selectedInvoice.invoice.nominal_voucher)}</span>
                    </div>
                  )}
                  {selectedInvoice.invoice.potongan_poin > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Poin Discount:</span>
                      <span>-{formatRupiah(selectedInvoice.invoice.potongan_poin)}</span>
                    </div>
                  )}
                  {selectedInvoice.invoice.infaq > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Infaq Shadaqah:</span>
                      <span>+{formatRupiah(selectedInvoice.invoice.infaq)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[12px] border-t border-dashed border-gray-300 pt-1.5 text-black">
                    <span>TOTAL BILL:</span>
                    <span>{formatRupiah(selectedInvoice.invoice.total_akhir)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 pt-0.5">
                    <span>Bayar via:</span>
                    <span>{selectedInvoice.invoice.jenis_pembayaran}</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[9px] space-y-1">
                  <p className="font-bold">*** TERIMA KASIH ***</p>
                  <p>Infaq yang Anda berikan insyaAllah barokah.</p>
                  <p>Simpan nota ini sebagai bukti transaksi resmi.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-secondary/15 transition-all"
                >
                  <Printer className="w-4 h-4" /> Cetak Nota
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT-ONLY CSS RULES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-invoice-modal, #print-invoice-modal * {
            visibility: visible;
          }
          .print\\:hidden, button, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
