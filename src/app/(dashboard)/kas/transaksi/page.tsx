"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: number;
  nomor_transaksi: string;
  id_rekening: number;
  nama_rekening: string;
  kode_rekening: string;
  tipe: "MASUK" | "KELUAR";
  kategori: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
  status: string;
  bukti: string | null;
  created_by_nama: string | null;
}

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
  is_active: boolean;
}

export default function KasTransaksiPage() {
  const { can_create, can_read, can_update, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Transaction[]>([]);
  const [rekenings, setRekenings] = useState<Rekening[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<any>(null);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState("");
  const [filterRekening, setFilterRekening] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"MASUK" | "KELUAR">("MASUK");

  // Form States
  const [formRekening, setFormRekening] = useState("");
  const [formNominal, setFormNominal] = useState("");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [formKategori, setFormKategori] = useState("OPERASIONAL");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formBukti, setFormBukti] = useState("");

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleApproveKeluar = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/kas/transaksi/${id}/approve`, {
        method: "PUT",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Transaksi kas keluar berhasil disetujui", "success");
        fetchData();
      } else {
        showToast(resData.error || "Gagal menyetujui transaksi", "error");
      }
    } catch {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const qParams = new URLSearchParams();
      if (startDate) qParams.append("startDate", startDate);
      if (endDate) qParams.append("endDate", endDate);
      if (filterTipe) qParams.append("tipe", filterTipe);
      if (filterRekening) qParams.append("id_rekening", filterRekening);

      const txRes = await fetch(`/api/kas/transaksi?${qParams.toString()}`);
      const rekRes = await fetch("/api/kas/rekening");
      const shiftRes = await fetch("/api/kas/shift");

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success) setList(txData.data);
      }
      if (rekRes.ok) {
        const rekData = await rekRes.json();
        if (rekData.success) {
          const activeReks = rekData.data.filter((r: any) => r.is_active);
          setRekenings(activeReks);
        }
      }
      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        if (shiftData.success) {
          const openShift = shiftData.data.find((s: any) => s.status === "OPEN");
          setActiveShift(openShift || null);
        }
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterTipe, filterRekening]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openForm = (type: "MASUK" | "KELUAR") => {
    setErrorMsg("");
    setModalType(type);
    setFormRekening(rekenings.length > 0 ? rekenings[0].id.toString() : "");
    setFormNominal("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKategori(type === "MASUK" ? "PENJUALAN" : "OPERASIONAL");
    setFormKeterangan("");
    setFormBukti("");
    setShowModal(true);
  };

  const handleSave = async () => {
    const nominalNum = parseInt(formNominal) || 0;
    if (!formRekening || nominalNum <= 0 || !formTanggal) {
      setErrorMsg("Rekening, nominal, dan tanggal wajib diisi");
      return;
    }

    // Check balance for cash out
    if (modalType === "KELUAR") {
      const selectedRek = rekenings.find((r) => r.id === parseInt(formRekening));
      if (selectedRek && selectedRek.saldo < nominalNum) {
        setErrorMsg(`Saldo rekening tidak cukup. Saldo saat ini: ${formatCurrency(selectedRek.saldo)}`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const path = modalType === "MASUK" ? "/api/kas/transaksi/masuk" : "/api/kas/transaksi/keluar";
      const payload = {
        id_rekening: parseInt(formRekening),
        nominal: nominalNum,
        tanggal: formTanggal,
        keterangan: formKeterangan.trim(),
        kategori: formKategori,
        bukti: formBukti || null,
      };

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(
          `Transaksi Kas ${modalType === "MASUK" ? "Masuk" : "Keluar"} berhasil dicatat`,
          "success"
        );
        setShowModal(false);
        fetchData();
      } else {
        setErrorMsg(resData.error || "Gagal mencatat transaksi");
      }
    } catch (e: any) {
      setErrorMsg("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalMasuk = list
    .filter((tx) => tx.tipe === "MASUK" && tx.status === "APPROVED")
    .reduce((sum, tx) => sum + tx.nominal, 0);

  const totalKeluar = list
    .filter((tx) => tx.tipe === "KELUAR" && tx.status === "APPROVED")
    .reduce((sum, tx) => sum + tx.nominal, 0);

  const filteredList = list.filter((tx) =>
    tx.nomor_transaksi.toLowerCase().includes(search.toLowerCase()) ||
    tx.keterangan?.toLowerCase().includes(search.toLowerCase())
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

      {/* Warning Banner for unopened shift */}
      {!activeShift && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex gap-3 text-sm text-amber-600 backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Shift Kasir Belum Dibuka!</strong>
            <span>Anda belum membuka shift kasir hari ini. Silakan buka shift terlebih dahulu di menu <a href="/kas/shift" className="underline font-bold hover:text-amber-700">Shift Kasir</a> sebelum mencatat mutasi kas atau melakukan transaksi POS.</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-background tracking-tight">
            Mutasi Kas & Transaksi
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Input penerimaan kas masuk atau pengeluaran kas operasional manual.
          </p>
        </div>
        {can_create && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => openForm("MASUK")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Kas Masuk
            </button>
            <button
              onClick={() => openForm("KELUAR")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Kas Keluar
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Total Kas Masuk Periode Ini
            </span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">
              {formatCurrency(totalMasuk)}
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Total Kas Keluar Periode Ini
            </span>
            <span className="text-3xl font-extrabold text-red-600 mt-1 block">
              {formatCurrency(totalKeluar)}
            </span>
          </div>
          <div className="p-3.5 bg-red-500/10 text-red-500 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="p-5 bg-surface border border-outline-variant/30 rounded-xl space-y-4 shadow-sm">
        <h4 className="text-sm font-bold text-on-surface">Filter Pencarian</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Tipe Kas</label>
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="MASUK">Masuk (Debit)</option>
              <option value="KELUAR">Keluar (Kredit)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Rekening</label>
            <select
              value={filterRekening}
              onChange={(e) => setFilterRekening(e.target.value)}
              className="w-full px-3 py-1.5 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none"
            >
              <option value="">Semua Rekening</option>
              {rekenings.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kode} - {r.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full flex items-center justify-center gap-2 py-2 bg-secondary text-on-secondary font-semibold rounded-lg hover:bg-secondary/90 transition text-sm shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari nomor transaksi atau keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
          />
        </div>

        <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4">No. Transaksi</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Rekening</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Nominal</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  {can_update && <th className="px-6 py-4 text-center">Tindakan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={can_update ? 9 : 8} className="px-6 py-8 text-center text-on-surface-variant">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <span className="text-xs mt-2 block">Memuat data transaksi...</span>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={can_update ? 9 : 8} className="px-6 py-8 text-center text-on-surface-variant">
                      Tidak ada transaksi kas ditemukan untuk kriteria filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-on-surface">{tx.nomor_transaksi}</td>
                      <td className="px-6 py-4 font-mono text-xs">{formatDate(tx.tanggal)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{tx.nama_rekening}</span>
                          <span className="text-xs text-on-surface-variant font-mono">{tx.kode_rekening}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${
                            tx.tipe === "MASUK"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.tipe === "MASUK" ? (
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                          )}
                          {tx.tipe === "MASUK" ? "Masuk" : "Keluar"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold uppercase">{tx.kategori}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={tx.keterangan}>
                        {tx.keterangan || <span className="text-on-surface-variant italic">Tanpa keterangan</span>}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-mono font-bold ${
                          tx.tipe === "MASUK" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {tx.tipe === "MASUK" ? "+" : "-"} {formatCurrency(tx.nominal)}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-full inline-block ${
                            tx.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      {can_update && (
                        <td className="px-6 py-4 text-center">
                          {tx.status === "PENDING" ? (
                            <button
                              onClick={() => handleApproveKeluar(tx.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Setujui
                            </button>
                          ) : (
                            <span className="text-xs text-on-surface-variant italic">—</span>
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

      {/* Cash In / Out Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {modalType === "MASUK" ? (
                  <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-red-600" />
                )}
                Catat Kas {modalType === "MASUK" ? "Masuk (Debit)" : "Keluar (Kredit)"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Rekening Asal/Tujuan
                </label>
                <select
                  value={formRekening}
                  onChange={(e) => setFormRekening(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                >
                  <option value="">-- Pilih Rekening Kas --</option>
                  {rekenings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.kode} - {r.nama} ({formatCurrency(r.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Kategori
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                >
                  {modalType === "MASUK" ? (
                    <>
                      <option value="PENJUALAN">Penjualan POS</option>
                      <option value="SETORAN">Setoran Tunai</option>
                      <option value="LAIN">Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option value="OPERASIONAL">Beban Operasional Toko</option>
                      <option value="GAJI">Bisyaroh / Gaji</option>
                      <option value="PEMBELIAN">Pembelian Barang / Supplier</option>
                      <option value="LISTRIK_AIR">Listrik & Air</option>
                      <option value="LAIN">Lain-lain</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Keterangan
                </label>
                <textarea
                  placeholder="Keterangan rincian transaksi..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {/* Footer */}
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
                className={`px-4 py-2 font-semibold text-white rounded-lg transition disabled:opacity-60 ${
                  modalType === "MASUK" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
