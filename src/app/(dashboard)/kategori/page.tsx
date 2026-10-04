"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderHeart, Plus, Edit2, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Kategori {
  id_kategori: number;
  kode_kategori: string;
  nama_kategori: string;
}

export default function KategoriPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Kategori | null>(null);
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [saving, setSaving] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; kategori: Kategori | null }>({
    show: false,
    kategori: null,
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kategori");
      if (res.ok) {
        setList(await res.json());
      } else {
        showToast("Gagal memuat data kategori.", "error");
      }
    } catch {
      showToast("Gagal memuat data kategori.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (kategori?: Kategori) => {
    setEdit(kategori || null);
    setFormKode(kategori?.kode_kategori || "");
    setFormNama(kategori?.nama_kategori || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    const kode = formKode.trim();
    const nama = formNama.trim();

    if (!kode || !nama) {
      showToast("Semua field wajib diisi.", "error");
      return;
    }

    setSaving(true);
    try {
      const url = edit ? `/api/kategori/${edit.id_kategori}` : "/api/kategori";
      const method = edit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_kategori: kode, nama_kategori: nama }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(edit ? "Kategori berhasil diperbarui." : "Kategori berhasil ditambahkan.", "success");
        setShowModal(false);
        fetchData();
      } else {
        showToast(data.error || "Gagal menyimpan kategori.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (kategori: Kategori) => {
    setDeleteConfirm({ show: true, kategori });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.kategori?.id_kategori;
    if (!id) return;

    try {
      const res = await fetch(`/api/kategori/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast("Kategori berhasil dihapus.", "success");
        fetchData();
      } else {
        showToast(data.error || "Gagal menghapus kategori.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setDeleteConfirm({ show: false, kategori: null });
    }
  };

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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl animate-in slide-in-from-top-5 duration-200 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 backdrop-blur-md" 
            : "bg-error/10 border-error/25 text-error backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-primary" /> Kategori Barang
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{list.length} kategori terdaftar</p>
        </div>
        {can_create && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Kode Kategori</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Nama Kategori</th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Belum ada kategori barang yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  list.map((c, idx) => (
                    <tr key={c.id_kategori} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant text-sm font-mono">{idx + 1}</td>
                      <td className="px-5 py-2.5">
                        <span className="text-primary font-mono text-sm bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">{c.kode_kategori}</span>
                      </td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{c.nama_kategori}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          {can_update && (
                            <button onClick={() => openModal(c)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button onClick={() => confirmDelete(c)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Kategori" : "Tambah Kategori Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Kode Kategori</label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  placeholder="Contoh: kt-001"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Contoh: Makanan, Minuman, dll."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {saving ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.kategori && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center gap-2 bg-surface-container-high/40 text-error">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h2 className="font-semibold text-on-surface">Konfirmasi Hapus</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                Apakah Anda yakin ingin menghapus kategori <span className="font-semibold text-on-surface">"{deleteConfirm.kategori.nama_kategori}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm({ show: false, kategori: null })}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-error hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
