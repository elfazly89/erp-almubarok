"use client";

import Link from "next/link";
import { Users, UserCheck, ArrowRight } from "lucide-react";

interface HrdAttendanceProps {
  data: {
    totalKaryawan: number;
    hadirCount: number;
    persentaseHadir: number;
  };
}

export function HrdAttendanceWidget({ data }: HrdAttendanceProps) {
  const belumHadir = Math.max(0, data.totalKaryawan - data.hadirCount);

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Presensi & Kehadiran Abdi Hari Ini
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Kedisiplinan presensi dan kehadiran staf toko & DC
          </p>
        </div>
        <Link
          href="/hrd/absensi"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Data Presensi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress & Stats */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold text-on-surface font-mono">
              {data.persentaseHadir}%
            </span>
            <p className="text-xs text-on-surface-variant mt-0.5">Tingkat Kehadiran</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-on-surface">
              <span className="text-primary font-bold">{data.hadirCount}</span> dari {data.totalKaryawan} Abdi
            </p>
            <p className="text-on-surface-variant/70">
              {belumHadir} belum / tidak hadir
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, data.persentaseHadir)}%` }}
          />
        </div>

        {/* Summary Chips */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <span className="text-on-surface-variant">Tercatat Hadir:</span>
            <span className="font-bold text-primary font-mono">{data.hadirCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <span className="text-on-surface-variant">Total Abdi:</span>
            <span className="font-bold text-on-surface font-mono">{data.totalKaryawan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

