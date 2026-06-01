"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, Eye, RefreshCw,
  ChevronLeft, ChevronRight, Phone, Briefcase, Building2,
  Camera, Upload, Key, ChevronUp, ChevronDown, User, FileText, MapPin, ShieldCheck, Calendar
} from "lucide-react";
import { getStatusColor, formatDate } from "@/lib/utils";
import { compressAndCropToPassport } from "@/lib/image";

interface User {
  id: number;
  kode_user: string;
  nama_user: string;
  status: string;
  no_hp: string;
  id_jabatan?: number | null;
  id_cabang?: number | null;
  jabatan: string | null;
  nama_cabang: string | null;
  tanggal_masuk: string | null;
  foto: string | null;
}

const STATUS_OPTIONS = ["Abdi Tetap", "Kontrak", "Training", "Non-Aktif"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [jabatanList, setJabatanList] = useState<{ id_jabatan: number; jabatan: string }[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sortField, setSortField] = useState("nama_user");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary shrink-0" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0" />
    );
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: "999999",
      search,
      status,
      sortBy: sortField,
      sortOrder: sortOrder,
    });
    const res = await fetch(`/api/hrd/users?${params}`);
    const data = await res.json();
    setUsers(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, status, sortField, sortOrder]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    fetch("/api/hrd/jabatan").then(r => r.json()).then(setJabatanList);
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus user ini?")) return;
    setDeleting(id);
    await fetch(`/api/hrd/users/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchUsers();
  };

  const [resettingPassword, setResettingPassword] = useState<number | null>(null);

  const handleResetPassword = async (user: User) => {
    const newPassword = prompt(`Masukkan password baru untuk abdi "${user.nama_user}":`);
    if (newPassword === null) return; // cancelled
    if (newPassword.trim().length < 6) {
      alert("Password minimal harus 6 karakter!");
      return;
    }

    setResettingPassword(user.id);
    try {
      const res = await fetch(`/api/hrd/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mereset password");
      }

      alert(`Password untuk ${user.nama_user} berhasil diperbarui!`);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setResettingPassword(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Daftar Abdi
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{total} total abdi terdaftar</p>
        </div>
        <button
          id="btn-tambah-user"
          onClick={() => { setEditUser(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Abdi
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Cari nama, kode user, no HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={fetchUsers}
          className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          title="Segarkan data"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span className="sm:hidden">Segarkan</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat data...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/60">
            <Users className="w-12 h-12 mb-3 opacity-30 text-primary" />
            <p>Tidak ada data ditemukan</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low select-none">
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-16">Foto</th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_user")}
                  >
                    <div className="flex items-center gap-1.5">
                      Abdi {renderSortIndicator("nama_user")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("jabatan")}
                  >
                    <div className="flex items-center gap-1.5">
                      Jabatan {renderSortIndicator("jabatan")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Cabang {renderSortIndicator("nama_cabang")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status {renderSortIndicator("status")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("tanggal_masuk")}
                  >
                    <div className="flex items-center gap-1.5">
                      Masuk {renderSortIndicator("tanggal_masuk")}
                    </div>
                  </th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-3 w-16">
                      <div className="w-10 h-13 rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center relative shadow-sm">
                        {user.foto ? (
                          <img src={user.foto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-primary font-bold text-[10px] uppercase">
                            {user.nama_user.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div>
                        <p className="text-on-surface text-sm font-semibold">{user.nama_user}</p>
                        <p className="text-on-surface-variant/70 text-xs mt-0.5">{user.kode_user} · {user.no_hp}</p>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 hidden md:table-cell">
                      <span className="text-on-surface/85 text-sm font-medium">{user.jabatan ?? "—"}</span>
                    </td>
                    <td className="px-5 py-2.5 hidden lg:table-cell">
                      <span className="text-on-surface/85 text-sm font-medium">{user.nama_cabang ?? "—"}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 hidden sm:table-cell">
                      <span className="text-on-surface-variant text-sm font-medium">{formatDate(user.tanggal_masuk)}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setViewUser(user); setShowViewModal(true); }}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer"
                          title="Detail Profil"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                         <button
                          onClick={() => { setEditUser(user); setShowModal(true); }}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={resettingPassword === user.id}
                          className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/15 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editUser}
          jabatanList={jabatanList}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchUsers(); }}
        />
      )}

      {showViewModal && viewUser && (
        <UserDetailModal
          user={viewUser}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  jabatanList,
  onClose,
  onSaved,
}: {
  user: User | null;
  jabatanList: { id_jabatan: number; jabatan: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    kode_user: user?.kode_user ?? "",
    nama_user: user?.nama_user ?? "",
    no_hp: user?.no_hp ?? "",
    status: user?.status ?? "Kontrak",
    id_jabatan: user?.id_jabatan ?? "",
    password: "",
    tanggal_masuk: user?.tanggal_masuk ?? "",
    foto: user?.foto ?? (null as string | null),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const croppedBase64 = await compressAndCropToPassport(file);
      setForm((f) => ({ ...f, foto: croppedBase64 }));
    } catch (err: any) {
      setError(err.message || "Gagal memproses foto");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = { ...form, id_jabatan: form.id_jabatan || null };
      if (isEdit && !payload.password) delete (payload as any).password;

      const res = await fetch(
        isEdit ? `/api/hrd/users/${user.id}` : "/api/hrd/users",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan"); return; }
      onSaved();
    } catch { setError("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface z-10">
          <h2 className="font-semibold text-on-surface">{isEdit ? "Edit Abdi" : "Tambah Abdi Baru"}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-2xl leading-none transition-colors cursor-pointer">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-error/15 border border-error/25 text-error px-4 py-3 rounded-xl font-medium">{error}</div>
          )}

          {/* Photo Upload Zone */}
          <div className="flex flex-col items-center justify-center pb-4 border-b border-outline-variant/20 mb-2">
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">Foto Profil (Paspor 3:4)</label>
            <div className="relative group w-24 h-32 rounded-xl overflow-hidden border border-dashed border-outline-variant hover:border-primary/60 bg-surface-container-low flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm">
              {form.foto ? (
                <>
                  <img src={form.foto} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-semibold">Ganti</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center text-on-surface-variant/60">
                  <Camera className="w-6 h-6 mb-1 text-primary/70" />
                  <span className="text-[9px] font-medium">Unggah Foto</span>
                  <span className="text-[7px] text-on-surface-variant/40 mt-0.5">Crop & kompres</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {form.foto && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, foto: null }))}
                className="mt-2 text-[9px] text-error hover:underline font-semibold cursor-pointer"
              >
                Hapus Foto
              </button>
            )}
          </div>
          {[
            { label: "Kode User", key: "kode_user", type: "text", required: true },
            { label: "Nama Lengkap", key: "nama_user", type: "text", required: true },
            { label: "No. HP", key: "no_hp", type: "text", required: true },
            { label: "Tanggal Masuk", key: "tanggal_masuk", type: "date" },
            { label: isEdit ? "Password Baru (kosongkan jika tidak diubah)" : "Password", key: "password", type: "password", required: !isEdit },
          ].map(({ label, key, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Jabatan</label>
            <select
              value={form.id_jabatan}
              onChange={(e) => setForm((f) => ({ ...f, id_jabatan: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
            >
              <option value="">— Pilih Jabatan —</option>
              {jabatanList.map((j) => <option key={j.id_jabatan} value={j.id_jabatan}>{j.jabatan}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 cursor-pointer">
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Abdi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/hrd/users/${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengambil data detail");
        setDetail(data);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [user.id]);

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in zoom-in-95 duration-150 relative text-on-background">
        {/* Banner Gradient Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent -z-10" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-outline-variant/10">
          <h2 className="font-semibold text-on-surface flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Detail Profil Abdi
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl leading-none transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Memuat profil lengkap...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-error/15 border border-error/25 text-error px-4 py-3 rounded-xl font-medium text-sm">
              {error}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top Profile Card Header Section */}
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center pb-6 border-b border-outline-variant/20">
              {/* Photo Preview Card */}
              <div className="w-28 h-36 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center relative shadow-sm shrink-0">
                {detail?.foto ? (
                  <img src={detail.foto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-primary font-bold text-xl uppercase">
                    {detail?.nama_user.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-2.5 flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-on-surface">{detail?.nama_user}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(detail?.status || "")}`}>
                      {detail?.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">{detail?.kode_user}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Briefcase className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>Jabatan: <span className="font-semibold text-on-surface">{user.jabatan ?? "Staf"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Building2 className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>Unit Kerja: <span className="font-semibold text-on-surface">{user.nama_cabang ?? "Pusat"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>Mulai Khidmat: <span className="font-semibold text-on-surface">{formatDateLabel(detail?.tanggal_masuk || null)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Phone className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>No. HP/WA: <span className="font-semibold text-on-surface font-mono">{detail?.no_hp}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: Data Pribadi & Kontak */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface border-b border-outline-variant/20 pb-1.5 uppercase tracking-wider text-[10px] text-primary">Data Pribadi & Kontak</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">No. KTP</label>
                    <div className="flex items-center gap-2 mt-1 text-on-surface font-mono bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                      <FileText className="w-4 h-4 text-on-surface-variant/60" />
                      <span>{detail?.no_ktp || "—"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Tempat & Tanggal Lahir</label>
                    <div className="flex items-center gap-2 mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                      <MapPin className="w-4 h-4 text-on-surface-variant/60 shrink-0" />
                      <span>
                        {detail?.tempat_lahir ? `${detail.tempat_lahir}, ` : ""}
                        {detail?.tanggal_lahir ? formatDateLabel(detail.tanggal_lahir) : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Pendidikan Terakhir</label>
                    <div className="flex items-center gap-2 mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                      <ShieldCheck className="w-4 h-4 text-on-surface-variant/60" />
                      <span>{detail?.pendidikan_terakhir || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Riwayat */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface border-b border-outline-variant/20 pb-1.5 uppercase tracking-wider text-[10px] text-primary">Riwayat Khidmat & Pekerjaan</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Riwayat Pendidikan Lembaga</label>
                    <div className="mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20 min-h-[50px] whitespace-pre-line">
                      {detail?.riwayat_lembaga || "—"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Riwayat Pekerjaan</label>
                    <div className="mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20 min-h-[50px] whitespace-pre-line">
                      {detail?.riwayat_pekerjaan || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end pt-4 border-t border-outline-variant/20 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-primary hover:bg-primary/95 text-on-primary px-6 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-primary/10"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
