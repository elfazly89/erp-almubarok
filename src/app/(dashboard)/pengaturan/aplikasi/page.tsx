"use client";

import { useState, useEffect } from "react";
import { Sliders, Save, RefreshCw, CheckCircle2, XCircle, Info, Globe, Building, Zap, Clock, TrendingUp, ShieldCheck } from "lucide-react";
import { useAppSettings } from "@/components/providers/AppSettingsProvider";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

export default function PengaturanAplikasiPage() {
  const { can_update, loading: permissionsLoading } = useMenuPermissions();
  const { refreshSettings } = useAppSettings();

  const [appName, setAppName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cashApprovalThreshold, setCashApprovalThreshold] = useState("500000");

  const [coaPenjualan, setCoaPenjualan] = useState("7");
  const [coaOperasional, setCoaOperasional] = useState("10");
  const [coaGaji, setCoaGaji] = useState("8");
  const [coaPembelian, setCoaPembelian] = useState("5");
  const [coaList, setCoaList] = useState<any[]>([]);

  // FSN & Procurement Buffer Settings
  const [fsnFastDays, setFsnFastDays] = useState("3");
  const [fsnMediumDays, setFsnMediumDays] = useState("14");
  const [fsnSlowDays, setFsnSlowDays] = useState("60");
  const [fsnIncubationDays, setFsnIncubationDays] = useState("30");
  const [fsnFastBufferPct, setFsnFastBufferPct] = useState("20");
  const [fsnSlowBufferPct, setFsnSlowBufferPct] = useState("30");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch settings from API
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pengaturan/aplikasi");
      const coaRes = await fetch("/api/akuntansi/daftar-akun");

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setAppName(result.data.app_name || "");
          setCompanyName(result.data.company_name || "");
          setCashApprovalThreshold(result.data.cash_approval_threshold || "500000");
          setCoaPenjualan(result.data.coa_kategori_penjualan || "7");
          setCoaOperasional(result.data.coa_kategori_operasional || "10");
          setCoaGaji(result.data.coa_kategori_gaji || "8");
          setCoaPembelian(result.data.coa_kategori_pembelian || "5");
          setFsnFastDays(result.data.fsn_fast_days || "3");
          setFsnMediumDays(result.data.fsn_medium_days || "14");
          setFsnSlowDays(result.data.fsn_slow_days || "60");
          setFsnIncubationDays(result.data.fsn_incubation_days || "30");
          setFsnFastBufferPct(result.data.fsn_fast_buffer_pct || "20");
          setFsnSlowBufferPct(result.data.fsn_slow_buffer_pct || "30");
        } else {
          showToast("Gagal memuat pengaturan aplikasi", "error");
        }
      }
      if (coaRes.ok) {
        const coaData = await coaRes.json();
        setCoaList(coaData || []);
      }
    } catch {
      showToast("Gagal memuat pengaturan aplikasi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!appName.trim() || !companyName.trim()) {
      showToast("Semua field wajib diisi", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pengaturan/aplikasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName.trim(),
          company_name: companyName.trim(),
          cash_approval_threshold: cashApprovalThreshold.trim(),
          coa_kategori_penjualan: coaPenjualan,
          coa_kategori_operasional: coaOperasional,
          coa_kategori_gaji: coaGaji,
          coa_kategori_pembelian: coaPembelian,
          fsn_fast_days: fsnFastDays,
          fsn_medium_days: fsnMediumDays,
          fsn_slow_days: fsnSlowDays,
          fsn_incubation_days: fsnIncubationDays,
          fsn_fast_buffer_pct: fsnFastBufferPct,
          fsn_slow_buffer_pct: fsnSlowBufferPct,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        if (result.recalculateResult) {
          const r = result.recalculateResult;
          showToast(
            `Pengaturan disimpan & Level FSN disinkronkan (${r.fast} Fast, ${r.medium} Medium, ${r.slow} Slow, ${r.dead} Dead Stock)`,
            "success"
          );
        } else {
          showToast("Pengaturan aplikasi berhasil disimpan!", "success");
        }
        // Refresh the global AppSettingsProvider context
        await refreshSettings();
      } else {
        showToast(result.message || "Gagal menyimpan pengaturan", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Gagal menyimpan pengaturan", "error");
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 text-on-surface-variant">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memeriksa hak akses...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-4 overflow-auto text-on-background relative p-1">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl animate-in slide-in-from-top-5 duration-200 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 backdrop-blur-md" 
            : "bg-error/10 border-error/25 text-error backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary" /> Pengaturan Aplikasi
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">Konfigurasi nama aplikasi dan informasi instansi/perusahaan secara global</p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl max-w-3xl shadow-xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat pengaturan...
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-xs text-on-surface-variant">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-on-surface font-semibold block">Informasi Sinkronisasi</strong>
                <span>Nama aplikasi yang diset di sini akan langsung disebarluaskan secara real-time ke halaman login, tab browser (judul halaman), kop cetak, nota transaksi, dan sidebar menu.</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Nama Aplikasi (Display Name)
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  placeholder="Contoh: Mizan ERP / Al-Mubarok ERP"
                  disabled={!can_update}
                />
                <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Nama utama sistem ERP Anda yang akan tertera di pojok kiri atas sidebar dan tab web browser.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" /> Nama Instansi / Perusahaan
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  placeholder="Contoh: Sistem Manajemen Terpadu"
                  disabled={!can_update}
                />
                <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Nama instansi yang akan dicetak pada kop surat jalan, invoice pembelian, dan nota POS kasir.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-primary" /> Batas (Threshold) Approval Kas Keluar (Rp)
                </label>
                <input
                  type="number"
                  value={cashApprovalThreshold}
                  onChange={(e) => setCashApprovalThreshold(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  placeholder="Contoh: 500000"
                  disabled={!can_update}
                />
                <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Batas maksimal nominal pengeluaran kas tanpa persetujuan (approval) bendahara/supervisor.</span>
              </div>

              {/* COA Mappings */}
              <div className="pt-6 border-t border-outline-variant/20 space-y-4">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" /> Pemetaan Akun COA Akuntansi
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                      Akun Pendapatan Penjualan Toko
                    </label>
                    <select
                      value={coaPenjualan}
                      onChange={(e) => setCoaPenjualan(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      disabled={!can_update}
                    >
                      {coaList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.kode_akun} — {c.nama_akun}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                      Akun Beban Operasional
                    </label>
                    <select
                      value={coaOperasional}
                      onChange={(e) => setCoaOperasional(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      disabled={!can_update}
                    >
                      {coaList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.kode_akun} — {c.nama_akun}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                      Akun Beban Gaji Karyawan
                    </label>
                    <select
                      value={coaGaji}
                      onChange={(e) => setCoaGaji(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      disabled={!can_update}
                    >
                      {coaList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.kode_akun} — {c.nama_akun}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                      Akun Hutang Usaha (Pembelian)
                    </label>
                    <select
                      value={coaPembelian}
                      onChange={(e) => setCoaPembelian(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      disabled={!can_update}
                    >
                      {coaList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.kode_akun} — {c.nama_akun}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* FSN & Procurement Buffer Settings */}
              <div className="pt-6 border-t border-outline-variant/20 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Analisis Perputaran Barang (FSN) & Buffer Pengadaan
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Otomatis Sinkron Database
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Konfigurasikan batas hari sejak penjualan terakhir untuk klasifikasi produk (Fast, Medium, Slow Moving, Dead Stock) serta penyesuaian otomatis safety buffer pada modul Saran Order Pembelian PO.
                </p>

                {/* Sub-grid 1: Ambang Batas Hari */}
                <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-4 space-y-3.5">
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Ambang Batas Hari Penjualan Terakhir (Days Since Last Sale)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fast Moving (&le; Hari)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={fsnFastDays}
                        onChange={(e) => setFsnFastDays(e.target.value)}
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                        placeholder="3"
                        disabled={!can_update}
                      />
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Default: 3 hari</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-sky-600 dark:text-sky-400 mb-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span> Medium Moving (&le; Hari)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={fsnMediumDays}
                        onChange={(e) => setFsnMediumDays(e.target.value)}
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                        placeholder="14"
                        disabled={!can_update}
                      />
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Default: 14 hari</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Slow Moving (&le; Hari)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={fsnSlowDays}
                        onChange={(e) => setFsnSlowDays(e.target.value)}
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                        placeholder="60"
                        disabled={!can_update}
                      />
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Default: 60 hari (&gt;60 = Dead Stock)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20">
                    <label className="block text-[11px] font-semibold text-on-surface mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Masa Inkubasi Produk Baru
                    </label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        min="7"
                        max="90"
                        value={fsnIncubationDays}
                        onChange={(e) => setFsnIncubationDays(e.target.value)}
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                        placeholder="30"
                        disabled={!can_update}
                      />
                      <span className="text-xs text-on-surface-variant shrink-0 font-medium">Hari</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant/70 mt-1 block">
                      Produk baru terdaftar dalam rentang ini dipertahankan sebagai Medium dan tidak langsung dicap Dead Stock meskipun belum ada penjualan.
                    </span>
                  </div>
                </div>

                {/* Sub-grid 2: Safety Buffer Factor Pembelian */}
                <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-4 space-y-3.5">
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> Safety Buffer Pengadaan (Modul Saran Order PO)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                        ⚡ Ekstra Buffer Fast Moving (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-500">+</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={fsnFastBufferPct}
                          onChange={(e) => setFsnFastBufferPct(e.target.value)}
                          className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                          placeholder="20"
                          disabled={!can_update}
                        />
                        <span className="text-xs text-on-surface-variant font-semibold">%</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Default: +20% (Safety factor 1.20)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                        ⏳ Perampingan Buffer Slow Moving (%)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-500">-</span>
                        <input
                          type="number"
                          min="0"
                          max="80"
                          value={fsnSlowBufferPct}
                          onChange={(e) => setFsnSlowBufferPct(e.target.value)}
                          className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                          placeholder="30"
                          disabled={!can_update}
                        />
                        <span className="text-xs text-on-surface-variant font-semibold">%</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Default: -30% (Safety factor 0.70)</span>
                    </div>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-rose-600 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>Dead Stock:</strong> Diberlakukan buffer 0% dan otomatis diblokir dari saran pemesanan PO untuk melindungi modal kerja.</span>
                  </div>
                </div>
              </div>
            </div>

            {can_update && (
              <div className="flex items-center justify-end pt-4 border-t border-outline-variant/20">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary disabled:opacity-60 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Pengaturan
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
