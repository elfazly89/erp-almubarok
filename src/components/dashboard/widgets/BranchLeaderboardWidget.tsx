"use client";

import Link from "next/link";
import { Trophy, AlertTriangle, ArrowRight, Building2, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface BranchLeaderboardItem {
  id_cabang: number | null;
  nama_cabang: string;
  omzet: number;
  transaksi: number;
  persen: number;
}

interface BranchLeaderboardProps {
  data: BranchLeaderboardItem[];
  top3?: BranchLeaderboardItem[];
  bottom3?: BranchLeaderboardItem[];
}

export function BranchLeaderboardWidget({ data, top3, bottom3 }: BranchLeaderboardProps) {
  const sorted = [...data].sort((a, b) => b.omzet - a.omzet);
  const topBranches = top3 && top3.length > 0 ? top3 : sorted.slice(0, 3);
  const bottomBranches =
    bottom3 && bottom3.length > 0
      ? bottom3
      : sorted.length > 3
      ? [...sorted.slice(-3)].reverse()
      : [];

  const totalOmzetAll = sorted.reduce((acc, curr) => acc + curr.omzet, 0);

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-outline-variant/20">
        <div>
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Performa Penjualan Cabang</span>
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Komparasi 3 cabang omset tertinggi dan 3 cabang omset terendah pada periode aktif
          </p>
        </div>
        <Link
          href="/akuntansi/profit-cabang"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-xl transition-colors"
        >
          <span>Detail Profit Cabang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant/60 text-xs">
          Belum ada data transaksi cabang pada periode ini
        </div>
      ) : (
        /* Split Grid: 2 Kolom Berdampingan */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          {/* Panel Kiri: 3 Cabang Omset Tertinggi */}
          <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  3 Cabang Omset Tertinggi
                </span>
                <span className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70">
                  Performa Terbaik
                </span>
              </div>

              <div className="space-y-3.5">
                {topBranches.map((item, index) => {
                  const rankBadges = [
                    "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs font-bold",
                    "bg-gradient-to-r from-slate-400 to-slate-500 text-white font-bold",
                    "bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold",
                  ];
                  const rankBadge = rankBadges[index] || "bg-primary/20 text-primary font-bold";

                  return (
                    <div
                      key={`top-${item.id_cabang ?? index}`}
                      className="p-3 rounded-xl bg-surface border border-outline-variant/30 space-y-2 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${rankBadge}`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-bold text-on-surface truncate">
                            {item.nama_cabang}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.omzet)}
                          </span>
                        </div>
                      </div>

                      {/* Bar & Keterangan */}
                      <div className="space-y-1">
                        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(3, item.persen))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70">
                          <span>Kontribusi: <strong className="text-on-surface">{item.persen}%</strong> dari total</span>
                          <span>{item.transaksi} nota kasir</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Subtotal Top 3:</span>
              <span className="font-mono font-bold text-on-surface">
                {formatCurrency(topBranches.reduce((acc, curr) => acc + curr.omzet, 0))}
              </span>
            </div>
          </div>

          {/* Panel Kanan: 3 Cabang Omset Terendah */}
          <div className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  3 Cabang Omset Terendah
                </span>
                <span className="text-[10px] font-medium text-rose-600/70 dark:text-rose-400/70">
                  Perlu Perhatian & Evaluasi
                </span>
              </div>

              {bottomBranches.length === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant/70 rounded-xl bg-surface border border-outline-variant/30">
                  <Store className="w-6 h-6 mx-auto mb-2 text-on-surface-variant/40" />
                  Seluruh cabang ({sorted.length}) telah tampil pada kolom performa di sebelah kiri.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {bottomBranches.map((item, index) => {
                    const originalRank = sorted.findIndex((s) => s.id_cabang === item.id_cabang) + 1;

                    return (
                      <div
                        key={`bot-${item.id_cabang ?? index}`}
                        className="p-3 rounded-xl bg-surface border border-outline-variant/30 space-y-2 hover:border-rose-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                              #{originalRank > 0 ? originalRank : sorted.length - index}
                            </span>
                            <span className="font-bold text-on-surface truncate">
                              {item.nama_cabang}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400">
                              {formatCurrency(item.omzet)}
                            </span>
                          </div>
                        </div>

                        {/* Bar & Keterangan */}
                        <div className="space-y-1">
                          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(3, item.persen))}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70">
                            <span>Kontribusi: <strong className="text-on-surface">{item.persen}%</strong> dari total</span>
                            <span>{item.transaksi} nota kasir</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {bottomBranches.length > 0 && (
              <div className="mt-4 pt-3 border-t border-rose-500/15 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Subtotal Bottom 3:</span>
                <span className="font-mono font-bold text-on-surface">
                  {formatCurrency(bottomBranches.reduce((acc, curr) => acc + curr.omzet, 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
