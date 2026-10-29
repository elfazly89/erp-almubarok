"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ShieldCheck,
  FileCheck,
  Building2,
  Clock,
  UserCheck
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatDate } from "@/lib/utils";

interface PeriodeRow {
  id: number;
  bulan: number;
  tahun: number;
  tanggal_mulai: string;
  tanggal_akhir: string;
  status: "OPEN" | "SOFT_LOCKED" | "HARD_CLOSED";
  lock_date: string | null;
  closed_by: number | null;
  closed_at: string | null;
  closed_by_nama: string | null;
  reopen_reason: string | null;
  reopened_at: string | null;
}

const NAMA_BULAN = [
  "",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function PeriodeAkuntansiPage() {
  const { can_update, can_read, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<PeriodeRow[]>([]);
  const [selectedTahun, setSelectedTahun] = useState<number>(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Modal Re-Open
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodeRow | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  // Modal Hard Close Year
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearCloseTarget, setYearCloseTarget] = useState(2026);

  // Toast & Saving
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/akuntansi/periode?tahun=${selectedTahun}`);
      const resData = await res.json();
      if (res.ok && resData.success) {
        setList(resData.data || []);
      } else {
        showToast(resData.message || "Gagal memuat periode", "error");
      }
    } catch (e: any) {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedTahun, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLock = async (p: PeriodeRow) => {
    if (!confirm(`Kunci periode pembukuan ${NAMA_BULAN[p.bulan]} ${p.tahun}? Transaksi tanggal mundur ke periode ini akan diblokir.`)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/akuntansi/periode/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulan: p.bulan, tahun: p.tahun }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        fetchData();
      } else {
        showToast(data.message || "Gagal mengunci periode", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReopenSubmit = async () => {
    if (!selectedPeriod || !reopenReason.trim()) {
      showToast("Alasan pembukaan kembali wajib diisi", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/akuntansi/periode/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_periode: selectedPeriod.id, reason: reopenReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        setShowReopenModal(false);
        setReopenReason("");
        fetchData();
      } else {
        showToast(data.message || "Gagal membuka periode", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseYearSubmit = async () => {
    if (!confirm(`PERINGATAN: Tutup permanen tahun buku ${yearCloseTarget}? Seluruh bulan akan dikunci dan sistem akan otomatis membuat Jurnal Penutup (Closing Entries) memindahkan Laba Bersih ke Laba Ditahan.`)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/akuntansi/periode/close-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahun: yearCloseTarget }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        setShowYearModal(false);
        fetchData();
      } else {
        showToast(data.message || "Gagal menutup tahun buku", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 md:p-6 text-on-surface">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-xl border border-outline/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Periode Akuntansi & Kunci Pembukuan
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Pengendalian penutupan buku bulanan (*Soft Lock*) dan tahunan (*Hard Close*) guna mencegah manipulasi tanggal transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
            className="px-3 py-2 text-sm bg-surface rounded-lg border border-outline/30 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
          >
            <option value={2025}>Tahun 2025</option>
            <option value={2026}>Tahun 2026</option>
            <option value={2027}>Tahun 2027</option>
          </select>

          <button
            onClick={() => setShowYearModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-red-600/10 text-red-600 border border-red-500/20 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Tutup Tahun Buku
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-on-surface-variant hover:text-on-surface bg-surface rounded-lg border border-outline/20 hover:bg-surface-container"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid 12 Bulan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((p) => {
          const isOpen = p.status === "OPEN";
          const isSoftLocked = p.status === "SOFT_LOCKED";
          const isHardClosed = p.status === "HARD_CLOSED";

          return (
            <div
              key={p.id}
              className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                isHardClosed
                  ? "bg-red-500/5 border-red-500/30"
                  : isSoftLocked
                  ? "bg-amber-500/5 border-amber-500/30"
                  : "bg-surface-container-low border-outline/10 hover:border-primary/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-on-surface">
                    {NAMA_BULAN[p.bulan]} {p.tahun}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isHardClosed
                        ? "bg-red-500/20 text-red-600 dark:text-red-400"
                        : isSoftLocked
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {isHardClosed ? (
                      <>
                        <Lock className="w-3 h-3" /> HARD CLOSED
                      </>
                    ) : isSoftLocked ? (
                      <>
                        <Lock className="w-3 h-3" /> LOCKED
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" /> OPEN
                      </>
                    )}
                  </span>
                </div>

                <div className="text-xs text-on-surface-variant space-y-1 mb-4">
                  <p>
                    Rentang: <span className="font-medium text-on-surface">{p.tanggal_mulai} s.d. {p.tanggal_akhir}</span>
                  </p>
                  {p.lock_date && (
                    <p>
                      Batas Kunci: <span className="font-semibold text-amber-600 dark:text-amber-400">{p.lock_date}</span>
                    </p>
                  )}
                  {p.closed_by_nama && (
                    <p className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-primary" />
                      Dikunci oleh: {p.closed_by_nama}
                    </p>
                  )}
                  {p.reopen_reason && (
                    <div className="p-2 mt-1 rounded bg-surface border border-outline/10 text-[11px] text-on-surface-variant italic">
                      "Reopen: {p.reopen_reason}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-outline/10 flex items-center justify-end gap-2">
                {isOpen && (
                  <button
                    onClick={() => handleLock(p)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Kunci Periode
                  </button>
                )}

                {isSoftLocked && (
                  <button
                    onClick={() => {
                      setSelectedPeriod(p);
                      setReopenReason("");
                      setShowReopenModal(true);
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-surface hover:bg-surface-container text-primary border border-primary/30 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Re-Open Darurat
                  </button>
                )}

                {isHardClosed && (
                  <span className="text-xs text-on-surface-variant/60 italic w-full text-center py-1">
                    Tutup Permanen
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Re-Open Emergency */}
      {showReopenModal && selectedPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-6 rounded-2xl max-w-md w-full shadow-2xl border border-outline/20">
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Otorisasi Re-Open Periode</h3>
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              Membuka kembali periode <b>{NAMA_BULAN[selectedPeriod.bulan]} {selectedPeriod.tahun}</b> akan mengizinkan posting jurnal pada tanggal yang sebelumnya dikunci. Tindakan ini dicatat dalam log audit.
            </p>

            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-on-surface block">
                Alasan Pembukaan Kembali (Wajib Diisi):
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Contoh: Koreksi selisih faktur vendor nomor INV-091 atas persetujuan pimpinan..."
                rows={3}
                className="w-full p-2.5 text-xs bg-surface-container rounded-lg border border-outline/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 text-xs font-medium bg-surface-container hover:bg-surface-container-high rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReopenSubmit}
                disabled={saving || !reopenReason.trim()}
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-on-primary rounded-lg disabled:opacity-50"
              >
                {saving ? "Memproses..." : "Konfirmasi Re-Open"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Close Year */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-6 rounded-2xl max-w-md w-full shadow-2xl border border-outline/20">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-bold">Penutupan Tahun Buku (Year-End)</h3>
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              Proses ini akan mengunci permanen (<b>Hard Closed</b>) seluruh 12 bulan dalam tahun buku yang dipilih dan otomatis mengeksekusi <b>Jurnal Penutup (Closing Entries)</b> memindahkan saldo laba/rugi bersih ke akun Laba Ditahan.
            </p>

            <div className="space-y-3 mb-5">
              <label className="text-xs font-semibold text-on-surface block">
                Pilih Tahun Buku:
              </label>
              <select
                value={yearCloseTarget}
                onChange={(e) => setYearCloseTarget(parseInt(e.target.value))}
                className="w-full p-2.5 text-xs bg-surface-container rounded-lg border border-outline/30 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              >
                <option value={2025}>Tahun Buku 2025</option>
                <option value={2026}>Tahun Buku 2026</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowYearModal(false)}
                className="px-4 py-2 text-xs font-medium bg-surface-container hover:bg-surface-container-high rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleCloseYearSubmit}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? "Memproses Penutupan..." : "Tutup Permanen Tahun Buku"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

