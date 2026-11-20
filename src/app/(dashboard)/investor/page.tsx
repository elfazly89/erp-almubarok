"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Landmark,
  Wallet,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders,
  DollarSign,
  PieChart as PieIcon,
  ShieldAlert,
  Copy,
  Check,
  ChevronRight,
  ArrowUpRight,
  CreditCard,
  Layers,
  Sparkles,
  Award,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Users,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProfilInvestor {
  id: number;
  nama_investor: string;
  nomor_identitas?: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  nama_bank: string;
  nomor_rekening: string;
  atas_nama_rekening: string;
  nisbah_pengelola: string;
  nisbah_investor: string;
  saldo_modal_saat_ini: string;
  akumulasi_defisit: string;
  status: string;
}

interface RingkasanInvestor {
  saldo_modal_saat_ini: number;
  total_setoran_modal: number;
  total_penarikan_modal: number;
  total_bagi_hasil_transfer: number;
  total_bagi_hasil_reinvestasi: number;
  total_bagi_hasil_pending: number;
  jumlah_bagi_hasil_pending: number;
  jumlah_modal_pending: number;
  akumulasi_defisit: number;
  total_cabang_investor: number;
}

interface CabangItem {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  alamat: string;
}

interface RiwayatBagiHasilItem {
  id: number;
  nomor_rekap: string;
  periode_bulan: number;
  periode_tahun: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_penjualan_bersih: string | number;
  laba_konsolidasi_kotor: string | number;
  defisit_bulan_lalu: string | number;
  laba_kena_bagi_hasil: string | number;
  nominal_hak_pengelola: string | number;
  nominal_hak_investor: string | number;
  nominal_transfer: string | number;
  nominal_reinvestasi: string | number;
  status: "PENDING" | "APPROVED" | "DIBAYARKAN" | "DITOLAK";
}

interface DashboardData {
  profil: ProfilInvestor;
  ringkasan: RingkasanInvestor;
  cabang_list: CabangItem[];
  riwayat_bagi_hasil: RiwayatBagiHasilItem[];
}

const NAMA_BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const NAMA_BULAN_LENGKAP = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Custom Tooltip component for Recharts
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-outline-variant/60 rounded-xl p-3 shadow-lg text-xs backdrop-blur-md">
        <p className="font-bold text-on-surface mb-2 border-b border-outline-variant/30 pb-1">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-on-surface">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function InvestorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI Interactive States
  const [chartMode, setChartMode] = useState<"dividend" | "growth">("dividend");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [copiedRekening, setCopiedRekening] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/investor/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat data dasbor investor");
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ringkasan = data?.ringkasan;
  const profil = data?.profil;

  // Copy Rekening Function
  const handleCopyRekening = () => {
    if (profil?.nomor_rekening) {
      navigator.clipboard.writeText(profil.nomor_rekening);
      setCopiedRekening(true);
      setTimeout(() => setCopiedRekening(false), 2000);
    }
  };

  // Available Years for Filter
  const availableYears = useMemo(() => {
    if (!data?.riwayat_bagi_hasil) return [];
    const years = Array.from(
      new Set(data.riwayat_bagi_hasil.map((item) => String(item.periode_tahun)))
    ).sort((a, b) => Number(b) - Number(a));
    return years;
  }, [data?.riwayat_bagi_hasil]);

  // Filtered History
  const filteredRiwayat = useMemo(() => {
    if (!data?.riwayat_bagi_hasil) return [];
    if (selectedYear === "ALL") return data.riwayat_bagi_hasil;
    return data.riwayat_bagi_hasil.filter(
      (item) => String(item.periode_tahun) === selectedYear
    );
  }, [data?.riwayat_bagi_hasil, selectedYear]);

  // Chart Data Processing (Oldest to Newest for Chronological Flow)
  const chartData = useMemo(() => {
    if (!filteredRiwayat || filteredRiwayat.length === 0) return [];

    const sorted = [...filteredRiwayat].sort((a, b) => {
      if (a.periode_tahun !== b.periode_tahun) return a.periode_tahun - b.periode_tahun;
      return a.periode_bulan - b.periode_bulan;
    });

    let runningEquity = Math.max(
      0,
      (ringkasan?.total_setoran_modal || 0) - (ringkasan?.total_penarikan_modal || 0)
    );

    return sorted.map((item) => {
      const bulanLabel = NAMA_BULAN[item.periode_bulan - 1] || `Bln ${item.periode_bulan}`;
      const labaKonsolidasi = Number(item.laba_konsolidasi_kotor || 0);
      const hakInvestor = Number(item.nominal_hak_investor || 0);
      const transfer = Number(item.nominal_transfer || 0);
      const reinvest = Number(item.nominal_reinvestasi || 0);

      // Kumulatif Ekuitas Compounding
      runningEquity += reinvest;

      return {
        periode: `${bulanLabel} ${item.periode_tahun}`,
        LabaKonsolidasi: labaKonsolidasi,
        HakInvestor: hakInvestor,
        DividenTransfer: transfer,
        Reinvestasi: reinvest,
        AkumulasiEkuitas: runningEquity,
      };
    });
  }, [filteredRiwayat, ringkasan]);

  // Return & ROI Calculations
  const totalReturn =
    (ringkasan?.total_bagi_hasil_transfer || 0) +
    (ringkasan?.total_bagi_hasil_reinvestasi || 0);
  const totalModalDisetor = ringkasan?.total_setoran_modal || 0;
  const roiKumulatif =
    totalModalDisetor > 0
      ? ((totalReturn / totalModalDisetor) * 100).toFixed(1)
      : "0.0";

  const nisbahInvestor = profil?.nisbah_investor ? Number(profil.nisbah_investor) : 60;
  const nisbahPengelola = profil?.nisbah_pengelola ? Number(profil.nisbah_pengelola) : 40;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION (EXECUTIVE PORTAL)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-amber-500/15 border border-primary/20 flex items-center justify-center text-primary dark:text-emerald-400 shadow-xs flex-shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-on-surface">
                Portofolio & Dasbor Investor
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {profil?.status || "AKTIF"}
              </span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
              Konsolidasi laba cabang binaan, pertumbuhan ekuitas syariah, dan realisasi bagi hasil
            </p>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
            title="Muat ulang data terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <Link
            href="/investor/daftar"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all active:scale-95 shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Daftar Para Pemodal</span>
          </Link>

          <Link
            href="/investor/transaksi"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface hover:bg-surface-container-highest transition-all active:scale-95 shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            <span>Setor / Tarik Modal</span>
          </Link>

          <Link
            href="/investor/bagi-hasil"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Hitung Bagi Hasil</span>
          </Link>

          <Link
            href="/investor/buku-pembantu"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95"
            title="Buku Pembantu Ekuitas"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline">Kartu Ekuitas</span>
          </Link>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs md:text-sm flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="font-bold">Terjadi Kesalahan Sinkronisasi Data</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold text-xs transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* DEFICIT CARRYFORWARD ALERT (IF ANY) */}
      {ringkasan && ringkasan.akumulasi_defisit > 0 && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs md:text-sm">
            <p className="font-bold">Perhatian: Terdapat Akumulasi Defisit Periode Sebelumnya</p>
            <p className="mt-0.5 opacity-90 leading-relaxed">
              Total defisit operasional sebesar{" "}
              <strong className="underline font-mono font-bold">
                {formatCurrency(ringkasan.akumulasi_defisit)}
              </strong>{" "}
              akan dikompensasikan secara otomatis ke laba konsolidasi periode berikutnya sesuai
              prinsip syariah mudharabah/musyarakah sebelum bagi hasil dapat dicairkan.
            </p>
          </div>
        </div>
      )}

      {/* MAKER-CHECKER PENDING BADGE */}
      {ringkasan &&
        (ringkasan.jumlah_modal_pending > 0 || ringkasan.jumlah_bagi_hasil_pending > 0) && (
          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold">Menunggu Persetujuan Verifikator (Maker-Checker):</span>
                <p className="opacity-90">
                  {ringkasan.jumlah_modal_pending > 0 && (
                    <span className="mr-2">
                      <strong>{ringkasan.jumlah_modal_pending}</strong> permohonan modal
                    </span>
                  )}
                  {ringkasan.jumlah_bagi_hasil_pending > 0 && (
                    <span>
                      <strong>{ringkasan.jumlah_bagi_hasil_pending}</strong> rekapitulasi bagi hasil
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ringkasan.jumlah_modal_pending > 0 && (
                <Link
                  href="/investor/transaksi"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
                >
                  Review Modal <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {ringkasan.jumlah_bagi_hasil_pending > 0 && (
                <Link
                  href="/investor/bagi-hasil"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
                >
                  Review Bagi Hasil <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}

      {/* ─────────────────────────────────────────────────────────────
          2. HERO EXECUTIVE PORTFOLIO CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-gradient-to-br from-surface-container-high/80 via-surface-container-low to-surface p-6 md:p-8 shadow-xs">
        {/* Subtle Ambient Accent Background */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Bar inside Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Ringkasan Portofolio Ekuitas Investor
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-xs font-semibold text-primary dark:text-emerald-400">
                {profil?.nama_investor || "Investor Utama Al-Mubarok"}
              </span>
            </div>

            {/* Nisbah Ratio & Annual Cycle Schedule Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Pencairan Dividen: Februari (Siklus Tahunan)</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/30 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-on-surface-variant font-medium">Rasio Nisbah:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {nisbahInvestor}% Investor
                </span>
                <span className="text-on-surface-variant/50">:</span>
                <span className="font-bold text-primary dark:text-emerald-400">
                  {nisbahPengelola}% Pengelola
                </span>
              </div>
            </div>
          </div>

          {/* Main Portfolio Headline Numbers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-7 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80">
                Total Nilai Modal / Ekuitas Aktif
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono tracking-tight text-on-surface">
                  {formatCurrency(ringkasan?.saldo_modal_saat_ini || 0)}
                </h2>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{roiKumulatif}% ROI Kumulatif</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant/70">
                Terdiri dari modal disetor awal & akumulasi reinvestasi bagi hasil yang sedang aktif
                menghasilkan laba di cabang.
              </p>
            </div>

            {/* Quick Capital Composition Pills */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface/80 border border-outline-variant/30">
                <span className="text-[11px] font-medium text-on-surface-variant block">
                  Modal Disetor Awal & Tambahan
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-on-surface block mt-1">
                  {formatCurrency(ringkasan?.total_setoran_modal || 0)}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 block mt-0.5">
                  Setoran dana riil
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface/80 border border-outline-variant/30">
                <span className="text-[11px] font-medium text-on-surface-variant block">
                  Akumulasi Reinvestasi Modal
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 block mt-1">
                  {formatCurrency(ringkasan?.total_bagi_hasil_reinvestasi || 0)}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 block mt-0.5">
                  Compounding return
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ROW KARTU METRIK KPI DIVIDEN & KINERJA
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dividen Cair / Kas Transfer */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Dividen Terbayar (Bank)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl lg:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(ringkasan?.total_bagi_hasil_transfer || 0)}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Kas/Bank dicairkan</span>
            <span className="font-semibold text-emerald-600">Realisasi Penuh</span>
          </div>
        </div>

        {/* Card 2: Reinvestasi ke Modal */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Dividen Direinvestasikan
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl lg:text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(ringkasan?.total_bagi_hasil_reinvestasi || 0)}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Menambah modal pokok</span>
            <span className="font-semibold text-indigo-600">Compounding</span>
          </div>
        </div>

        {/* Card 3: Total Dividen Menunggu Approval */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Dividen Dalam Proses
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl lg:text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(ringkasan?.total_bagi_hasil_pending || 0)}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>{ringkasan?.jumlah_bagi_hasil_pending || 0} periode pending</span>
            <Link href="/investor/bagi-hasil" className="font-bold text-blue-600 hover:underline">
              Periksa
            </Link>
          </div>
        </div>

        {/* Card 4: Jaringan Cabang Binaaan */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Jaringan Cabang Binaan
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl lg:text-2xl font-extrabold font-mono text-on-surface">
                {ringkasan?.total_cabang_investor || 0}{" "}
                <span className="text-xs font-normal text-on-surface-variant">Cabang</span>
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Konsolidasi laba</span>
            <span className="font-medium text-amber-600">Unit Operasional</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. DUAL-MODE INTERACTIVE CHART
      ───────────────────────────────────────────────────────────── */}
      <div className="p-5 md:p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs space-y-5">
        {/* Chart Header with Mode Selector and Year Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Analisis Performa Finansial & Bagi Hasil</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Visualisasi laba konsolidasi seluruh cabang binaan vs perolehan dividen hak investor
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
              <button
                onClick={() => setChartMode("dividend")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  chartMode === "dividend"
                    ? "bg-surface text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                <span>Bagi Hasil Per Periode</span>
              </button>
              <button
                onClick={() => setChartMode("growth")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  chartMode === "growth"
                    ? "bg-surface text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pertumbuhan Ekuitas</span>
              </button>
            </div>

            {/* Year Filter Dropdown (if multiple years exist) */}
            {availableYears.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">Semua Tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      Tahun {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 sm:h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70 text-xs bg-surface-container-low/50 rounded-2xl border border-dashed border-outline-variant/40">
              <PieIcon className="w-10 h-10 opacity-30 mb-2.5" />
              <p className="font-semibold text-sm text-on-surface">
                Belum Ada Riwayat Closing Bagi Hasil
              </p>
              <p className="max-w-md mt-1">
                Data grafik akan otomatis terbentuk setelah proses kalkulasi dan approval closing
                bagi hasil bulanan dijalankan.
              </p>
              <Link
                href="/investor/bagi-hasil"
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Mulai Kalkulasi Periode Ini</span>
              </Link>
            </div>
          ) : chartMode === "dividend" ? (
            /* Mode 1: Bar Chart of Laba Konsolidasi vs Hak Dividen Investor */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="periode"
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: "var(--color-outline-variant, #ccc)" }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}Jt`}
                  axisLine={{ stroke: "var(--color-outline-variant, #ccc)" }}
                />
                <ChartTooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar
                  dataKey="LabaKonsolidasi"
                  name="Laba Konsolidasi Seluruh Cabang"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="HakInvestor"
                  name="Hak Dividen Investor"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* Mode 2: Area Chart of Cumulative Equity Growth */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEkuitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="periode"
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: "var(--color-outline-variant, #ccc)" }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}Jt`}
                  axisLine={{ stroke: "var(--color-outline-variant, #ccc)" }}
                />
                <ChartTooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="AkumulasiEkuitas"
                  name="Pertumbuhan Nilai Modal & Reinvestasi"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEkuitas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION INFORMASI PENDUKUNG (GRID ATAS):
             PROFIL INVESTOR & JARINGAN CABANG
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL KIRI: PROFIL ENTITAS & BANK REKENING (5 COLS) */}
        <div className="lg:col-span-5 p-5 md:p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-on-surface">Profil Entitas & Rekening</h3>
              </div>
              <Link
                href="/investor/profil"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Edit Profil</span>
                <Sliders className="w-3 h-3" />
              </Link>
            </div>

            {/* Nama & Status */}
            <div>
              <span className="text-[11px] font-medium text-on-surface-variant block">
                Nama Pemodal / Entitas
              </span>
              <span className="font-bold text-on-surface text-base block mt-0.5">
                {profil?.nama_investor || "Investor Utama Konsorsium"}
              </span>
            </div>

            {/* Rekening Bank Card with Copy Action */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  Rekening Penampung Dividen
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                  {profil?.nama_bank || "Bank Mandiri"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-mono font-bold text-base sm:text-lg text-on-surface tracking-wider">
                    {profil?.nomor_rekening || "—"}
                  </span>
                  <span className="text-xs text-on-surface-variant block mt-0.5">
                    a.n. {profil?.atas_nama_rekening || "—"}
                  </span>
                </div>

                <button
                  onClick={handleCopyRekening}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container transition-all active:scale-95"
                  title="Salin nomor rekening"
                >
                  {copiedRekening ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Nisbah Bagi Hasil Visual Bar */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-on-surface-variant">Nisbah Bagi Hasil:</span>
                <span className="font-bold text-on-surface">
                  {nisbahInvestor}% Investor : {nisbahPengelola}% Pengelola
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden flex shadow-inner">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${nisbahInvestor}%` }}
                  title={`Hak Investor: ${nisbahInvestor}%`}
                />
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${nisbahPengelola}%` }}
                  title={`Hak Pengelola (Al-Mubarok): ${nisbahPengelola}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant/70">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Investor Utama ({nisbahInvestor}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Al-Mubarok ({nisbahPengelola}%)
                </span>
              </div>
            </div>
          </div>

          {/* Shortcut to Buku Pembantu */}
          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Buku Pembantu Ekuitas:</span>
            <Link
              href="/investor/buku-pembantu"
              className="font-bold text-primary hover:underline flex items-center gap-1"
            >
              Lihat Riwayat Saldo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* PANEL KANAN: JARINGAN CABANG INVESTOR (7 COLS) */}
        <div className="lg:col-span-7 p-5 md:p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">
                  Jaringan Cabang Binaaan Investor ({data?.cabang_list?.length || 0})
                </h3>
              </div>
              <Link
                href="/akuntansi/profit-cabang"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Lihat Profit Cabang</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-xs text-on-surface-variant">
              Cabang bertipe <strong>INVESTOR</strong> yang hasil laba operasionalnya dikonsolidasikan
              ke dalam pembukuan bagi hasil pemodal ini:
            </p>

            {data?.cabang_list && data.cabang_list.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {data.cabang_list.map((c) => (
                  <div
                    key={c.id_cabang}
                    className="p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-on-surface line-clamp-1">
                          {c.nama_cabang}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold flex-shrink-0">
                          {c.kode_cabang}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant/70 mt-1 line-clamp-1">
                        {c.alamat || "Alamat cabang belum diatur"}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aktif Konsolidasi
                      </span>
                      <Link
                        href={`/akuntansi/profit-cabang?cabang=${c.id_cabang}`}
                        className="text-primary font-semibold hover:underline flex items-center gap-0.5"
                      >
                        Profit <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low/60 rounded-2xl border border-dashed border-outline-variant/30">
                <Building2 className="w-8 h-8 opacity-30 mx-auto mb-2" />
                <p className="font-semibold text-on-surface">Belum ada cabang bertipe INVESTOR.</p>
                <p className="mt-1">
                  Buka menu{" "}
                  <Link href="/cabang" className="text-primary font-bold underline">
                    Master Cabang
                  </Link>
                  , lalu atur jenis kepemilikan menjadi <strong>Cabang Investor</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Tipe Kepemilikan: INVESTOR</span>
            <Link href="/cabang" className="text-primary font-semibold hover:underline">
              Kelola Master Cabang
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. TABEL RIWAYAT DIVIDEN & CLOSING TERAKHIR (FULL WIDTH)
      ───────────────────────────────────────────────────────────── */}
      <div className="p-5 md:p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Riwayat Rekapitulasi Dividen & Penutupan Buku</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Daftar histori kalkulasi bagi hasil bulanan dan realisasi pencairan ke rekening investor
            </p>
          </div>

          <Link
            href="/investor/bagi-hasil"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Buka Modul Bagi Hasil Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant bg-surface-container-low/50">
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Periode</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">No. Rekap</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Laba Konsolidasi</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Hak Investor ({nisbahInvestor}%)</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Dividen Ditransfer</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Reinvestasi Modal</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {filteredRiwayat.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-variant/70 text-xs">
                    Belum ada riwayat rekapitulasi bagi hasil untuk periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredRiwayat.map((row) => {
                  const bulanName = NAMA_BULAN_LENGKAP[row.periode_bulan - 1] || `Bulan ${row.periode_bulan}`;
                  const isApproved = row.status === "APPROVED" || row.status === "DIBAYARKAN";
                  const isPending = row.status === "PENDING";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-container-low/60 transition-colors"
                    >
                      <td className="py-3.5 px-3.5 font-semibold text-on-surface">
                        {bulanName} {row.periode_tahun}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-on-surface-variant text-[11px]">
                        {row.nomor_rekap}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-right font-medium text-on-surface">
                        {formatCurrency(Number(row.laba_konsolidasi_kotor || 0))}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-right font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(Number(row.nominal_hak_investor || 0))}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(row.nominal_transfer || 0))}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-right font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(Number(row.nominal_reinvestasi || 0))}
                      </td>
                      <td className="py-3.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : isPending
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-center">
                        <Link
                          href="/investor/bagi-hasil"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant/30 hover:bg-surface-container font-semibold text-primary transition-colors text-[11px]"
                        >
                          <span>Rincian</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
