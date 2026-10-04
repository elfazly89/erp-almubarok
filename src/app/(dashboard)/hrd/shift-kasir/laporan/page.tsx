"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  Download,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Shift {
  id: number;
  id_cabang: number;
  nama_cabang: string;
  id_kasir: number;
  nama_kasir: string;
  kode_kasir: string;
  id_rekening: number;
  nama_rekening: string;
  waktu_buka: string;
  waktu_tutup: string | null;
  saldo_awal: number;
  total_sistem: number;
  total_tunai: number;
  total_transfer: number;
  uang_fisik: number | null;
  selisih: number | null;
  setoran: number;
  status: "OPEN" | "CLOSING" | "VERIFIED" | "DISCREPANCY";
  catatan: string | null;
  verified_by_nama?: string | null;
  verified_at?: string | null;
}

interface Cabang {
  id_cabang: number;
  nama_cabang: string;
}

interface Kasir {
  id: number;
  nama_user: string;
}

export default function LaporanShiftPage() {
  const { can_read } = useMenuPermissions();
  const [list, setList] = useState<Shift[]>([]);
  const [cabangs, setCabangs] = useState<Cabang[]>([]);
  const [kasirs, setKasirs] = useState<Kasir[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCabang, setSelectedCabang] = useState("");
  const [selectedKasir, setSelectedKasir] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch shift list from API
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedCabang) params.append("id_cabang", selectedCabang);
      if (selectedKasir) params.append("id_kasir", selectedKasir);
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await fetch(`/api/kas/shift?${params.toString()}`);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success) {
          setList(resData.data);
        }
      }
    } catch (e) {
      console.error("Gagal memuat laporan shift", e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedCabang, selectedKasir, selectedStatus]);

  useEffect(() => {
    fetchData();

    // Fetch branches for dropdown filter
    fetch("/api/cabang")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCabangs(res.data);
        else if (Array.isArray(res)) setCabangs(res);
      })
      .catch((err) => console.error("Gagal memuat data cabang", err));

    // Fetch users (cashiers) for dropdown filter
    fetch("/api/hrd/users")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res)) setKasirs(res);
        else if (res.success && Array.isArray(res.data)) setKasirs(res.data);
      })
      .catch((err) => console.error("Gagal memuat data kasir", err));
  }, [fetchData]);

  // Calculations for KPI Widget
  const totalShift = list.length;
  const totalPenjualan = list.reduce((sum, s) => sum + (s.total_sistem || 0), 0);
  const totalSelisih = list.reduce((sum, s) => sum + (s.selisih || 0), 0);
  const totalDiscrepancy = list.filter((s) => s.status === "DISCREPANCY").length;

  const handleExportExcel = () => {
    if (list.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "ID Shift",
      "Nama Kasir",
      "Cabang",
      "Laci Kasir",
      "Waktu Buka",
      "Waktu Tutup",
      "Modal Awal",
      "Total Penjualan",
      "Total Tunai",
      "Total Transfer",
      "Uang Fisik",
      "Selisih",
      "Setoran",
      "Status",
      "Catatan/Alasan",
      "Diverifikasi Oleh",
      "Waktu Verifikasi",
    ];

    const data = [
      headers,
      ...list.map((s) => [
        s.id,
        s.nama_kasir,
        s.nama_cabang || "—",
        s.nama_rekening,
        s.waktu_buka,
        s.waktu_tutup || "—",
        s.saldo_awal,
        s.total_sistem,
        s.total_tunai,
        s.total_transfer,
        s.uang_fisik !== null ? s.uang_fisik : "—",
        s.selisih !== null ? s.selisih : "—",
        s.setoran,
        s.status,
        s.catatan || "—",
        s.verified_by_nama || "—",
        s.verified_at || "—",
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Shift Kasir");

    // Adjust column widths
    const colWidths = headers.map((_, colIdx) => {
      let maxLen = headers[colIdx].length;
      list.forEach((item, rowIdx) => {
        const val = String(data[rowIdx + 1][colIdx]);
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(maxLen + 4, 30) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `Laporan_Shift_Kasir_${startDate}_sd_${endDate}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "CLOSING":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "DISCREPANCY":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "VERIFIED":
        return "bg-slate-100 text-slate-800 border border-slate-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (!can_read) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface text-on-surface rounded-xl border border-outline/30">
        <AlertTriangle className="w-16 h-16 text-warning mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-sm text-on-surface-variant text-center max-w-md">
          Anda tidak memiliki izin untuk melihat halaman ini. Silakan hubungi administrator Anda.
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
            Laporan Rekap Shift Kasir
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Pantau dan analisis riwayat shift, total transaksi, dan investigasi selisih kas dari semua kasir.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary hover:bg-primary/95 font-semibold rounded-lg shadow-sm transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor ke Excel
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-on-surface-variant font-medium block uppercase tracking-wider">Total Shift</span>
            <span className="text-2xl font-bold text-on-surface">{totalShift}</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-on-surface-variant font-medium block uppercase tracking-wider">Total Penjualan</span>
            <span className="text-2xl font-bold text-on-surface font-mono">{formatCurrency(totalPenjualan)}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-on-surface-variant font-medium block uppercase tracking-wider">Total Selisih</span>
            <span className={`text-2xl font-bold font-mono ${totalSelisih >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {totalSelisih > 0 ? "+" : ""}
              {formatCurrency(totalSelisih)}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${totalSelisih >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-on-surface-variant font-medium block uppercase tracking-wider">Discrepancy (Selisih)</span>
            <span className="text-2xl font-bold text-rose-600">{totalDiscrepancy} <span className="text-xs text-on-surface-variant font-normal">Shift</span></span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          Filter Laporan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant uppercase block">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant uppercase block">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant uppercase block">Cabang</label>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            >
              <option value="">Semua Cabang</option>
              {cabangs.map((c) => (
                <option key={c.id_cabang} value={c.id_cabang}>
                  {c.nama_cabang}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant uppercase block">Kasir</label>
            <select
              value={selectedKasir}
              onChange={(e) => setSelectedKasir(e.target.value)}
              className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            >
              <option value="">Semua Kasir</option>
              {kasirs.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_user}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant uppercase block">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            >
              <option value="">Semua Status</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSING">CLOSING</option>
              <option value="DISCREPANCY">DISCREPANCY</option>
              <option value="VERIFIED">VERIFIED</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-outline-variant/30 gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-5 py-2 bg-secondary text-on-secondary hover:bg-secondary/95 font-semibold rounded-lg text-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Cabang</th>
                <th className="px-6 py-4">Laci Kasir</th>
                <th className="px-6 py-4">Waktu Buka / Tutup</th>
                <th className="px-6 py-4 text-right">Modal Awal</th>
                <th className="px-6 py-4 text-right">Penjualan Sistem</th>
                <th className="px-6 py-4 text-right">Uang Fisik</th>
                <th className="px-6 py-4 text-right">Selisih</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-on-surface-variant">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <span className="text-xs mt-2 block">Memuat laporan rekap...</span>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-on-surface-variant">
                    Tidak ada data shift ditemukan untuk kriteria filter ini.
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container/50 transition">
                    <td className="px-6 py-4 font-mono font-bold">#{s.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold block">{s.nama_kasir}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{s.kode_kasir}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-xs">{s.nama_cabang || "—"}</td>
                    <td className="px-6 py-4 text-xs font-mono">{s.nama_rekening}</td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="block text-emerald-600">B: {formatDateTime(s.waktu_buka)}</span>
                      <span className="block text-rose-600">T: {s.waktu_tutup ? formatDateTime(s.waktu_tutup) : "Belum ditutup"}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(s.saldo_awal)}</td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(s.total_sistem)}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {s.uang_fisik !== null ? formatCurrency(s.uang_fisik) : <span className="text-on-surface-variant italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {s.selisih !== null ? (
                        <span className={s.selisih === 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                          {s.selisih > 0 ? "+" : ""}
                          {formatCurrency(s.selisih)}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block tracking-wide uppercase ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
