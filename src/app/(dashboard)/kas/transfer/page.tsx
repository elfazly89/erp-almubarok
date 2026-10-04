"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transfer {
  id: number;
  nomor_transaksi: string;
  id_rekening: number;
  nama_rekening_asal: string;
  kode_rekening_asal: string;
  id_rekening_tujuan: number;
  nama_rekening_tujuan: string;
  kode_rekening_tujuan: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
  status: "PENDING" | "APPROVED";
  created_by_nama: string | null;
}

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
  is_active: boolean;
}

export default function TransferKasPage() {
  const { can_create, can_update, can_read, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Transfer[]>([]);
  const [rekenings, setRekenings] = useState<Rekening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [formAsal, setFormAsal] = useState("");
  const [formTujuan, setFormTujuan] = useState("");
  const [formNominal, setFormNominal] = useState("");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [formKeterangan, setFormKeterangan] = useState("");

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
      const trfRes = await fetch("/api/kas/transfer");
      const rekRes = await fetch("/api/kas/rekening");

      if (trfRes.ok) {
        const trfData = await trfRes.json();
        if (trfData.success) setList(trfData.data);
      }
      if (rekRes.ok) {
        const rekData = await rekRes.json();
        if (rekData.success) {
          const activeReks = rekData.data.filter((r: any) => r.is_active);
          setRekenings(activeReks);
        }
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data transfer dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = () => {
    setErrorMsg("");
    setFormAsal(rekenings.length > 0 ? rekenings[0].id.toString() : "");
    setFormTujuan("");
    setFormNominal("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKeterangan("");
    setShowModal(true);
  };

  const handleSave = async () => {
    const nominalNum = parseInt(formNominal) || 0;
    if (!formAsal || !formTujuan || nominalNum <= 0 || !formTanggal) {
      setErrorMsg("Semua field wajib diisi");
      return;
    }

    if (formAsal === formTujuan) {
      setErrorMsg("Rekening asal dan tujuan tidak boleh sama");
      return;
    }

    // Check balance of sender account
    const senderRek = rekenings.find((r) => r.id === parseInt(formAsal));
    if (senderRek && senderRek.saldo < nominalNum) {
      setErrorMsg(`Saldo rekening asal tidak cukup. Saldo saat ini: ${formatCurrency(senderRek.saldo)}`);
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/kas/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_rekening_asal: parseInt(formAsal),
          id_rekening_tujuan: parseInt(formTujuan),
          nominal: nominalNum,
          tanggal: formTanggal,
          keterangan: formKeterangan.trim(),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Pengajuan transfer kas berhasil dikirim", "success");
        setShowModal(false);
        fetchData();
      } else {
        setErrorMsg(resData.error || "Gagal membuat transfer");
      }
    } catch (e: any) {
      setErrorMsg("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const handleKonfirmasi = async (trfId: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/kas/transfer/${trfId}/konfirmasi`, {
        method: "PUT",
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Transfer kas berhasil diterima dan dikonfirmasi", "success");
        fetchData();
      } else {
        showToast(resData.error || "Gagal mengkonfirmasi transfer", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredList = list.filter((item) =>
    item.nomor_transaksi.toLowerCase().includes(search.toLowerCase()) ||
    item.nama_rekening_asal.toLowerCase().includes(search.toLowerCase()) ||
    item.nama_rekening_tujuan.toLowerCase().includes(search.toLowerCase())
  );

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
            Transfer Kas Antar Rekening
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Kirim saldo antar rekening toko, kas pusat, petty cash, atau bank per cabang.
          </p>
        </div>
        {can_create && (
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-hover font-semibold rounded-lg shadow-sm transition"
          >
            <Send className="w-4 h-4 rotate-315" />
            Buat Transfer
          </button>
        )}
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari kode transfer atau nama rekening..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-outline/30 rounded-lg text-sm font-medium hover:bg-surface-variant transition text-on-surface"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant uppercase">
                  <th className="px-6 py-4">No. Transaksi</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Pengirim (Asal)</th>
                  <th className="px-6 py-4 text-center">Arah</th>
                  <th className="px-6 py-4">Penerima (Tujuan)</th>
                  <th className="px-6 py-4 text-right">Nominal</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  {can_update && <th className="px-6 py-4 text-center">Konfirmasi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={can_update ? 8 : 7} className="px-6 py-8 text-center text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <span className="text-xs mt-2 block">Memuat data transfer...</span>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={can_update ? 8 : 7} className="px-6 py-8 text-center text-on-surface-variant">
                      Tidak ada riwayat transfer kas ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((trf) => (
                    <tr key={trf.id} className="hover:bg-surface-container/50 transition">
                      <td className="px-6 py-4 font-mono font-bold">{trf.nomor_transaksi}</td>
                      <td className="px-6 py-4 font-mono text-xs">{formatDate(trf.tanggal)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{trf.nama_rekening_asal}</span>
                          <span className="text-xs text-on-surface-variant font-mono">{trf.kode_rekening_asal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-primary">
                        <ArrowRight className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{trf.nama_rekening_tujuan}</span>
                          <span className="text-xs text-on-surface-variant font-mono">{trf.kode_rekening_tujuan}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                        {formatCurrency(trf.nominal)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block ${
                            trf.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {trf.status === "PENDING" ? "Menunggu Penerimaan" : "Selesai"}
                        </span>
                      </td>
                      {can_update && (
                        <td className="px-6 py-4 text-center">
                          {trf.status === "PENDING" ? (
                            <button
                              onClick={() => handleKonfirmasi(trf.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Terima Dana
                            </button>
                          ) : (
                            <span className="text-xs text-on-surface-variant italic">Sudah diterima</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Transfer Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-primary rotate-315" />
                Buat Transfer Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full transition"
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
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Rekening Asal (Kirim Dari)</label>
                <select
                  value={formAsal}
                  onChange={(e) => setFormAsal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Rekening Asal --</option>
                  {rekenings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama} ({formatCurrency(r.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Rekening Tujuan (Kirim Ke)</label>
                <select
                  value={formTujuan}
                  onChange={(e) => setFormTujuan(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Rekening Tujuan --</option>
                  {rekenings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama} ({formatCurrency(r.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Nominal Dana (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Tanggal Transfer</label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Keterangan / Memo</label>
                <textarea
                  placeholder="Memo transfer..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-outline/30 rounded-lg text-sm font-semibold hover:bg-surface-variant transition text-on-surface"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-on-primary font-semibold rounded-lg transition"
              >
                {saving ? "Memproses..." : "Ajukan Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
