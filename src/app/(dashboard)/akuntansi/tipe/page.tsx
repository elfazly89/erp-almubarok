"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, Edit2, Trash2, RefreshCw, Tags, AlertTriangle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface TipeAkun {
  id: number;
  nama: string;
  posisi_saldo_normal: "DEBIT" | "KREDIT";
}

export default function TipeAkunPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<TipeAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<TipeAkun | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formSaldo, setFormSaldo] = useState<"DEBIT" | "KREDIT" | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/akuntansi/tipe-akun");
      if (!res.ok) throw new Error("Gagal memuat data");
      setList(await res.json());
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item?: TipeAkun) => {
    setEdit(item || null);
    setFormNama(item?.nama || "");
    setFormSaldo(item?.posisi_saldo_normal || "");
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNama.trim() || !formSaldo) {
      setErrorMsg("Semua kolom wajib diisi");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      let res;
      if (edit) {
        res = await fetch(`/api/akuntansi/tipe-akun/${edit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: formNama, posisi_saldo_normal: formSaldo }),
        });
      } else {
        res = await fetch("/api/akuntansi/tipe-akun", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: formNama, posisi_saldo_normal: formSaldo }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

      setShowModal(false);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tipe akun ini?")) return;
    try {
      const res = await fetch(`/api/akuntansi/tipe-akun/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus");
      fetchData();
    } catch (e: any) {
      alert(e.message);
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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Tags className="w-6 h-6 text-primary" /> Tipe Akun Akuntansi
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{list.length} tipe akun dikonfigurasi</p>
        </div>
        {can_create && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Tipe Akun
          </button>
        )}
      </div>

      <div className="bg-surface-container border border-outline-variant/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-high/40">
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-16">ID</th>
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Nama Tipe Akun</th>
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Saldo Normal</th>
                <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                    Tidak ada data tipe akun.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-5 py-2.5 text-on-surface-variant text-sm font-mono">{item.id}</td>
                    <td className="px-5 py-2.5 text-on-surface font-medium">{item.nama}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          item.posisi_saldo_normal === "DEBIT"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-secondary/10 text-secondary border-secondary/20"
                        }`}
                      >
                        {item.posisi_saldo_normal}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        {can_update && (
                          <button
                            onClick={() => openModal(item)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can_delete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Hapus"
                          >
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
          <div className="bg-surface-container border border-outline-variant/60 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Tipe Akun" : "Tambah Tipe Akun"}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-lg"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-error/15 border border-error/25 text-error text-xs px-3.5 py-2.5 rounded-xl">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nama Tipe Akun</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Contoh: Aset, Kewajiban, dll."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Posisi Saldo Normal</label>
                <select
                  value={formSaldo}
                  onChange={(e) => setFormSaldo(e.target.value as "DEBIT" | "KREDIT" | "")}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Saldo Normal --</option>
                  <option value="DEBIT" className="bg-surface-container text-on-surface">DEBIT</option>
                  <option value="KREDIT" className="bg-surface-container text-on-surface">KREDIT</option>
                </select>
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
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
