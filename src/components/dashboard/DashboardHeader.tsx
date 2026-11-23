"use client";

import { useState } from "react";
import { Building2, Calendar, RefreshCw, SlidersHorizontal, ArrowRight, AlertCircle, X, Check } from "lucide-react";

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
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  activePeriodLabel?: string;
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
  customStartDate,
  customEndDate,
  onCustomDateChange,
  activePeriodLabel,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenManageWidgets,
}: DashboardHeaderProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(customStartDate);
  const [tempEnd, setTempEnd] = useState(customEndDate);
  const [validationError, setValidationError] = useState("");

  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleApplyCustomDate = () => {
    if (!tempStart || !tempEnd) {
      setValidationError("Tanggal mulai dan tanggal selesai wajib diisi.");
      return;
    }
    const s = new Date(tempStart);
    const e = new Date(tempEnd);
    if (s > e) {
      setValidationError("Tanggal mulai tidak boleh lebih besar dari tanggal selesai.");
      return;
    }
    const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 366) {
      setValidationError(`Rentang waktu terpilih ${diffDays} hari. Maksimal rentang adalah 365 hari (1 tahun).`);
      return;
    }

    setValidationError("");
    onCustomDateChange(tempStart, tempEnd);
    onPeriodChange("custom");
    setShowCustomModal(false);
  };

  const handlePeriodSelect = (val: string) => {
    if (val === "custom") {
      setTempStart(customStartDate);
      setTempEnd(customEndDate);
      setValidationError("");
      setShowCustomModal(true);
    } else {
      setShowCustomModal(false);
      onPeriodChange(val);
    }
  };

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

        {/* Timeframe Filter Dropdown */}
        <div className="flex items-center gap-1.5 bg-surface border border-outline-variant/40 rounded-xl px-3 py-1.5 shadow-xs">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodSelect(e.target.value)}
            className="bg-transparent text-sm font-medium text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini (YTD)</option>
            <option value="1year">1 Tahun Terakhir (365 Hari)</option>
            <option value="custom">📅 Rentang Kustom (Maks 1 Thn)...</option>
          </select>
        </div>

        {/* Active Custom Range Button Indicator */}
        {selectedPeriod === "custom" && (
          <button
            type="button"
            onClick={() => {
              setTempStart(customStartDate);
              setTempEnd(customEndDate);
              setValidationError("");
              setShowCustomModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-all shadow-xs cursor-pointer font-mono"
            title="Klik untuk mengubah rentang tanggal kustom"
          >
            <span>{customStartDate} &rarr; {customEndDate}</span>
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Segarkan Data Real-Time"
          className="p-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
        </button>

        {/* Manage Widgets Button */}
        <button
          onClick={onOpenManageWidgets}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container shadow-xs transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Atur Widget</span>
        </button>
      </div>

      {/* Popover / Modal Rentang Tanggal Kustom (Maksimal 1 Tahun) */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <Calendar className="w-5 h-5" />
                <span>Pilih Rentang Tanggal Kustom</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Tentukan periode tanggal mulai dan selesai lintas bulan. Maksimal rentang waktu adalah <strong>365 hari (1 tahun)</strong>.
            </p>

            {validationError && (
              <div className="bg-error/15 border border-error/25 text-error text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Dari Tanggal (Mulai)
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Sampai Tanggal (Selesai)
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Quick preset chips inside modal */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-on-surface-variant block mb-1.5">
                Preset Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = new Date(now);
                    d.setDate(now.getDate() - 29);
                    setTempStart(d.toISOString().slice(0, 10));
                    setTempEnd(now.toISOString().slice(0, 10));
                  }}
                  className="text-[11px] bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
                >
                  30 Hari Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = new Date(now);
                    d.setDate(now.getDate() - 89);
                    setTempStart(d.toISOString().slice(0, 10));
                    setTempEnd(now.toISOString().slice(0, 10));
                  }}
                  className="text-[11px] bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
                >
                  3 Bulan Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = new Date(now);
                    d.setDate(now.getDate() - 179);
                    setTempStart(d.toISOString().slice(0, 10));
                    setTempEnd(now.toISOString().slice(0, 10));
                  }}
                  className="text-[11px] bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
                >
                  6 Bulan Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = new Date(now);
                    d.setDate(now.getDate() - 364);
                    setTempStart(d.toISOString().slice(0, 10));
                    setTempEnd(now.toISOString().slice(0, 10));
                  }}
                  className="text-[11px] bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
                >
                  1 Tahun Penuh
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyCustomDate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Rentang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

