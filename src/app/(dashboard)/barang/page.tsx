"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Edit2, Trash2, RefreshCw, Search, Eye, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Kategori {
  id_kategori: number;
  nama_kategori: string;
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

interface Barang {
  id_barang: number;
  barcode: string;
  nama_barang: string;
  id_kategori: number | null;
  nama_kategori?: string | null;
  id_supplier: number | null;
  nama_supplier?: string | null;
  satuan_1: string | null;
  satuan_2: string | null;
  satuan_3: string | null;
  isi_1: number | null;
  isi_2: number | null;
  isi_3: number | null;
  harga_beli: number | null;
  harga_rata: number | null;
  harga_jual_1_1: number | null;
  harga_jual_1_2: number | null;
  harga_jual_1_3: number | null;
  harga_jual_2_1: number | null;
  harga_jual_2_2: number | null;
  harga_jual_2_3: number | null;
  harga_jual_3_1: number | null;
  harga_jual_3_2: number | null;
  harga_jual_3_3: number | null;
  jual_rugi: number;
  status: string;
  status_pajak: string | null;
  keterangan_1: string | null;
  keterangan_2: string | null;
}

export default function BarangPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Barang[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null);
  const [edit, setEdit] = useState<Barang | null>(null);

  // Form Fields
  const [barcode, setBarcode] = useState("");
  const [nama, setNama] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [satuan1, setSatuan1] = useState("pcs");
  const [satuan2, setSatuan2] = useState("");
  const [satuan3, setSatuan3] = useState("");
  const [isi1, setIsi1] = useState("1");
  const [isi2, setIsi2] = useState("");
  const [isi3, setIsi3] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaRata, setHargaRata] = useState("");
  
  // Prices
  const [hj_1_1, setHj11] = useState("");
  const [hj_1_2, setHj12] = useState("");
  const [hj_1_3, setHj13] = useState("");
  const [hj_2_1, setHj21] = useState("");
  const [hj_2_2, setHj22] = useState("");
  const [hj_2_3, setHj23] = useState("");
  const [hj_3_1, setHj31] = useState("");
  const [hj_3_2, setHj32] = useState("");
  const [hj_3_3, setHj33] = useState("");

  const [jualRugi, setJualRugi] = useState("0");
  const [status, setStatus] = useState("Aktif");
  const [statusPajak, setStatusPajak] = useState("Non PPn");
  const [ket1, setKet1] = useState("");
  const [ket2, setKet2] = useState("");

  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<string>("nama_barang");
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
    const [resBarang, resKat, resSup] = await Promise.all([
      fetch("/api/barang"),
      fetch("/api/kategori"),
      fetch("/api/supplier"),
    ]);
    
    setList(await resBarang.json());
    setCategories(await resKat.json());
    setSuppliers(await resSup.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (barang?: Barang) => {
    setEdit(barang || null);
    setBarcode(barang?.barcode || "");
    setNama(barang?.nama_barang || "");
    setKategoriId(barang?.id_kategori?.toString() || "");
    setSupplierId(barang?.id_supplier?.toString() || "");
    setSatuan1(barang?.satuan_1 || "pcs");
    setSatuan2(barang?.satuan_2 || "");
    setSatuan3(barang?.satuan_3 || "");
    setIsi1(barang?.isi_1?.toString() || "1");
    setIsi2(barang?.isi_2?.toString() || "");
    setIsi3(barang?.isi_3?.toString() || "");
    setHargaBeli(barang?.harga_beli?.toString() || "");
    setHargaRata(barang?.harga_rata?.toString() || "");
    
    setHj11(barang?.harga_jual_1_1?.toString() || "");
    setHj12(barang?.harga_jual_1_2?.toString() || "");
    setHj13(barang?.harga_jual_1_3?.toString() || "");
    setHj21(barang?.harga_jual_2_1?.toString() || "");
    setHj22(barang?.harga_jual_2_2?.toString() || "");
    setHj23(barang?.harga_jual_2_3?.toString() || "");
    setHj31(barang?.harga_jual_3_1?.toString() || "");
    setHj32(barang?.harga_jual_3_2?.toString() || "");
    setHj33(barang?.harga_jual_3_3?.toString() || "");

    setJualRugi(barang?.jual_rugi?.toString() || "0");
    setStatus(barang?.status || "Aktif");
    setStatusPajak(barang?.status_pajak || "Non PPn");
    setKet1(barang?.keterangan_1 || "");
    setKet2(barang?.keterangan_2 || "");
    
    setShowModal(true);
  };

  const openViewModal = (item: Barang) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!barcode.trim() || !nama.trim()) return;
    setSaving(true);
    
    const payload = {
      barcode,
      nama_barang: nama,
      id_kategori: kategoriId || null,
      id_supplier: supplierId || null,
      satuan_1: satuan1,
      satuan_2: satuan2 || null,
      satuan_3: satuan3 || null,
      isi_1: isi1 || 1,
      isi_2: isi2 || null,
      isi_3: isi3 || null,
      harga_beli: hargaBeli || null,
      harga_rata: hargaRata || null,
      harga_jual_1_1: hj_1_1 || null,
      harga_jual_1_2: hj_1_2 || null,
      harga_jual_1_3: hj_1_3 || null,
      harga_jual_2_1: hj_2_1 || null,
      harga_jual_2_2: hj_2_2 || null,
      harga_jual_2_3: hj_2_3 || null,
      harga_jual_3_1: hj_3_1 || null,
      harga_jual_3_2: hj_3_2 || null,
      harga_jual_3_3: hj_3_3 || null,
      jual_rugi: parseInt(jualRugi),
      status,
      status_pajak: statusPajak || null,
      keterangan_1: ket1 || null,
      keterangan_2: ket2 || null,
    };

    if (edit) {
      await fetch(`/api/barang/${edit.id_barang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus barang ini?")) return;
    await fetch(`/api/barang/${id}`, { method: "DELETE" });
    fetchData();
  };

  const formatRupiah = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredList = list.filter(
    (b) =>
      b.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      b.barcode.includes(search)
  );

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === "nama_kategori") {
      aVal = a.nama_kategori || "";
      bVal = b.nama_kategori || "";
    } else if (sortField === "nama_supplier") {
      aVal = a.nama_supplier || "";
      bVal = b.nama_supplier || "";
    } else {
      aVal = a[sortField as keyof Barang] ?? "";
      bVal = b[sortField as keyof Barang] ?? "";
    }

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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-4 overflow-hidden text-on-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Katalog Barang
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{list.length} barang terdaftar</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / barcode..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {can_create && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Barang
            </button>
          )}
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
                    onClick={() => handleSort("nama_barang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Barang {renderSortIndicator("nama_barang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_kategori")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kategori & Supplier {renderSortIndicator("nama_kategori")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("harga_beli")}
                  >
                    <div className="flex items-center gap-1.5">
                      Harga Beli {renderSortIndicator("harga_beli")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("harga_jual_1_1")}
                  >
                    <div className="flex items-center gap-1.5">
                      Harga Jual (Retail) {renderSortIndicator("harga_jual_1_1")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status {renderSortIndicator("status")}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Belum ada katalog barang yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((b, idx) => (
                    <tr key={b.id_barang} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-4 text-on-surface-variant text-sm font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface font-semibold block">{b.nama_barang}</span>
                        <span className="text-on-surface-variant font-mono text-xs bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">{b.barcode}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface text-sm block font-medium">{b.nama_kategori || "-"}</span>
                        <span className="text-on-surface-variant text-xs">{b.nama_supplier || "-"}</span>
                      </td>
                      <td className="px-5 py-4 text-on-surface font-mono text-sm">
                        {formatRupiah(b.harga_beli)}
                      </td>
                      <td className="px-5 py-4 text-primary text-sm font-bold font-mono">
                        {formatRupiah(b.harga_jual_1_1)} <span className="text-on-surface-variant font-normal text-xs">/ {b.satuan_1}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.status === "Aktif"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-error/10 text-error border border-error/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openViewModal(b)} className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Lihat detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          {can_update && (
                            <button onClick={() => openModal(b)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button onClick={() => handleDelete(b.id_barang)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Hapus">
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

      {/* Modal View Detail */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Detail Barang</h2>
              <button onClick={() => setShowViewModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-on-surface-variant text-xs block">Nama Barang</span>
                  <span className="text-on-surface font-semibold">{selectedItem.nama_barang}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Barcode</span>
                  <span className="text-on-surface font-mono font-semibold">{selectedItem.barcode}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Kategori</span>
                  <span className="text-on-surface font-semibold">{selectedItem.nama_kategori || "-"}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Supplier</span>
                  <span className="text-on-surface font-semibold">{selectedItem.nama_supplier || "-"}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Harga Beli</span>
                  <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_beli)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Harga HPP Rata-Rata</span>
                  <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_rata)}</span>
                </div>
              </div>

              <div className="border-t border-outline-variant/40 pt-4">
                <h3 className="font-semibold text-on-surface mb-2 text-sm">Struktur Satuan & Harga Jual</h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-on-surface-variant block">Satuan 1</span>
                      <span className="text-on-surface font-semibold">{selectedItem.satuan_1} (isi: {selectedItem.isi_1})</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Harga Retail</span>
                      <span className="text-primary font-bold font-mono">{formatRupiah(selectedItem.harga_jual_1_1)}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Harga Grosir</span>
                      <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_1)}</span>
                    </div>
                  </div>

                  {selectedItem.satuan_2 && (
                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-on-surface-variant block">Satuan 2</span>
                        <span className="text-on-surface font-semibold">{selectedItem.satuan_2} (isi: {selectedItem.isi_2} pcs)</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Harga Retail</span>
                        <span className="text-primary font-bold font-mono">{formatRupiah(selectedItem.harga_jual_1_2)}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Harga Grosir</span>
                        <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_2)}</span>
                      </div>
                    </div>
                  )}

                  {selectedItem.satuan_3 && (
                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-on-surface-variant block">Satuan 3</span>
                        <span className="text-on-surface font-semibold">{selectedItem.satuan_3} (isi: {selectedItem.isi_3} pcs)</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Harga Retail</span>
                        <span className="text-primary font-bold font-mono">{formatRupiah(selectedItem.harga_jual_1_3)}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Harga Grosir</span>
                        <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_3)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/40">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Barang" : "Tambah Barang Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Kolom 1: Data Dasar */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Informasi Produk
                </h3>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode *</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Barcode scanner scan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Nama lengkap barang"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Kategori</label>
                  <select
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id_kategori} value={c.id_kategori} className="bg-surface text-on-surface">{c.nama_kategori}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id_supplier} value={s.id_supplier} className="bg-surface text-on-surface">{s.nama_supplier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Status Pajak</label>
                  <select
                    value={statusPajak}
                    onChange={(e) => setStatusPajak(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="Non PPn" className="bg-surface text-on-surface">Non PPn</option>
                    <option value="PPn" className="bg-surface text-on-surface">PPn</option>
                    <option value="Cukai" className="bg-surface text-on-surface">Cukai</option>
                    <option value="Konsinyasi" className="bg-surface text-on-surface">Konsinyasi</option>
                  </select>
                </div>
              </div>

              {/* Kolom 2: Satuan & HPP */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Struktur Satuan
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Satuan 1 (Kecil)</label>
                    <input
                      type="text"
                      value={satuan1}
                      onChange={(e) => setSatuan1(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. pcs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Isi 1</label>
                    <input
                      type="number"
                      value={isi1}
                      onChange={(e) => setIsi1(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none opacity-60"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Satuan 2 (Tengah)</label>
                    <input
                      type="text"
                      value={satuan2}
                      onChange={(e) => setSatuan2(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. pak"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Isi 2 (jml pcs)</label>
                    <input
                      type="number"
                      value={isi2}
                      onChange={(e) => setIsi2(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Satuan 3 (Besar)</label>
                    <input
                      type="text"
                      value={satuan3}
                      onChange={(e) => setSatuan3(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. dus"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Isi 3 (jml pcs)</label>
                    <input
                      type="number"
                      value={isi3}
                      onChange={(e) => setIsi3(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>

                <div className="border-t border-outline-variant/40 pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Harga Beli</label>
                    <input
                      type="number"
                      value={hargaBeli}
                      onChange={(e) => setHargaBeli(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="Nominal Rp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">HPP Rata-Rata</label>
                    <input
                      type="number"
                      value={hargaRata}
                      onChange={(e) => setHargaRata(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="Nominal Rp"
                    />
                  </div>
                </div>
              </div>

              {/* Kolom 3: Harga Jual */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Susunan Harga Jual
                </h3>
                
                {/* Level 1: Retail */}
                <div>
                  <span className="text-on-surface font-semibold text-xs mb-1 block">Level 1 (Retail)</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    <input
                      type="number"
                      value={hj_1_1}
                      onChange={(e) => setHj11(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      placeholder="Sat 1"
                    />
                    <input
                      type="number"
                      value={hj_1_2}
                      onChange={(e) => setHj12(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 2"
                      disabled={!satuan2}
                    />
                    <input
                      type="number"
                      value={hj_1_3}
                      onChange={(e) => setHj13(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 3"
                      disabled={!satuan3}
                    />
                  </div>
                </div>

                {/* Level 2: Grosir */}
                <div>
                  <span className="text-on-surface font-semibold text-xs mb-1 block">Level 2 (Grosir)</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    <input
                      type="number"
                      value={hj_2_1}
                      onChange={(e) => setHj21(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      placeholder="Sat 1"
                    />
                    <input
                      type="number"
                      value={hj_2_2}
                      onChange={(e) => setHj22(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 2"
                      disabled={!satuan2}
                    />
                    <input
                      type="number"
                      value={hj_2_3}
                      onChange={(e) => setHj23(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 3"
                      disabled={!satuan3}
                    />
                  </div>
                </div>

                {/* Level 3: Khusus */}
                <div>
                  <span className="text-on-surface font-semibold text-xs mb-1 block">Level 3 (Khusus)</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    <input
                      type="number"
                      value={hj_3_1}
                      onChange={(e) => setHj31(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      placeholder="Sat 1"
                    />
                    <input
                      type="number"
                      value={hj_3_2}
                      onChange={(e) => setHj32(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 2"
                      disabled={!satuan2}
                    />
                    <input
                      type="number"
                      value={hj_3_3}
                      onChange={(e) => setHj33(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 3"
                      disabled={!satuan3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/40 pt-2">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Jual Rugi</label>
                    <select
                      value={jualRugi}
                      onChange={(e) => setJualRugi(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="0" className="bg-surface text-on-surface">Tidak Boleh</option>
                      <option value="1" className="bg-surface text-on-surface">Boleh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="Aktif" className="bg-surface text-on-surface">Aktif</option>
                      <option value="Nonaktif" className="bg-surface text-on-surface">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Baris Bawah: Keterangan & Button */}
              <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/40 pt-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Keterangan 1</label>
                  <input
                    type="text"
                    value={ket1}
                    onChange={(e) => setKet1(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Informasi deskripsi tambahan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Keterangan 2</label>
                  <input
                    type="text"
                    value={ket2}
                    onChange={(e) => setKet2(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Informasi deskripsi tambahan lain"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-3 flex gap-3 pt-4 border-t border-outline-variant/40">
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
                  {saving ? "Menyimpan..." : "Simpan Barang"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
