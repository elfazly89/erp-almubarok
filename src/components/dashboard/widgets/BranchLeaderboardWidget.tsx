"use client";

import Link from "next/link";
import { Building2, Trophy, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BranchLeaderboardItem {
  id_cabang: number | null;
  nama_cabang: string;
  omzet: number;
  transaksi: number;
  persen: number;
}

interface BranchLeaderboardProps {
  data: BranchLeaderboardItem[];
}

export function BranchLeaderboardWidget({ data }: BranchLeaderboardProps) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Leaderboard Cabang
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">Kontribusi omzet antartoko</p>
        </div>
        <Link
          href="/akuntansi/profit-cabang"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>Profit Cabang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[260px] pr-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/60 text-xs">
            Belum ada transaksi cabang pada periode ini
          </div>
        ) : (
          data.map((item, index) => {
            const rankColors = [
              "bg-amber-500 text-white font-bold",
              "bg-slate-400 text-white font-bold",
              "bg-amber-700 text-white font-bold",
              "bg-surface-container-high text-on-surface font-medium",
            ];
            const rankBadge = rankColors[index] || rankColors[3];

            return (
              <div key={item.id_cabang ?? index} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${rankBadge}`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold text-on-surface truncate">
                      {item.nama_cabang}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-on-surface">
                      {formatCurrency(item.omzet)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/70 ml-1.5">
                      ({item.transaksi} nota)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, item.persen))}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

