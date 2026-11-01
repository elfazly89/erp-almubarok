"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SalesTrendItem {
  date: string;
  label: string;
  omzet: number;
  transaksi: number;
  kasMasuk: number;
  kasKeluar: number;
}

interface SalesCashFlowChartProps {
  data: SalesTrendItem[];
}

export function SalesCashFlowChartWidget({ data }: SalesCashFlowChartProps) {
  const [activeTab, setActiveTab] = useState<"omzet" | "kas">("omzet");

  const totalOmzetPeriod = data.reduce((acc, curr) => acc + curr.omzet, 0);
  const totalKasMasuk = data.reduce((acc, curr) => acc + curr.kasMasuk, 0);
  const totalKasKeluar = data.reduce((acc, curr) => acc + curr.kasKeluar, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-outline-variant/40 rounded-xl p-3 shadow-lg text-xs">
          <p className="font-bold text-on-surface mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-on-surface">
                {entry.name.includes("Transaksi") ? `${entry.value} nota` : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Tren Penjualan & Arus Kas (7 Hari Terakhir)
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            {activeTab === "omzet"
              ? `Total 7 Hari: ${formatCurrency(totalOmzetPeriod)}`
              : `Masuk: ${formatCurrency(totalKasMasuk)} | Keluar: ${formatCurrency(totalKasKeluar)}`}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("omzet")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "omzet"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Omzet Penjualan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kas")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "kas"
                ? "bg-surface text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Arus Kas Masuk / Keluar
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[260px]">
        {activeTab === "omzet" ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c480a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1c480a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="omzet"
                name="Omzet Penjualan"
                stroke="#1c480a"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#omzetGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="kasMasuk" name="Kas Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kasKeluar" name="Kas Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

