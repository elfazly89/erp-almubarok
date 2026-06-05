"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface HutangRow {
  id: number;
  user_id: number;
  nama_user: string | null;
  kode_user: string | null;
  nominal: number;
  tanggal: string;
  keterangan: string | null;
  status: "aktif" | "lunas";
}

interface UserOption {
  id: number;
  kode_user: string;
  nama_user: string;
}

// ─── Kategori preset keterangan ───────────────────────────────────────────────
const KATEGORI_PRESET = [
  "Pinjaman Tunai",
  "Iuran Seragam",
  "Potongan Stok Opname",
  "Kasbon Belanja",
  "Biaya Pelatihan",
  "Lainnya",
];

export default function HutangAbdiPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } =
    useMenuPermissions();

  // ─── State ───────────────────────────────────────────────────────────────────
  const [hutangList, setHutangList] = useState<HutangRow[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "aktif" | "lunas">("aktif");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal add/edit
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<HutangRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formUserId, setFormUserId] = useState<number | "">("");
  const [formNominal, setFormNominal] = useState("");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formStatus, setFormStatus] = useState<"aktif" | "lunas">("aktif");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<HutangRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchHutang = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterStatus !== "all" ? `?status=${filterStatus}` : "?status=all";
      const res = await fetch(`/api/hrd/hutang${qs}`);
      const data = await res.json();
      setHutangList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat data hutang:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/hrd/users?limit=200");
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      setUserOptions(list.map((u: any) => ({ id: u.id, kode_user: u.kode_user, nama_user: u.nama_user })));
    } catch {}
  }, []);

  useEffect(() => {
    fetchHutang();
  }, [fetchHutang]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Filter ──────────────────────────────────────────────────────────────────
  const filtered = hutangList.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      (h.nama_user ?? "").toLowerCase().includes(q) ||
      (h.kode_user ?? "").toLowerCase().includes(q) ||
      (h.keterangan ?? "").toLowerCase().includes(q)
    );
  });

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const totalAktif = hutangList.filter((h) => h.status === "aktif").length;
  const totalLunas = hutangList.filter((h) => h.status === "lunas").length;
  const nominalAktif = hutangList
    .filter((h) => h.status === "aktif")
    .reduce((s, h) => s + h.nominal, 0);
  const nominalLunas = hutangList
    .filter((h) => h.status === "lunas")
    .reduce((s, h) => s + h.nominal, 0);

  // ─── Modal helpers ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setFormUserId("");
    setFormNominal("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKeterangan("");
    setFormStatus("aktif");
    setShowModal(true);
  };

  const openEdit = (row: HutangRow) => {
    setEditTarget(row);
    setFormUserId(row.user_id);
    setFormNominal(row.nominal.toString());
    setFormTanggal(row.tanggal);
    setFormKeterangan(row.keterangan ?? "");
    setFormStatus(row.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formUserId || !formNominal || !formTanggal) {
      alert("Nama abdi, nominal, dan tanggal wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (editTarget) {
        res = await fetch("/api/hrd/hutang", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget.id,
            nominal: parseInt(formNominal),
            tanggal: formTanggal,
            keterangan: formKeterangan,
            status: formStatus,
          }),
        });
      } else {
        res = await fetch("/api/hrd/hutang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: formUserId,
            nominal: parseInt(formNominal),
            tanggal: formTanggal,
            keterangan: formKeterangan,
          }),
        });
      }

      if (res.ok) {
        setShowModal(false);
        fetchHutang();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan data hutang");
      }
    } catch {
      alert("Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  const handleLunas = async (row: HutangRow) => {
    if (!confirm(`Tandai hutang ${row.nama_user} sebesar ${formatCurrency(row.nominal)} sebagai Lunas?`)) return;
    try {
      const res = await fetch("/api/hrd/hutang", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status: "lunas" }),
      });
      if (res.ok) fetchHutang();
      else alert("Gagal memperbarui status hutang");
    } catch {
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hrd/hutang?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchHutang();
      } else {
        alert("Gagal menghapus data hutang");
      }
    } catch {
      alert("Terjadi kesalahan sistem");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Guard ───────────────────────────────────────────────────────────────────
  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <AlertTriangle className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk melihat halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-4 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-error" /> Hutang Abdi
          </h1>
          <p className="text-on-background/70 text-sm mt-1">
            Manajemen pinjaman, iuran, dan potongan kewajiban abdi pondok
          </p>
        </div>
        {can_create && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Hutang
          </button>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="bg-surface border border-outline-variant/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 bg-error/10 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <div>
            <p className="text-on-surface-variant/70 text-[11px] font-semibold uppercase">Hutang Aktif</p>
            <p className="text-lg font-extrabold text-error mt-0.5">{totalAktif} catatan</p>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 bg-error/5 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-error/70" />
          </div>
          <div>
            <p className="text-on-surface-variant/70 text-[11px] font-semibold uppercase">Total Nominal Aktif</p>
            <p className="text-lg font-extrabold text-error mt-0.5">{formatCurrency(nominalAktif)}</p>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-on-surface-variant/70 text-[11px] font-semibold uppercase">Sudah Lunas</p>
            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{totalLunas} catatan</p>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 bg-emerald-500/5 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600/70" />
          </div>
          <div>
            <p className="text-on-surface-variant/70 text-[11px] font-semibold uppercase">Total Dilunasi</p>
            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{formatCurrency(nominalLunas)}</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0 shadow-sm">
        <div className="flex gap-2 items-center flex-wrap">
          {(["aktif", "lunas", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                filterStatus === s
                  ? s === "aktif"
                    ? "bg-error text-white border-error shadow-sm"
                    : s === "lunas"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-surface-container text-on-surface-variant border-outline-variant/40 hover:border-outline-variant"
              }`}
            >
              {s === "all" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchHutang}
            className="p-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama abdi atau keterangan..."
            className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/70"
          />
        </div>
      </div>

      {/* ── Info banner: how bisyaroh potongan works ── */}
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3 shrink-0">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Koneksi ke Bisyaroh:</strong> Hutang dengan status <strong>Aktif</strong> akan otomatis muncul sebagai informasi potongan di halaman <strong>Bisyaroh (Penggajian)</strong> saat memproses gaji abdi. Admin dapat memilih berapa nominal yang dipotong dari gaji bulan tersebut.
        </p>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-7 h-7 animate-spin mr-3 text-primary" /> Memuat data hutang...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-on-surface-variant/60">
            <CreditCard className="w-12 h-12 text-on-surface-variant/30" />
            <p className="font-semibold text-sm">Tidak ada data hutang ditemukan</p>
            <p className="text-xs">
              {filterStatus === "aktif" ? "Semua hutang sudah lunas 🎉" : "Coba ubah filter status"}
            </p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-outline-variant/35 bg-surface-container-low">
                  <th className="text-left px-5 py-3 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                    Abdi
                  </th>
                  <th className="text-left px-5 py-3 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="text-center px-5 py-3 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="text-right px-5 py-3 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                    Nominal
                  </th>
                  <th className="text-center px-5 py-3 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-high/30 transition-colors"
                  >
                    {/* Abdi */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/10 to-primary/20 text-primary border border-primary/15 flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                          {(row.nama_user ?? "?")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <span className="text-on-surface text-sm font-bold block">
                            {row.nama_user ?? "—"}
                          </span>
                          <span className="text-on-surface-variant/60 text-xs block mt-0.5">
                            {row.kode_user ?? "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td className="px-5 py-3">
                      <span className="text-on-surface text-sm">
                        {row.keterangan || <span className="text-on-surface-variant/40 italic">—</span>}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="px-5 py-3 text-center">
                      <span className="text-on-surface text-sm font-semibold">
                        {new Date(row.tanggal).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-sm font-bold font-mono ${
                          row.status === "aktif" ? "text-error" : "text-on-surface-variant/50"
                        }`}
                      >
                        {formatCurrency(row.nominal)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          row.status === "aktif"
                            ? "bg-error/10 text-error border-error/25"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {row.status === "aktif" ? "Aktif" : "Lunas"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tandai Lunas */}
                        {row.status === "aktif" && can_update && (
                          <button
                            onClick={() => handleLunas(row)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            title="Tandai Lunas"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Lunas
                          </button>
                        )}
                        {/* Edit */}
                        {can_update && (
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* Delete */}
                        {can_delete && (
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════ MODAL ADD / EDIT ══════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div>
                <h2 className="font-bold text-on-surface text-lg">
                  {editTarget ? "Edit Data Hutang" : "Tambah Hutang Abdi"}
                </h2>
                <p className="text-on-surface-variant/60 text-xs mt-0.5">
                  {editTarget
                    ? `Mengubah data hutang ${editTarget.nama_user}`
                    : "Catat pinjaman, iuran, atau potongan baru"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Abdi — only on add */}
              {!editTarget && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    Nama Abdi <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formUserId}
                      onChange={(e) => setFormUserId(parseInt(e.target.value) || "")}
                      className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 cursor-pointer appearance-none"
                    >
                      <option value="">— Pilih Abdi —</option>
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama_user} ({u.kode_user})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                  Nominal (Rp) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={formNominal}
                  onChange={(e) => setFormNominal(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 font-mono"
                  placeholder="Rp 0"
                  min={0}
                />
                {formNominal && parseInt(formNominal) > 0 && (
                  <p className="text-xs text-primary mt-1 font-semibold">
                    {formatCurrency(parseInt(formNominal))}
                  </p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Tanggal <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 cursor-pointer"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  Keterangan / Jenis Hutang
                </label>
                {/* Preset quick-picks */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {KATEGORI_PRESET.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFormKeterangan(k)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border cursor-pointer transition-all ${
                        formKeterangan === k
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container text-on-surface-variant border-outline-variant/40 hover:border-primary/50"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80"
                  placeholder="Atau tulis keterangan bebas..."
                />
              </div>

              {/* Status — only on edit */}
              {editTarget && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Status
                  </label>
                  <div className="flex gap-3">
                    {(["aktif", "lunas"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormStatus(s)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-all capitalize ${
                          formStatus === s
                            ? s === "aktif"
                              ? "bg-error text-white border-error"
                              : "bg-emerald-600 text-white border-emerald-600"
                            : "bg-surface-container text-on-surface-variant border-outline-variant/40"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-low">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/15 transition-all cursor-pointer"
              >
                {saving ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Hutang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL DELETE CONFIRM ══════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Hapus Data Hutang?</h3>
                <p className="text-on-surface-variant text-sm mt-1">
                  Hutang <strong>{deleteTarget.nama_user}</strong> sebesar{" "}
                  <strong className="text-error">{formatCurrency(deleteTarget.nominal)}</strong> akan
                  dihapus permanen.
                </p>
                <p className="text-xs text-on-surface-variant/60 mt-2">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-error hover:bg-error/90 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-lg shadow-error/20"
                >
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
