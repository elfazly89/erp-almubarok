"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Landmark,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders,
  FileText,
  DollarSign,
  PieChart as PieIcon,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardData {
  profil: {
    id: number;
    nama_investor: string;
    nama_bank: string;
    nomor_rekening: string;
    atas_nama_rekening: string;
    nisbah_pengelola: string;
    nisbah_investor: string;
    saldo_modal_saat_ini: string;
    akumulasi_defisit: string;
    status: string;
  };
  ringkasan: {
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
  };
  cabang_list: Array<{
    id_cabang: number;
    kode_cabang: string;
    nama_cabang: string;
    alamat: string;
  }>;
  riwayat_bagi_hasil: Array<any>;
}

export default function InvestorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Chart data formatting from riwayat_bagi_hasil
  const chartData = (data?.riwayat_bagi_hasil || [])
    .slice()
    .reverse()
    .map((item) => ({
      periode: `${item.periode_bulan}/${item.periode_tahun}`,
      LabaKonsolidasi: Number(item.laba_konsolidasi_kotor || 0),
      HakInvestor: Number(item.nominal_hak_investor || 0),
      HakPengelola: Number(item.nominal_hak_pengelola || 0),
    }));

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Landmark className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface">
                Manajemen & Akuntansi Investor
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant">
                Konsolidasi laba seluruh cabang investor, pembukuan ekuitas, dan realisasi bagi hasil
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
          <Link
            href="/investor/transaksi"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5" />
            Setor Modal
          </Link>
          <Link
            href="/investor/bagi-hasil"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Hitung Bagi Hasil
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DEFICIT CARRYFORWARD ALERT (IF ANY) */}
      {ringkasan && ringkasan.akumulasi_defisit > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs md:text-sm">
            <p className="font-bold">Perhatian: Terdapat Akumulasi Defisit Periode Lalu</p>
            <p className="mt-0.5 opacity-90">
              Total defisit sebesar{" "}
              <strong className="underline font-mono">
                {formatCurrency(ringkasan.akumulasi_defisit)}
              </strong>{" "}
              akan dikompensasikan secara otomatis ke laba konsolidasi periode mendatang sebelum bagi
              hasil berikutnya dapat dicairkan.
            </p>
          </div>
        </div>
      )}

      {/* MAKER-CHECKER PENDING BADGE */}
      {ringkasan &&
        (ringkasan.jumlah_modal_pending > 0 || ringkasan.jumlah_bagi_hasil_pending > 0) && (
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Ada <strong>{ringkasan.jumlah_modal_pending}</strong> permohonan modal dan{" "}
                <strong>{ringkasan.jumlah_bagi_hasil_pending}</strong> rekap bagi hasil menunggu
                persetujuan (Approval Checker).
              </span>
            </div>
            <Link
              href="/investor/transaksi"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Lihat Pending <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Modal Aktif */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Saldo Modal Disetor
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold font-mono text-on-surface">
              {formatCurrency(ringkasan?.saldo_modal_saat_ini || 0)}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-on-surface-variant">
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-medium">
                Nisbah: {profil?.nisbah_investor || 60}%
              </span>
              <span>• Akun Ekuitas: 3.101.01</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bagi Hasil Dibayarkan (Transfer Bank) */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Dividen Terbayar (Kas/Bank)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(ringkasan?.total_bagi_hasil_transfer || 0)}
            </h3>
            <p className="mt-2 text-[11px] text-on-surface-variant">
              Tercatat di mutasi kas & jurnal umum keluar
            </p>
          </div>
        </div>

        {/* Card 3: Dividen Direinvestasikan (Compounding) */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Reinvestasi ke Modal
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatCurrency(ringkasan?.total_bagi_hasil_reinvestasi || 0)}
            </h3>
            <p className="mt-2 text-[11px] text-on-surface-variant">
              Dikonversi otomatis menambah pokok investasi
            </p>
          </div>
        </div>

        {/* Card 4: Jaringan Cabang Investor */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Jaringan Cabang Investor
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold font-mono text-on-surface">
              {ringkasan?.total_cabang_investor || 0}{" "}
              <span className="text-xs font-normal text-on-surface-variant">Cabang</span>
            </h3>
            <p className="mt-2 text-[11px] text-on-surface-variant">
              Laba dikonsolidasikan menaungi seluruh cabang ini
            </p>
          </div>
        </div>
      </div>

      {/* ROW: PROFILE SUMMARY & CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: INVESTOR PROFILE DETAIL CARD */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-500" /> Profil Entitas Investor
            </h3>
            <Link
              href="/investor/profil"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Ubah <Sliders className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-on-surface-variant/70 text-[11px] block">Nama Pemodal</span>
              <span className="font-bold text-on-surface text-sm">
                {profil?.nama_investor || "-"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-on-surface-variant/70 text-[11px] block">Rekening Bank</span>
                <span className="font-semibold text-on-surface">
                  {profil?.nama_bank} - {profil?.nomor_rekening}
                </span>
                <span className="text-on-surface-variant block text-[10px]">
                  a.n. {profil?.atas_nama_rekening}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant/70 text-[11px] block">Status Entitas</span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                  {profil?.status || "AKTIF"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-on-surface-variant">Nisbah Bagi Hasil:</span>
                <span className="font-bold text-on-surface">
                  Al-Mubarok {profil?.nisbah_pengelola || 40}% : Investor{" "}
                  {profil?.nisbah_investor || 60}%
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 mt-2 overflow-hidden flex">
                <div
                  className="bg-primary h-full"
                  style={{ width: `${profil?.nisbah_pengelola || 40}%` }}
                  title={`Pengelola: ${profil?.nisbah_pengelola || 40}%`}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${profil?.nisbah_investor || 60}%` }}
                  title={`Investor: ${profil?.nisbah_investor || 60}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant/70 mt-1">
                <span>Pengelola (Al-Mubarok)</span>
                <span>Investor Utama</span>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/30 flex justify-between text-xs">
              <span className="text-on-surface-variant">Buku Pembantu Modal:</span>
              <Link
                href="/investor/buku-pembantu"
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                Lihat Kartu Ekuitas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT: CHART PERFORMA BULANAN KONSOLIDASI */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div>
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Tren Laba Konsolidasi & Bagi Hasil
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Riwayat periode penutupan buku cabang investor
              </p>
            </div>
            <Link
              href="/investor/bagi-hasil"
              className="text-xs text-primary font-semibold hover:underline"
            >
              Lihat Rekap Lengkap
            </Link>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-xs">
                <PieIcon className="w-8 h-8 opacity-40 mb-2" />
                <p>Belum ada riwayat closing bagi hasil yang tersimpan.</p>
                <Link
                  href="/investor/bagi-hasil"
                  className="mt-2 text-primary font-semibold hover:underline"
                >
                  Mulai Kalkulasi Periode Ini
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}Jt`}
                  />
                  <ChartTooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar
                    dataKey="LabaKonsolidasi"
                    name="Laba Konsolidasi"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="HakInvestor"
                    name="Hak Dividen Investor"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* BRANCHES LIST & NAVIGATION SHORTCUTS */}
      <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">
              Daftar Cabang yang Dinaungi Investor Ini
            </h3>
          </div>
          <span className="text-xs text-on-surface-variant">
            Tipe: <strong className="text-amber-600">INVESTOR</strong> di Master Cabang
          </span>
        </div>

        {data?.cabang_list && data.cabang_list.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.cabang_list.map((c) => (
              <div
                key={c.id_cabang}
                className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">{c.nama_cabang}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    {c.kode_cabang}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-1 line-clamp-1">
                  {c.alamat || "Alamat belum diatur"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
            <p>Belum ada cabang bertipe INVESTOR terdaftar.</p>
            <p className="mt-1">
              Buka menu{" "}
              <Link href="/cabang" className="text-primary font-bold underline">
                Master Cabang
              </Link>
              , edit cabang terkait dan ubah jenis kepemilikan menjadi <strong>Cabang Investor</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
