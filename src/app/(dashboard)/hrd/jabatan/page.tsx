"use client";

import { useState, useEffect, useCallback } from "react";
import { Briefcase, Plus, Edit2, Trash2, RefreshCw } from "lucide-react";

interface Jabatan {
  id_jabatan: number;
  jabatan: string;
}

export default function JabatanPage() {
  const [list, setList] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Jabatan | null>(null);
  const [form, setForm] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hrd/jabatan");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (jabatan?: Jabatan) => {
    setEdit(jabatan || null);
    setForm(jabatan?.jabatan || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.trim()) return;
    setSaving(true);
    if (edit) {
      await fetch(`/api/hrd/jabatan/${edit.id_jabatan}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan: form }),
      });
    } else {
      await fetch("/api/hrd/jabatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jabatan: form }),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jabatan ini?")) return;
    await fetch(`/api/hrd/jabatan/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Daftar Jabatan
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{list.length} jabatan terdaftar</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Jabatan
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/35 bg-surface-container-low">
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Jabatan</th>
                <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {list.map((j, idx) => (
                <tr key={j.id_jabatan} className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="px-5 py-2.5 text-on-surface-variant/70 text-sm">{idx + 1}</td>
                  <td className="px-5 py-2.5">
                    <span className="text-on-surface font-semibold text-sm">{j.jabatan}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(j)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(j.id_jabatan)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-lg transition-colors cursor-pointer" title="Hapus">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Jabatan" : "Tambah Jabatan"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors cursor-pointer">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Nama Jabatan</label>
                <input
                  type="text"
                  value={form}
                  onChange={(e) => setForm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
                  placeholder="Contoh: Kasir, Manager, dll."
                  autoFocus
                />
              </div>
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
