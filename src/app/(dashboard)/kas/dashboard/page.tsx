"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Vault,
  RefreshCw,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  totalSaldo: number;
  kasMasukHariIni: number;
  kasKeluarHariIni: number;
  jumlahShiftBuka: number;
  rekonsiliasiPending: number;
  mutasiTerbaru: {
    id: number;
    nomor_transaksi: string;
    nama_rekening: string;
    tipe: "MASUK" | "KELUAR";
    kategori: string;
    nominal: number;
    tanggal: string;
    keterangan: string | null;
  }[];
}

export default function KasDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kas/dashboard");
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.data);
      } else {
        setError(resData.error || "Gagal memuat data dashboard");
      }
    } catch (e: any) {
      setError("Kesalahan koneksi jaringan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Gagal memuat dashboard</h4>
          <p className="text-xs">{error || "Terjadi kesalahan sistem"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-background tracking-tight">
            Dashboard Manajemen Kas
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Ringkasan ketersediaan saldo, pencapaian omzet harian, dan mutasi kasir.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-outline/30 rounded-lg text-sm font-medium hover:bg-surface-variant transition text-on-surface"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Total Saldo Berjalan
            </span>
            <span className="text-2xl font-extrabold text-on-surface mt-1 block">
              {formatCurrency(data.totalSaldo)}
            </span>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Vault className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Kas Masuk (Hari Ini)
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {formatCurrency(data.kasMasukHariIni)}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Kas Keluar (Hari Ini)
            </span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">
              {formatCurrency(data.kasKeluarHariIni)}
            </span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Shift Aktif Kasir
            </span>
            <span className="text-2xl font-extrabold text-on-surface mt-1 block">
              {data.jumlahShiftBuka} Kasir
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent mutations list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface">Mutasi Kas Terbaru</h3>
            <Link
              href="/kas/transaksi"
              className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              Lihat Semua
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant uppercase">
                    <th className="px-5 py-3">No. Transaksi</th>
                    <th className="px-5 py-3">Rekening</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
                  {data.mutasiTerbaru.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-on-surface-variant text-xs">
                        Belum ada transaksi mutasi kas hari ini.
                      </td>
                    </tr>
                  ) : (
                    data.mutasiTerbaru.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-container/30 transition">
                        <td className="px-5 py-3 font-mono font-bold text-xs">{tx.nomor_transaksi}</td>
                        <td className="px-5 py-3 text-xs">{tx.nama_rekening}</td>
                        <td className="px-5 py-3 text-xs font-semibold uppercase">{tx.kategori}</td>
                        <td
                          className={`px-5 py-3 text-right font-mono font-semibold ${
                            tx.tipe === "MASUK" ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {tx.tipe === "MASUK" ? "+" : "-"} {formatCurrency(tx.nominal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Quick Links */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-on-surface">Pemberitahuan Audit</h3>
          
          <div className="p-5 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm space-y-4">
            {data.rekonsiliasiPending > 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-800">Menunggu Rekonsiliasi</p>
                  <p className="text-on-surface-variant">Ada <strong>{data.rekonsiliasiPending}</strong> pengajuan rekonsiliasi kas yang memerlukan persetujuan Supervisor.</p>
                  <Link href="/kas/rekonsiliasi" className="text-xs font-semibold text-primary inline-block pt-1 hover:underline">
                    Pergi ke Rekonsiliasi
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-800">Status Audit Aman</p>
                  <p className="text-on-surface-variant">Tidak ada pengajuan rekonsiliasi kas yang tertunda atau pending saat ini.</p>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-on-surface-variant uppercase block">Pintasan Cepat</span>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <Link
                  href="/kas/shift"
                  className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-center block transition text-on-surface"
                >
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  Sesi Kasir (Shift)
                </Link>
                <Link
                  href="/kas/rekening"
                  className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-center block transition text-on-surface"
                >
                  <Vault className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                  Master Rekening
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
