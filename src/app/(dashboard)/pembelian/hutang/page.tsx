"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, Search, RefreshCw, HandCoins, History, CheckCircle } from "lucide-react";

interface SupplierDebt {
  id_supplier: number;
  nama_supplier: string;
  alamat: string | null;
  telepon: string | null;
  hutang: number;
}

interface PaymentHistory {
  id: number;
  nama_supplier: string;
  tanggal_bayar: string;
  jumlah_bayar: number;
  metode_pembayaran: string;
  keterangan: string | null;
}

export default function HutangPage() {
  const [debts, setDebts] = useState<SupplierDebt[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [activeTab, setActiveTab] = useState<"balances" | "logs">("balances");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDebt | null>(null);

  // Form State
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [metode, setMetode] = useState("Transfer");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [resDebts, resHistory] = await Promise.all([
      fetch("/api/pembelian/hutang"),
      fetch("/api/pembelian/hutang?mode=history"),
    ]);
    setDebts(await resDebts.json());
    setHistory(await resHistory.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openPayModal = (s: SupplierDebt) => {
    setSelectedSupplier(s);
    setJumlahBayar(s.hutang.toString()); // default to full pay-off amount
    setTanggal(new Date().toISOString().slice(0, 10));
    setMetode("Transfer");
    setKeterangan("");
    setShowModal(true);
  };

  const handleSavePayment = async () => {
    if (!selectedSupplier || !jumlahBayar || parseInt(jumlahBayar) <= 0) return;
    setSaving(true);

    try {
      const res = await fetch("/api/pembelian/hutang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_supplier: selectedSupplier.id_supplier,
          tanggal_bayar: tanggal,
          jumlah_bayar: parseInt(jumlahBayar),
          metode_pembayaran: metode,
          keterangan,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        loadData();
      } else {
        alert("Gagal mencatat pembayaran: " + data.error);
      }
    } catch {
      alert("Error memproses pembayaran hutang.");
    } finally {
      setSaving(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredDebts = debts.filter(
    (d) => d.nama_supplier.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = history.filter(
    (h) => h.nama_supplier.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + d.hutang, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Hutang Dagang (Supplier)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Mengelola pelunasan kewajiban hutang belanja ke supplier cabang Anda.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari supplier..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Omset / Info Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center text-error">
            <HandCoins className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Sisa Hutang Dagang Dagang</span>
            <span className="text-on-surface text-lg font-bold font-mono">{formatRupiah(totalOutstanding)}</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Jumlah Supplier Berhutang</span>
            <span className="text-on-surface text-lg font-bold font-mono">{debts.length} Pemasok</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/40 pb-2">
        <button
          onClick={() => setActiveTab("balances")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "balances"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40"
          }`}
        >
          <Wallet className="w-4 h-4" /> Saldo Hutang
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "logs"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40"
          }`}
        >
          <History className="w-4 h-4" /> Riwayat Pembayaran
        </button>
      </div>

      {/* MAIN DATA PANELS */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : activeTab === "balances" ? (
          /* Balances view */
          filteredDebts.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              Tidak ada hutang supplier outstanding! Semua lunas.
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-2.5 w-12">#</th>
                    <th className="px-5 py-2.5">Nama Supplier</th>
                    <th className="px-5 py-2.5">Telepon</th>
                    <th className="px-5 py-2.5">Alamat</th>
                    <th className="px-5 py-2.5 text-right">Saldo Hutang</th>
                    <th className="px-5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredDebts.map((d, idx) => (
                    <tr key={d.id_supplier} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant font-mono">{idx + 1}</td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{d.nama_supplier}</td>
                      <td className="px-5 py-2.5 text-on-surface-variant font-medium">{d.telepon || "-"}</td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs max-w-xs truncate">{d.alamat || "-"}</td>
                      <td className="px-5 py-2.5 text-right text-error font-bold font-mono">{formatRupiah(d.hutang)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          onClick={() => openPayModal(d)}
                          className="bg-primary hover:bg-primary-container text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <HandCoins className="w-3.5 h-3.5" /> Cicil / Bayar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Logs view */
          filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              Belum ada riwayat pembayaran hutang.
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-2.5 w-12">#</th>
                    <th className="px-5 py-2.5">Tanggal</th>
                    <th className="px-5 py-2.5">Supplier</th>
                    <th className="px-5 py-2.5">Metode</th>
                    <th className="px-5 py-2.5">Keterangan / Memo</th>
                    <th className="px-5 py-2.5 text-right">Jumlah Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredHistory.map((h, idx) => (
                    <tr key={h.id} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant font-mono">{idx + 1}</td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs font-mono">{h.tanggal_bayar}</td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{h.nama_supplier}</td>
                      <td className="px-5 py-2.5">
                        <span className="bg-surface-container border border-outline-variant/30 text-on-surface-variant text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">{h.metode_pembayaran}</span>
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs">{h.keterangan || "-"}</td>
                      <td className="px-5 py-2.5 text-right text-primary font-bold font-mono">{formatRupiah(h.jumlah_bayar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* MODAL BAYAR HUTANG */}
      {showModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Catat Pembayaran Hutang</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                <span className="text-on-surface-variant block uppercase font-medium">Pemasok</span>
                <span className="text-on-surface font-semibold text-sm">{selectedSupplier.nama_supplier}</span>
                <span className="text-error block mt-1.5 font-extrabold font-mono text-base">Total Hutang: {formatRupiah(selectedSupplier.hutang)}</span>
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1.5 font-semibold">Tanggal Bayar *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1.5 font-semibold">Jumlah Bayar *</label>
                <input
                  type="number"
                  value={jumlahBayar}
                  onChange={(e) => setJumlahBayar(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2.5 text-xs focus:outline-none font-bold font-mono"
                  max={selectedSupplier.hutang}
                  required
                />
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1.5 font-semibold">Metode Pembayaran</label>
                <select
                  value={metode}
                  onChange={(e) => setMetode(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Transfer" className="bg-surface text-on-surface">Transfer Bank / QRIS</option>
                  <option value="Tunai" className="bg-surface text-on-surface">Tunai / Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1.5 font-semibold">Memo / Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2.5 text-xs focus:outline-none"
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/40 mt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={saving || !jumlahBayar}
                  className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  {saving ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
