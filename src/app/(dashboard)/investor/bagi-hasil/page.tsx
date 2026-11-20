"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Wallet,
  Landmark,
  ShieldAlert,
  ArrowRight,
  FileText,
  DollarSign,
  Users,
  Percent,
  Layers,
  Sparkles,
  Info,
  Check,
  CreditCard,
  Sliders,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MemberBreakdownItem {
  id_cabang_investor: number;
  nama_investor: string;
  modal_disetor: number;
  tanggal_bergabung: string | null;
  bulan_aktif: number;
  bobot_waktu_modal: number;
  porsi_persen: number;
  nominal_hak_dividen: number;
  nominal_transfer: number;
  nominal_reinvestasi: number;
  metode_pencairan: "TRANSFER" | "REINVESTASI";
  nama_bank: string | null;
  no_rekening: string | null;
  atas_nama_rekening: string | null;
}

interface KalkulasiData {
  periode: {
    jenis_periode: "TAHUNAN" | "BULANAN";
    bulan: number;
    tahun: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    jadwal_pencairan_bulan: number;
    jadwal_pencairan_tahun: number;
  };
  profil: {
    nama_investor: string;
    nama_bank: string;
    nomor_rekening: string;
    atas_nama_rekening: string;
    nisbah_pengelola: number;
    nisbah_investor: number;
  };
  konsolidasi: {
    total_penjualan_bruto: number;
    total_diskon_retur: number;
    total_penjualan_bersih: number;
    total_hpp: number;
    total_laba_kotor: number;
    total_beban_operasional: number;
    laba_konsolidasi_kotor: number;
    defisit_bulan_lalu: number;
    laba_kena_bagi_hasil: number;
    defisit_terbawa_berikutnya: number;
    nominal_hak_pengelola: number;
    nominal_hak_investor: number;
    total_bobot_konsorsium?: number;
  };
  breakdown_cabang: Array<{
    id_cabang: number;
    kode_cabang: string;
    nama_cabang: string;
    penjualan_bruto: number;
    diskon_retur: number;
    penjualan_bersih: number;
    hpp: number;
    laba_kotor: number;
    beban_operasional: number;
    laba_operasional: number;
  }>;
  member_breakdown: MemberBreakdownItem[];
}

interface RekapBagiHasil {
  id: number;
  nomor_rekap: string;
  periode_bulan: number;
  periode_tahun: number;
  jenis_periode?: "TAHUNAN" | "BULANAN";
  jadwal_pencairan_bulan?: number;
  jadwal_pencairan_tahun?: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_penjualan_bersih: string;
  laba_konsolidasi_kotor: string;
  defisit_bulan_lalu: string;
  laba_kena_bagi_hasil: string;
  nominal_hak_investor: string;
  nominal_hak_pengelola: string;
  metode_penyelesaian: string;
  nominal_transfer: string;
  nominal_reinvestasi: string;
  status: "PENDING" | "APPROVED" | "DIBAYARKAN" | "REJECTED";
  tanggal_persetujuan: string | null;
  nama_pengaju: string | null;
  nama_rekening_kas: string | null;
}

interface RekeningKas {
  id: number;
  kode: string;
  nama: string;
  jenis: string;
  saldo: number;
  nama_cabang: string;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function BagiHasilInvestorPage() {
  const now = new Date();
  const [jenisPeriode, setJenisPeriode] = useState<"TAHUNAN" | "BULANAN">("TAHUNAN");
  const [selectedBulan, setSelectedBulan] = useState(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear());

  const [kalkulasi, setKalkulasi] = useState<KalkulasiData | null>(null);
  const [members, setMembers] = useState<MemberBreakdownItem[]>([]);
  const [rekapList, setRekapList] = useState<RekapBagiHasil[]>([]);
  const [rekeningList, setRekeningList] = useState<RekeningKas[]>([]);
  const [loadingKalkulasi, setLoadingKalkulasi] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settlement Form State
  const [selectedRekeningKas, setSelectedRekeningKas] = useState<string>("");
  const [catatanPengajuan, setCatatanPengajuan] = useState("");

  // Detailed Slip View State
  const [slipData, setSlipData] = useState<any | null>(null);
  const [loadingSlip, setLoadingSlip] = useState(false);

  // 1. Fetch History List & Rekening
  const fetchRekap = useCallback(async () => {
    setLoadingList(true);
    try {
      const [resRekap, resRek] = await Promise.all([
        fetch("/api/investor/bagi-hasil"),
        fetch("/api/investor/rekening-kas"),
      ]);
      const jsonRekap = await resRekap.json();
      const jsonRek = await resRek.json();

      if (jsonRekap.success) setRekapList(jsonRekap.data);
      if (jsonRek.success) setRekeningList(jsonRek.data);
    } catch (err: any) {
      setToast({ type: "error", text: "Gagal memuat rekapitulasi: " + err.message });
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  // 2. Fetch Live Calculation for selected period
  const handleHitungKalkulasi = async () => {
    setLoadingKalkulasi(true);
    try {
      const url =
        jenisPeriode === "TAHUNAN"
          ? `/api/investor/bagi-hasil/kalkulasi?jenis_periode=TAHUNAN&tahun=${selectedTahun}`
          : `/api/investor/bagi-hasil/kalkulasi?jenis_periode=BULANAN&bulan=${selectedBulan}&tahun=${selectedTahun}`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menghitung bagi hasil");

      setKalkulasi(json.data);
      setMembers(json.data.member_breakdown || []);
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setLoadingKalkulasi(false);
    }
  };

  // Toggle individual member payout preference
  const handleToggleMemberPayout = (id_cabang_investor: number) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id_cabang_investor === id_cabang_investor) {
          const newMetode = m.metode_pencairan === "TRANSFER" ? "REINVESTASI" : "TRANSFER";
          return {
            ...m,
            metode_pencairan: newMetode,
            nominal_transfer: newMetode === "TRANSFER" ? m.nominal_hak_dividen : 0,
            nominal_reinvestasi: newMetode === "REINVESTASI" ? m.nominal_hak_dividen : 0,
          };
        }
        return m;
      })
    );
  };

  // Bulk set member payout preference
  const handleBulkSetPayout = (metode: "TRANSFER" | "REINVESTASI") => {
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        metode_pencairan: metode,
        nominal_transfer: metode === "TRANSFER" ? m.nominal_hak_dividen : 0,
        nominal_reinvestasi: metode === "REINVESTASI" ? m.nominal_hak_dividen : 0,
      }))
    );
  };

  // Totals for Transfer vs Reinvestment from Members
  const totalTransferRequired = useMemo(() => {
    return members.reduce((acc, curr) => acc + curr.nominal_transfer, 0);
  }, [members]);

  const totalReinvestRequired = useMemo(() => {
    return members.reduce((acc, curr) => acc + curr.nominal_reinvestasi, 0);
  }, [members]);

  // 3. Maker: Ajukan Penetapan Bagi Hasil
  const handleAjukanBagiHasil = async () => {
    if (!kalkulasi) return;

    if (totalTransferRequired > 0 && !selectedRekeningKas) {
      alert("Terdapat dividen yang dicairkan via Transfer Bank. Harap pilih rekening kas/bank sumber pembayaran.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/investor/bagi-hasil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis_periode: jenisPeriode,
          periode_bulan: jenisPeriode === "TAHUNAN" ? 12 : selectedBulan,
          periode_tahun: selectedTahun,
          jadwal_pencairan_bulan: 2, // Februari
          jadwal_pencairan_tahun: jenisPeriode === "TAHUNAN" ? selectedTahun + 1 : selectedTahun,
          tanggal_mulai: kalkulasi.periode.tanggal_mulai,
          tanggal_selesai: kalkulasi.periode.tanggal_selesai,
          total_penjualan_bruto: kalkulasi.konsolidasi.total_penjualan_bruto,
          total_diskon_retur: kalkulasi.konsolidasi.total_diskon_retur,
          total_penjualan_bersih: kalkulasi.konsolidasi.total_penjualan_bersih,
          total_hpp: kalkulasi.konsolidasi.total_hpp,
          total_laba_kotor: kalkulasi.konsolidasi.total_laba_kotor,
          total_beban_operasional: kalkulasi.konsolidasi.total_beban_operasional,
          laba_konsolidasi_kotor: kalkulasi.konsolidasi.laba_konsolidasi_kotor,
          defisit_bulan_lalu: kalkulasi.konsolidasi.defisit_bulan_lalu,
          laba_kena_bagi_hasil: kalkulasi.konsolidasi.laba_kena_bagi_hasil,
          defisit_terbawa_berikutnya: kalkulasi.konsolidasi.defisit_terbawa_berikutnya,
          nisbah_pengelola_persen: kalkulasi.profil.nisbah_pengelola,
          nisbah_investor_persen: kalkulasi.profil.nisbah_investor,
          nominal_hak_pengelola: kalkulasi.konsolidasi.nominal_hak_pengelola,
          nominal_hak_investor: kalkulasi.konsolidasi.nominal_hak_investor,
          metode_penyelesaian: totalReinvestRequired > 0 && totalTransferRequired > 0 ? "MEMBER_CHOICE" : totalReinvestRequired > 0 ? "REINVESTASI_MODAL" : "TRANSFER_BANK",
          id_rekening_kas: selectedRekeningKas || null,
          catatan: catatanPengajuan,
          breakdown_cabang: kalkulasi.breakdown_cabang,
          member_breakdown: members,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengajukan bagi hasil");

      setToast({
        type: "success",
        text: `Penetapan Tutup Buku Bagi Hasil Tahun ${selectedTahun} berhasil diajukan dan membekukan snapshot pemodal (Pending Checker).`,
      });
      fetchRekap();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Checker: Approve Bagi Hasil
  const handleApprove = async (id: number) => {
    if (!confirm("Konfirmasi persetujuan (Approve) bagi hasil ini? Sistem akan memposting jurnal umum, mencairkan kas/mengeksekusi reinvestasi modal pemodal.")) {
      return;
    }
    try {
      const res = await fetch(`/api/investor/bagi-hasil/${id}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyetujui bagi hasil");
      setToast({ type: "success", text: json.message });
      fetchRekap();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    }
  };

  // 5. Checker: Reject Bagi Hasil
  const handleReject = async (id: number) => {
    const alasan = prompt("Masukkan alasan penolakan bagi hasil:");
    if (alasan === null) return;
    try {
      const res = await fetch(`/api/investor/bagi-hasil/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan: alasan }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menolak bagi hasil");
      setToast({ type: "success", text: "Pengajuan bagi hasil telah ditolak." });
      fetchRekap();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    }
  };

  // 6. View Detailed Slip for Print
  const handleViewSlip = async (id: number) => {
    setLoadingSlip(true);
    try {
      const res = await fetch(`/api/investor/slip/${id}`);
      const json = await res.json();
      if (json.success) {
        setSlipData(json.data);
      }
    } catch (err: any) {
      alert("Gagal memuat slip: " + err.message);
    } finally {
      setLoadingSlip(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            href="/investor"
            className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant transition-colors shadow-xs"
            title="Kembali ke Dasbor Investor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-on-surface">
                Tutup Buku & Pembagian Bagi Hasil
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Siklus Tahunan (Pencairan Februari)
              </span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
              Konsolidasi laba 1 tahun buku penuh, pembobotan modal tengah tahun (Time-Weighted Capital), dan freeze snapshot pemodal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/investor/daftar"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Daftar Pemodal</span>
          </Link>

          <button
            onClick={fetchRekap}
            disabled={loadingList}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST BANNER */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm flex items-center justify-between gap-3 animate-in fade-in ${
            toast.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. KALKULATOR CLOSING BAGI HASIL KONSOLIDASI
      ───────────────────────────────────────────────────────────── */}
      <div className="p-5 md:p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
          <div>
            <h2 className="font-extrabold text-base md:text-lg text-on-surface flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Kalkulator Closing Bagi Hasil Konsolidasi</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Pilih mode periode tutup buku untuk mengkonsolidasi laba seluruh cabang bertipe INVESTOR
            </p>
          </div>

          {/* Mode Switcher & Filter Controls */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Mode Switcher */}
            <div className="p-1 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setJenisPeriode("TAHUNAN")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  jenisPeriode === "TAHUNAN"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Tutup Buku Tahunan
              </button>
              <button
                onClick={() => setJenisPeriode("BULANAN")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  jenisPeriode === "BULANAN"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Bulanan (Interim)
              </button>
            </div>

            {/* Bulan Selector (If Bulanan) */}
            {jenisPeriode === "BULANAN" && (
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(parseInt(e.target.value))}
                className="px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {NAMA_BULAN.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Bulan {m}
                  </option>
                ))}
              </select>
            )}

            {/* Tahun Selector */}
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>

            {/* Action Hitung */}
            <button
              onClick={handleHitungKalkulasi}
              disabled={loadingKalkulasi}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingKalkulasi ? "animate-spin" : ""}`} />
              <span>{loadingKalkulasi ? "Menghitung..." : "Kalkulasi Laba"}</span>
            </button>
          </div>
        </div>

        {/* Notice Siklus Tahunan & Pencairan Februari */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-on-surface block">
                {jenisPeriode === "TAHUNAN"
                  ? `Siklus Tutup Buku Tahunan Buku ${selectedTahun}`
                  : `Closing Bulanan Bulan ${NAMA_BULAN[selectedBulan - 1]} ${selectedTahun}`}
              </span>
              <span className="text-on-surface-variant block mt-0.5 leading-relaxed">
                {jenisPeriode === "TAHUNAN"
                  ? `Konsolidasi laba 1 tahun penuh (1 Jan - 31 Des ${selectedTahun}). Realisasi pencairan dividen dijadwalkan pada bulan Februari ${selectedTahun + 1}. Setiap investor baru dihitung prorata bobot bulan aktif (Time-Weighted Capital).`
                  : `Closing bulanan sementara (interim) untuk evaluasi performa kas konsorsium.`}
              </span>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs whitespace-nowrap self-start sm:self-center">
            Jadwal Pencairan: Februari {jenisPeriode === "TAHUNAN" ? selectedTahun + 1 : selectedTahun}
          </div>
        </div>

        {/* HASIL KALKULASI PREVIEW */}
        {kalkulasi && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Konsolidasi Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant block text-[11px] font-medium">Penjualan Bersih</span>
                <span className="font-extrabold text-base font-mono text-on-surface mt-1 block">
                  {formatCurrency(kalkulasi.konsolidasi.total_penjualan_bersih)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5 opacity-70">
                  Bruto: {formatCurrency(kalkulasi.konsolidasi.total_penjualan_bruto)}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant block text-[11px] font-medium">Total HPP</span>
                <span className="font-extrabold text-base font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  - {formatCurrency(kalkulasi.konsolidasi.total_hpp)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5 opacity-70">
                  Laba Kotor: {formatCurrency(kalkulasi.konsolidasi.total_laba_kotor)}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant block text-[11px] font-medium">Beban Operasional</span>
                <span className="font-extrabold text-base font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  - {formatCurrency(kalkulasi.konsolidasi.total_beban_operasional)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5 opacity-70">
                  Dari Akun Beban (Tipe 6)
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant block text-[11px] font-medium">Laba Konsolidasi Bersih</span>
                <span
                  className={`font-extrabold text-lg font-mono mt-1 block ${
                    kalkulasi.konsolidasi.laba_konsolidasi_kotor >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatCurrency(kalkulasi.konsolidasi.laba_konsolidasi_kotor)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5 opacity-70">
                  {kalkulasi.konsolidasi.laba_konsolidasi_kotor >= 0 ? "Surplus Bersih" : "Defisit (Rugi Operasional)"}
                </span>
              </div>
            </div>

            {/* DEFICIT CARRYFORWARD & NISBAH CALCULATION BOX */}
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-bold text-on-surface text-sm">
                    Kompensasi Defisit & Alokasi Dividen Syariah
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-on-surface-variant font-medium">
                    Ketentuan Nisbah: <strong>Pengelola {kalkulasi.profil.nisbah_pengelola}%</strong> :{" "}
                    <strong>Konsorsium Investor {kalkulasi.profil.nisbah_investor}%</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-surface p-3.5 rounded-xl border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant block">Kompensasi Defisit Lalu:</span>
                  <span className="font-bold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                    {formatCurrency(kalkulasi.konsolidasi.defisit_bulan_lalu)}
                  </span>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant block">Laba Dasar Kena Bagi Hasil:</span>
                  <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5 text-base">
                    {formatCurrency(kalkulasi.konsolidasi.laba_kena_bagi_hasil)}
                  </span>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant block">
                    Hak Dividen Konsorsium Investor ({kalkulasi.profil.nisbah_investor}%):
                  </span>
                  <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400 block mt-0.5 text-base">
                    {formatCurrency(kalkulasi.konsolidasi.nominal_hak_investor)}
                  </span>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                3. TABEL TIME-WEIGHTED CAPITAL (SNAPSHOT INDIVIDUAL PEMODAL)
            ───────────────────────────────────────────────────────────── */}
            <div className="border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-surface-container-low px-5 py-3.5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-extrabold text-sm text-on-surface flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Rincian Hak Dividen Pemodal (Time-Weighted Capital)</span>
                  </span>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Pembagian dividen proporsional berdasarkan bobot: <strong>Modal Disetor × Bulan Aktif Bekerja</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface-variant font-medium">Set Semua:</span>
                  <button
                    onClick={() => handleBulkSetPayout("TRANSFER")}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant/40 hover:bg-surface text-[10px] font-bold text-on-surface transition-colors"
                  >
                    Transfer Kas
                  </button>
                  <button
                    onClick={() => handleBulkSetPayout("REINVESTASI")}
                    className="px-2.5 py-1 rounded-lg border border-indigo-500/40 hover:bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    Reinvestasi (Compounding)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-lowest text-on-surface-variant font-semibold border-b border-outline-variant/20">
                    <tr>
                      <th className="px-4 py-3">Nama Pemodal</th>
                      <th className="px-4 py-3 text-right">Modal Disetor</th>
                      <th className="px-4 py-3 text-center">Bulan Aktif</th>
                      <th className="px-4 py-3 text-right">Bobot Modal</th>
                      <th className="px-4 py-3 text-right">Porsi Hak</th>
                      <th className="px-4 py-3 text-right">Hak Dividen (Rp)</th>
                      <th className="px-4 py-3 text-center">Pilihan Realisasi</th>
                      <th className="px-4 py-3">Rekening Bank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-on-surface-variant">
                          Belum ada data pemodal aktif. Silakan tambahkan pemodal di menu Daftar Pemodal.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id_cabang_investor} className="hover:bg-surface-container/20 transition-colors">
                          <td className="px-4 py-3 font-bold text-on-surface">
                            {m.nama_investor}
                            {m.tanggal_bergabung && (
                              <span className="text-[10px] text-on-surface-variant font-normal block">
                                Gabung: {formatDate(m.tanggal_bergabung)}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-semibold">
                            {formatCurrency(m.modal_disetor)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                m.bulan_aktif === 12
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              }`}
                            >
                              {m.bulan_aktif} / 12 bln
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-on-surface-variant">
                            {m.bobot_waktu_modal.toLocaleString("id-ID")}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                            {m.porsi_persen.toFixed(2)}%
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                            {formatCurrency(m.nominal_hak_dividen)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleMemberPayout(m.id_cabang_investor)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                                m.metode_pencairan === "TRANSFER"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-indigo-500/10 text-indigo-700 border-indigo-500/30 hover:bg-indigo-500/20"
                              }`}
                              title="Klik untuk beralih antara Transfer Bank vs Reinvestasi"
                            >
                              {m.metode_pencairan === "TRANSFER" ? "💳 Transfer Kas" : "📈 Reinvestasi Modal"}
                            </button>
                          </td>

                          <td className="px-4 py-3 text-on-surface-variant text-[11px]">
                            {m.nama_bank ? (
                              <span>
                                {m.nama_bank} • {m.no_rekening}
                              </span>
                            ) : (
                              <span className="italic opacity-60">Belum diset</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {members.length > 0 && (
                    <tfoot className="bg-surface-container-low font-bold text-xs border-t-2 border-outline-variant/30">
                      <tr>
                        <td className="px-4 py-3">Total Konsorsium ({members.length} Pemodal)</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(members.reduce((acc, curr) => acc + curr.modal_disetor, 0))}
                        </td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {members.reduce((acc, curr) => acc + curr.bobot_waktu_modal, 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">100.00%</td>
                        <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          {formatCurrency(kalkulasi.konsolidasi.nominal_hak_investor)}
                        </td>
                        <td colSpan={2} className="px-4 py-3 text-center text-[10px] text-on-surface-variant font-normal">
                          Transfer: <strong>{formatCurrency(totalTransferRequired)}</strong> | Reinvestasi: <strong>{formatCurrency(totalReinvestRequired)}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* TABEL BREAKDOWN PER CABANG INVESTOR */}
            <div className="border border-outline-variant/30 rounded-2xl overflow-hidden">
              <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/30 flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Kontribusi Performa Seluruh Cabang Bertipe INVESTOR
                </span>
                <span className="text-on-surface-variant font-mono">
                  {kalkulasi.breakdown_cabang.length} Cabang Konsolidasi
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-lowest text-on-surface-variant font-semibold">
                    <tr>
                      <th className="px-4 py-2">Cabang</th>
                      <th className="px-4 py-2 text-right">Penjualan Bersih</th>
                      <th className="px-4 py-2 text-right">HPP</th>
                      <th className="px-4 py-2 text-right">Laba Kotor</th>
                      <th className="px-4 py-2 text-right">Beban Operasional</th>
                      <th className="px-4 py-2 text-right">Laba Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {kalkulasi.breakdown_cabang.map((b) => (
                      <tr key={b.id_cabang} className="hover:bg-surface-container/20">
                        <td className="px-4 py-2 font-semibold">
                          {b.nama_cabang}{" "}
                          <span className="text-[10px] font-mono opacity-60">({b.kode_cabang})</span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatCurrency(b.penjualan_bersih)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-rose-600">
                          {formatCurrency(b.hpp)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatCurrency(b.laba_kotor)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-rose-600">
                          {formatCurrency(b.beban_operasional)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold">
                          <span className={b.laba_operasional >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {formatCurrency(b.laba_operasional)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SETTLEMENT & SUBMIT BOX */}
            <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-4 text-xs">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> Pengesahan Realisasi Pembayaran Dividen
              </h3>

              {totalTransferRequired > 0 && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-on-surface-variant block">
                    Rekening Kas / Bank Pembayar (Diperlukan Rp {totalTransferRequired.toLocaleString("id-ID")} untuk transfer kas) *
                  </label>
                  <select
                    value={selectedRekeningKas}
                    onChange={(e) => setSelectedRekeningKas(e.target.value)}
                    className="w-full md:w-96 px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
                  >
                    <option value="">-- Pilih Rekening Kas / Bank Sumber --</option>
                    {rekeningList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nama} ({r.jenis}) — Saldo: {formatCurrency(r.saldo)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-on-surface-variant block">
                  Catatan Pengesahan Tutup Buku (Opsional)
                </label>
                <input
                  type="text"
                  value={catatanPengajuan}
                  onChange={(e) => setCatatanPengajuan(e.target.value)}
                  placeholder="Contoh: Tutup buku tahunan telah diverifikasi bersama tim akuntansi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleAjukanBagiHasil}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting
                    ? "Membekukan Snapshot & Mengajukan..."
                    : `Ajukan & Bekukan Snapshot Bagi Hasil ${jenisPeriode} ${selectedTahun} (Draft)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. RIWAYAT PENETAPAN BAGI HASIL
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-outline-variant/30 bg-surface shadow-xs overflow-hidden space-y-4 p-5 md:p-6">
        <h2 className="font-extrabold text-base md:text-lg text-on-surface flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span>Riwayat Rekapitulasi & Pembayaran Bagi Hasil</span>
        </h2>

        <div className="overflow-x-auto border border-outline-variant/20 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
              <tr>
                <th className="px-4 py-3">No. Rekap / Periode</th>
                <th className="px-4 py-3">Jenis Periode</th>
                <th className="px-4 py-3 text-right">Laba Konsolidasi</th>
                <th className="px-4 py-3 text-right">Hak Konsorsium</th>
                <th className="px-4 py-3">Jadwal Pencairan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loadingList ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-on-surface-variant">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Memuat riwayat rekapitulasi bagi hasil...
                  </td>
                </tr>
              ) : rekapList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-on-surface-variant">
                    Belum ada riwayat bagi hasil yang diajukan. Gunakan kalkulator di atas untuk memulai.
                  </td>
                </tr>
              ) : (
                rekapList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold font-mono text-on-surface block">
                        {item.nomor_rekap}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-semibold">
                        Tahun: {item.periode_tahun}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.jenis_periode === "TAHUNAN"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {item.jenis_periode === "TAHUNAN" ? "Tahunan (1 Jan - 31 Des)" : `Bulan ${item.periode_bulan}`}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(Number(item.laba_konsolidasi_kotor))}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400">
                      {formatCurrency(Number(item.nominal_hak_investor))}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-on-surface text-[11px] block">
                        Februari {item.jadwal_pencairan_tahun || item.periode_tahun + 1}
                      </span>
                      {item.nama_rekening_kas && (
                        <span className="text-[10px] text-on-surface-variant/70 block">
                          Kas: {item.nama_rekening_kas}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "DIBAYARKAN" || item.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right space-x-1">
                      {item.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors shadow-xs"
                            title="Approve & Eksekusi Bagi Hasil"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-600 font-bold text-[10px] hover:bg-rose-500/10 transition-colors"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleViewSlip(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container font-semibold text-[11px] text-on-surface transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Slip & Snapshot</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SLIP BAGI HASIL & SNAPSHOT PEMODAL (OFFICIAL PRINT)
      ───────────────────────────────────────────────────────────── */}
      {slipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-outline-variant/40 shadow-2xl max-w-3xl w-full overflow-hidden p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Slip Paper Container */}
            <div id="slip-print-area" className="p-6 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest space-y-5 text-xs">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-outline-variant/60 pb-4">
                <div>
                  <h2 className="font-black text-base uppercase tracking-wider text-primary">
                    AL-MUBAROK RETAIL GROUP
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Kantor Pusat Manajemen & Konsolidasi Cabang Pemodal
                  </p>
                  <p className="text-[10px] text-on-surface-variant/70">
                    Jember, Jawa Timur • Telp: (0331) 489-xxxx
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm uppercase text-on-surface block tracking-wide">
                    SLIP & SNAPSHOT TUTUP BUKU BAGI HASIL
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-600 block mt-0.5">
                    {slipData.bagi_hasil.nomor_rekap}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Periode: {slipData.bagi_hasil.jenis_periode || "TAHUNAN"} • Tahun {slipData.bagi_hasil.periode_tahun}
                  </span>
                </div>
              </div>

              {/* Data Konsorsium */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Entitas Konsorsium:</span>
                  <span className="font-bold text-sm text-on-surface block">
                    {slipData.profil.nama_investor}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block">
                    {slipData.profil.nama_bank} • Rek: {slipData.profil.nomor_rekening} (a.n. {slipData.profil.atas_nama_rekening})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant block">Kebijakan Nisbah:</span>
                  <span className="font-bold text-xs text-on-surface block">
                    Pengelola {slipData.bagi_hasil.nisbah_pengelola_persen}% : Investor {slipData.bagi_hasil.nisbah_investor_persen}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    Jadwal Pencairan: Februari {slipData.bagi_hasil.jadwal_pencairan_tahun || slipData.bagi_hasil.periode_tahun + 1}
                  </span>
                </div>
              </div>

              {/* Rekap Finansial Konsolidasi */}
              <div className="space-y-1.5 border-t border-b border-outline-variant/30 py-3">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Penjualan Konsolidasi Seluruh Cabang:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(Number(slipData.bagi_hasil.total_penjualan_bersih))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Harga Pokok Penjualan (HPP):</span>
                  <span className="font-mono text-rose-600">
                    - {formatCurrency(Number(slipData.bagi_hasil.total_hpp))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Beban Operasional:</span>
                  <span className="font-mono text-rose-600">
                    - {formatCurrency(Number(slipData.bagi_hasil.total_beban_operasional))}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-outline-variant/20">
                  <span>Laba Bersih Konsolidasi Periode Berjalan:</span>
                  <span className="font-mono text-emerald-600">
                    {formatCurrency(Number(slipData.bagi_hasil.laba_konsolidasi_kotor))}
                  </span>
                </div>
                {Number(slipData.bagi_hasil.defisit_bulan_lalu) > 0 && (
                  <div className="flex justify-between text-rose-600 pt-0.5">
                    <span>Kompensasi Defisit Periode Sebelumnya:</span>
                    <span className="font-mono">
                      - {formatCurrency(Number(slipData.bagi_hasil.defisit_bulan_lalu))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-outline-variant/20 text-sm">
                  <span>Laba Bersih Dasar Pembagian Dividen:</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(Number(slipData.bagi_hasil.laba_kena_bagi_hasil))}
                  </span>
                </div>
              </div>

              {/* Total Hak Investor */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center">
                <div>
                  <span className="font-bold text-xs uppercase text-amber-800 dark:text-amber-300 block">
                    TOTAL HAK BAGI HASIL KONSORSIUM
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    Sesuai nisbah {slipData.bagi_hasil.nisbah_investor_persen}% dari laba dasar konsolidasi
                  </span>
                </div>
                <span className="font-mono font-black text-xl text-amber-700 dark:text-amber-400">
                  {formatCurrency(Number(slipData.bagi_hasil.nominal_hak_investor))}
                </span>
              </div>

              {/* Immutable Snapshot Table of Members */}
              {slipData.members && slipData.members.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      Snapshot Permanen Anggota Pemodal ({slipData.members.length} Pemodal)
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold">
                      Immutable Historical Record
                    </span>
                  </div>
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-surface-container-low font-semibold text-on-surface-variant border-b border-outline-variant/20">
                        <tr>
                          <th className="px-3 py-2">Nama Pemodal</th>
                          <th className="px-3 py-2 text-right">Modal</th>
                          <th className="px-3 py-2 text-center">Bulan</th>
                          <th className="px-3 py-2 text-right">Porsi</th>
                          <th className="px-3 py-2 text-right">Hak Dividen</th>
                          <th className="px-3 py-2 text-center">Penyelesaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {slipData.members.map((mem: any) => (
                          <tr key={mem.id}>
                            <td className="px-3 py-1.5 font-bold">{mem.nama_investor}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatCurrency(Number(mem.modal_disetor))}</td>
                            <td className="px-3 py-1.5 text-center">{mem.bulan_aktif} bln</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-primary">{Number(mem.porsi_persen).toFixed(2)}%</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-amber-600">{formatCurrency(Number(mem.nominal_hak_dividen))}</td>
                            <td className="px-3 py-1.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-surface border border-outline-variant/30">
                                {mem.status_pencairan || mem.metode_pencairan}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tanda Tangan */}
              <div className="pt-6 grid grid-cols-2 text-center text-[10px] border-t border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block">Disahkan Oleh (Pengelola):</span>
                  <span className="mt-8 font-bold text-on-surface block underline">
                    Direksi Keuangan Al-Mubarok
                  </span>
                  <span className="text-[9px] text-on-surface-variant/70">
                    Tanggal: {slipData.bagi_hasil.tanggal_persetujuan?.slice(0, 10) || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Diterima Oleh (Konsorsium Pemodal):</span>
                  <span className="mt-8 font-bold text-on-surface block underline">
                    {slipData.profil.atas_nama_rekening}
                  </span>
                  <span className="text-[9px] text-on-surface-variant/70">Perwakilan Dewan Investor</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSlipData(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/60 text-xs font-semibold hover:bg-surface-container"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip Resmi PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}