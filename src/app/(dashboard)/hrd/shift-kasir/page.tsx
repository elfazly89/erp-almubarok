"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Unlock,
  Lock,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  UserCheck,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Shift {
  id: number;
  id_cabang: number;
  id_kasir: number;
  nama_kasir: string;
  kode_kasir: string;
  id_rekening: number;
  nama_rekening: string;
  waktu_buka: string;
  waktu_tutup: string | null;
  saldo_awal: number;
  total_sistem: number;
  total_tunai: number;
  total_transfer: number;
  uang_fisik: number | null;
  selisih: number | null;
  setoran: number;
  catatan: string | null;
  status: "OPEN" | "CLOSING" | "VERIFIED" | "DISCREPANCY";
}

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
  is_active: boolean;
  jenis: string;
}

export default function ShiftKasirPage() {
  const { can_create, can_read, can_update, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Shift[]>([]);
  const [rekenings, setRekenings] = useState<Rekening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showBukaModal, setShowBukaModal] = useState(false);
  const [showTutupModal, setShowTutupModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Form buka shift
  const [formSaldoAwal, setFormSaldoAwal] = useState("0");
  const [formRekening, setFormRekening] = useState("");

  // Form tutup shift
  const [formUangFisik, setFormUangFisik] = useState("");
  const [formSetoran, setFormSetoran] = useState("0");
  const [formCatatan, setFormCatatan] = useState("");

  // Toast & Saving
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const shiftRes = await fetch("/api/kas/shift");
      const rekRes = await fetch("/api/kas/rekening");

      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        if (shiftData.success) setList(shiftData.data);
      }
      if (rekRes.ok) {
        const rekData = await rekRes.json();
        if (rekData.success) {
          // filter cash box accounts (KAS_TOKO)
          const cashReks = rekData.data.filter((r: any) => r.is_active && r.jenis === "KAS_TOKO");
          setRekenings(cashReks);
        }
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data shift dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cari shift aktif kasir saat ini
  const activeShift = list.find((s) => s.status === "OPEN");

  // Real-time calculations for closing modal
  const estimasiSistem = activeShift ? activeShift.saldo_awal + (activeShift.total_tunai || 0) : 0;
  const selisihRealtime = activeShift && formUangFisik ? (parseInt(formUangFisik) || 0) - estimasiSistem : 0;

  const handleBukaShift = async () => {
    if (!formRekening) {
      setErrorMsg("Pilih laci rekening kasir terlebih dahulu");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/kas/shift/buka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saldo_awal: parseInt(formSaldoAwal) || 0,
          id_rekening: parseInt(formRekening),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Shift kasir berhasil dibuka", "success");
        setShowBukaModal(false);
        fetchData();
      } else {
        setErrorMsg(resData.error || "Gagal membuka shift");
      }
    } catch (e: any) {
      setErrorMsg("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const handleTutupShift = async () => {
    if (!activeShift) return;

    if (!formUangFisik.trim()) {
      setErrorMsg("Total uang fisik di laci wajib diisi");
      return;
    }

    // Jika terdeteksi selisih, alasan wajib diisi
    if (selisihRealtime !== 0 && !formCatatan.trim()) {
      setErrorMsg("Selisih kas terdeteksi! Wajib memberikan alasan/catatan.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/kas/shift/${activeShift.id}/closing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uang_fisik: parseInt(formUangFisik) || 0,
          setoran: parseInt(formSetoran) || 0,
          catatan: formCatatan.trim(),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(
          selisihRealtime === 0 
            ? "Shift kasir berhasil ditutup dan diverifikasi." 
            : "Shift kasir ditutup dengan selisih. Menunggu verifikasi supervisor.", 
          "success"
        );
        setShowTutupModal(false);
        fetchData();
      } else {
        setErrorMsg(resData.error || "Gagal menutup shift");
      }
    } catch (e: any) {
      setErrorMsg("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifikasi = async (shiftId: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/kas/shift/${shiftId}/verify`, {
        method: "POST",
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Shift kasir berhasil diverifikasi", "success");
        fetchData();
        if (showDetailModal && selectedShift?.id === shiftId) {
          setShowDetailModal(false);
        }
      } else {
        showToast(resData.error || "Gagal memverifikasi shift", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const openBukaModal = () => {
    setErrorMsg("");
    setFormSaldoAwal("0");
    setFormRekening(rekenings.length > 0 ? rekenings[0].id.toString() : "");
    setShowBukaModal(true);
  };

  const openTutupModal = () => {
    setErrorMsg("");
    setFormUangFisik("");
    setFormSetoran("0");
    setFormCatatan("");
    setShowTutupModal(true);
  };

  const openDetail = (shift: Shift) => {
    setSelectedShift(shift);
    setShowDetailModal(true);
  };

  const filteredList = list.filter((s) =>
    s.nama_kasir.toLowerCase().includes(search.toLowerCase()) ||
    s.nama_rekening.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "CLOSING":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "DISCREPANCY":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "VERIFIED":
        return "bg-slate-100 text-slate-800 border border-slate-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!can_read) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface text-on-surface rounded-xl border border-outline/30">
        <AlertTriangle className="w-16 h-16 text-warning mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-sm text-on-surface-variant text-center max-w-md">
          Anda tidak memiliki izin untuk melihat halaman ini. Silakan hubungi administrator Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-background tracking-tight">
            Shift & Sesi Kasir
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Buka atau tutup shift laci kasir dan pantau selisih uang fisik kasir.
          </p>
        </div>
      </div>

      {/* Active Shift Dashboard Widget */}
      <div className="p-6 bg-surface border border-outline-variant/30 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${activeShift ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">
                {activeShift ? "Shift Anda Sedang Aktif" : "Shift Anda Belum Dibuka"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {activeShift
                  ? `Mulai sejak ${formatDateTime(activeShift.waktu_buka)}`
                  : "Silakan buka shift untuk mulai melayani transaksi kasir POS."}
              </p>
            </div>
          </div>
          {activeShift ? (
            <button
              onClick={openTutupModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Tutup Shift (Closing)
            </button>
          ) : (
            can_create && (
              <button
                onClick={openBukaModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary hover:bg-primary/95 font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Buka Shift Baru
              </button>
            )
          )}
        </div>

        {activeShift && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4 border-t border-outline-variant/30">
            <div>
              <span className="text-xs text-on-surface-variant block uppercase font-semibold">Laci Kasir</span>
              <span className="font-bold text-on-surface">{activeShift.nama_rekening}</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block uppercase font-semibold">Modal Awal</span>
              <span className="font-bold text-on-surface font-mono">{formatCurrency(activeShift.saldo_awal)}</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block uppercase font-semibold">Estimasi Sistem (Tunai)</span>
              <span className="font-bold text-on-surface font-mono text-primary">{formatCurrency(estimasiSistem)}</span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block uppercase font-semibold">Status</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold inline-block mt-0.5 border border-emerald-200">
                OPEN
              </span>
            </div>
          </div>
        )}
      </div>

      {/* History and List */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari kasir atau nama rekening laci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-outline/30 rounded-lg text-sm font-medium hover:bg-surface-variant transition text-on-surface cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Kasir</th>
                  <th className="px-6 py-4">Laci Kasir</th>
                  <th className="px-6 py-4">Waktu Buka</th>
                  <th className="px-6 py-4 text-right">Modal Awal</th>
                  <th className="px-6 py-4 text-right">Uang Fisik</th>
                  <th className="px-6 py-4 text-right">Selisih</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <span className="text-xs mt-2 block">Memuat data shift...</span>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-on-surface-variant">
                      Tidak ada riwayat shift ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container/50 transition">
                      <td className="px-6 py-4 font-mono font-bold">#{s.id}</td>
                      <td className="px-6 py-4 font-medium">{s.nama_kasir}</td>
                      <td className="px-6 py-4 text-xs">{s.nama_rekening}</td>
                      <td className="px-6 py-4 text-xs font-mono">{formatDateTime(s.waktu_buka)}</td>
                      <td className="px-6 py-4 text-right font-mono">{formatCurrency(s.saldo_awal)}</td>
                      <td className="px-6 py-4 text-right font-mono">
                        {s.uang_fisik !== null ? formatCurrency(s.uang_fisik) : <span className="text-on-surface-variant italic">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {s.selisih !== null ? (
                          <span className={s.selisih === 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                            {s.selisih > 0 ? "+" : ""}
                            {formatCurrency(s.selisih)}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block tracking-wide uppercase ${getStatusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(s)}
                          className="px-3 py-1 bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Buka Shift Dialog */}
      {showBukaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Unlock className="w-5 h-5 text-primary" />
                Mulai Buka Shift Kasir
              </h3>
              <button
                onClick={() => setShowBukaModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Pilih Laci Toko</label>
                <select
                  value={formRekening}
                  onChange={(e) => setFormRekening(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Rekening Kasir --</option>
                  {rekenings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama} ({formatCurrency(r.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Modal Awal Drawer (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formSaldoAwal}
                  onChange={(e) => setFormSaldoAwal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBukaModal(false)}
                className="px-4 py-2 border border-outline/30 rounded-lg text-sm font-semibold hover:bg-surface-variant transition text-on-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleBukaShift}
                disabled={saving}
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-on-primary font-semibold rounded-lg transition cursor-pointer"
              >
                {saving ? "Membuka..." : "Buka Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutup Shift Dialog */}
      {showTutupModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Closing & Tutup Shift
              </h3>
              <button
                onClick={() => setShowTutupModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Real-time Summary Card */}
              <div className="p-4 bg-surface-container-high rounded-xl border border-outline-variant/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Modal Awal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(activeShift.saldo_awal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Penjualan Sistem (Tunai):</span>
                  <span className="font-mono font-semibold text-emerald-600">+{formatCurrency(activeShift.total_tunai || 0)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-outline-variant/40 pt-2 text-sm">
                  <span>Estimasi Uang Fisik:</span>
                  <span className="font-mono">{formatCurrency(estimasiSistem)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Total Uang Fisik di Laci (Rp)</label>
                <input
                  type="number"
                  placeholder="Masukkan total uang fisik tunai"
                  value={formUangFisik}
                  onChange={(e) => setFormUangFisik(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              {/* Real-time Difference Display */}
              {formUangFisik && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
                  selisihRealtime === 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  <AlertCircle className="w-4 h-4" />
                  <div>
                    <span>Estimasi Selisih: </span>
                    <span className="font-bold font-mono">
                      {selisihRealtime > 0 ? "+" : ""}
                      {formatCurrency(selisihRealtime)}
                    </span>
                    {selisihRealtime !== 0 && (
                      <span className="block text-[10px] mt-0.5 text-rose-600">
                        * Selisih terdeteksi. Alasan/Catatan wajib diisi di bawah!
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Setoran Kas ke Cabang (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formSetoran}
                  onChange={(e) => setFormSetoran(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  Jumlah kas tunai yang diserahkan ke bendahara cabang (saldo laci kasir akan dikurangi nominal ini).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">
                  Catatan / Keterangan {selisihRealtime !== 0 && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  placeholder={selisihRealtime !== 0 ? "Wajib isi alasan selisih kas..." : "Catatan tambahan jika ada..."}
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTutupModal(false)}
                className="px-4 py-2 border border-outline/30 rounded-lg text-sm font-semibold hover:bg-surface-variant transition text-on-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleTutupShift}
                disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition cursor-pointer"
              >
                {saving ? "Menyimpan..." : "Kirim Closing Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Shift Dialog */}
      {showDetailModal && selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold">Rincian Shift #{selectedShift.id}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-y-3">
                <span className="text-on-surface-variant font-medium">Kasir:</span>
                <span className="font-semibold text-right">{selectedShift.nama_kasir} ({selectedShift.kode_kasir})</span>

                <span className="text-on-surface-variant font-medium">Laci Kasir:</span>
                <span className="font-semibold text-right">{selectedShift.nama_rekening}</span>

                <span className="text-on-surface-variant font-medium">Waktu Buka:</span>
                <span className="font-mono text-xs text-right">{formatDateTime(selectedShift.waktu_buka)}</span>

                <span className="text-on-surface-variant font-medium">Waktu Tutup:</span>
                <span className="font-mono text-xs text-right">{selectedShift.waktu_tutup ? formatDateTime(selectedShift.waktu_tutup) : "Belum ditutup"}</span>

                <span className="text-on-surface-variant font-medium border-t border-outline-variant/30 pt-3">Modal Awal:</span>
                <span className="font-mono font-semibold text-right border-t border-outline-variant/30 pt-3">{formatCurrency(selectedShift.saldo_awal)}</span>

                <span className="text-on-surface-variant font-medium">Penjualan (Sistem):</span>
                <span className="font-mono font-semibold text-right">{formatCurrency(selectedShift.total_sistem)}</span>

                <span className="text-on-surface-variant font-medium pl-3 text-xs italic">— Tunai:</span>
                <span className="font-mono text-xs text-right">{formatCurrency(selectedShift.total_tunai)}</span>

                <span className="text-on-surface-variant font-medium pl-3 text-xs italic">— Non-Tunai/Trf:</span>
                <span className="font-mono text-xs text-right">{formatCurrency(selectedShift.total_transfer)}</span>

                <span className="text-on-surface-variant font-medium border-t border-outline-variant/30 pt-3">Uang Fisik:</span>
                <span className="font-mono font-bold text-right border-t border-outline-variant/30 pt-3">
                  {selectedShift.uang_fisik !== null ? formatCurrency(selectedShift.uang_fisik) : "—"}
                </span>

                <span className="text-on-surface-variant font-medium">Selisih Kas:</span>
                <span className={`font-mono font-bold text-right`}>
                  {selectedShift.selisih !== null ? (
                    <span className={selectedShift.selisih === 0 ? "text-emerald-600" : "text-rose-600"}>
                      {selectedShift.selisih > 0 ? "+" : ""}
                      {formatCurrency(selectedShift.selisih)}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>

                <span className="text-on-surface-variant font-medium">Uang Disetor:</span>
                <span className="font-mono text-right font-semibold text-red-600">-{formatCurrency(selectedShift.setoran)}</span>

                <span className="text-on-surface-variant font-medium border-t border-outline-variant/30 pt-3">Status:</span>
                <span className="text-right border-t border-outline-variant/30 pt-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block tracking-wide uppercase ${getStatusBadge(selectedShift.status)}`}>
                    {selectedShift.status}
                  </span>
                </span>
              </div>

              {selectedShift.catatan && (
                <div className="p-3 bg-surface-container rounded-lg space-y-1">
                  <span className="text-xs font-semibold text-on-surface-variant block uppercase">Catatan/Alasan Kasir:</span>
                  <span className="text-xs text-on-surface block italic">"{selectedShift.catatan}"</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-outline/30 rounded-lg text-sm font-semibold hover:bg-surface-variant transition text-on-surface cursor-pointer"
              >
                Tutup
              </button>
              {can_update && (selectedShift.status === "CLOSING" || selectedShift.status === "DISCREPANCY") && (
                <button
                  onClick={() => handleVerifikasi(selectedShift.id)}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  Verifikasi & Approve Shift
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
