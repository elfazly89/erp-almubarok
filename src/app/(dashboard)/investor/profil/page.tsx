"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sliders,
  Landmark,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Undo2,
  DollarSign,
  Calculator,
  Sparkles,
  Info,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

interface InvestorProfil {
  id: number;
  nama_investor: string;
  nomor_identitas: string | null;
  telepon: string | null;
  email: string | null;
  alamat: string | null;
  nama_bank: string;
  nomor_rekening: string;
  atas_nama_rekening: string;
  nisbah_pengelola: string;
  nisbah_investor: string;
  saldo_modal_saat_ini: string;
  akumulasi_defisit: string;
  status: string;
}

type TabType = "identitas" | "rekening" | "nisbah";

export default function InvestorProfilPage() {
  const [profil, setProfil] = useState<InvestorProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<TabType>("identitas");

  // Form states
  const [namaInvestor, setNamaInvestor] = useState("");
  const [nomorIdentitas, setNomorIdentitas] = useState("");
  const [telepon, setTelepon] = useState("");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [nomorRekening, setNomorRekening] = useState("");
  const [atasNamaRekening, setAtasNamaRekening] = useState("");
  const [nisbahInvestor, setNisbahInvestor] = useState(60);

  // Simulation State for Nisbah Calculator
  const [simulasiNominal, setSimulasiNominal] = useState<number>(100000000);

  const nisbahPengelola = 100 - nisbahInvestor;

  const populateForm = (p: InvestorProfil) => {
    setProfil(p);
    setNamaInvestor(p.nama_investor || "");
    setNomorIdentitas(p.nomor_identitas || "");
    setTelepon(p.telepon || "");
    setEmail(p.email || "");
    setAlamat(p.alamat || "");
    setNamaBank(p.nama_bank || "");
    setNomorRekening(p.nomor_rekening || "");
    setAtasNamaRekening(p.atas_nama_rekening || "");
    setNisbahInvestor(Math.round(parseFloat(p.nisbah_investor || "60")));
  };

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/investor/profil");
      const json = await res.json();

      if (json.success && json.data) {
        populateForm(json.data);
      } else {
        throw new Error(json.error || "Gagal memuat data profil");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal memuat profil: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!profil) return false;
    const initialNisbah = Math.round(parseFloat(profil.nisbah_investor || "60"));
    return (
      namaInvestor !== (profil.nama_investor || "") ||
      nomorIdentitas !== (profil.nomor_identitas || "") ||
      telepon !== (profil.telepon || "") ||
      email !== (profil.email || "") ||
      alamat !== (profil.alamat || "") ||
      namaBank !== (profil.nama_bank || "") ||
      nomorRekening !== (profil.nomor_rekening || "") ||
      atasNamaRekening !== (profil.atas_nama_rekening || "") ||
      nisbahInvestor !== initialNisbah
    );
  }, [
    profil,
    namaInvestor,
    nomorIdentitas,
    telepon,
    email,
    alamat,
    namaBank,
    nomorRekening,
    atasNamaRekening,
    nisbahInvestor,
  ]);

  const handleReset = () => {
    if (profil) {
      populateForm(profil);
      setMessage(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/investor/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_investor: namaInvestor,
          nomor_identitas: nomorIdentitas,
          telepon,
          email,
          alamat,
          nama_bank: namaBank,
          nomor_rekening: nomorRekening,
          atas_nama_rekening: atasNamaRekening,
          nisbah_pengelola: nisbahPengelola,
          nisbah_investor: nisbahInvestor,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan perubahan");
      }

      populateForm(json.data);
      setMessage({ type: "success", text: "Profil dan pengaturan nisbah investor berhasil diperbarui." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Nisbah Simulation Calculations
  const simulasiHakInvestor = (simulasiNominal * nisbahInvestor) / 100;
  const simulasiHakPengelola = (simulasiNominal * nisbahPengelola) / 100;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto pb-28">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/investor"
            className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant transition-colors shadow-xs"
            title="Kembali ke Dasbor Investor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-on-surface">
              Profil & Pengaturan Investor
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant">
              Konfigurasi identitas pemodal, rekening penampung dividen, dan nisbah bagi hasil konsolidasi
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* FEEDBACK BANNER (SUCCESS / ERROR) */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm flex items-center gap-3 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EXECUTIVE IDENTITY BANNER & OVERVIEW
      ───────────────────────────────────────────────────────────── */}
      {profil && (
        <div className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-gradient-to-br from-surface-container-high/90 via-surface-container-low to-surface p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Identity Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-amber-500/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-xs flex-shrink-0">
                {getInitials(profil.nama_investor || "Investor")}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-xl font-extrabold text-on-surface">
                    {profil.nama_investor || "Investor Utama Al-Mubarok"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    {profil.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  ID Resmi: <span className="font-mono">{profil.nomor_identitas || "3509012345670001"}</span> • Rekening:{" "}
                  <span className="font-semibold">{profil.nama_bank} ({profil.nomor_rekening})</span>
                </p>
              </div>
            </div>

            {/* 3 Executive Mini Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Saldo Modal Aktif */}
              <div className="p-3 rounded-2xl bg-surface/80 border border-outline-variant/30 min-w-[150px]">
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Saldo Modal Aktif
                </span>
                <span className="text-sm md:text-base font-bold font-mono text-on-surface block mt-0.5">
                  {formatCurrency(Number(profil.saldo_modal_saat_ini || 0))}
                </span>
              </div>

              {/* Akumulasi Defisit */}
              <div className="p-3 rounded-2xl bg-surface/80 border border-outline-variant/30 min-w-[150px]">
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Akumulasi Defisit
                </span>
                <span
                  className={`text-sm md:text-base font-bold font-mono block mt-0.5 ${
                    Number(profil.akumulasi_defisit || 0) > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatCurrency(Number(profil.akumulasi_defisit || 0))}
                </span>
              </div>

              {/* Rasio Nisbah */}
              <div className="p-3 rounded-2xl bg-surface/80 border border-outline-variant/30 min-w-[150px]">
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Nisbah Pembagian
                </span>
                <span className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  {nisbahInvestor}% : {nisbahPengelola}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. STRUCTURED NAVIGATION TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container border border-outline-variant/30 overflow-x-auto">
        <button
          onClick={() => setActiveTab("identitas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
            activeTab === "identitas"
              ? "bg-surface text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <User className="w-4 h-4 text-primary" />
          <span>Identitas & Kontak</span>
        </button>

        <button
          onClick={() => setActiveTab("rekening")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
            activeTab === "rekening"
              ? "bg-surface text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Rekening Bank</span>
        </button>

        <button
          onClick={() => setActiveTab("nisbah")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
            activeTab === "nisbah"
              ? "bg-surface text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-500" />
          <span>Kebijakan Nisbah</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TAB CONTENT
      ───────────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs">
        {/* TAB 1: IDENTITAS & KONTAK */}
        {activeTab === "identitas" && (
          <div className="space-y-6">
            <div className="border-b border-outline-variant/20 pb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span>Identitas Pemodal / Entitas Investor</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Data resmi entitas pemodal yang tercatat pada akta kerja sama dan laporan akuntansi ekuitas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Nama Lengkap / Nama Entitas *
                </label>
                <input
                  type="text"
                  required
                  value={namaInvestor}
                  onChange={(e) => setNamaInvestor(e.target.value)}
                  placeholder="Contoh: Bpk. H. Ahmad Fauzi / PT Investasi Al-Mubarok"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Nomor Identitas Resmi (NIK / NPWP)
                </label>
                <input
                  type="text"
                  value={nomorIdentitas}
                  onChange={(e) => setNomorIdentitas(e.target.value)}
                  placeholder="3509xxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-on-surface-variant/60" />
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Alamat Email Resmi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-on-surface-variant/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Alamat Domisili / Korespondensi
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-on-surface-variant/60" />
                  <textarea
                    rows={3}
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Jl. Gajah Mada No. 12, Jember, Jawa Timur..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REKENING BANK PENERIMA DIVIDEN */}
        {activeTab === "rekening" && (
          <div className="space-y-6">
            <div className="border-b border-outline-variant/20 pb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Rekening Bank Penampung Bagi Hasil</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Rekening tujuan transfer riil saat pembayaran dividen dieksekusi dari kas & bank pusat
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-on-surface-variant leading-relaxed">
                Pastikan nama pemilik rekening sesuai persis dengan buku tabungan bank agar proses
                pemindahbukuan otomatis tidak terkendala rekonsiliasi perbankan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Nama Bank Penerima *
                </label>
                <input
                  type="text"
                  required
                  value={namaBank}
                  onChange={(e) => setNamaBank(e.target.value)}
                  placeholder="Contoh: Bank Syariah Indonesia / Bank Mandiri / BCA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  placeholder="1430099887766"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-on-surface-variant block">
                  Atas Nama Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={atasNamaRekening}
                  onChange={(e) => setAtasNamaRekening(e.target.value)}
                  placeholder="Nama Pemilik Rekening Sesuai Buku Tabungan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KEBIJAKAN NISBAH & SIMULASI LABA */}
        {activeTab === "nisbah" && (
          <div className="space-y-6">
            <div className="border-b border-outline-variant/20 pb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Nisbah Pembagian Hasil Usaha</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Persentase bagi hasil konsolidasi laba bersih seluruh cabang yang dinaungi investor
              </p>
            </div>

            {/* Slider Kontrol Nisbah */}
            <div className="p-5 md:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">
                    Porsi Hak Investor
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                    {nisbahInvestor}%
                  </span>
                </div>

                <div className="flex-1 max-w-lg px-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={nisbahInvestor}
                    onChange={(e) => setNisbahInvestor(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-surface-container-highest rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-on-surface-variant/70 mt-2">
                    <span>0% Investor</span>
                    <span className="font-bold text-on-surface">50% : 50%</span>
                    <span>100% Investor</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-semibold text-primary block">
                    Porsi Pengelola (Al-Mubarok)
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-primary">
                    {nisbahPengelola}%
                  </span>
                </div>
              </div>

              {/* Preset Tombol Cepat */}
              <div className="pt-4 border-t border-outline-variant/20 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-on-surface-variant font-medium">Pilihan Cepat:</span>
                <button
                  type="button"
                  onClick={() => setNisbahInvestor(60)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    nisbahInvestor === 60
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container"
                  }`}
                >
                  60% Investor : 40% Pengelola (Standar)
                </button>
                <button
                  type="button"
                  onClick={() => setNisbahInvestor(70)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    nisbahInvestor === 70
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container"
                  }`}
                >
                  70% Investor : 30% Pengelola
                </button>
                <button
                  type="button"
                  onClick={() => setNisbahInvestor(50)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    nisbahInvestor === 50
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container"
                  }`}
                >
                  50% : 50%
                </button>
              </div>
            </div>

            {/* Simulasi Pembagian Laba Konsolidasi Real-Time */}
            <div className="p-5 md:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-xs md:text-sm text-on-surface">
                    Simulasi Pembagian Laba Konsolidasi Real-Time
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-on-surface-variant">Laba Bersih Simulasi:</span>
                  <select
                    value={simulasiNominal}
                    onChange={(e) => setSimulasiNominal(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface font-semibold text-on-surface focus:outline-none"
                  >
                    <option value={50000000}>Rp 50.000.000</option>
                    <option value={100000000}>Rp 100.000.000</option>
                    <option value={250000000}>Rp 250.000.000</option>
                    <option value={500000000}>Rp 500.000.000</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block">
                    Hak Dividen Investor ({nisbahInvestor}%)
                  </span>
                  <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 block mt-1">
                    {formatCurrency(simulasiHakInvestor)}
                  </span>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                    Dapat dicairkan via transfer bank atau direinvestasikan menambah modal ekuitas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-[11px] font-semibold text-primary block">
                    Hak Pengelola Al-Mubarok ({nisbahPengelola}%)
                  </span>
                  <span className="text-xl font-extrabold font-mono text-primary block mt-1">
                    {formatCurrency(simulasiHakPengelola)}
                  </span>
                  <p className="text-[10px] text-primary/80 mt-1">
                    Diakui sebagai pendapatan bagi hasil pengelola konsolidasi pusat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. STICKY FLOATING SAVE BAR
          (Otomatis muncul melayang di bawah saat terdapat perubahan data)
      ───────────────────────────────────────────────────────────── */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl animate-in slide-in-from-bottom duration-300">
          <div className="p-4 rounded-2xl bg-surface/95 backdrop-blur-md border border-outline-variant/60 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-semibold text-on-surface">
                Terdapat perubahan profil atau nisbah yang belum disimpan
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface text-on-surface font-semibold text-xs hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
              >
                <Undo2 className="w-3.5 h-3.5 text-on-surface-variant" />
                <span>Batal</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all active:scale-95 shadow-md disabled:opacity-50"
              >
                <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
                <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
