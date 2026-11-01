"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  RefreshCw,
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  Landmark,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LedgerItem {
  id: number;
  nomor_referensi: string;
  tanggal: string;
  jenis: string;
  keterangan: string | null;
  nama_rekening_kas: string | null;
  debit: number;
  kredit: number;
  saldo_akhir: number;
}

interface BukuPembantuData {
  profil: {
    nama_investor: string;
    nama_bank: string;
    nomor_rekening: string;
    atas_nama_rekening: string;
    saldo_modal_saat_ini: number;
  };
  transaksi: LedgerItem[];
  total_kredit: number;
  total_debit: number;
  saldo_akhir: number;
}

export default function BukuPembantuInvestorPage() {
  const [data, setData] = useState<BukuPembantuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/investor/buku-pembantu");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat buku pembantu");
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export CSV / Excel
  const handleExportCSV = () => {
    if (!data || data.transaksi.length === 0) return;

    const headers = ["Tanggal", "No Referensi", "Jenis Mutasi", "Keterangan", "Kas/Bank Lawan", "Debit (Penarikan)", "Kredit (Setoran/Reinvestasi)", "Saldo Modal Akhir"];
    const rows = data.transaksi.map((t) => [
      `"${t.tanggal}"`,
      `"${t.nomor_referensi}"`,
      `"${t.jenis}"`,
      `"${t.keterangan || ""}"`,
      `"${t.nama_rekening_kas || "Internal"}"`,
      t.debit,
      t.kredit,
      t.saldo_akhir,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Buku_Pembantu_Modal_Investor_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              Buku Pembantu Ekuitas Modal
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant">
              Rekening koran ekuitas investor (Statement of Changes in Equity) dan riwayat mutasi modal disetor
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
            onClick={handleExportCSV}
            disabled={!data || data.transaksi.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV / Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Rekening Koran
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs md:text-sm">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
            <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider block">
              Total Setoran & Reinvestasi (Kredit)
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              + {formatCurrency(data.total_kredit)}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Penambahan modal disetor & dividen dikonversi
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
            <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider block">
              Total Penarikan Modal / Prive (Debit)
            </span>
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
              - {formatCurrency(data.total_debit)}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Pengembalian modal pokok kepada investor
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 shadow-sm">
            <span className="text-[11px] text-primary uppercase font-bold tracking-wider block">
              Saldo Akhir Modal Disetor
            </span>
            <span className="text-2xl font-black font-mono text-primary mt-1 block">
              {formatCurrency(data.saldo_akhir)}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Akun 3.101.01 Modal Disetor Investor
            </span>
          </div>
        </div>
      )}

      {/* PRINTABLE LEDGER TABLE */}
      <div id="rekening-koran-modal" className="rounded-2xl border border-outline-variant/30 bg-surface shadow-sm overflow-hidden p-6 space-y-4">
        {/* Printable Header */}
        <div className="border-b border-outline-variant/30 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
              AL-MUBAROK RETAIL GROUP
            </span>
            <h2 className="text-base font-bold text-on-surface">
              BUKU BESAR PEMBANTU MODAL INVESTOR
            </h2>
            <p className="text-xs text-on-surface-variant">
              Sub-Ledger Akun COA: <strong>3.101.01 (Modal Disetor)</strong>
            </p>
          </div>

          {data && (
            <div className="text-xs text-right bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <span className="text-on-surface-variant/70 block text-[10px]">Nama Pemodal Resmi:</span>
              <span className="font-bold text-on-surface block">{data.profil.nama_investor}</span>
              <span className="text-on-surface-variant block text-[10px]">
                {data.profil.nama_bank} • Rek: {data.profil.nomor_rekening}
              </span>
            </div>
          )}
        </div>

        {/* Table of Ledger Entries */}
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
              <tr>
                <th className="px-4 py-3">Tanggal / Ref</th>
                <th className="px-4 py-3">Jenis Transaksi</th>
                <th className="px-4 py-3">Keterangan / Lawan Akun</th>
                <th className="px-4 py-3 text-right">Debit (Penarikan)</th>
                <th className="px-4 py-3 text-right">Kredit (Setoran)</th>
                <th className="px-4 py-3 text-right">Saldo Modal Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-on-surface-variant">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Memuat buku besar ekuitas investor...
                  </td>
                </tr>
              ) : !data || data.transaksi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-on-surface-variant">
                    Belum ada riwayat mutasi modal yang disetujui (Approved).
                  </td>
                </tr>
              ) : (
                data.transaksi.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-on-surface block">{t.tanggal}</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {t.nomor_referensi}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.jenis === "PENARIKAN_MODAL"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : t.jenis === "REINVESTASI_BAGI_HASIL"
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {t.jenis.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-on-surface block">
                        {t.keterangan || "-"}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70 block">
                        Lawan: {t.nama_rekening_kas || "Kas/Bank Operasional"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {t.debit > 0 ? formatCurrency(t.debit) : "-"}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {t.kredit > 0 ? formatCurrency(t.kredit) : "-"}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-on-surface bg-surface-container-lowest">
                      {formatCurrency(t.saldo_akhir)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data && data.transaksi.length > 0 && (
              <tfoot className="bg-surface-container-low font-bold border-t-2 border-outline-variant/40">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-on-surface">
                    TOTAL MUTASI & SALDO AKHIR EKUITAS:
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                    {formatCurrency(data.total_debit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.total_kredit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-primary text-sm">
                    {formatCurrency(data.saldo_akhir)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
