"use client";

import { Building2, Calendar, RefreshCw, SlidersHorizontal } from "lucide-react";

interface CabangOption {
  id_cabang: number;
  nama_cabang: string;
}

interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
  cabangList: CabangOption[];
  selectedCabang: string;
  onCabangChange: (cabangId: string) => void;
  isBranchLocked: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  onOpenManageWidgets: () => void;
}

export function DashboardHeader({
  userName,
  userRole,
  cabangList,
  selectedCabang,
  onCabangChange,
  isBranchLocked,
  selectedPeriod,
  onPeriodChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenManageWidgets,
}: DashboardHeaderProps) {
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
      {/* Title & Greeting */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Pusat Kendali ERP
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {userRole || "User"}
          </span>
        </div>
        <p className="text-on-surface-variant text-sm mt-1">
          Selamat datang, <span className="font-semibold text-primary">{userName}</span> &bull; {todayFormatted}
          {lastUpdated && (
            <span className="text-xs text-on-surface-variant/60 ml-2">
              (Pembaruan: {lastUpdated})
            </span>
          )}
        </p>
      </div>

      {/* Global Control Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Cabang Filter */}
        <div className="flex items-center gap-1.5 bg-surface border border-outline-variant/40 rounded-xl px-3 py-1.5 shadow-xs">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedCabang}
            onChange={(e) => onCabangChange(e.target.value)}
            disabled={isBranchLocked}
            className="bg-transparent text-sm font-medium text-on-surface focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
          >
            {!isBranchLocked && (
              <option value="all">Semua Cabang (Konsolidasi)</option>
            )}
            {cabangList.map((c) => (
              <option key={c.id_cabang} value={String(c.id_cabang)}>
                {c.nama_cabang}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1.5 bg-surface border border-outline-variant/40 rounded-xl px-3 py-1.5 shadow-xs">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="bg-transparent text-sm font-medium text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="this_month">Bulan Ini</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Segarkan Data Real-Time"
          className="p-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
        </button>

        {/* Manage Widgets Button */}
        <button
          onClick={onOpenManageWidgets}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container shadow-xs transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Atur Widget</span>
        </button>
      </div>
    </div>
  );
}

