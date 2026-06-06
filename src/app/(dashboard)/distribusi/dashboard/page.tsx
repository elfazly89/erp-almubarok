"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  kpi: {
    totalCabang: number;
    totalKritis: number;
    serviceLevel: number;
    pendingRekomendasi: number;
  };
  barangKritis: { cabang: string; barang: string; stok: number; ads: number; habis: number; status: string }[];
  cabangKritis: { cabang: string; jmlKritis: number; totalItem: number; status: string }[];
  fastMoving: { barang: string; ads: number; cabang: string }[];
  prioritas: { cabang: string; skor: number; status: string; alasan: string }[];
}

// Fallback MOCK data jika DB belum punya data (forecast belum pernah dijalankan)
const MOCK_CRITICAL_ITEMS = [
  { cabang: "SUKOWONO", barang: "Minyak Goreng Sunco 2L", stok: 12, ads: 8.5, habis: 1.4, status: "KRITIS" },
  { cabang: "KALISAT", barang: "Beras Cap Mangkok 5kg", stok: 8, ads: 4.2, habis: 1.9, status: "KRITIS" },
  { cabang: "PONPES", barang: "Gula Pasir Gulaku 1kg", stok: 25, ads: 10.0, habis: 2.5, status: "PERHATIAN" },
  { cabang: "LEDOKOMBO", barang: "Aqua Gelas Dus", stok: 18, ads: 6.0, habis: 3.0, status: "PERHATIAN" },
  { cabang: "GUNUNG MALANG", barang: "Indomie Goreng Spesial", stok: 45, ads: 12.5, habis: 3.6, status: "PERHATIAN" },
  { cabang: "SUKOSARI", barang: "Sabun Nuvo Cair 450ml", stok: 5, ads: 1.2, habis: 4.1, status: "PERHATIAN" },
];
const MOCK_CRITICAL_BRANCHES = [
  { cabang: "SUKOWONO", jmlKritis: 18, totalItem: 120, status: "Kritis" },
  { cabang: "KALISAT", jmlKritis: 12, totalItem: 95, status: "Kritis" },
  { cabang: "PONPES", jmlKritis: 9, totalItem: 150, status: "Perhatian" },
  { cabang: "LEDOKOMBO", jmlKritis: 6, totalItem: 110, status: "Perhatian" },
  { cabang: "GUNUNG MALANG", jmlKritis: 4, totalItem: 85, status: "Aman" },
];
const MOCK_FAST_MOVING = [
  { barang: "Minyak Goreng Sunco 2L", ads: 42.5, cabang: "Jaringan DC" },
  { barang: "Gula Pasir Gulaku 1kg", ads: 38.0, cabang: "Jaringan DC" },
  { barang: "Aqua Gelas Dus", ads: 35.2, cabang: "Jaringan DC" },
  { barang: "Indomie Goreng Spesial", ads: 30.8, cabang: "Jaringan DC" },
  { barang: "Telur Ayam Negeri / Kg", ads: 28.4, cabang: "Jaringan DC" },
];
const MOCK_PRIORITY = [
  { cabang: "SUKOWONO", skor: 92, status: "Sangat Tinggi", alasan: "Estimasi habis < 2 hari & jarak 5km" },
  { cabang: "KALISAT", skor: 85, status: "Tinggi", alasan: "Kecepatan jual tinggi & stok kritis" },
  { cabang: "PONPES", skor: 74, status: "Sedang", alasan: "Stok menipis untuk kebutuhan harian" },
  { cabang: "LEDOKOMBO", skor: 68, status: "Sedang", alasan: "Waktu pengiriman 1 hari" },
  { cabang: "GUNUNG MALANG", skor: 45, status: "Rendah", alasan: "Stok aman untuk 7 hari ke depan" },
];

export default function DashboardDistribusiPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/dashboard");
      const json = await res.json();

      if (json.success && json.barangKritis?.length > 0) {
        setData(json);
        setUsingMock(false);
      } else {
        // Fallback ke mock jika data DB kosong
        setData({
          kpi: { totalCabang: 16, totalKritis: 35, serviceLevel: 94.8, pendingRekomendasi: 12 },
          barangKritis: MOCK_CRITICAL_ITEMS,
          cabangKritis: MOCK_CRITICAL_BRANCHES,
          fastMoving: MOCK_FAST_MOVING,
          prioritas: MOCK_PRIORITY,
        });
        setUsingMock(true);
      }
    } catch {
      setData({
        kpi: { totalCabang: 16, totalKritis: 35, serviceLevel: 94.8, pendingRekomendasi: 12 },
        barangKritis: MOCK_CRITICAL_ITEMS,
        cabangKritis: MOCK_CRITICAL_BRANCHES,
        fastMoving: MOCK_FAST_MOVING,
        prioritas: MOCK_PRIORITY,
      });
      setUsingMock(true);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString("id-ID"));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpi = data?.kpi;
  const barangKritis = data?.barangKritis || [];
  const cabangKritis = data?.cabangKritis || [];
  const fastMoving = data?.fastMoving || [];
  const prioritas = data?.prioritas || [];

  return (
    <div className="flex flex-col space-y-5 text-on-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-primary" /> Dasbor Distribusi &amp; Pengisian Stok Pintar
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Pantau ketersediaan stok cabang, proyeksi ketersediaan, dan estimasi waktu habis secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {usingMock && (
            <span className="text-[10px] bg-warning/10 text-warning border border-warning/20 px-2 py-1 rounded-full font-bold">
              Data Simulasi — Jalankan Forecast untuk data nyata
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Memuat..." : `Refresh ${lastUpdated ? `(${lastUpdated})` : ""}`}
          </button>
        </div>
      </div>

      {/* Rangkuman KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-outline-variant/30 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-on-surface-variant text-xs block font-semibold uppercase tracking-wider">Total Cabang Dipantau</span>
            <span className="text-3xl font-extrabold text-on-surface mt-1 block font-mono">{loading ? "—" : kpi?.totalCabang || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/30 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-on-surface-variant text-xs block font-semibold uppercase tracking-wider">Barang Status Kritis</span>
            <span className="text-3xl font-extrabold text-error mt-1 block font-mono">{loading ? "—" : `${kpi?.totalKritis || 0} SKU`}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/30 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-on-surface-variant text-xs block font-semibold uppercase tracking-wider">Tingkat Pemenuhan Stok</span>
            <span className="text-3xl font-extrabold text-success mt-1 block font-mono">{loading ? "—" : `${kpi?.serviceLevel || 0}%`}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/30 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-on-surface-variant text-xs block font-semibold uppercase tracking-wider">Rekomendasi Tertunda</span>
            <span className="text-3xl font-extrabold text-secondary mt-1 block font-mono">{loading ? "—" : `${kpi?.pendingRekomendasi || 0} Draf`}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Widget 1 - Barang Kritis (Col span 2) */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider text-error">
              <AlertTriangle className="w-4 h-4 text-error" /> Daftar Barang Kritis (Stok &lt; Batas Pengiriman)
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Urutan estimasi habis tercepat</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold">
                  <th className="px-4 py-2.5">Cabang</th>
                  <th className="px-4 py-2.5">Nama Barang</th>
                  <th className="px-4 py-2.5 text-right">Stok Saat Ini</th>
                  <th className="px-4 py-2.5 text-right">Rata-rata Jual (Harian)</th>
                  <th className="px-4 py-2.5 text-right">Estimasi Habis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">Memuat data...</td></tr>
                ) : barangKritis.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-success text-sm font-semibold">✅ Tidak ada barang dengan status kritis!</td></tr>
                ) : (
                  barangKritis.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-3 font-semibold">{item.cabang}</td>
                      <td className="px-4 py-3">{item.barang}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{item.stok} pcs</td>
                      <td className="px-4 py-3 text-right font-mono">{item.ads.toFixed(1)} pcs</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.habis < 2 ? "bg-error/10 text-error border border-error/20" : "bg-warning/10 text-warning border border-warning/20"
                        }`}>
                          {item.habis} Hari
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget 4 - Prioritas Distribusi */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider text-primary">
              <Sparkles className="w-4 h-4 text-primary" /> Prioritas Pengiriman Cabang
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Algoritma Pintar</span>
          </div>
          <div className="space-y-3 flex-1">
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant text-xs">Memuat...</div>
            ) : (
              prioritas.map((p, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-high/40 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-xs">{idx + 1}. {p.cabang}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        p.status === "Sangat Tinggi" ? "bg-error/10 text-error" : p.status === "Tinggi" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block truncate mt-1">{p.alasan}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold font-mono text-primary">{p.skor}</span>
                    <span className="text-[9px] text-on-surface-variant block font-semibold">Skor</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2 - Cabang Kritis */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider text-on-surface">
              <Building2 className="w-4 h-4 text-primary" /> Cabang Paling Kritis
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Berdasarkan SKU</span>
          </div>
          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant text-xs">Memuat...</div>
            ) : (
              cabangKritis.map((cb, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface">{cb.cabang}</span>
                    <span className="text-on-surface-variant font-mono">{cb.jmlKritis} / {cb.totalItem} Item Kritis</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cb.status === "Kritis" ? "bg-error" : cb.status === "Perhatian" ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${cb.totalItem > 0 ? (cb.jmlKritis / cb.totalItem) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 3 - Top Fast Moving */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm uppercase tracking-wider text-success">
              <TrendingUp className="w-4 h-4 text-success" /> Produk Terlaris (Laju Cepat)
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Laju Penjualan Tertinggi</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold">
                  <th className="px-4 py-2.5">Nama Produk</th>
                  <th className="px-4 py-2.5">Cabang Tertinggi</th>
                  <th className="px-4 py-2.5 text-right">Rata-rata Penjualan Harian (Laju)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {loading ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">Memuat data...</td></tr>
                ) : fastMoving.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">Belum ada data penjualan</td></tr>
                ) : (
                  fastMoving.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-3 font-semibold">{item.barang}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{item.cabang}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-success flex items-center justify-end gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> {item.ads.toFixed(1)} pcs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
