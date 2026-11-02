"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendPoint {
  period: string;
  label: string;
  omzet: number;
  transaksi?: number;
}

interface BranchGrowthItem {
  id_cabang: number;
  nama_cabang: string;
  currentOmzet: number;
  previousOmzet: number;
  diffNominal: number;
  growthPercent: number;
  trend?: TrendPoint[];
}

interface GrowthStatsData {
  granularity: "monthly" | "weekly" | "daily";
  periodTitle: string;
  company: {
    currentOmzet: number;
    previousOmzet: number;
    diffNominal: number;
    growthPercent: number;
    trend: TrendPoint[];
  };
  branches: BranchGrowthItem[];
}

interface CompanyGrowthAnalyticsProps {
  initialData?: GrowthStatsData | null;
}

export function CompanyGrowthAnalyticsWidget({ initialData }: CompanyGrowthAnalyticsProps) {
  const [granularity, setGranularity] = useState<"monthly" | "weekly" | "daily">(
    initialData?.granularity || "monthly"
  );
  const [data, setData] = useState<GrowthStatsData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllRows, setShowAllRows] = useState(false);

  // Fetch data when granularity changes
  useEffect(() => {
    if (initialData && granularity === initialData.granularity && !data) {
      setData(initialData);
      return;
    }

    async function loadGrowthData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/growth?granularity=${granularity}`);
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && resJson.data) {
            setData(resJson.data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat analitik pertumbuhan:", err);
      } finally {
        setLoading(false);
      }
    }

    loadGrowthData();
  }, [granularity]);

  if (!data && loading) {
    return (
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-surface-container rounded mb-4" />
        <div className="h-64 bg-surface-container rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const company = data.company;
  const branches = data.branches || [];

  // Determine active chart series
  let activeTrend: TrendPoint[] = company.trend || [];
  let activeCurrentOmzet = company.currentOmzet;
  let activePrevOmzet = company.previousOmzet;
  let activeDiffNominal = company.diffNominal;
  let activeGrowthPercent = company.growthPercent;
  let activeEntityName = "Konsolidasi Seluruh Perusahaan";

  if (selectedBranchId !== "all") {
    const targetBranch = branches.find((b) => String(b.id_cabang) === selectedBranchId);
    if (targetBranch) {
      activeTrend = targetBranch.trend || [];
      activeCurrentOmzet = targetBranch.currentOmzet;
      activePrevOmzet = targetBranch.previousOmzet;
      activeDiffNominal = targetBranch.diffNominal;
      activeGrowthPercent = targetBranch.growthPercent;
      activeEntityName = targetBranch.nama_cabang;
    }
  }

  const isPositiveGrowth = activeGrowthPercent >= 0;

  // Filtered branches for the table
  const filteredBranches = branches.filter((b) =>
    b.nama_cabang.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedBranches = showAllRows ? filteredBranches : filteredBranches.slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-surface border border-outline-variant/40 rounded-xl p-3 shadow-lg text-xs">
          <p className="font-bold text-on-surface mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            <span className="text-on-surface-variant">Omset:</span>
            <span className="font-mono font-bold text-on-surface">{formatCurrency(val)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs space-y-6">
      {/* Header Widget */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-on-surface">
              Statistik Pertumbuhan Perusahaan & Cabang
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant/70 mt-1">
            Visualisasi tren pertumbuhan omset berkala ({data.periodTitle}) dengan rincian komparasi tiap cabang
          </p>
        </div>

        {/* Filter Controls: Granularity & Branch Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Picker */}
          <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl px-2.5 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Semua Cabang (Perusahaan)</option>
              {branches.map((b) => (
                <option key={b.id_cabang} value={String(b.id_cabang)}>
                  {b.nama_cabang}
                </option>
              ))}
            </select>
          </div>

          {/* Granularity Switcher */}
          <div className="flex items-center p-0.5 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => setGranularity("monthly")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                granularity === "monthly"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Bulanan (MoM)
            </button>
            <button
              type="button"
              onClick={() => setGranularity("weekly")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                granularity === "weekly"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Mingguan (WoW)
            </button>
            <button
              type="button"
              onClick={() => setGranularity("daily")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                granularity === "daily"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Harian (30 Hari)
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strips for the Active Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Omset Periode Ini
            </p>
            <p className="text-xl font-bold font-mono text-on-surface mt-1">
              {formatCurrency(activeCurrentOmzet)}
            </p>
          </div>
          <span className="text-[11px] text-on-surface-variant/70 font-medium text-right truncate max-w-[110px]">
            {activeEntityName}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Omset Periode Pembanding
            </p>
            <p className="text-xl font-bold font-mono text-on-surface mt-1">
              {formatCurrency(activePrevOmzet)}
            </p>
          </div>
          <span className="text-[11px] text-on-surface-variant/70 font-medium">Periode Lalu</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Laju Pertumbuhan (Growth)
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p
                className={`text-xl font-bold font-mono ${
                  isPositiveGrowth
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isPositiveGrowth ? `+${activeGrowthPercent}%` : `${activeGrowthPercent}%`}
              </p>
              <span className="text-xs text-on-surface-variant/70 font-mono">
                ({isPositiveGrowth ? "+" : ""}
                {formatCurrency(activeDiffNominal)})
              </span>
            </div>
          </div>
          <div
            className={`p-2 rounded-xl ${
              isPositiveGrowth
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPositiveGrowth ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-on-surface flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Kurva Tren Pertumbuhan ({activeEntityName})
          </span>
          {loading && (
            <span className="text-xs text-primary flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Memperbarui tren...
            </span>
          )}
        </div>

        <div className="h-64 w-full">
          {activeTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-on-surface-variant/60">
              Tidak ada data penjualan historis yang tercatat untuk periode ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary, #0284c7)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary, #0284c7)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--on-surface-variant, #64748b)" }}
                  axisLine={{ stroke: "rgba(100, 116, 139, 0.2)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--on-surface-variant, #64748b)" }}
                  tickFormatter={(val) => {
                    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}jt`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
                    return String(val);
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="var(--primary, #0284c7)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#growthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rincian Matriks Pertumbuhan Seluruh Cabang */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-on-surface">
              Rincian Pertumbuhan Seluruh Cabang ({filteredBranches.length} Toko)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari cabang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary w-40"
              />
            </div>

            {branches.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllRows(!showAllRows)}
                className="text-xs font-semibold text-primary hover:underline px-2.5 py-1 bg-primary/10 rounded-xl"
              >
                {showAllRows ? "Tampilkan 5 Teratas" : `Lihat Semua (${branches.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-outline-variant/30 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/20 font-semibold">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Nama Cabang</th>
                <th className="py-2.5 px-3 text-right">Omset Saat Ini</th>
                <th className="py-2.5 px-3 text-right">Omset Lalu</th>
                <th className="py-2.5 px-3 text-right">Selisih Pertumbuhan</th>
                <th className="py-2.5 px-3 text-right">Laju (% Growth)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-on-surface">
              {displayedBranches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-on-surface-variant/60">
                    Tidak ada cabang yang cocok dengan kata kunci pencarian
                  </td>
                </tr>
              ) : (
                displayedBranches.map((b, idx) => {
                  const bGrowth = b.growthPercent;
                  const isPositive = bGrowth > 0;
                  const isNeutral = bGrowth === 0;

                  return (
                    <tr
                      key={b.id_cabang}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-on-surface-variant/70">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-on-surface">
                        <button
                          type="button"
                          onClick={() => setSelectedBranchId(String(b.id_cabang))}
                          className="hover:text-primary hover:underline text-left"
                          title="Klik untuk melihat grafik cabang ini"
                        >
                          {b.nama_cabang}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {formatCurrency(b.currentOmzet)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">
                        {formatCurrency(b.previousOmzet)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-medium ${
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isNeutral
                            ? "text-on-surface-variant"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(b.diffNominal)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isNeutral
                              ? "bg-surface-container text-on-surface-variant"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                          {!isPositive && !isNeutral && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {isNeutral && <Minus className="w-3 h-3 mr-0.5" />}
                          {bGrowth}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isNeutral
                              ? "bg-surface-container text-on-surface-variant"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? "Tumbuh 📈" : isNeutral ? "Stabil ➖" : "Turun 📉"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
