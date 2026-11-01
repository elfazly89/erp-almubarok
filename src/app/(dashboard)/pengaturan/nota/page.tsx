"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Save,
  RotateCcw,
  Printer,
  FileText,
  Building2,
  Phone,
  Tag,
  HeartHandshake,
  QrCode,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HelpCircle,
  Eye,
  Sliders,
  Store,
  Layers,
  Award
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface NotaConfig {
  nota_nama_toko: string;
  nota_slogan: string;
  nota_show_alamat_cabang: string; // "true" | "false"
  nota_show_telepon_cabang: string;
  nota_show_logo: string;
  nota_paper_width: string; // "58mm" | "80mm"
  nota_show_kasir: string;
  nota_show_pelanggan: string;
  nota_show_barcode: string;
  nota_show_diskon: string;
  nota_show_infaq: string;
  nota_show_poin: string;
  nota_show_hemat: string;
  nota_footer_kebijakan: string;
  nota_footer_doa: string;
  nota_footer_pesan: string;
  nota_footer_medsos: string;
  nota_feed_lines: string;
  nota_auto_print: string;
  nota_rangkap_cetak: string;
}

const DEFAULT_CONFIG: NotaConfig = {
  nota_nama_toko: "ERP Al-Mubarok",
  nota_slogan: "Pusat Belanja Berkah & Terpercaya",
  nota_show_alamat_cabang: "true",
  nota_show_telepon_cabang: "true",
  nota_show_logo: "false",
  nota_paper_width: "58mm",
  nota_show_kasir: "true",
  nota_show_pelanggan: "true",
  nota_show_barcode: "true",
  nota_show_diskon: "true",
  nota_show_infaq: "true",
  nota_show_poin: "true",
  nota_show_hemat: "true",
  nota_footer_kebijakan: "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan",
  nota_footer_doa: "Jazaakumullah Khairan Katsiran",
  nota_footer_pesan: "Simpan nota ini sebagai bukti transaksi resmi",
  nota_footer_medsos: "IG: @erpalmubarok | WA: 0812-3456-7890",
  nota_feed_lines: "2",
  nota_auto_print: "false",
  nota_rangkap_cetak: "1",
};

export default function PengaturanNotaPage() {
  const { can_update, can_read, loading: permissionsLoading } = useMenuPermissions();

  const [form, setForm] = useState<NotaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"header" | "body" | "footer" | "printer">("header");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch from backend
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pengaturan/nota");
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setForm((prev) => ({ ...prev, ...result.data }));
        }
      }
    } catch (e: any) {
      showToast("Gagal memuat pengaturan nota: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan/nota", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Pengaturan nota transaksi berhasil disimpan!", "success");
      } else {
        showToast(result.message || "Gagal menyimpan pengaturan nota", "error");
      }
    } catch (e: any) {
      showToast("Gagal menyimpan pengaturan nota: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Reset to Defaults
  const handleReset = () => {
    if (confirm("Kembalikan pengaturan nota ke format standar awal?")) {
      setForm(DEFAULT_CONFIG);
      showToast("Format dikembalikan ke default. Klik 'Simpan' untuk menerapkan.", "success");
    }
  };

  // Helper toggle
  const toggleKey = (key: keyof NotaConfig) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  };

  // Helper change
  const handleChange = (key: keyof NotaConfig, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const is58mm = form.nota_paper_width === "58mm";

  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <Receipt className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk mengubah pengaturan nota transaksi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" /> Pengaturan Nota & Struk Transaksi Kasir
          </h1>
          <p className="text-on-background/70 text-xs mt-0.5">
            Konfigurasi identitas toko, tata letak struk termal, pilihan ukuran kertas, dan uji cetak real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={saving || loading}
            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Default
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-primary hover:bg-primary/95 text-on-primary disabled:opacity-50 px-4 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT-SCREEN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: CONFIGURATION FORM (7 COLS) */}
        <div className="lg:col-span-7 bg-surface border border-outline-variant/30 rounded-2xl flex flex-col overflow-hidden shadow-xs">
          {/* Navigation Tabs */}
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setActiveTab("header")}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === "header"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <Store className="w-3.5 h-3.5" /> 1. Header & Identitas
            </button>
            <button
              onClick={() => setActiveTab("body")}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === "body"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> 2. Format & Isi Struk
            </button>
            <button
              onClick={() => setActiveTab("footer")}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === "footer"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" /> 3. Footer & Pesan
            </button>
            <button
              onClick={() => setActiveTab("printer")}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === "printer"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <Printer className="w-3.5 h-3.5" /> 4. Perilaku Cetak
            </button>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat konfigurasi nota...
              </div>
            ) : (
              <>
                {/* TAB 1: HEADER & IDENTITAS */}
                {activeTab === "header" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-2.5 text-on-surface-variant">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        Informasi header akan dicetak di bagian paling atas struk belanja kasir. Nama cabang, alamat, dan nomor telepon otomatis ditarik dari profil cabang aktif tempat kasir bertransaksi.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface block">
                        Nama Toko / Brand Utama di Struk
                      </label>
                      <input
                        type="text"
                        value={form.nota_nama_toko}
                        onChange={(e) => handleChange("nota_nama_toko", e.target.value)}
                        placeholder="Contoh: ERP Al-Mubarok"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-on-surface-variant/70">
                        Dicetak dengan huruf kapital tebal di baris pertama.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface block">
                        Slogan / Sub-header Toko
                      </label>
                      <input
                        type="text"
                        value={form.nota_slogan}
                        onChange={(e) => handleChange("nota_slogan", e.target.value)}
                        placeholder="Contoh: Pusat Belanja Berkah & Terpercaya"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                      <h4 className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-secondary" /> Opsi Data Cabang Dinamis
                      </h4>

                      <label className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                        <div>
                          <span className="font-semibold text-on-surface block">Tampilkan Alamat Cabang</span>
                          <span className="text-[10px] text-on-surface-variant block">
                            Mencantumkan alamat fisik cabang kasir tempat transaksi berlangsung.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_alamat_cabang === "true"}
                          onChange={() => toggleKey("nota_show_alamat_cabang")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                        <div>
                          <span className="font-semibold text-on-surface block">Tampilkan No. Telepon / WhatsApp Cabang</span>
                          <span className="text-[10px] text-on-surface-variant block">
                            Mencantumkan nomor kontak cabang untuk kemudahan komplain/layanan pelanggan.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_telepon_cabang === "true"}
                          onChange={() => toggleKey("nota_show_telepon_cabang")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: FORMAT & ISI STRUK */}
                {activeTab === "body" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Paper Width Selection */}
                    <div className="space-y-2">
                      <label className="font-semibold text-on-surface block">
                        Ukuran Kertas Printer Thermal
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleChange("nota_paper_width", "58mm")}
                          className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            form.nota_paper_width === "58mm"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                              : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <Receipt className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-xs font-bold">58 mm (Compact)</span>
                            <span className="text-[10px] font-normal opacity-80 block">
                              Printer kasir thermal mini (32 karakter/baris). Hemat kertas.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChange("nota_paper_width", "80mm")}
                          className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            form.nota_paper_width === "80mm"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                              : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <Receipt className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-xs font-bold">80 mm (Standar POS)</span>
                            <span className="text-[10px] font-normal opacity-80 block">
                              Printer thermal meja lebar (48 karakter/baris). Rapi dan leluasa.
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Content Toggles */}
                    <div className="pt-2 border-t border-outline-variant/20 space-y-2.5">
                      <h4 className="font-bold text-on-surface text-xs">Elemen Transaksi yang Ditampilkan</h4>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Nama Kasir</span>
                          <span className="text-[10px] text-on-surface-variant block">Mencetak nama kasir yang melayani transaksi.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_kasir === "true"}
                          onChange={() => toggleKey("nota_show_kasir")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Nama Pelanggan / Member</span>
                          <span className="text-[10px] text-on-surface-variant block">Mencetak nama member atau &apos;Umum&apos;.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_pelanggan === "true"}
                          onChange={() => toggleKey("nota_show_pelanggan")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Barcode No. Invoice</span>
                          <span className="text-[10px] text-on-surface-variant block">Barcode di bawah nota untuk kemudahan scan nota saat retur/komplain.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_barcode === "true"}
                          onChange={() => toggleKey("nota_show_barcode")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Rincian Diskon & Voucher</span>
                          <span className="text-[10px] text-on-surface-variant block">Mencetak potongan harga per item atau voucher jika ada.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_diskon === "true"}
                          onChange={() => toggleKey("nota_show_diskon")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Infaq Shadaqah Sukarela</span>
                          <span className="text-[10px] text-on-surface-variant block">Mencetak rincian infaq kasir pembulatan / sukarela.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_infaq === "true"}
                          onChange={() => toggleKey("nota_show_infaq")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Poin Reward Pelanggan</span>
                          <span className="text-[10px] text-on-surface-variant block">Menampilkan poin yang didapat dan saldo poin pelanggan.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_poin === "true"}
                          onChange={() => toggleKey("nota_show_poin")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container">
                        <div>
                          <span className="font-semibold text-on-surface block">Banner Penghematan (&quot;Anda Hemat: Rp X&quot;)</span>
                          <span className="text-[10px] text-on-surface-variant block">Menampilkan total penghematan belanja pelanggan agar berbelanja lebih puas.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={form.nota_show_hemat === "true"}
                          onChange={() => toggleKey("nota_show_hemat")}
                          className="w-4 h-4 text-primary rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 3: FOOTER & PESAN */}
                {activeTab === "footer" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface block">
                        Ketentuan / Kebijakan Retur Barang
                      </label>
                      <input
                        type="text"
                        value={form.nota_footer_kebijakan}
                        onChange={(e) => handleChange("nota_footer_kebijakan", e.target.value)}
                        placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar/dikembalikan"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface block">
                        Pesan Doa / Syariah Penutup
                      </label>
                      <input
                        type="text"
                        value={form.nota_footer_doa}
                        onChange={(e) => handleChange("nota_footer_doa", e.target.value)}
                        placeholder="Contoh: Jazaakumullah Khairan Katsiran"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface block">
                        Pesan Penutup Tambahan
                      </label>
                      <input
                        type="text"
                        value={form.nota_footer_pesan}
                        onChange={(e) => handleChange("nota_footer_pesan", e.target.value)}
                        placeholder="Contoh: Simpan nota ini sebagai bukti transaksi resmi"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-on-surface block">
                        Akun Media Sosial / WhatsApp CS
                      </label>
                      <input
                        type="text"
                        value={form.nota_footer_medsos}
                        onChange={(e) => handleChange("nota_footer_medsos", e.target.value)}
                        placeholder="Contoh: IG: @erpalmubarok | WA: 0812-3456-7890"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-outline-variant/20">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-on-surface block">
                          Jarak Potong Kertas Bawah (Feed Lines)
                        </label>
                        <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                          {form.nota_feed_lines} Baris Kosong
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={form.nota_feed_lines}
                        onChange={(e) => handleChange("nota_feed_lines", e.target.value)}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <span className="text-[10px] text-on-surface-variant block">
                        Memberi spasi kosong di akhir nota agar teks tidak terpotong saat pisau pemotong (autocut) berjalan.
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 4: PERILAKU CETAK & HARDWARE */}
                {activeTab === "printer" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <label className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl cursor-pointer hover:bg-surface-container transition-colors">
                      <div>
                        <span className="font-semibold text-on-surface block">Cetak Otomatis (Auto-Print)</span>
                        <span className="text-[10px] text-on-surface-variant block">
                          Langsung memanggil dialog cetak begitu kasir menekan tombol Selesaikan Transaksi (F12).
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.nota_auto_print === "true"}
                        onChange={() => toggleKey("nota_auto_print")}
                        className="w-4 h-4 text-primary rounded cursor-pointer"
                      />
                    </label>

                    <div className="space-y-2">
                      <label className="font-semibold text-on-surface block">
                        Jumlah Rangkap Struk
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleChange("nota_rangkap_cetak", "1")}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                            form.nota_rangkap_cetak === "1"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                              : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-xs font-bold">1 Rangkap</span>
                            <span className="text-[10px] font-normal opacity-80 block">
                              Cetak 1 nota struk untuk pelanggan saja.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChange("nota_rangkap_cetak", "2")}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                            form.nota_rangkap_cetak === "2"
                              ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                              : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-xs font-bold">2 Rangkap</span>
                            <span className="text-[10px] font-normal opacity-80 block">
                              Cetak 2 nota struk (1 nota pelanggan + 1 nota arsip toko).
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE RECEIPT SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col overflow-hidden shadow-xs">
          {/* Simulator Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 shrink-0">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary" />
              <span className="font-bold text-xs text-on-surface">Simulasi Struk Real-Time</span>
              <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 font-mono">
                {form.nota_paper_width}
              </span>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-secondary hover:bg-secondary/90 text-on-secondary px-3 py-1 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Kirim ke printer untuk tes cetak fisik kertas"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Struk Sampel
            </button>
          </div>

          {/* Receipt Canvas */}
          <div className="flex-1 overflow-y-auto py-4 flex justify-center items-start">
            <div
              id="print-sample-receipt"
              className={`bg-white text-black p-4 rounded-xl shadow-lg border border-slate-300 font-mono transition-all duration-300 print:shadow-none print:border-0 print:p-0 ${
                is58mm ? "w-[270px] text-[10px]" : "w-[360px] text-[11px]"
              }`}
            >
              {/* Header */}
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-400">
                <h3 className="font-bold text-xs tracking-wider uppercase">
                  {form.nota_nama_toko || "ERP AL-MUBAROK"}
                </h3>
                {form.nota_slogan && (
                  <p className="text-[9px] text-gray-700">{form.nota_slogan}</p>
                )}
                {form.nota_show_alamat_cabang === "true" && (
                  <p className="text-[8.5px] text-gray-600">Jl. Raya Pusat Grosir No. 12, Jawa Timur</p>
                )}
                {form.nota_show_telepon_cabang === "true" && (
                  <p className="text-[8.5px] text-gray-600">Telp/WA: 0812-3456-7890</p>
                )}
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-0.5 border-b border-dashed border-gray-400 py-1.5 text-[9.5px]">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold">INV/20261031/1/0088</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date().toISOString().slice(0, 10)} 14:32:05</span>
                </div>
                {form.nota_show_kasir === "true" && (
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>Ahmad Fawaid (Shift 1)</span>
                  </div>
                )}
                {form.nota_show_pelanggan === "true" && (
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>Bpk. Bambang S. (Gold)</span>
                  </div>
                )}
              </div>

              {/* Sample Items List */}
              <div className="space-y-1.5 border-b border-dashed border-gray-400 py-2 text-[9.5px]">
                <div className="space-y-0.5">
                  <span className="font-semibold block">MINYAK GORENG SANIA 2L</span>
                  <div className="flex justify-between text-gray-700">
                    <span>2 x Rp 34.000 / PCH</span>
                    <span>Rp 68.000</span>
                  </div>
                  {form.nota_show_diskon === "true" && (
                    <div className="text-[8.5px] text-red-600 text-right">Diskon Promo: -Rp 4.000</div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="font-semibold block">BERAS PREMIUM AL-MUBAROK 5KG</span>
                  <div className="flex justify-between text-gray-700">
                    <span>1 x Rp 72.000 / SAK</span>
                    <span>Rp 72.000</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="font-semibold block">GULA PASIR ROSE BRAND 1KG</span>
                  <div className="flex justify-between text-gray-700">
                    <span>2 x Rp 17.500 / PCS</span>
                    <span>Rp 35.000</span>
                  </div>
                </div>
              </div>

              {/* Calculations */}
              <div className="space-y-1 py-1.5 text-right text-[9.5px]">
                <div className="flex justify-between">
                  <span>Subtotal Belanja:</span>
                  <span>Rp 175.000</span>
                </div>
                {form.nota_show_diskon === "true" && (
                  <div className="flex justify-between text-red-600">
                    <span>Total Diskon & Voucher:</span>
                    <span>-Rp 9.000</span>
                  </div>
                )}
                {form.nota_show_infaq === "true" && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Infaq Shadaqah Kasir:</span>
                    <span>+Rp 1.000</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs border-t border-dashed border-gray-400 pt-1 text-black">
                  <span>TOTAL BILL:</span>
                  <span>Rp 167.000</span>
                </div>
                <div className="flex justify-between text-gray-700 pt-0.5">
                  <span>Bayar (Tunai):</span>
                  <span>Rp 200.000</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>Kembalian:</span>
                  <span>Rp 33.000</span>
                </div>
              </div>

              {/* Savings Banner */}
              {form.nota_show_hemat === "true" && (
                <div className="my-1.5 p-1 bg-gray-100 border border-gray-300 text-center font-bold text-[9px]">
                  *** ANDA HEMAT: Rp 9.000 ***
                </div>
              )}

              {/* Points Information */}
              {form.nota_show_poin === "true" && (
                <div className="border-t border-dashed border-gray-300 py-1 text-[8.5px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Poin Didapat Hari Ini:</span>
                    <span className="font-bold">+16 Poin</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Saldo Poin Anda:</span>
                    <span className="font-bold">245 Poin</span>
                  </div>
                </div>
              )}

              {/* Barcode Simulation */}
              {form.nota_show_barcode === "true" && (
                <div className="text-center py-2 border-t border-dashed border-gray-300">
                  <div className="font-mono tracking-widest text-base font-bold scale-y-125 inline-block text-black">
                    ||| | |||| | ||| || ||||
                  </div>
                  <p className="text-[8px] font-mono mt-0.5 text-gray-600">INV/20261031/1/0088</p>
                </div>
              )}

              {/* Footer Messages */}
              <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[8.5px] space-y-0.5 text-gray-700">
                {form.nota_footer_doa && (
                  <p className="font-bold text-black">{form.nota_footer_doa}</p>
                )}
                {form.nota_footer_kebijakan && (
                  <p>{form.nota_footer_kebijakan}</p>
                )}
                {form.nota_footer_pesan && (
                  <p>{form.nota_footer_pesan}</p>
                )}
                {form.nota_footer_medsos && (
                  <p className="text-[8px] text-gray-600 font-medium pt-0.5">{form.nota_footer_medsos}</p>
                )}
              </div>

              {/* Empty Feed Lines */}
              {Array.from({ length: parseInt(form.nota_feed_lines) || 1 }).map((_, i) => (
                <div key={i} className="h-3 text-transparent">
                  .
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS RULES FOR SAMPLE RECEIPT TEST */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-sample-receipt, #print-sample-receipt * {
            visibility: visible;
          }
          #print-sample-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${form.nota_paper_width === "58mm" ? "58mm" : "80mm"} !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          button, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-white animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 border-emerald-500/30"
              : "bg-rose-600 border-rose-500/30"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

