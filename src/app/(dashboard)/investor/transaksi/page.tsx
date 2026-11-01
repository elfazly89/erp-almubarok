"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TransaksiModal {
  id: number;
  nomor_referensi: string;
  jenis_transaksi: "SETORAN_AWAL" | "TAMBAHAN_MODAL" | "PENARIKAN_MODAL" | "REINVESTASI_BAGI_HASIL";
  tanggal_transaksi: string;
  nominal: string;
  keterangan: string | null;
  bukti_lampiran: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  tanggal_persetujuan: string | null;
  catatan_persetujuan: string | null;
  created_at: string;
  id_rekening_kas: number | null;
  nama_rekening_kas: string | null;
  kode_rekening_kas: string | null;
  nama_pengaju: string | null;
}

interface RekeningKas {
  id: number;
  kode: string;
  nama: string;
  jenis: string;
  saldo: number;
  nama_cabang: string;
}

export default function TransaksiModalPage() {
  const [list, setList] = useState<TransaksiModal[]>([]);
  const [rekeningList, setRekeningList] = useState<RekeningKas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Input State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formJenis, setFormJenis] = useState<"SETORAN_AWAL" | "TAMBAHAN_MODAL" | "PENARIKAN_MODAL">(
    "TAMBAHAN_MODAL"
  );
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [formNominal, setFormNominal] = useState("");
  const [formRekening, setFormRekening] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");

  // Print Receipt State
  const [selectedReceipt, setSelectedReceipt] = useState<TransaksiModal | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTrx, resRek] = await Promise.all([
        fetch(`/api/investor/transaksi-modal?status=${filterStatus}`),
        fetch("/api/investor/rekening-kas"),
      ]);

      const jsonTrx = await resTrx.json();
      const jsonRek = await resRek.json();

      if (jsonTrx.success) setList(jsonTrx.data);
      if (jsonRek.success) setRekeningList(jsonRek.data);
    } catch (err: any) {
      setToast({ type: "error", text: "Gagal memuat data transaksi: " + err.message });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Form Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/investor/transaksi-modal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis_transaksi: formJenis,
          tanggal_transaksi: formTanggal,
          nominal: formNominal,
          id_rekening_kas: formRekening,
          keterangan: formKeterangan,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengajukan transaksi");
      }

      setToast({
        type: "success",
        text: "Permohonan transaksi modal berhasil diajukan (Status: PENDING).",
      });
      setShowModal(false);
      setFormNominal("");
      setFormKeterangan("");
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Approve
  const handleApprove = async (id: number) => {
    if (!confirm("Konfirmasi persetujuan (Approve) transaksi modal ini? Saldo kas & jurnal umum akan otomatis dibukukan.")) {
      return;
    }
    try {
      const res = await fetch(`/api/investor/transaksi-modal/${id}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyetujui transaksi");
      setToast({ type: "success", text: json.message });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    }
  };

  // Handle Reject
  const handleReject = async (id: number) => {
    const alasan = prompt("Masukkan catatan penolakan transaksi:");
    if (alasan === null) return;
    try {
      const res = await fetch(`/api/investor/transaksi-modal/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan: alasan }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menolak transaksi");
      setToast({ type: "success", text: "Transaksi telah ditolak." });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    }
  };

  // Filtered List
  const filteredList = list.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nomor_referensi.toLowerCase().includes(q) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
      (item.nama_rekening_kas && item.nama_rekening_kas.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/investor"
            className="p-2 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface">
              Transaksi Modal Investor
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant">
              Pencatatan setoran modal awal, penambahan modal, dan penarikan modal dengan otorisasi Maker-Checker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
          <button
            onClick={() => {
              setFormJenis("TAMBAHAN_MODAL");
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Transaksi Modal
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-xl text-xs md:text-sm flex items-center justify-between gap-3 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Semua Transaksi" },
            { id: "PENDING", label: "Menunggu Persetujuan" },
            { id: "APPROVED", label: "Disetujui" },
            { id: "REJECTED", label: "Ditolak" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? "bg-surface text-on-surface shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Cari nomor ref, kas, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
              <tr>
                <th className="px-4 py-3">No. Referensi / Tanggal</th>
                <th className="px-4 py-3">Jenis Transaksi</th>
                <th className="px-4 py-3">Rekening Kas / Bank</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3">Diajukan Oleh</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-on-surface-variant">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Memuat riwayat transaksi modal...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-on-surface-variant">
                    Tidak ada transaksi modal yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((trx) => {
                  const isPenarikan = trx.jenis_transaksi === "PENARIKAN_MODAL";
                  const isReinvest = trx.jenis_transaksi === "REINVESTASI_BAGI_HASIL";

                  return (
                    <tr key={trx.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold font-mono text-on-surface block">
                          {trx.nomor_referensi}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {trx.tanggal_transaksi}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPenarikan
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : isReinvest
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isPenarikan ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : isReinvest ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {trx.jenis_transaksi.replace(/_/g, " ")}
                        </span>
                        {trx.keterangan && (
                          <span className="text-[11px] text-on-surface-variant/80 block mt-0.5 truncate max-w-xs">
                            {trx.keterangan}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {trx.nama_rekening_kas ? (
                          <div>
                            <span className="font-semibold text-on-surface">
                              {trx.nama_rekening_kas}
                            </span>
                            <span className="text-[10px] text-on-surface-variant block">
                              Kode: {trx.kode_rekening_kas}
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/60 italic">
                            {isReinvest ? "Reinvestasi Modal Internal" : "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isPenarikan
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isPenarikan ? "-" : "+"} {formatCurrency(Number(trx.nominal))}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-on-surface-variant">
                        <span>{trx.nama_pengaju || "Sistem"}</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            trx.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : trx.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {trx.status === "APPROVED"
                            ? "DISETUJUI"
                            : trx.status === "REJECTED"
                            ? "DITOLAK"
                            : "MENUNGGU (PENDING)"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right space-x-1">
                        {trx.status === "PENDING" ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleApprove(trx.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors shadow-xs"
                              title="Setujui transaksi dan gerakkan kas/jurnal"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(trx.id)}
                              className="px-2 py-1 rounded border border-rose-500/40 text-rose-600 font-bold text-[10px] hover:bg-rose-500/10 transition-colors"
                              title="Tolak permohonan"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : trx.status === "APPROVED" ? (
                          <button
                            onClick={() => setSelectedReceipt(trx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-outline-variant/60 bg-surface hover:bg-surface-container font-semibold text-[11px] text-on-surface transition-colors"
                          >
                            <Printer className="w-3 h-3 text-primary" />
                            Kwitansi
                          </button>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/60 italic">
                            {trx.catatan_persetujuan || "Ditolak"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT TRANSAKSI (MAKER) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> Permohonan Transaksi Modal Investor
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant/70 hover:text-on-surface text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Jenis Transaksi Modal *
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
                >
                  <option value="TAMBAHAN_MODAL">Setoran Modal / Penambahan Modal</option>
                  <option value="SETORAN_AWAL">Setoran Modal Awal (Inisialisasi)</option>
                  <option value="PENARIKAN_MODAL">Penarikan Modal (Prive / Pengembalian)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-on-surface-variant block mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-semibold text-on-surface-variant block mb-1">
                    Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    placeholder="Contoh: 50000000"
                    value={formNominal}
                    onChange={(e) => setFormNominal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Rekening Kas / Bank Perusahaan *
                </label>
                <select
                  required
                  value={formRekening}
                  onChange={(e) => setFormRekening(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">-- Pilih Rekening Kas / Bank Penerima/Asal --</option>
                  {rekeningList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama} ({r.jenis}) — Saldo: {formatCurrency(r.saldo)} [{r.nama_cabang}]
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
                  Uang akan masuk/keluar ke rekening kas perusahaan ini saat transaksi disetujui.
                </span>
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant block mb-1">
                  Keterangan / Catatan Transaksi
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Setoran modal ekspansi cabang baru..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant/30 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/60 text-on-surface font-semibold hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Mengajukan..." : "Ajukan Transaksi (Draft/Pending)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL (KWITANSI RESMI) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            {/* Kwitansi Body */}
            <div id="kwitansi-print-area" className="p-4 border-2 border-dashed border-outline-variant/50 rounded-xl bg-surface-container-lowest space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-outline-variant/30 pb-3">
                <div>
                  <span className="font-black text-sm tracking-wider uppercase text-primary">
                    AL-MUBAROK GROUP
                  </span>
                  <span className="text-[10px] text-on-surface-variant block">
                    Enterprise Resource Planning & Treasury
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs uppercase text-on-surface block">
                    BUKTI TRANSAKSI MODAL
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    {selectedReceipt.nomor_referensi}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tanggal:</span>
                  <span className="font-semibold text-on-surface">
                    {selectedReceipt.tanggal_transaksi}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Jenis Mutasi:</span>
                  <span className="font-bold text-on-surface">
                    {selectedReceipt.jenis_transaksi.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Akun Kas/Bank:</span>
                  <span className="font-semibold text-on-surface">
                    {selectedReceipt.nama_rekening_kas || "Kas/Bank Operasional"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Akun Ekuitas:</span>
                  <span className="font-semibold text-on-surface">
                    3.101.01 Modal Disetor Investor
                  </span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/20 pt-2">
                  <span className="font-bold text-on-surface">Nominal Transaksi:</span>
                  <span className="font-bold font-mono text-base text-primary">
                    {formatCurrency(Number(selectedReceipt.nominal))}
                  </span>
                </div>
                {selectedReceipt.keterangan && (
                  <div className="pt-1">
                    <span className="text-[10px] text-on-surface-variant block">Keterangan:</span>
                    <span className="italic text-on-surface">
                      "{selectedReceipt.keterangan}"
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-6 grid grid-cols-2 text-center text-[10px] border-t border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block">Disetujui Oleh:</span>
                  <span className="mt-8 font-bold text-on-surface block underline">
                    Manajemen Keuangan
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Diterima / Penyetor:</span>
                  <span className="mt-8 font-bold text-on-surface block underline">
                    Pemodal Utama
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/60 text-xs font-semibold hover:bg-surface-container"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
