"use client";

import {
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Scale,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KpiStatsProps {
  data: {
    omzet: number;
    omzetKemarin?: number;
    growthPercent?: number;
    totalTransaksi?: number;
    basketSize?: number;
    marginKotor: number;
    marginKotorPercent?: number;
    bebanOperasional?: number;
    labaBersih?: number;
    marginBersihPercent?: number;
    totalSaldoKasBank?: number;
  };
}

export function KpiStatsWidget({ data }: KpiStatsProps) {
  const omzet = data.omzet || 0;
  const marginKotor = data.marginKotor || 0;
  const bebanOperasional = data.bebanOperasional || 0;
  const labaBersih = data.labaBersih !== undefined ? data.labaBersih : marginKotor - bebanOperasional;

  const marginKotorPercent =
    data.marginKotorPercent !== undefined
      ? data.marginKotorPercent
      : omzet > 0
      ? Number(((marginKotor / omzet) * 100).toFixed(1))
      : 0;

  const marginBersihPercent =
    data.marginBersihPercent !== undefined
      ? data.marginBersihPercent
      : omzet > 0
      ? Number(((labaBersih / omzet) * 100).toFixed(1))
      : 0;

  const growthPercent = data.growthPercent ?? 0;
  const isPositiveGrowth = growthPercent >= 0;
  const isPositiveNetProfit = labaBersih >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Omzet Penjualan */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span>Omset Penjualan</span>
            </p>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl xl:text-3xl font-extrabold text-on-surface mt-2 font-mono">
            {formatCurrency(omzet)}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span
              className={`flex items-center font-bold px-1.5 py-0.5 rounded text-[11px] ${
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
              {Math.abs(growthPercent)}%
            </span>
            <span className="text-on-surface-variant/70 text-[11px]">vs periode lalu</span>
          </div>
          {data.totalTransaksi !== undefined && (
            <span className="text-on-surface-variant/70 text-[11px] flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {data.totalTransaksi} nota
            </span>
          )}
        </div>
      </div>

      {/* 2. Laba Kotor */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span>Laba Kotor (Gross)</span>
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl xl:text-3xl font-extrabold text-on-surface mt-2 font-mono">
            {formatCurrency(marginKotor)}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant/70 text-[11px]">Margin Kotor:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs px-2 py-0.5 bg-emerald-500/10 rounded-md">
            {marginKotorPercent}%
          </span>
        </div>
      </div>

      {/* 3. Margin Usaha (Kotor & Bersih) */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span>Rasio Margin</span>
            </p>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <p className="text-2xl xl:text-3xl font-extrabold text-on-surface font-mono">
                {marginKotorPercent}%
              </p>
              <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider">Gross</p>
            </div>
            <span className="text-on-surface-variant/40 text-xl font-light">/</span>
            <div>
              <p
                className={`text-2xl xl:text-3xl font-extrabold font-mono ${
                  isPositiveNetProfit
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {marginBersihPercent}%
              </p>
              <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider">Net</p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-1.5">
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden flex">
            <div
              className="bg-primary h-1.5 rounded-l-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, marginKotorPercent))}%` }}
              title={`Gross Margin: ${marginKotorPercent}%`}
            />
            <div
              className={`h-1.5 transition-all duration-500 ${
                isPositiveNetProfit ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, Math.abs(marginBersihPercent)))}%` }}
              title={`Net Margin: ${marginBersihPercent}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70">
            <span>Efisiensi: {marginBersihPercent >= 15 ? "Sehat" : marginBersihPercent >= 5 ? "Normal" : "Perlu Optimasi"}</span>
            <span className="font-mono">Beban: {formatCurrency(bebanOperasional)}</span>
          </div>
        </div>
      </div>

      {/* 4. Laba Bersih */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span>Laba Bersih (Net)</span>
            </p>
            <div
              className={`p-2 rounded-xl ${
                isPositiveNetProfit
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl xl:text-3xl font-extrabold mt-2 font-mono ${
              isPositiveNetProfit
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(labaBersih)}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant/70 text-[11px]">Net Profit Margin:</span>
          <span
            className={`font-bold font-mono text-xs px-2 py-0.5 rounded-md ${
              isPositiveNetProfit
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {marginBersihPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
