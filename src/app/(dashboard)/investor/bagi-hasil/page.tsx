"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KalkulasiData {
  periode: {
    bulan: number;
    tahun: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
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
}

interface RekapBagiHasil {
  id: number;
  nomor_rekap: string;
  periode_bulan: number;
  periode_tahun: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_penjualan_bersih: string;
  laba_konsolidasi_kotor: string;
  defisit_bulan_lalu: string;
  laba_kena_bagi_hasil: string;
  nominal_hak_investor: string;
  nominal_hak_pengelola: string;
  metode_penyelesaian: "TRANSFER_BANK" | "REINVESTASI_MODAL";
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

export default function BagiHasilInvestorPage() {
  const now = new Date();
  const [selectedBulan, setSelectedBulan] = useState(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear());

  const [kalkulasi, setKalkulasi] = useState<KalkulasiData | null>(null);
  const [rekapList, setRekapList] = useState<RekapBagiHasil[]>([]);
  const [rekeningList, setRekeningList] = useState<RekeningKas[]>([]);
  const [loadingKalkulasi, setLoadingKalkulasi] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settlement Form State
  const [metodePenyelesaian, setMetodePenyelesaian] = useState<"TRANSFER_BANK" | "REINVESTASI_MODAL">(
    "TRANSFER_BANK"
  );
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
      const res = await fetch(
        `/api/investor/bagi-hasil/kalkulasi?bulan=${selectedBulan}&tahun=${selectedTahun}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menghitung bagi hasil");
      setKalkulasi(json.data);
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setLoadingKalkulasi(false);
    }
  };

  // 3. Maker: Ajukan Penetapan Bagi Hasil
  const handleAjukanBagiHasil = async () => {
    if (!kalkulasi) return;

    if (metodePenyelesaian === "TRANSFER_BANK" && !selectedRekeningKas && kalkulasi.konsolidasi.nominal_hak_investor > 0) {
      alert("Harap pilih rekening kas/bank sumber pembayaran bagi hasil.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/investor/bagi-hasil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periode_bulan: selectedBulan,
          periode_tahun: selectedTahun,
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
          metode_penyelesaian: metodePenyelesaian,
          id_rekening_kas: selectedRekeningKas || null,
          catatan: catatanPengajuan,
          breakdown_cabang: kalkulasi.breakdown_cabang,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengajukan bagi hasil");

      setToast({
        type: "success",
        text: `Bagi hasil periode ${selectedBulan}/${selectedTahun} berhasil diajukan dan menunggu persetujuan (Checker).`,
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
    if (!confirm("Konfirmasi persetujuan (Approve) bagi hasil ini? Sistem akan memposting jurnal umum dan memotong kas/menambah modal.")) {
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
    <div className="space-y-6 p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/investor"
            className="p-2 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface">
              Pembagian Bagi Hasil (Dividen)
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant">
              Kalkulasi laba konsolidasi seluruh cabang investor, kompensasi defisit rugi, dan eksekusi pembayaran
            </p>
          </div>
        </div>

        <button
          onClick={fetchRekap}
          disabled={loadingList}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
          Muat Ulang
        </button>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-xl text-xs md:text-sm flex items-center justify-between gap-3 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* KALKULATOR PENETAPAN PERIODE */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h2 className="font-bold text-sm md:text-base text-on-surface flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Kalkulator Closing Bagi Hasil Konsolidasi
            </h2>
            <p className="text-xs text-on-surface-variant">
              Tarik data penjualan, HPP, beban dari seluruh cabang bertipe INVESTOR untuk dihitung bagi hasilnya
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
              ].map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {m}
                </option>
              ))}
            </select>

            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>

            <button
              onClick={handleHitungKalkulasi}
              disabled={loadingKalkulasi}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingKalkulasi ? "animate-spin" : ""}`} />
              {loadingKalkulasi ? "Menghitung..." : "Hitung Laba"}
            </button>
          </div>
        </div>

        {/* HASIL KALKULASI PREVIEW */}
        {kalkulasi && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Konsolidasi Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant/70 block text-[11px]">Penjualan Bersih</span>
                <span className="font-bold text-sm font-mono text-on-surface mt-1 block">
                  {formatCurrency(kalkulasi.konsolidasi.total_penjualan_bersih)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  Bruto: {formatCurrency(kalkulasi.konsolidasi.total_penjualan_bruto)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant/70 block text-[11px]">Total HPP</span>
                <span className="font-bold text-sm font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  - {formatCurrency(kalkulasi.konsolidasi.total_hpp)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  Laba Kotor: {formatCurrency(kalkulasi.konsolidasi.total_laba_kotor)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant/70 block text-[11px]">Beban Operasional</span>
                <span className="font-bold text-sm font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  - {formatCurrency(kalkulasi.konsolidasi.total_beban_operasional)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  Dari Jurnal Akun Tipe 6
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-low">
                <span className="text-on-surface-variant/70 block text-[11px]">Laba Konsolidasi</span>
                <span
                  className={`font-bold text-base font-mono mt-1 block ${
                    kalkulasi.konsolidasi.laba_konsolidasi_kotor >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatCurrency(kalkulasi.konsolidasi.laba_konsolidasi_kotor)}
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  {kalkulasi.konsolidasi.laba_konsolidasi_kotor >= 0 ? "Surplus Bersih" : "Defisit (Rugi)"}
                </span>
              </div>
            </div>

            {/* DEFICIT CARRYFORWARD & NISBAH CALCULATION BOX */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-bold text-on-surface">
                    Perhitungan Kompensasi Defisit & Dasar Bagi Hasil
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-on-surface-variant">
                    Nisbah: <strong>Al-Mubarok {kalkulasi.profil.nisbah_pengelola}%</strong> :{" "}
                    <strong>Investor {kalkulasi.profil.nisbah_investor}%</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant block">Defisit Periode Sebelumnya:</span>
                  <span className="font-bold font-mono text-rose-600 dark:text-rose-400 block mt-0.5">
                    {formatCurrency(kalkulasi.konsolidasi.defisit_bulan_lalu)}
                  </span>
                </div>

                <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant block">Laba Dasar Kena Bagi Hasil:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5 text-sm">
                    {formatCurrency(kalkulasi.konsolidasi.laba_kena_bagi_hasil)}
                  </span>
                </div>

                <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant block">Hak Dividen Investor ({kalkulasi.profil.nisbah_investor}%):</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400 block mt-0.5 text-sm">
                    {formatCurrency(kalkulasi.konsolidasi.nominal_hak_investor)}
                  </span>
                </div>
              </div>
            </div>

            {/* TABEL BREAKDOWN PER CABANG INVESTOR */}
            <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
              <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/30 flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Rincian Kontribusi Seluruh Cabang Investor
                </span>
                <span className="text-on-surface-variant font-mono">
                  {kalkulasi.breakdown_cabang.length} Cabang Terkonsolidasi
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

            {/* SETTLEMENT OPTION (TRANSFER VS REINVEST) & SUBMIT */}
            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low space-y-4 text-xs">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> Metode Realisasi Penyelesaian Dividen
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    metodePenyelesaian === "TRANSFER_BANK"
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 bg-surface"
                  }`}
                >
                  <input
                    type="radio"
                    name="metode"
                    checked={metodePenyelesaian === "TRANSFER_BANK"}
                    onChange={() => setMetodePenyelesaian("TRANSFER_BANK")}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="font-bold text-on-surface block">Transfer ke Rekening Bank Investor</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      Uang tunai dicairkan dari rekening kas perusahaan ke rekening investor (
                      <strong>{kalkulasi.profil.nama_bank} - {kalkulasi.profil.nomor_rekening}</strong>).
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    metodePenyelesaian === "REINVESTASI_MODAL"
                      ? "border-indigo-600 bg-indigo-500/5"
                      : "border-outline-variant/40 bg-surface"
                  }`}
                >
                  <input
                    type="radio"
                    name="metode"
                    checked={metodePenyelesaian === "REINVESTASI_MODAL"}
                    onChange={() => setMetodePenyelesaian("REINVESTASI_MODAL")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-on-surface block">Reinvestasi ke Modal (Compounding)</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      Dividen tidak dicairkan tunai, melainkan otomatis dikonversi menambah saldo modal pokok
                      investor di buku besar ekuitas.
                    </span>
                  </div>
                </label>
              </div>

              {metodePenyelesaian === "TRANSFER_BANK" && kalkulasi.konsolidasi.nominal_hak_investor > 0 && (
                <div>
                  <label className="font-semibold text-on-surface-variant block mb-1">
                    Rekening Kas / Bank Pembayar *
                  </label>
                  <select
                    value={selectedRekeningKas}
                    onChange={(e) => setSelectedRekeningKas(e.target.value)}
                    className="w-full md:w-96 px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleAjukanBagiHasil}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting
                    ? "Mengajukan..."
                    : `Ajukan Bagi Hasil Periode ${selectedBulan}/${selectedTahun} (Draft/Pending)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIWAYAT PENETAPAN BAGI HASIL */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface shadow-sm overflow-hidden space-y-3 p-5">
        <h2 className="font-bold text-sm md:text-base text-on-surface flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Riwayat Rekapitulasi & Pembayaran Bagi Hasil
        </h2>

        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
              <tr>
                <th className="px-4 py-3">No. Rekap / Periode</th>
                <th className="px-4 py-3 text-right">Laba Konsolidasi</th>
                <th className="px-4 py-3 text-right">Hak Investor</th>
                <th className="px-4 py-3 text-right">Hak Pengelola</th>
                <th className="px-4 py-3">Metode Penyelesaian</th>
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
                        Periode: {item.periode_bulan}/{item.periode_tahun}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(Number(item.laba_konsolidasi_kotor))}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(Number(item.nominal_hak_investor))}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-primary font-semibold">
                      {formatCurrency(Number(item.nominal_hak_pengelola))}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-on-surface block">
                        {item.metode_penyelesaian === "REINVESTASI_MODAL"
                          ? "Reinvestasi Modal"
                          : "Transfer Bank"}
                      </span>
                      {item.nama_rekening_kas && (
                        <span className="text-[10px] text-on-surface-variant/70 block">
                          Sumber: {item.nama_rekening_kas}
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
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors shadow-xs"
                            title="Approve & Eksekusi Bagi Hasil"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="px-2 py-1 rounded border border-rose-500/40 text-rose-600 font-bold text-[10px] hover:bg-rose-500/10 transition-colors"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleViewSlip(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-outline-variant/60 bg-surface hover:bg-surface-container font-semibold text-[11px] text-on-surface transition-colors"
                        >
                          <Printer className="w-3 h-3 text-emerald-600" />
                          Slip Resmi
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

      {/* SLIP BAGI HASIL MODAL VIEW (OFFICIAL PRINT) */}
      {slipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-2xl max-w-2xl w-full overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Slip Paper Container */}
            <div id="slip-print-area" className="p-6 border-2 border-dashed border-outline-variant/50 rounded-xl bg-surface-container-lowest space-y-4 text-xs">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-outline-variant/60 pb-4">
                <div>
                  <h2 className="font-black text-base uppercase tracking-wider text-primary">
                    AL-MUBAROK RETAIL GROUP
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Kantor Pusat Manajemen & Konsolidasi Cabang
                  </p>
                  <p className="text-[10px] text-on-surface-variant/70">
                    Jember, Jawa Timur • Telp: (0331) 489-xxxx
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm uppercase text-on-surface block tracking-wide">
                    SLIP PEMBAGIAN BAGI HASIL
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-600 block mt-0.5">
                    {slipData.bagi_hasil.nomor_rekap}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Periode: Bulan {slipData.bagi_hasil.periode_bulan} / {slipData.bagi_hasil.periode_tahun}
                  </span>
                </div>
              </div>

              {/* Data Pemodal */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Penerima Hak Bagi Hasil:</span>
                  <span className="font-bold text-sm text-on-surface block">
                    {slipData.profil.nama_investor}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block">
                    {slipData.profil.nama_bank} • Rek: {slipData.profil.nomor_rekening} (a.n. {slipData.profil.atas_nama_rekening})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant block">Ketentuan Nisbah:</span>
                  <span className="font-bold text-xs text-on-surface block">
                    Pengelola {slipData.bagi_hasil.nisbah_pengelola_persen}% : Investor {slipData.bagi_hasil.nisbah_investor_persen}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    Metode: {slipData.bagi_hasil.metode_penyelesaian === "REINVESTASI_MODAL" ? "Reinvestasi ke Modal" : "Transfer Kas/Bank"}
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
                  <span>Laba Bersih Dasar Pembagian Bagi Hasil:</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(Number(slipData.bagi_hasil.laba_kena_bagi_hasil))}
                  </span>
                </div>
              </div>

              {/* Total Hak Investor */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center">
                <div>
                  <span className="font-bold text-xs uppercase text-amber-800 dark:text-amber-300 block">
                    TOTAL HAK BAGI HASIL INVESTOR
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    Sesuai nisbah {slipData.bagi_hasil.nisbah_investor_persen}% dari laba dasar
                  </span>
                </div>
                <span className="font-mono font-black text-lg text-amber-700 dark:text-amber-400">
                  {formatCurrency(Number(slipData.bagi_hasil.nominal_hak_investor))}
                </span>
              </div>

              {/* Rincian Cabang Ringkas */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-on-surface-variant block uppercase mb-1">
                  Kontribusi per Cabang Terkonsolidasi ({slipData.cabang_details.length} Cabang)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  {slipData.cabang_details.map((c: any) => (
                    <div key={c.id_cabang} className="p-2 rounded bg-surface border border-outline-variant/20">
                      <span className="font-bold block truncate">{c.nama_cabang}</span>
                      <span className="font-mono text-emerald-600 font-semibold block">
                        Profit: {formatCurrency(Number(c.laba_operasional))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-8 grid grid-cols-2 text-center text-[10px] border-t border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block">Disahkan Oleh (Pengelola):</span>
                  <span className="mt-10 font-bold text-on-surface block underline">
                    Direksi Keuangan Al-Mubarok
                  </span>
                  <span className="text-[9px] text-on-surface-variant/70">
                    Tanggal: {slipData.bagi_hasil.tanggal_persetujuan?.slice(0, 10) || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Diterima Oleh (Investor):</span>
                  <span className="mt-10 font-bold text-on-surface block underline">
                    {slipData.profil.atas_nama_rekening}
                  </span>
                  <span className="text-[9px] text-on-surface-variant/70">Pemodal Utama</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSlipData(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant/60 text-xs font-semibold hover:bg-surface-container"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Slip Resmi PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
