"use client";

import Link from "next/link";
import { UserCheck, Clock, Wallet, ArrowRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface CashierShiftItem {
  id: number;
  id_kasir: number;
  nama_kasir: string;
  id_cabang: number;
  nama_cabang: string;
  nama_rekening: string;
  waktu_buka: string;
  saldo_awal: number;
  total_tunai: number;
  total_transfer: number;
  total_sistem: number;
  saldo_laci_saat_ini: number;
}

interface ActiveCashierShiftsProps {
  data: CashierShiftItem[];
}

export function ActiveCashierShiftsWidget({ data }: ActiveCashierShiftsProps) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Status Shift Kasir & Uang Laci
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Kasir aktif bertugas dan pantauan posisi kas fisik laci
          </p>
        </div>
        <Link
          href="/hrd/shift-kasir"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Shift Kasir</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/60 text-xs">
            Saat ini tidak ada sesi shift kasir yang sedang buka (OPEN).
          </div>
        ) : (
          data.map((shift) => (
            <div
              key={shift.id}
              className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-on-surface text-sm">
                    {shift.nama_kasir}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    OPEN
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant/80 mt-1 text-[11px]">
                  <span>Cabang: <b>{shift.nama_cabang}</b></span>
                  <span>&bull; {shift.nama_rekening}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-on-surface-variant/60" />
                    {shift.waktu_buka.slice(11, 16) || shift.waktu_buka}
                  </span>
                </div>
              </div>

              <div className="sm:text-right shrink-0 bg-surface sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-outline-variant/20">
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">
                  Kas Fisik di Laci
                </p>
                <p className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(shift.saldo_laci_saat_ini)}
                </p>
                <p className="text-[10px] text-on-surface-variant/60">
                  Modal: {formatCurrency(shift.saldo_awal)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

