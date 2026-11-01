"use client";

import Link from "next/link";
import { Wallet, Landmark, Banknote, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RekeningItem {
  id: number;
  kode: string;
  nama: string;
  jenis: string;
  saldo: number;
  id_cabang: number;
  nama_cabang: string | null;
}

interface CashLiquidityProps {
  data: RekeningItem[];
}

export function CashLiquidityWidget({ data }: CashLiquidityProps) {
  const totalSaldo = data.reduce((acc, curr) => acc + Number(curr.saldo || 0), 0);

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Landmark className="w-4 h-4 text-secondary" />
            Likuiditas Rekening Kas & Bank
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Total Likuid: <span className="font-bold text-on-surface font-mono">{formatCurrency(totalSaldo)}</span>
          </p>
        </div>
        <Link
          href="/kas/rekening"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Kelola Rekening</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Accounts */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[260px] pr-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/60 text-xs">
            Belum ada data rekening kas aktif.
          </div>
        ) : (
          data.map((rek) => (
            <div
              key={rek.id}
              className="p-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 flex items-center justify-between gap-3 text-xs hover:border-outline-variant/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-surface border border-outline-variant/30 text-secondary shrink-0">
                  {rek.jenis === "BANK" ? (
                    <Landmark className="w-4 h-4" />
                  ) : (
                    <Banknote className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface truncate">{rek.nama}</p>
                  <p className="text-[10px] text-on-surface-variant/70">
                    {rek.nama_cabang || "Pusat"} &bull; <span className="font-mono">{rek.kode}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-mono font-extrabold text-sm text-on-surface">
                  {formatCurrency(rek.saldo)}
                </p>
                <span className="text-[10px] font-semibold text-on-surface-variant/70 uppercase">
                  {rek.jenis.replace("_", " ")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

