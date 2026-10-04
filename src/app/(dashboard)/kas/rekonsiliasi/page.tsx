"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Check,
  Percent,
  CheckSquare
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Reconciliation {
  id: number;
  id_rekening: number;
  nama_rekening: string;
  kode_rekening: string;
  tanggal: string;
  saldo_sistem: number;
  saldo_fisik: number;
  selisih: number;
  alasan: string | null;
  bukti: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_by_nama: string | null;
}

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
  is_active: boolean;
}

export default function RekonsiliasiKasPage() {
  const { can_create, can_update, can_read, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Reconciliation[]>([]);
  const [rekenings, setRekenings] = useState<Rekening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Reconciliation | null>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVED" | "REJECTED">("APPROVED");

  // Form States
  const [formRekening, setFormRekening] = useState("");
  const [formSaldoFisik, setFormSaldoFisik] = useState("");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [formAlasan, setFormAlasan] = useState("");
  const [formBukti, setFormBukti] = useState("");

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
      const rekonRes = await fetch("/api/kas/rekonsiliasi");
      const rekRes = await fetch("/api/kas/rekening");

      if (rekonRes.ok) {
        const rekonData = await rekonRes.json();
        if (rekonData.success) setList(rekonData.data);
      }
      if (rekRes.ok) {
        const rekData = await rekRes.json();
        if (rekData.success) {
          const activeReks = rekData.data.filter((r: any) => r.is_active);
          setRekenings(activeReks);
        }
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data rekonsiliasi dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedRek = rekenings.find((r) => r.id === parseInt(formRekening));
  const expectedSaldo = selectedRek ? selectedRek.saldo : 0;
  const selisih = formSaldoFisik ? (parseInt(formSaldoFisik) || 0) - expectedSaldo : 0;

  const openForm = () => {
    setErrorMsg("");
    setFormRekening(rekenings.length > 0 ? rekenings[0].id.toString() : "");
    setFormSaldoFisik("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormAlasan("");
    setFormBukti("");
    setShowModal(true);
  };

  const handleSave = async () => {
    const sFisikNum = parseInt(formSaldoFisik);
    if (!formRekening || isNaN(sFisikNum) || !formTanggal) {
      setErrorMsg("Rekening, saldo fisik, dan tanggal wajib diisi");
      return;
    }

    if (selisih !== 0 && !formAlasan.trim()) {
      setErrorMsg("Alasan perbedaan saldo wajib diisi jika terdapat selisih");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/kas/rekonsiliasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_rekening: parseInt(formRekening),
          tanggal: formTanggal,
          saldo_fisik: sFisikNum,
          alasan: formAlasan.trim(),
          bukti: formBukti || null,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Pengajuan rekonsiliasi kas berhasil diajukan", "success");
        setShowModal(false);
        fetchData();
      } else {
        setErrorMsg(resData.error || "Gagal membuat rekonsiliasi");
      }
    } catch (e: any) {
      setErrorMsg("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAction = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/kas/rekonsiliasi/${selectedItem.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: approvalAction }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(`Rekonsiliasi kas berhasil di-${approvalAction.toLowerCase()}`, "success");
        setShowApproveConfirm(false);
        fetchData();
      } else {
        showToast(resData.error || "Gagal memproses approval", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const openApproveConfirm = (item: Reconciliation, action: "APPROVED" | "REJECTED") => {
    setSelectedItem(item);
    setApprovalAction(action);
    setShowApproveConfirm(true);
  };

  const filteredList = list.filter((item) =>
    item.nama_rekening.toLowerCase().includes(search.toLowerCase()) ||
    item.kode_rekening.toLowerCase().includes(search.toLowerCase())
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
            Rekonsiliasi Kas
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Sesuaikan saldo kas fisik dengan saldo sistem dan koreksi selisih saldo.
          </p>
        </div>
        {can_create && (
          <button
            onClick={openForm}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-hover font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Rekonsiliasi Baru
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
              placeholder="Cari kode atau nama rekening..."
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
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Rekening</th>
                  <th className="px-6 py-4 text-right">Saldo Sistem</th>
                  <th className="px-6 py-4 text-right">Saldo Fisik</th>
                  <th className="px-6 py-4 text-right">Selisih</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  {can_update && <th className="px-6 py-4 text-center">Tindakan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={can_update ? 9 : 8} className="px-6 py-8 text-center text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <span className="text-xs mt-2 block">Memuat data audit...</span>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={can_update ? 9 : 8} className="px-6 py-8 text-center text-on-surface-variant">
                      Tidak ada data pengajuan rekonsiliasi kas.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container/50 transition">
                      <td className="px-6 py-4 font-mono font-bold">#{item.id}</td>
                      <td className="px-6 py-4 font-mono text-xs">{formatDate(item.tanggal)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.nama_rekening}</span>
                          <span className="text-xs text-on-surface-variant font-mono">{item.kode_rekening}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{formatCurrency(item.saldo_sistem)}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold">{formatCurrency(item.saldo_fisik)}</td>
                      <td className="px-6 py-4 text-right font-mono">
                        {item.selisih === 0 ? (
                          <span className="text-emerald-600 font-bold">Aman</span>
                        ) : (
                          <span className={item.selisih > 0 ? "text-blue-600 font-bold" : "text-red-600 font-bold"}>
                            {item.selisih > 0 ? "+" : ""}
                            {formatCurrency(item.selisih)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={item.alasan || ""}>
                        {item.alasan || <span className="text-on-surface-variant italic">Kliping aman</span>}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-full inline-block ${
                            item.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : item.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      {can_update && (
                        <td className="px-6 py-4 text-center">
                          {item.status === "PENDING" ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openApproveConfirm(item, "APPROVED")}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Setujui (Sesuaikan Saldo)"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openApproveConfirm(item, "REJECTED")}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Tolak Pengajuan"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant italic">— Selesai</span>
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

      {/* Submit Reconciliation Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Rekonsiliasi Saldo Kas
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
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Pilih Rekening Kas</label>
                <select
                  value={formRekening}
                  onChange={(e) => setFormRekening(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Rekening --</option>
                  {rekenings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama} ({formatCurrency(r.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRek && (
                <div className="p-3 bg-surface-container rounded-lg space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Saldo Tercatat Sistem:</span>
                    <span className="font-bold font-mono">{formatCurrency(expectedSaldo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Perbedaan Selisih:</span>
                    <span className={`font-bold font-mono ${selisih === 0 ? "text-emerald-600" : selisih > 0 ? "text-blue-600" : "text-red-600"}`}>
                      {selisih > 0 ? "+" : ""}{formatCurrency(selisih)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Saldo Fisik Sebenarnya (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formSaldoFisik}
                  onChange={(e) => setFormSaldoFisik(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Tanggal Audit</label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase block">Alasan Perbedaan Saldo</label>
                <textarea
                  placeholder="Keterangan mengapa ada selisih, misal: biaya admin bank belum dicatat / salah input POS..."
                  value={formAlasan}
                  onChange={(e) => setFormAlasan(e.target.value)}
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
                {saving ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Approval/Rejection */}
      {showApproveConfirm && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-8 h-8 ${approvalAction === "APPROVED" ? "text-emerald-500" : "text-red-500"}`} />
                <h3 className="text-lg font-bold">
                  {approvalAction === "APPROVED" ? "Setujui Rekonsiliasi?" : "Tolak Rekonsiliasi?"}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                {approvalAction === "APPROVED"
                  ? `Persetujuan akan menyesuaikan saldo rekening "${selectedItem.nama_rekening}" sebesar ${formatCurrency(selectedItem.selisih)} di sistem, dan membuat entri jurnal koreksi otomatis.`
                  : "Pengajuan rekonsiliasi kas ini akan ditolak tanpa mengubah saldo rekening."}
              </p>
            </div>
            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="px-3.5 py-1.5 border border-outline/30 rounded-lg text-xs font-semibold hover:bg-surface-variant transition text-on-surface"
              >
                Batal
              </button>
              <button
                onClick={handleApproveAction}
                disabled={saving}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition ${
                  approvalAction === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {saving ? "Memproses..." : "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
