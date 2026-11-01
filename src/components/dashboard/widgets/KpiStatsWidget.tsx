"use client";

import { DollarSign, Wallet, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KpiStatsProps {
  data: {
    omzet: number;
    omzetKemarin: number;
    growthPercent: number;
    totalTransaksi: number;
    basketSize: number;
    marginKotor: number;
    totalSaldoKasBank: number;
  };
}

export function KpiStatsWidget({ data }: KpiStatsProps) {
  const isPositiveGrowth = data.growthPercent >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Omzet Penjualan */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Omzet Penjualan
          </p>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl xl:text-3xl font-extrabold text-on-surface mt-2 font-mono">
          {formatCurrency(data.omzet)}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span
            className={`flex items-center font-bold px-1.5 py-0.5 rounded ${
              isPositiveGrowth
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPositiveGrowth ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {Math.abs(data.growthPercent)}%
          </span>
          <span className="text-on-surface-variant/70">vs hari kemarin</span>
        </div>
      </div>

      {/* 2. Total Likuiditas Kas & Bank */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Likuiditas Kas & Bank
          </p>
          <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl xl:text-3xl font-extrabold text-on-surface mt-2 font-mono">
          {formatCurrency(data.totalSaldoKasBank)}
        </p>
        <p className="text-xs text-on-surface-variant/70 mt-2">
          Saldo riil lintas toko & rekening
        </p>
      </div>

      {/* 3. Estimasi Margin Kotor */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Estimasi Laba Kotor
          </p>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl xl:text-3xl font-extrabold text-on-surface mt-2 font-mono">
          {formatCurrency(data.marginKotor)}
        </p>
        <p className="text-xs text-on-surface-variant/70 mt-2">
          Margin ~
          {data.omzet > 0
            ? `${Math.round((data.marginKotor / data.omzet) * 100)}% dari penjualan`
            : "0%"}
        </p>
      </div>

      {/* 4. Transaksi & Rata-rata Belanja */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Aktivitas Kasir
          </p>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl xl:text-3xl font-extrabold text-on-surface mt-2 font-mono">
          {data.totalTransaksi} <span className="text-sm font-sans font-normal text-on-surface-variant">nota</span>
        </p>
        <p className="text-xs text-on-surface-variant/70 mt-2">
          Basket size: <span className="font-semibold text-on-surface font-mono">{formatCurrency(data.basketSize)}</span>/nota
        </p>
      </div>
    </div>
  );
}

