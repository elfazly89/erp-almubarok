"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Vault,
  Plus,
  Edit2,
  RefreshCw,
  Search,
  Check,
  X,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  jenis: string;
  id_cabang: number;
  saldo_awal: number;
  saldo: number;
  id_akun_coa: number | null;
  is_active: boolean;
  nama_akun_coa: string | null;
  kode_akun_coa: string | null;
}

interface CoaAccount {
  id: number;
  kode_akun: string;
  nama_akun: string;
}

export default function RekeningKasPage() {
  const { can_create, can_read, can_update, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Rekening[]>([]);
  const [coaList, setCoaList] = useState<CoaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Rekening | null>(null);

  // Form states
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formJenis, setFormJenis] = useState("KAS_TOKO");
  const [formSaldoAwal, setFormSaldoAwal] = useState("0");
  const [formCoa, setFormCoa] = useState("");
  const [formActive, setFormActive] = useState(true);

  // Toast Notification State
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
      const rekRes = await fetch("/api/kas/rekening");
      const coaRes = await fetch("/api/akuntansi/daftar-akun");

      if (rekRes.ok) {
        const rekData = await rekRes.json();
        if (rekData.success) {
          setList(rekData.data);
        }
      }
      if (coaRes.ok) {
        const coaData = await coaRes.json();
        // filter coa assets (1.xxx) for cash/bank
        setCoaList(coaData.filter((c: any) => c.kode_akun.startsWith("1.")));
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item?: Rekening) => {
    setErrorMsg("");
    if (item) {
      setEditItem(item);
      setFormKode(item.kode);
      setFormNama(item.nama);
      setFormJenis(item.jenis);
      setFormSaldoAwal(item.saldo_awal.toString());
      setFormCoa(item.id_akun_coa ? item.id_akun_coa.toString() : "");
      setFormActive(item.is_active);
    } else {
      setEditItem(null);
      setFormKode("");
      setFormNama("");
      setFormJenis("KAS_TOKO");
      setFormSaldoAwal("0");
      setFormCoa("");
      setFormActive(true);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formKode.trim() || !formNama.trim() || !formJenis) {
      setErrorMsg("Kode, nama rekening, dan jenis rekening wajib diisi");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const url = editItem ? `/api/kas/rekening/${editItem.id}` : "/api/kas/rekening";
      const method = editItem ? "PUT" : "POST";
      const payload = {
        kode: formKode.trim(),
        nama: formNama.trim(),
        jenis: formJenis,
        saldo_awal: editItem ? undefined : parseInt(formSaldoAwal) || 0,
        id_akun_coa: formCoa ? parseInt(formCoa) : null,
        is_active: formActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(
          editItem
            ? "Rekening kas berhasil diperbarui"
            : "Rekening kas baru berhasil ditambahkan",
          "success"
        );
        setShowModal(false);
        fetchData();
      } else {
        setErrorMsg(resData.error || "Gagal menyimpan data ke server");
      }
    } catch (e: any) {
      setErrorMsg("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const filteredList = list.filter(
    (item) =>
      item.kode.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = list
    .filter((item) => item.is_active)
    .reduce((sum, item) => sum + item.saldo, 0);

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
            Rekening Kas & Bank
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Kelola master rekening kas toko, petty cash, dan rekening bank per cabang.
          </p>
        </div>
        {can_create && (
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-hover font-semibold rounded-lg shadow-sm transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Tambah Rekening
          </button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Total Rekening Aktif
            </span>
            <span className="text-3xl font-extrabold text-on-surface mt-1 block">
              {list.filter((item) => item.is_active).length}
            </span>
          </div>
          <div className="p-3.5 bg-primary/10 text-primary rounded-xl">
            <Vault className="w-6 h-6" />
          </div>
        </div>
        <div className="p-6 bg-surface-container border border-outline-variant/30 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              Total Saldo Berjalan
            </span>
            <span className="text-3xl font-extrabold text-primary mt-1 block">
              {formatCurrency(totalBalance)}
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <span className="font-bold text-lg">Rp</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-surface border border-outline-variant/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
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

      {/* Data Table */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant/40 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Rekening</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4">Link COA Akuntansi</th>
                <th className="px-6 py-4 text-right">Saldo Awal</th>
                <th className="px-6 py-4 text-right">Saldo Saat Ini</th>
                <th className="px-6 py-4 text-center">Status</th>
                {can_update && <th className="px-6 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={can_update ? 8 : 7} className="px-6 py-8 text-center text-on-surface-variant">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <span className="text-xs mt-2 block">Memuat data...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={can_update ? 8 : 7} className="px-6 py-8 text-center text-on-surface-variant">
                    Tidak ada rekening kas ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{item.kode}</td>
                    <td className="px-6 py-4 font-medium">{item.nama}</td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          item.jenis === "KAS_TOKO"
                            ? "bg-blue-100 text-blue-800"
                            : item.jenis === "KAS_DC"
                            ? "bg-purple-100 text-purple-800"
                            : item.jenis === "BANK"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.jenis.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {item.id_akun_coa ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">{item.nama_akun_coa}</span>
                          <span className="text-on-surface-variant font-mono">{item.kode_akun_coa}</span>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant italic">— Belum terhubung</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {formatCurrency(item.saldo_awal)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(item.saldo)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    {can_update && (
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openModal(item)}
                          className="p-1.5 hover:bg-surface-variant hover:text-primary rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface text-on-surface border border-outline/30 rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editItem ? "Edit Rekening Kas" : "Tambah Rekening Kas"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-surface-variant rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Kode Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KAS-T-01"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  disabled={!!editItem}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary disabled:opacity-60 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Nama Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kas Utama Sukosari"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                  Jenis Kas
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                >
                  <option value="KAS_TOKO">Kas Toko</option>
                  <option value="KAS_DC">Kas DC (Distribution Center)</option>
                  <option value="BANK">Bank</option>
                  <option value="PETTY_CASH">Petty Cash (Kas Kecil)</option>
                </select>
              </div>

              {!editItem && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(e.target.value)}
                    className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label 
                  className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block flex items-center gap-1"
                  title="Tabel COA standar aset 1.xxx"
                >
                  Hubungkan dengan COA Akuntansi
                  <HelpCircle className="w-3.5 h-3.5 text-on-surface-variant" />
                </label>
                <select
                  value={formCoa}
                  onChange={(e) => setFormCoa(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-lg text-sm bg-background text-on-background focus:outline-none focus:border-primary transition"
                >
                  <option value="">-- Pilih Akun COA --</option>
                  {coaList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.kode_akun} - {c.nama_akun}
                    </option>
                  ))}
                </select>
              </div>

              {editItem && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formActive"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="formActive" className="text-sm font-medium text-on-surface select-none">
                    Rekening Kas Aktif
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
                className="px-4 py-2 bg-primary text-on-primary font-semibold hover:bg-primary-hover rounded-lg transition disabled:opacity-60"
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
