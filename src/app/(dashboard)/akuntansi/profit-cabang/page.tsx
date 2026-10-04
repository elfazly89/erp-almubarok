"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Calendar,
  Building2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  FileText,
  CheckCircle2,
  HelpCircle,
  Database,
  Scale
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { useAppSettings } from "@/components/providers/AppSettingsProvider";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

// Interfaces
interface Cabang {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
}

interface ProfitData {
  pos: {
    penjualan_bruto: number;
    diskon: number;
    penjualan_bersih: number;
    hpp: number;
    laba_kotor: number;
    beban_operasional: number;
    laba_operasional: number;
    margin_kotor: number;
    margin_operasional: number;
    jumlah_transaksi: number;
    avg_transaksi: number;
  };
  jurnal: {
    penjualan_bruto: number;
    diskon_retur: number;
    penjualan_bersih: number;
    hpp: number;
    laba_kotor: number;
    beban_operasional: number;
    laba_operasional: number;
    pendapatan_non_operasional: number;
    beban_non_operasional: number;
    laba_sebelum_pajak: number;
    margin_kotor: number;
    margin_operasional: number;
    margin_bersih: number;
  };
}

interface BranchProfitRow {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  penjualan_bersih: number;
  hpp: number;
  laba_kotor: number;
  beban_operasional: number;
  laba_operasional: number;
  margin_kotor: number;
  margin_operasional: number;
}

interface ReconciliationRow {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  sales_pos: number;
  sales_jurnal: number;
  selisih_sales: number;
  hpp_pos: number;
  hpp_jurnal: number;
  selisih_hpp: number;
  status: "COCOK" | "PERLU REKONSILIASI";
}

const MULTI_BRANCH_JABATANS = [1, 2, 4, 8, 11]; // Super User, IT, Bendahara, Manager, SPV

export default function ProfitCabangPage() {
  const { can_read, loading: permissionsLoading } = useMenuPermissions();
  const { settings } = useAppSettings();

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedCabangId, setSelectedCabangId] = useState<string>("");

  // Mode Selection: pos (Operasional) vs jurnal (Finansial)
  const [viewMode, setViewMode] = useState<"pos" | "jurnal">("pos");

  // User details & options
  const [user, setUser] = useState<any>(null);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [canAccessMultiBranch, setCanAccessMultiBranch] = useState(false);

  // Stats & Loadings
  const [profitSummary, setProfitSummary] = useState<ProfitData | null>(null);
  const [branchProfitList, setBranchProfitList] = useState<BranchProfitRow[]>([]);
  const [reconciliationList, setReconciliationList] = useState<ReconciliationRow[]>([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<keyof BranchProfitRow>("penjualan_bersih");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch logged-in user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.user) {
            setUser(result.user);
            const isMulti = MULTI_BRANCH_JABATANS.includes(result.user.id_jabatan);
            setCanAccessMultiBranch(isMulti);
            if (!isMulti && result.user.id_cabang) {
              setSelectedCabangId(result.user.id_cabang.toString());
            }
          }
        }
      } catch (e) {
        console.error("Gagal memuat profil pengguna", e);
      }
    };
    fetchUser();
  }, []);

  // Fetch branches for dropdown if multi-branch
  useEffect(() => {
    const fetchCabang = async () => {
      try {
        const res = await fetch("/api/cabang");
        if (res.ok) {
          const data = await res.json();
          setCabangList(data);
        }
      } catch (e) {
        console.error("Gagal memuat daftar cabang", e);
      }
    };
    if (canAccessMultiBranch) {
      fetchCabang();
    }
  }, [canAccessMultiBranch]);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    setLoadingStats(true);
    setErrorMsg("");
    try {
      const qParams = `startDate=${startDate}&endDate=${endDate}&id_cabang=${selectedCabangId}`;
      
      const [sumRes, branchRes, reconRes] = await Promise.all([
        fetch(`/api/akuntansi/dashboard-profit?${qParams}`),
        fetch(`/api/akuntansi/dashboard-profit/cabang?${qParams}`),
        fetch(`/api/akuntansi/dashboard-profit/rekonsiliasi?${qParams}`)
      ]);

      if (sumRes.ok && branchRes.ok && reconRes.ok) {
        const sumJson = await sumRes.json();
        const branchJson = await branchRes.json();
        const reconJson = await reconRes.json();

        if (sumJson.success) setProfitSummary(sumJson.data);
        if (branchJson.success) setBranchProfitList(branchJson.data);
        if (reconJson.success) setReconciliationList(reconJson.data);
      } else {
        throw new Error("Gagal mengambil data dari server");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Gagal memproses data profitabilitas");
    } finally {
      setLoadingStats(false);
    }
  }, [startDate, endDate, selectedCabangId]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Date Filters Presets
  const setDatePreset = (preset: "today" | "week" | "month" | "year") => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === "today") {
      start = today;
    } else if (preset === "week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(today.setDate(diff));
    } else if (preset === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === "year") {
      start = new Date(today.getFullYear(), 0, 1);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // Sorting Handler
  const handleSort = (field: keyof BranchProfitRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortedBranches = () => {
    const list = [...branchProfitList];
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return list;
  };

  const sortedBranches = getSortedBranches();

  // Check if any branch needs reconciliation
  const needsReconciliationCount = reconciliationList.filter(r => r.status === "PERLU REKONSILIASI").length;

  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <AlertTriangle className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk melihat halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-on-background print:space-y-4 print:text-black font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Scale className="w-7 h-7 text-primary" /> Dashboard Profit & Rekonsiliasi Cabang
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Analisis profitabilitas, HPP, margin laba kotor, dan verifikasi silang POS vs Akuntansi
          </p>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex items-center bg-surface-container-low border border-outline-variant p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setViewMode("pos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              viewMode === "pos"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS (Operasional)
          </button>
          <button
            onClick={() => setViewMode("jurnal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              viewMode === "jurnal"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Akuntansi (Jurnal)
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-surface-container/60 p-4 border border-outline-variant/40 rounded-2xl flex flex-wrap items-center gap-4 print:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface-variant">Periode:</span>
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "Minggu Ini" },
              { id: "month", label: "Bulan Ini" },
              { id: "year", label: "Tahun Ini" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id)}
              className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
          <span className="text-on-surface-variant/60 text-xs">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
          />
        </div>

        {/* Cabang dropdown for Multi-branch allowed users */}
        {canAccessMultiBranch && (
          <div className="flex items-center gap-2 ml-auto">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-on-surface-variant">Cabang:</span>
            <select
              value={selectedCabangId}
              onChange={(e) => setSelectedCabangId(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs min-w-[150px] focus:outline-none"
            >
              <option value="">Semua Cabang</option>
              {cabangList.map((cab) => (
                <option key={cab.id_cabang} value={cab.id_cabang}>
                  {cab.nama_cabang}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingStats ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="text-xs">Menghitung profitabilitas & konsistensi data cabang...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {errorMsg && (
            <div className="bg-error/15 border border-error/25 text-error text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-error" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reconciliation Alert Box */}
          {needsReconciliationCount > 0 && (
            <div className="bg-warning/15 border border-warning/35 text-on-surface rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-warning/20 text-warning mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Terdeteksi Perbedaan Data POS vs Jurnal Akuntansi</h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Terdapat {needsReconciliationCount} cabang yang memiliki perbedaan pencatatan antara transaksi kasir (POS) dan posting jurnal. Mohon lakukan rekonsiliasi data keuangan.
                  </p>
                </div>
              </div>
              <a
                href="#reconciliation-table"
                className="bg-warning/25 hover:bg-warning/35 border border-warning/30 px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 self-start md:self-auto transition-colors font-mono"
              >
                Lihat Selisih <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* KPI Summary Cards Grid */}
          {profitSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Penjualan Bersih */}
              <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Penjualan Bersih</span>
                  <strong className="text-lg font-bold block text-primary font-mono mt-1">
                    {formatCurrency(viewMode === "pos" ? profitSummary.pos.penjualan_bersih : profitSummary.jurnal.penjualan_bersih)}
                  </strong>
                  <span className="text-[9px] text-on-surface-variant/80 mt-1 block">
                    Bruto: {formatCurrency(viewMode === "pos" ? profitSummary.pos.penjualan_bruto : profitSummary.jurnal.penjualan_bruto)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: HPP (Operational / Journal) */}
              <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Harga Pokok Penjualan (HPP)</span>
                  <strong className="text-lg font-bold block text-on-surface font-mono mt-1">
                    {formatCurrency(viewMode === "pos" ? profitSummary.pos.hpp : profitSummary.jurnal.hpp)}
                  </strong>
                  <span className="text-[9px] text-on-surface-variant/80 mt-1 block">
                    Sumber: {viewMode === "pos" ? "POS (Real-time)" : "Akuntansi (Jurnal)"}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface-variant">
                  <Database className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Laba Kotor */}
              <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Laba Kotor</span>
                  <strong className="text-lg font-bold block text-primary font-mono mt-1">
                    {formatCurrency(viewMode === "pos" ? profitSummary.pos.laba_kotor : profitSummary.jurnal.laba_kotor)}
                  </strong>
                  <span className="text-[9px] text-primary/80 font-bold mt-1 block font-mono">
                    Margin: {viewMode === "pos" ? profitSummary.pos.margin_kotor.toFixed(1) : profitSummary.jurnal.margin_kotor.toFixed(1)}%
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Laba Operasional */}
              <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Laba Operasional</span>
                  <strong className="text-lg font-bold block text-primary font-mono mt-1">
                    {formatCurrency(viewMode === "pos" ? profitSummary.pos.laba_operasional : profitSummary.jurnal.laba_operasional)}
                  </strong>
                  <span className="text-[9px] text-primary/80 font-bold mt-1 block font-mono">
                    Beban: {formatCurrency(viewMode === "pos" ? profitSummary.pos.beban_operasional : profitSummary.jurnal.beban_operasional)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

            </div>
          )}

          {/* Visual Charts & Stats */}
          {branchProfitList.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart: Laba per Cabang */}
              <div className="lg:col-span-2 bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" /> Performa Omzet & Laba per Cabang
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchProfitList}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="nama_cabang" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `Rp ${v/1000000}M`} tick={{ fontSize: 10 }} />
                      <ChartTooltip formatter={(v) => formatCurrency(v as number)} />
                      <Legend />
                      <Bar dataKey="penjualan_bersih" fill="var(--color-primary, #1c480a)" name="Penjualan Bersih" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="laba_operasional" fill="var(--color-secondary, #914d00)" name="Laba Operasional" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Extra Stats Card */}
              <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-primary" /> Statistik Tambahan ({viewMode === "pos" ? "POS" : "Jurnal"})
                </h3>
                
                {viewMode === "pos" ? (
                  <div className="space-y-4 font-mono">
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Jumlah Transaksi POS</span>
                      <span className="text-xs font-bold text-on-surface">{profitSummary?.pos.jumlah_transaksi} kali</span>
                    </div>
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Avg Transaction Value</span>
                      <span className="text-xs font-bold text-on-surface">{formatCurrency(profitSummary?.pos.avg_transaksi || 0)}</span>
                    </div>
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Gross Profit Margin (%)</span>
                      <span className="text-xs font-bold text-primary">{profitSummary?.pos.margin_kotor.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-on-surface-variant">Operating Margin (%)</span>
                      <span className="text-xs font-bold text-primary">{profitSummary?.pos.margin_operasional.toFixed(2)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 font-mono">
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Pendapatan Non-Op</span>
                      <span className="text-xs font-bold text-primary">+{formatCurrency(profitSummary?.jurnal.pendapatan_non_operasional || 0)}</span>
                    </div>
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Beban Non-Op</span>
                      <span className="text-xs font-bold text-error">-{formatCurrency(profitSummary?.jurnal.beban_non_operasional || 0)}</span>
                    </div>
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Gross Margin</span>
                      <span className="text-xs font-bold text-primary">{profitSummary?.jurnal.margin_kotor.toFixed(2)}%</span>
                    </div>
                    <div className="border-b border-outline-variant/20 pb-3 flex justify-between">
                      <span className="text-xs text-on-surface-variant">Operating Margin</span>
                      <span className="text-xs font-bold text-primary">{profitSummary?.jurnal.margin_operasional.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-on-surface-variant">Net Margin (%)</span>
                      <span className="text-xs font-bold text-primary">{profitSummary?.jurnal.margin_bersih.toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Ranking & Branches Table */}
          <div className="bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-on-surface">Tabel Laba Rugi Cabang</h3>
                <p className="text-[11px] text-on-surface-variant">Klik kolom header untuk mengurutkan data cabang</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40">
                    <th onClick={() => handleSort("nama_cabang")} className="px-5 py-3 text-on-surface-variant cursor-pointer hover:text-primary">Cabang</th>
                    <th onClick={() => handleSort("penjualan_bersih")} className="px-5 py-3 text-on-surface-variant text-right cursor-pointer hover:text-primary">Penjualan Bersih</th>
                    <th onClick={() => handleSort("hpp")} className="px-5 py-3 text-on-surface-variant text-right cursor-pointer hover:text-primary">HPP (POS)</th>
                    <th onClick={() => handleSort("laba_kotor")} className="px-5 py-3 text-on-surface-variant text-right cursor-pointer hover:text-primary">Laba Kotor</th>
                    <th onClick={() => handleSort("beban_operasional")} className="px-5 py-3 text-on-surface-variant text-right cursor-pointer hover:text-primary">Beban Op (Jurnal)</th>
                    <th onClick={() => handleSort("laba_operasional")} className="px-5 py-3 text-on-surface-variant text-right cursor-pointer hover:text-primary">Laba Operasional</th>
                    <th onClick={() => handleSort("margin_operasional")} className="px-5 py-3 text-on-surface-variant text-right cursor-pointer hover:text-primary">Op Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-mono">
                  {sortedBranches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant">Belum ada data profit untuk cabang.</td>
                    </tr>
                  ) : (
                    sortedBranches.map((item) => (
                      <tr key={item.id_cabang} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="px-5 py-3.5 font-sans font-bold text-on-surface">{item.nama_cabang}</td>
                        <td className="px-5 py-3.5 text-right text-on-surface font-semibold">{formatCurrency(item.penjualan_bersih)}</td>
                        <td className="px-5 py-3.5 text-right text-on-surface-variant">{formatCurrency(item.hpp)}</td>
                        <td className="px-5 py-3.5 text-right text-primary font-bold">{formatCurrency(item.laba_kotor)}</td>
                        <td className="px-5 py-3.5 text-right text-error">{formatCurrency(item.beban_operasional)}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${item.laba_operasional >= 0 ? "text-primary" : "text-error"}`}>
                          {formatCurrency(item.laba_operasional)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-on-surface font-semibold">{item.margin_operasional.toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reconciliation Table Segment */}
          <div id="reconciliation-table" className="bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Rekonsiliasi & Konsistensi Data (POS vs Jurnal)
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Verifikasi silang nominal penjualan dan HPP antara data operasional POS dan jurnal akuntansi
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40">
                    <th className="px-5 py-3 text-on-surface-variant">Cabang</th>
                    <th className="px-5 py-3 text-on-surface-variant text-right">Penjualan POS</th>
                    <th className="px-5 py-3 text-on-surface-variant text-right">Penjualan Jurnal</th>
                    <th className="px-5 py-3 text-on-surface-variant text-right">Selisih Sales</th>
                    <th className="px-5 py-3 text-on-surface-variant text-right">HPP POS</th>
                    <th className="px-5 py-3 text-on-surface-variant text-right">HPP Jurnal</th>
                    <th className="px-5 py-3 text-on-surface-variant text-right">Selisih HPP</th>
                    <th className="px-5 py-3 text-on-surface-variant text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-mono">
                  {reconciliationList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-on-surface-variant">Belum ada data rekonsiliasi.</td>
                    </tr>
                  ) : (
                    reconciliationList.map((item) => (
                      <tr key={item.id_cabang} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="px-5 py-3.5 font-sans font-bold text-on-surface">{item.nama_cabang}</td>
                        <td className="px-5 py-3.5 text-right text-on-surface">{formatCurrency(item.sales_pos)}</td>
                        <td className="px-5 py-3.5 text-right text-on-surface">{formatCurrency(item.sales_jurnal)}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${item.selisih_sales === 0 ? "text-primary" : "text-error"}`}>
                          {formatCurrency(item.selisih_sales)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-on-surface">{formatCurrency(item.hpp_pos)}</td>
                        <td className="px-5 py-3.5 text-right text-on-surface">{formatCurrency(item.hpp_jurnal)}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${item.selisih_hpp === 0 ? "text-primary" : "text-error"}`}>
                          {formatCurrency(item.selisih_hpp)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-sans ${
                            item.status === "COCOK"
                              ? "bg-primary/10 text-primary"
                              : "bg-error/10 text-error"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
