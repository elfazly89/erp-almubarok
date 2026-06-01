"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Edit2, Trash2, RefreshCw, ChevronUp, ChevronDown, Search } from "lucide-react";

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  bank?: string;
  no_rek_bank?: string;
  hari_kunjungan?: string;
  periode_kunjungan?: string;
  status_pajak?: string;
  npwp?: string;
  keterangan_1?: string;
  keterangan_2?: string;
}

export default function SupplierPage() {
  const [list, setList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  
  // Form fields
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [email, setEmail] = useState("");
  const [bank, setBank] = useState("");
  const [noRek, setNoRek] = useState("");
  const [hariKunjungan, setHariKunjungan] = useState("");
  const [periodeKunjungan, setPeriodeKunjungan] = useState("");
  const [statusPajak, setStatusPajak] = useState("PKP");
  const [npwp, setNpwp] = useState("");
  const [ket1, setKet1] = useState("");
  const [ket2, setKet2] = useState("");

  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<string>("nama_supplier");
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
    const res = await fetch("/api/supplier");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (supplier?: Supplier) => {
    setEdit(supplier || null);
    setNama(supplier?.nama_supplier || "");
    setAlamat(supplier?.alamat || "");
    setTelepon(supplier?.telepon || "");
    setEmail(supplier?.email || "");
    setBank(supplier?.bank || "");
    setNoRek(supplier?.no_rek_bank || "");
    setHariKunjungan(supplier?.hari_kunjungan || "");
    setPeriodeKunjungan(supplier?.periode_kunjungan || "");
    setStatusPajak(supplier?.status_pajak || "PKP");
    setNpwp(supplier?.npwp || "");
    setKet1(supplier?.keterangan_1 || "");
    setKet2(supplier?.keterangan_2 || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nama.trim()) return;
    setSaving(true);
    const payload = {
      nama_supplier: nama,
      alamat,
      telepon,
      email,
      bank,
      no_rek_bank: noRek,
      hari_kunjungan: hariKunjungan,
      periode_kunjungan: periodeKunjungan,
      status_pajak: statusPajak,
      npwp,
      keterangan_1: ket1,
      keterangan_2: ket2,
    };

    if (edit) {
      await fetch(`/api/supplier/${edit.id_supplier}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    setLoading(true);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus supplier ini?")) return;
    await fetch(`/api/supplier/${id}`, { method: "DELETE" });
    setLoading(true);
    fetchData();
  };

  const filteredList = list.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.nama_supplier.toLowerCase().includes(s) ||
      (item.alamat && item.alamat.toLowerCase().includes(s)) ||
      (item.telepon && item.telepon.includes(s)) ||
      (item.email && item.email.toLowerCase().includes(s))
    );
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any = a[sortField as keyof Supplier] ?? "";
    let bVal: any = b[sortField as keyof Supplier] ?? "";

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Daftar Supplier
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center bg-surface-container/40 px-4 py-2 border border-outline-variant/30 rounded-xl shrink-0">
        <span className="text-on-surface-variant text-xs font-semibold">Daftar Supplier Aktif</span>
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, alamat, telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_supplier")}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Supplier {renderSortIndicator("nama_supplier")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("telepon")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kontak {renderSortIndicator("telepon")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("alamat")}
                  >
                    <div className="flex items-center gap-1.5">
                      Alamat {renderSortIndicator("alamat")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("hari_kunjungan")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kunjungan {renderSortIndicator("hari_kunjungan")}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Belum ada supplier yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((s, idx) => (
                    <tr key={s.id_supplier} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-4 text-on-surface-variant text-sm font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface font-semibold block">{s.nama_supplier}</span>
                        <span className="text-on-surface-variant text-xs">{s.status_pajak} {s.npwp ? `| NPWP: ${s.npwp}` : ""}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface text-sm block font-semibold">{s.telepon || "-"}</span>
                        <span className="text-on-surface-variant text-xs">{s.email || "-"}</span>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant text-sm">{s.alamat || "-"}</td>
                      <td className="px-5 py-4 text-on-surface text-sm font-medium">
                        {s.hari_kunjungan ? `${s.hari_kunjungan} (${s.periode_kunjungan})` : "-"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(s)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(s.id_supplier)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Supplier" : "Tambah Supplier Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nama Supplier</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nama perusahaan supplier"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Alamat</label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 h-20"
                  placeholder="Alamat kantor / gudang"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Telepon</label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="No. Telepon / WA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="email@supplier.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Bank Partner</label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Contoh: BCA, Mandiri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">No. Rekening</label>
                <input
                  type="text"
                  value={noRek}
                  onChange={(e) => setNoRek(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nomor Rekening Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Hari Kunjungan Sales</label>
                <select
                  value={hariKunjungan}
                  onChange={(e) => setHariKunjungan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="" className="bg-surface text-on-surface-variant">-- Pilih Hari --</option>
                  <option value="Senin" className="bg-surface text-on-surface">Senin</option>
                  <option value="Selasa" className="bg-surface text-on-surface">Selasa</option>
                  <option value="Rabu" className="bg-surface text-on-surface">Rabu</option>
                  <option value="Kamis" className="bg-surface text-on-surface">Kamis</option>
                  <option value="Jumat" className="bg-surface text-on-surface">Jumat</option>
                  <option value="Sabtu" className="bg-surface text-on-surface">Sabtu</option>
                  <option value="Minggu" className="bg-surface text-on-surface">Minggu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Periode Kunjungan</label>
                <select
                  value={periodeKunjungan}
                  onChange={(e) => setPeriodeKunjungan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="" className="bg-surface text-on-surface-variant">-- Pilih Periode --</option>
                  <option value="Mingguan" className="bg-surface text-on-surface">Mingguan</option>
                  <option value="Setengah Bulanan" className="bg-surface text-on-surface">Setengah Bulanan</option>
                  <option value="Bulanan" className="bg-surface text-on-surface">Bulanan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Status Pajak</label>
                <select
                  value={statusPajak}
                  onChange={(e) => setStatusPajak(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="PKP" className="bg-surface text-on-surface">PKP</option>
                  <option value="NON-PKP" className="bg-surface text-on-surface">NON-PKP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">NPWP</label>
                <input
                  type="text"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nomor Pokok Wajib Pajak"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Keterangan 1</label>
                <input
                  type="text"
                  value={ket1}
                  onChange={(e) => setKet1(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Catatan tambahan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Keterangan 2</label>
                <input
                  type="text"
                  value={ket2}
                  onChange={(e) => setKet2(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Catatan tambahan lain"
                />
              </div>
              <div className="col-span-2 flex gap-3 mt-4 border-t border-outline-variant/40 pt-4">
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
                  {saving ? "Menyimpan..." : "Simpan Supplier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
