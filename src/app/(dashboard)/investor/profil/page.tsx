"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Landmark,
  Save,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

interface CabangTerkait {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  alamat: string;
  telepon: string | null;
}

export default function InvestorProfilPage() {
  const [profil, setProfil] = useState<InvestorProfil | null>(null);
  const [cabangList, setCabangList] = useState<CabangTerkait[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const nisbahPengelola = 100 - nisbahInvestor;

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [resProfil, resCabang] = await Promise.all([
        fetch("/api/investor/profil"),
        fetch("/api/investor/cabang-terkait"),
      ]);

      const dataProfil = await resProfil.json();
      const dataCabang = await resCabang.json();

      if (dataProfil.success && dataProfil.data) {
        const p = dataProfil.data;
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
      }

      if (dataCabang.success && dataCabang.data) {
        setCabangList(dataCabang.data);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal memuat data profil: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setProfil(json.data);
      setMessage({ type: "success", text: "Profil dan nisbah investor berhasil diperbarui." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
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
              Profil & Pengaturan Investor
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant">
              Pengaturan pemodal tunggal, nomor rekening penerima dividen, dan nisbah konsolidasi
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Muat Ulang
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs md:text-sm flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* READONLY STATUS HIGHLIGHTS */}
      {profil && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-semibold">
              Saldo Modal Aktif
            </span>
            <span className="text-lg font-bold font-mono text-on-surface mt-1 block">
              {formatCurrency(Number(profil.saldo_modal_saat_ini || 0))}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Dapat ditambah/ditarik di menu Transaksi Modal
            </span>
          </div>

          <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-semibold">
              Akumulasi Defisit (Rugi Lalu)
            </span>
            <span
              className={`text-lg font-bold font-mono mt-1 block ${
                Number(profil.akumulasi_defisit || 0) > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(Number(profil.akumulasi_defisit || 0))}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Wajib ditutup laba sebelum pencairan berikutnya
            </span>
          </div>

          <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-semibold">
              Status Entitas
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {profil.status}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
              Pemodal Tunggal Terpusat
            </span>
          </div>
        </div>
      )}

      {/* FORM PENGATURAN */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: NISBAH BAGI HASIL */}
        <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
            <Sliders className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-bold text-sm md:text-base text-on-surface">
                Nisbah Bagi Hasil Konsolidasi
              </h2>
              <p className="text-xs text-on-surface-variant">
                Persentase pembagian laba bersih konsolidasi seluruh cabang investor
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="text-center sm:text-left">
                <span className="text-xs font-semibold text-primary block">
                  Pengelola (Al-Mubarok)
                </span>
                <span className="text-2xl font-bold font-mono text-primary">
                  {nisbahPengelola}%
                </span>
              </div>

              <div className="flex-1 max-w-md px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={nisbahInvestor}
                  onChange={(e) => setNisbahInvestor(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/70 mt-1">
                  <span>0% Investor</span>
                  <span>50% : 50%</span>
                  <span>100% Investor</span>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">
                  Investor Utama
                </span>
                <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {nisbahInvestor}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-on-surface-variant/80">
              * Nisbah ini berlaku otomatis untuk seluruh cabang yang bertipe <strong>INVESTOR</strong>{" "}
              saat proses closing bagi hasil bulanan.
            </p>
          </div>
        </div>

        {/* SECTION 2: IDENTITAS INVESTOR */}
        <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-bold text-sm md:text-base text-on-surface">
                Identitas Pemodal / Entitas Investor
              </h2>
              <p className="text-xs text-on-surface-variant">
                Informasi resmi investor penerima bagi hasil
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Nama Lengkap / Nama Entitas *
              </label>
              <input
                type="text"
                required
                value={namaInvestor}
                onChange={(e) => setNamaInvestor(e.target.value)}
                placeholder="Contoh: Bpk. H. Ahmad Fauzi / PT Investasi Al-Mubarok"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Nomor Identitas (NIK / NPWP)
              </label>
              <input
                type="text"
                value={nomorIdentitas}
                onChange={(e) => setNomorIdentitas(e.target.value)}
                placeholder="3509xxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-on-surface-variant/60" />
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-on-surface-variant/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@domain.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-on-surface-variant block mb-1">
                Alamat Domisili
              </label>
              <textarea
                rows={2}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jl. Gajah Mada No. 12, Jember..."
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: REKENING BANK PENERIMA DIVIDEN */}
        <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-sm md:text-base text-on-surface">
                Rekening Bank Penerima Bagi Hasil
              </h2>
              <p className="text-xs text-on-surface-variant">
                Rekening tujuan transfer saat eksekusi pembayaran bagi hasil dilakukan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Nama Bank Penerima *
              </label>
              <input
                type="text"
                required
                value={namaBank}
                onChange={(e) => setNamaBank(e.target.value)}
                placeholder="BCA / Mandiri / BNI / BRI / BSI"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Nomor Rekening *
              </label>
              <input
                type="text"
                required
                value={nomorRekening}
                onChange={(e) => setNomorRekening(e.target.value)}
                placeholder="143009988xxxx"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-on-surface-variant block mb-1">
                Atas Nama Rekening *
              </label>
              <input
                type="text"
                required
                value={atasNamaRekening}
                onChange={(e) => setAtasNamaRekening(e.target.value)}
                placeholder="Nama Pemilik Rekening"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: JARINGAN CABANG TERKAIT */}
        <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-bold text-sm md:text-base text-on-surface">
                  Cabang Investor yang Terdaftar ({cabangList.length})
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Cabang yang dikonsolidasikan otomatis di bawah naungan investor ini
                </p>
              </div>
            </div>
            <Link
              href="/cabang"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Kelola di Master Cabang
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {cabangList.map((c) => (
              <div
                key={c.id_cabang}
                className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-on-surface">{c.nama_cabang}</span>
                  <span className="text-[11px] text-on-surface-variant block">{c.alamat}</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-600">
                  {c.kode_cabang}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs md:text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Menyimpan Perubahan..." : "Simpan Pengaturan Profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
