"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Edit2, Trash2, RefreshCw } from "lucide-react";

interface JamKerja {
  id: number;
  nama_shift: string;
  jam_masuk: string;
  jam_masuk_batas_akhir: string;
  jam_pulang: string;
  jam_pulang_batas_awal: string;
  keterangan: string | null;
}

const defaultForm = {
  nama_shift: "",
  jam_masuk: "08:00",
  jam_masuk_batas_akhir: "08:15",
  jam_pulang: "16:00",
  jam_pulang_batas_awal: "15:45",
  keterangan: "",
};

export default function JamKerjaPage() {
  const [list, setList] = useState<JamKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<JamKerja | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hrd/jam-kerja");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item?: JamKerja) => {
    setEdit(item || null);
    setForm(item ? {
      nama_shift: item.nama_shift,
      jam_masuk: item.jam_masuk.slice(0, 5),
      jam_masuk_batas_akhir: item.jam_masuk_batas_akhir.slice(0, 5),
      jam_pulang: item.jam_pulang.slice(0, 5),
      jam_pulang_batas_awal: item.jam_pulang_batas_awal.slice(0, 5),
      keterangan: item.keterangan || "",
    } : defaultForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (edit) {
      await fetch(`/api/hrd/jam-kerja/${edit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/hrd/jam-kerja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus shift ini?")) return;
    await fetch(`/api/hrd/jam-kerja/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-background flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" /> Jam Kerja / Shift
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{list.length} shift terdaftar</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : list.length === 0 ? (
          <div className="col-span-full text-center py-16 text-on-surface-variant/70 font-medium">Belum ada shift</div>
        ) : list.map((shift) => (
          <div key={shift.id} className="bg-surface border border-outline-variant/30 rounded-2xl p-5 hover:border-outline-variant/60 shadow-sm transition-all duration-150">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-on-surface font-bold text-base capitalize">{shift.nama_shift}</h3>
                {shift.keterangan && <p className="text-on-surface-variant text-xs mt-0.5">{shift.keterangan}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(shift)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(shift.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-lg transition-colors cursor-pointer" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Masuk</span>
                <span className="text-primary font-mono font-semibold">{shift.jam_masuk.slice(0,5)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Batas Masuk</span>
                <span className="text-tertiary font-mono font-semibold">{shift.jam_masuk_batas_akhir.slice(0,5)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Pulang</span>
                <span className="text-secondary font-mono font-semibold">{shift.jam_pulang.slice(0,5)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">Batas Pulang</span>
                <span className="text-on-surface/85 font-mono">{shift.jam_pulang_batas_awal.slice(0,5)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Shift" : "Tambah Shift Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors cursor-pointer">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Nama Shift</label>
                <input
                  type="text"
                  value={form.nama_shift}
                  onChange={(e) => setForm(f => ({ ...f, nama_shift: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
                  placeholder="shift1, kantor, dll."
                />
              </div>
              {[
                { label: "Jam Masuk", key: "jam_masuk" },
                { label: "Batas Akhir Masuk", key: "jam_masuk_batas_akhir" },
                { label: "Jam Pulang", key: "jam_pulang" },
                { label: "Batas Awal Pulang", key: "jam_pulang_batas_awal" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">{label}</label>
                  <input
                    type="time"
                    value={(form as any)[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Keterangan</label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
                  placeholder="Opsional"
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
