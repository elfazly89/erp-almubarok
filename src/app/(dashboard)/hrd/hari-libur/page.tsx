"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarOff, Plus, Edit2, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface HariLibur {
  id: number;
  tanggal: string;
  nama_libur: string;
  keterangan: string | null;
}

export default function HariLiburPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<HariLibur | null>(null);
  const [form, setForm] = useState({ tanggal: "", nama_libur: "", keterangan: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hrd/hari-libur");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item?: HariLibur) => {
    setEdit(item || null);
    setForm(item ? { tanggal: item.tanggal, nama_libur: item.nama_libur, keterangan: item.keterangan || "" } : { tanggal: "", nama_libur: "", keterangan: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tanggal || !form.nama_libur) return;
    setSaving(true);
    if (edit) {
      await fetch(`/api/hrd/hari-libur/${edit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/hrd/hari-libur", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus hari libur ini?")) return;
    await fetch(`/api/hrd/hari-libur/${id}`, { method: "DELETE" });
    fetchData();
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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-primary" /> Hari Libur
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{list.length} hari libur terdaftar</p>
        </div>
        {can_create && (
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant/70 font-medium">Belum ada hari libur</div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/35 bg-surface-container-low">
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Tanggal</th>
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Nama Libur</th>
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Keterangan</th>
                <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="px-5 py-2.5">
                    <span className="text-on-surface font-mono text-sm">{item.tanggal}</span>
                    <p className="text-on-surface-variant/70 text-xs mt-0.5">{formatDate(item.tanggal)}</p>
                  </td>
                  <td className="px-5 py-2.5 text-on-surface text-sm font-semibold">{item.nama_libur}</td>
                  <td className="px-5 py-2.5 text-on-surface-variant text-sm hidden md:table-cell">{item.keterangan || "—"}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      {can_update && (
                        <button onClick={() => openModal(item)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      )}
                      {can_delete && (
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-lg transition-colors cursor-pointer" title="Hapus"><Trash2 className="w-4 h-4" /></button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Hari Libur" : "Tambah Hari Libur"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors cursor-pointer">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              {[
                { label: "Tanggal", key: "tanggal", type: "date" },
                { label: "Nama Libur", key: "nama_libur", type: "text", placeholder: "Hari Raya Idul Fitri" },
                { label: "Keterangan", key: "keterangan", type: "text", placeholder: "Libur Nasional" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 cursor-pointer">
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
