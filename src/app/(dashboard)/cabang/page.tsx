"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  X,
  Store,
  Layers,
  Settings,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Eye,
  Printer,
  QrCode
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Cabang {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  alamat: string;
  telepon: string | null;
  email: string | null;
  admin: number | null;
  nama_admin: string | null;
  latitude: string | null;
  longitude: string | null;
  data_kode: string | null;
}

interface DBUser {
  id: number;
  nama_user: string;
  kode_user: string;
}

export default function CabangManagementPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Cabang[]>([]);
  const [userList, setUserList] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [viewCabang, setViewCabang] = useState<Cabang | null>(null);
  const [editItem, setEditItem] = useState<Cabang | null>(null);

  // Form states
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formTelepon, setFormTelepon] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAdmin, setFormAdmin] = useState("");
  const [formLatitude, setFormLatitude] = useState("");
  const [formLongitude, setFormLongitude] = useState("");


  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortField, setSortField] = useState<string>("kode_cabang");
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const cabRes = await fetch("/api/cabang");
      const userRes = await fetch("/api/hrd/users?limit=100");

      if (cabRes.ok) setList(await cabRes.json());
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserList(userData.data || []);
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data cabang dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item?: Cabang) => {
    if (item) {
      setEditItem(item);
      setFormKode(item.kode_cabang);
      setFormNama(item.nama_cabang);
      setFormAlamat(item.alamat);
      setFormTelepon(item.telepon || "");
      setFormEmail(item.email || "");
      setFormAdmin(item.admin ? item.admin.toString() : "");
      setFormLatitude(item.latitude || "");
      setFormLongitude(item.longitude || "");
    } else {
      setEditItem(null);
      setFormKode("");
      setFormNama("");
      setFormAlamat("");
      setFormTelepon("");
      setFormEmail("");
      setFormAdmin("");
      setFormLatitude("");
      setFormLongitude("");
    }
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formKode.trim() || !formNama.trim() || !formAlamat.trim()) {
      setErrorMsg("Kode, nama cabang, dan alamat wajib diisi");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        kode_cabang: formKode,
        nama_cabang: formNama,
        alamat: formAlamat,
        telepon: formTelepon || null,
        email: formEmail || null,
        admin: formAdmin ? parseInt(formAdmin) : null,
        latitude: formLatitude || null,
        longitude: formLongitude || null,
      };

      let res;
      if (editItem) {
        res = await fetch(`/api/cabang/${editItem.id_cabang}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/cabang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan cabang");

      setShowModal(false);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan koneksi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus cabang ini?")) return;
    try {
      const res = await fetch(`/api/cabang/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus cabang");
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("print-area-cabang");
    if (!printArea) return;

    const tempContainer = document.createElement("div");
    tempContainer.id = "temp-print-container";

    const clone = printArea.cloneNode(true) as HTMLElement;
    clone.id = "temp-print-content";
    clone.classList.remove("hidden");

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    document.body.classList.add("printing-active");

    window.print();

    document.body.classList.remove("printing-active");
    document.body.removeChild(tempContainer);
  };

  // Filter list
  const filteredList = list.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.kode_cabang.toLowerCase().includes(s) ||
      item.nama_cabang.toLowerCase().includes(s) ||
      item.alamat.toLowerCase().includes(s) ||
      (item.data_kode || "").toLowerCase().includes(s)
    );
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any = a[sortField as keyof Cabang] ?? "";
    let bVal: any = b[sortField as keyof Cabang] ?? "";

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
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
      <style dangerouslySetInnerHTML={{__html: `
        #temp-print-container {
          display: none;
        }
        @media print {
          @page {
            margin: 0;
          }
          body.printing-active > :not(#temp-print-container) {
            display: none !important;
          }
          body.printing-active {
            background: white !important;
            color: black !important;
          }
          #temp-print-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          #temp-print-content {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Pengaturan Cabang
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {can_create && (
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 shadow-sm shadow-primary-container/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Cabang
            </button>
          )}
        </div>
      </div>

      {/* Widget Cards Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="bg-surface border border-outline-variant/30 py-2 px-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block">Total Cabang</span>
              <strong className="text-base font-bold text-primary block -mt-0.5">{list.length} Outlet</strong>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/30 py-2 px-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block">Abdi Terhubung</span>
              <strong className="text-base font-bold text-secondary block -mt-0.5">{userList.length} Akun</strong>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/30 py-2 px-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block">Metrik Stabilitas</span>
              <strong className="text-base font-bold text-primary block -mt-0.5">100% Aktif</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Cabang Data Grid / Table */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat daftar cabang...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-36 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("kode_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kode Cabang {renderSortIndicator("kode_cabang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-48 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Cabang {renderSortIndicator("nama_cabang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("alamat")}
                  >
                    <div className="flex items-center gap-1.5">
                      Alamat Lengkap {renderSortIndicator("alamat")}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-40">
                    Koordinat Absensi
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-40 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("telepon")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kontak Cabang {renderSortIndicator("telepon")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-40 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_admin")}
                  >
                    <div className="flex items-center gap-1.5">
                      Administrator {renderSortIndicator("nama_admin")}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant">
                      Tidak ada cabang yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((item) => (
                    <tr key={item.id_cabang} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                          {item.kode_cabang}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold text-xs">
                        {item.nama_cabang}
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant max-w-xs truncate text-xs" title={item.alamat}>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {item.alamat}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs">
                        {item.latitude && item.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                          >
                            <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                            {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-on-surface-variant/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs space-y-1">
                        {item.telepon && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-secondary" />
                            <span>{item.telepon}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-secondary" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {!item.telepon && !item.email && <span className="text-on-surface-variant/40">—</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        {item.nama_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                            <User className="w-3 h-3" />
                            {item.nama_admin}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-xs">— Belum Ditunjuk —</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewCabang(item)}
                            className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors cursor-pointer"
                            title="Detail cabang"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {can_update && (
                            <button
                              onClick={() => openModal(item)}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                              title="Ubah data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button
                              onClick={() => handleDelete(item.id_cabang)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
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

      {/* CRUD INPUT DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">
                {editItem ? "Edit Cabang" : "Tambah Cabang Baru"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-error/15 border border-error/25 text-error text-xs px-3.5 py-2.5 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Kode Cabang</label>
                  <input
                    type="text"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    placeholder="Contoh: SR092"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nama Cabang</label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Nama Cabang"
                    required
                  />
                </div>
              </div>

              {editItem && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Data Kode QR (Absensi - Auto-Generated)</label>
                  <input
                    type="text"
                    value={editItem.data_kode || "—"}
                    disabled
                    className="w-full bg-surface-container border border-outline-variant/60 text-on-surface-variant/80 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Alamat Kantor/Outlet"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Telepon</label>
                  <input
                    type="text"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="0823..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="cabang@almubarok.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Latitude</label>
                  <input
                    type="text"
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    placeholder="Contoh: -7.12345"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Longitude</label>
                  <input
                    type="text"
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    placeholder="Contoh: 113.12345"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Administrator Cabang</label>
                <select
                  value={formAdmin}
                  onChange={(e) => setFormAdmin(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Admin --</option>
                  {userList.map((user) => (
                    <option key={user.id} value={user.id} className="bg-surface-container text-on-surface">
                      {user.nama_user} ({user.kode_user})
                    </option>
                  ))}
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
                  className="flex-1 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW & PRINT QR MODAL */}
      {viewCabang && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div>
                <h2 className="font-bold text-on-surface text-lg">Detail Cabang</h2>
                <p className="text-on-surface-variant/60 text-xs mt-0.5">Informasi lengkap dan QR Code absensi</p>
              </div>
              <button 
                onClick={() => setViewCabang(null)} 
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Printed area wrapper */}
              <div id="print-area-cabang" className="hidden">
                <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-3xl text-center text-slate-800 w-[380px] max-w-full">
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">{viewCabang.nama_cabang}</h2>
                  <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                    {viewCabang.alamat}
                  </p>

                  {/* QR Code visualization */}
                  <div className="my-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(viewCabang.data_kode || "")}`}
                      alt={`QR Code ${viewCabang.nama_cabang}`}
                      className="w-48 h-48"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium max-w-xs mt-1 italic">
                    Posisikan kode di dalam area scanner absensi untuk masuk atau pulang.
                  </p>
                </div>
              </div>

              {/* General Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-surface-container/35 p-4 rounded-xl border border-outline-variant/25">
                <div className="space-y-1 col-span-2">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Alamat Lengkap</span>
                  <span className="text-on-surface font-medium block">{viewCabang.alamat}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Telepon</span>
                  <span className="text-on-surface font-medium block">{viewCabang.telepon || "—"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Email</span>
                  <span className="text-on-surface font-medium block truncate" title={viewCabang.email || ""}>{viewCabang.email || "—"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Administrator</span>
                  <span className="text-on-surface font-medium block">{viewCabang.nama_admin || "— Belum Ditunjuk —"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Koordinat Absensi</span>
                  {viewCabang.latitude && viewCabang.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${viewCabang.latitude},${viewCabang.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono font-semibold block"
                    >
                      {parseFloat(viewCabang.latitude).toFixed(4)}, {parseFloat(viewCabang.longitude).toFixed(4)}
                    </a>
                  ) : (
                    <span className="text-on-surface-variant/50 block font-mono">— Belum Diset —</span>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Data Kode QR (Absensi)</span>
                  <span className="text-on-surface font-medium block font-mono bg-surface-container px-2.5 py-1 rounded border border-outline-variant/20 max-w-max select-all">
                    {viewCabang.data_kode || "—"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-low text-xs no-print">
              <button 
                onClick={() => setViewCabang(null)} 
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-3 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={handlePrint} 
                className="flex-1 bg-primary hover:bg-primary/95 text-on-primary py-3 rounded-xl font-bold shadow-lg shadow-primary/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
