"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Edit2, Trash2, RefreshCw, Search, AlertTriangle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface TipeAkun {
  id: number;
  nama: string;
  posisi_saldo_normal: "DEBIT" | "KREDIT";
}

interface DaftarAkun {
  id: number;
  kode_akun: string;
  nama_akun: string;
  deskripsi: string | null;
  tipe_akun_id: number;
  status: "Aktif" | "Non-Aktif";
  nama_tipe_akun: string | null;
  posisi_saldo_normal: "DEBIT" | "KREDIT" | null;
}

export default function CoaPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<DaftarAkun[]>([]);
  const [tipeList, setTipeList] = useState<TipeAkun[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<string>("all");

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<DaftarAkun | null>(null);
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formTipe, setFormTipe] = useState("");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formStatus, setFormStatus] = useState<"Aktif" | "Non-Aktif">("Aktif");
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const coaRes = await fetch("/api/akuntansi/daftar-akun");
      const tipeRes = await fetch("/api/akuntansi/tipe-akun");

      if (!coaRes.ok || !tipeRes.ok) throw new Error("Gagal mengambil data");

      setList(await coaRes.json());
      setTipeList(await tipeRes.json());
    } catch (e: any) {
      setErrorMsg(e.message || "Gagal mengambil data dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item?: DaftarAkun) => {
    setEdit(item || null);
    setFormKode(item?.kode_akun || "");
    setFormNama(item?.nama_akun || "");
    setFormTipe(item?.tipe_akun_id?.toString() || "");
    setFormDeskripsi(item?.deskripsi || "");
    setFormStatus(item?.status || "Aktif");
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formKode.trim() || !formNama.trim() || !formTipe) {
      setErrorMsg("Kode, Nama, dan Tipe Akun wajib diisi");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      let res;
      const payload = {
        kode_akun: formKode,
        nama_akun: formNama,
        tipe_akun_id: parseInt(formTipe),
        deskripsi: formDeskripsi,
        status: formStatus,
      };

      if (edit) {
        res = await fetch(`/api/akuntansi/daftar-akun/${edit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/akuntansi/daftar-akun", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

      setShowModal(false);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun CoA ini?")) return;
    try {
      const res = await fetch(`/api/akuntansi/daftar-akun/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus");
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filter list
  const filteredList = list.filter((item) => {
    const matchesSearch =
      item.kode_akun.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_akun.toLowerCase().includes(search.toLowerCase()) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase()));

    const matchesTipe =
      selectedTipe === "all" ||
      item.nama_tipe_akun?.toLowerCase() === selectedTipe.toLowerCase();

    return matchesSearch && matchesTipe;
  });

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Bagan Akun (Chart of Accounts)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{list.length} akun buku besar terdaftar</p>
        </div>
        {can_create && (
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full md:w-auto shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Akun Baru
          </button>
        )}
      </div>

      {/* Tab Filter Tipe & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-surface-container/40 px-4 py-2 border border-outline-variant/30 rounded-xl shrink-0">
        {/* Tipe Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTipe("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              selectedTipe === "all"
                ? "bg-primary/10 text-primary border-primary/25"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:text-on-surface"
            }`}
          >
            Semua Tipe
          </button>
          {tipeList.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTipe(t.nama)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                selectedTipe.toLowerCase() === t.nama.toLowerCase()
                  ? "bg-primary/10 text-primary border-primary/25"
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:text-on-surface"
              }`}
            >
              {t.nama}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* CoA Table */}
      <div className="bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-32">Kode Akun</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Nama Akun</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Deskripsi</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Tipe Akun</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                    Tidak ada bagan akun yang cocok dengan pencarian / filter Anda.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-5 py-2.5">
                      <span className="text-primary font-mono text-sm bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {item.kode_akun}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-on-surface font-medium">{item.nama_akun}</td>
                    <td className="px-5 py-2.5 text-on-surface-variant text-sm hidden md:table-cell max-w-xs truncate" title={item.deskripsi || ""}>
                      {item.deskripsi || "—"}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-on-surface text-sm font-medium">{item.nama_tipe_akun || "—"}</span>
                        <span className="text-on-surface-variant/80 text-xs">Saldo normal: {item.posisi_saldo_normal || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          item.status === "Aktif"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-error/10 text-error border-error/20"
                        }`}
                      >
                        {item.status}
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
        )}
      </div>

      {/* Modal Creator/Editor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Akun (CoA)" : "Tambah Akun Baru"}</h2>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Tipe Akun</label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Tipe --</option>
                    {tipeList.map((t) => (
                      <option key={t.id} value={t.id} className="bg-surface-container text-on-surface">
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Kode Akun</label>
                  <input
                    type="text"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    placeholder="Contoh: 1.101.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nama Akun</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Contoh: Kas Utama Toko, Bank BCA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Deskripsi</label>
                <textarea
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 h-20 resize-none"
                  placeholder="Keterangan singkat mengenai akun ini..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Status Akun</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Aktif" | "Non-Aktif")}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Aktif" className="bg-surface-container text-on-surface">Aktif</option>
                  <option value="Non-Aktif" className="bg-surface-container text-on-surface">Non-Aktif</option>
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
