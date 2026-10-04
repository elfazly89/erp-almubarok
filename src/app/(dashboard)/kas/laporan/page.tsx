"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Vault
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

interface MutationRow {
  id: number;
  nomor_transaksi: string;
  tanggal: string;
  keterangan: string | null;
  debit: number;
  kredit: number;
}

interface LaporanRekening {
  rekening: {
    id: number;
    kode: string;
    nama: string;
  };
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  mutations: MutationRow[];
}

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  is_active: boolean;
}

export default function LaporanKasPage() {
  const { can_read, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<LaporanRekening[]>([]);
  const [rekenings, setRekenings] = useState<Rekening[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [filterRekening, setFilterRekening] = useState("");

  const fetchRekenings = useCallback(async () => {
    try {
      const res = await fetch("/api/kas/rekening");
      const resData = await res.json();
      if (res.ok && resData.success) {
        setRekenings(resData.data.filter((r: any) => r.is_active));
      }
    } catch {
      setErrorMsg("Gagal memuat daftar rekening");
    }
  }, []);

  const fetchLaporan = useCallback(async () => {
    if (!startDate || !endDate) {
      setErrorMsg("Pilih periode tanggal laporan");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const qParams = new URLSearchParams({
        startDate,
        endDate,
      });
      if (filterRekening) qParams.append("id_rekening", filterRekening);

      const res = await fetch(`/api/kas/laporan?${qParams.toString()}`);
      const resData = await res.json();
      if (res.ok && resData.success) {
        setList(resData.reports);
      } else {
        setErrorMsg(resData.error || "Gagal memuat laporan mutasi");
      }
    } catch {
      setErrorMsg("Kesalahan koneksi jaringan");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterRekening]);

  useEffect(() => {
    fetchRekenings();
  }, [fetchRekenings]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  const handleExportExcel = () => {
    if (list.length === 0) return;

    const workbook = XLSX.utils.book_new();
    const today = new Date().toISOString().slice(0, 10);

    for (const rep of list) {
      const sheetRows = [
        ["LAPORAN BUKU KAS / MUTASI SALDO"],
        [`Rekening: ${rep.rekening.nama} (${rep.rekening.kode})`],
        [`Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`],
        [],
        ["Saldo Awal:", formatCurrency(rep.saldoAwal)],
        ["Total Penerimaan (Masuk):", formatCurrency(rep.totalMasuk)],
        ["Total Pengeluaran (Keluar):", formatCurrency(rep.totalKeluar)],
        ["Saldo Akhir:", formatCurrency(rep.saldoAkhir)],
        [],
        ["TANGGAL", "NO. TRANSAKSI", "KETERANGAN", "DEBIT (MASUK)", "KREDIT (KELUAR)", "SALDO BERJALAN"],
      ];

      let runningSaldo = rep.saldoAwal;

      rep.mutations.forEach((m) => {
        runningSaldo = runningSaldo + m.debit - m.kredit;
        sheetRows.push([
          m.tanggal,
          m.nomor_transaksi,
          m.keterangan || "—",
          m.debit.toString(),
          m.kredit.toString(),
          runningSaldo.toString(),
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);

      // Auto width columns
      const colWidths = [12, 22, 35, 15, 15, 18].map((w) => ({ wch: w }));
      worksheet["!cols"] = colWidths;

      // Append sheet to workbook (sheet name max 31 chars)
      const sheetName = rep.rekening.nama.slice(0, 30);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    XLSX.writeFile(workbook, `laporan_buku_kas_${today}.xlsx`);
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!can_read) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface text-on-surface rounded-xl border border-outline/30">
        <AlertTriangle className="w-16 h-16 text-warning mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-sm text-on-surface-variant text-center max-w-md">
          Anda tidak memiliki izin untuk melihat halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-background tracking-tight">
            Laporan Buku Kas & Mutasi
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Unduh laporan mutasi harian dan analisis arus kas per rekening kasir/toko.
          </p>
        </div>
        {list.length > 0 && (
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Ekspor ke Excel
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="p-5 bg-surface border border-outline-variant/30 rounded-xl space-y-4 shadow-sm">
        <h4 className="text-sm font-bold text-on-surface">Kriteria Laporan</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Pilih Rekening Kas</label>
            <select
              value={filterRekening}
              onChange={(e) => setFilterRekening(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            >
              <option value="">Semua Rekening Kas</option>
              {rekenings.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kode} - {r.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchLaporan}
              className="w-full flex items-center justify-center gap-2 py-2 bg-secondary text-on-secondary font-semibold rounded-lg hover:bg-secondary/90 transition text-sm shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs">{errorMsg}</span>
        </div>
      )}

      {/* Reports Render */}
      <div className="space-y-8">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <span className="text-xs mt-2 block">Menghitung buku kas...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-sm border border-dashed border-outline/30 rounded-xl">
            Tidak ada transaksi kas terdaftar pada periode ini.
          </div>
        ) : (
          list.map((rep) => {
            let runningSaldo = rep.saldoAwal;

            return (
              <div key={rep.rekening.id} className="p-6 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm space-y-6">
                {/* Account details and summary cards */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <Vault className="w-5 h-5 text-primary" />
                      {rep.rekening.nama} ({rep.rekening.kode})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-surface-container border border-outline-variant/20 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-on-surface-variant uppercase block">Saldo Awal</span>
                    <span className="font-mono font-bold text-sm text-on-surface block mt-1">{formatCurrency(rep.saldoAwal)}</span>
                  </div>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Total Masuk</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 block mt-1">+{formatCurrency(rep.totalMasuk)}</span>
                  </div>
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-red-800 uppercase block">Total Keluar</span>
                    <span className="font-mono font-bold text-sm text-red-600 block mt-1">-{formatCurrency(rep.totalKeluar)}</span>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-center">
                    <span className="text-[10px] font-semibold text-primary uppercase block">Saldo Akhir</span>
                    <span className="font-mono font-bold text-sm text-primary block mt-1">{formatCurrency(rep.saldoAkhir)}</span>
                  </div>
                </div>

                {/* Mutation Table */}
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/40 text-[10px] font-semibold text-on-surface-variant uppercase">
                        <th className="px-5 py-3">Tanggal</th>
                        <th className="px-5 py-3">No. Transaksi</th>
                        <th className="px-5 py-3">Keterangan</th>
                        <th className="px-5 py-3 text-right">Debit (Masuk)</th>
                        <th className="px-5 py-3 text-right">Kredit (Keluar)</th>
                        <th className="px-5 py-3 text-right font-semibold">Saldo Berjalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-xs font-mono text-on-surface">
                      {rep.mutations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-6 text-center text-on-surface-variant font-sans">
                            Tidak ada transaksi mutasi selama periode ini.
                          </td>
                        </tr>
                      ) : (
                        rep.mutations.map((m) => {
                          runningSaldo = runningSaldo + m.debit - m.kredit;
                          return (
                            <tr key={m.id} className="hover:bg-surface-container/30 transition">
                              <td className="px-5 py-3">{formatDate(m.tanggal)}</td>
                              <td className="px-5 py-3 font-bold">{m.nomor_transaksi}</td>
                              <td className="px-5 py-3 font-sans font-medium max-w-xs truncate" title={m.keterangan || ""}>
                                {m.keterangan || <span className="text-on-surface-variant italic">—</span>}
                              </td>
                              <td className="px-5 py-3 text-right text-emerald-600 font-bold">
                                {m.debit > 0 ? `+${formatCurrency(m.debit)}` : "—"}
                              </td>
                              <td className="px-5 py-3 text-right text-red-600 font-bold">
                                {m.kredit > 0 ? `-${formatCurrency(m.kredit)}` : "—"}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-on-surface">
                                {formatCurrency(runningSaldo)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
