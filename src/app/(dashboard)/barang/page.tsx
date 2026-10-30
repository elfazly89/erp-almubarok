"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Edit2, Trash2, RefreshCw, Search, Eye, ChevronUp, ChevronDown, AlertTriangle, CheckCircle, XCircle, Building2, ExternalLink, ArrowLeftRight } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

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
  barcode_satuan_2?: string | null;
  barcode_satuan_3?: string | null;
  tipe_barang?: string | null;
  lacak_kadaluarsa?: boolean;
  keterangan_1: string | null;
  keterangan_2: string | null;
}

interface MultiCabangBreakdown {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  stok_akhir: number;
  posisi_rak: string;
  minimal_stok: number;
  maksimal_stok: number;
  status_stok: string;
  nilai_aset: number;
}

export default function BarangPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Barang[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null);
  const [edit, setEdit] = useState<Barang | null>(null);

  // Multi-Cabang Stock Inspection Modal
  const [showMultiCabangModal, setShowMultiCabangModal] = useState(false);
  const [multiCabangItem, setMultiCabangItem] = useState<Barang | null>(null);
  const [multiCabangData, setMultiCabangData] = useState<{
    barang: any;
    total_stok_global: number;
    total_nilai_global: number;
    is_manager_or_admin: boolean;
    breakdown: MultiCabangBreakdown[];
  } | null>(null);
  const [loadingMultiCabang, setLoadingMultiCabang] = useState(false);
  const [cabangSearch, setCabangSearch] = useState("");

  // Form Fields
  const [barcode, setBarcode] = useState("");
  const [barcode2, setBarcode2] = useState("");
  const [barcode3, setBarcode3] = useState("");
  const [nama, setNama] = useState("");
  const [tipeBarang, setTipeBarang] = useState("STOK");
  const [lacakKadaluarsa, setLacakKadaluarsa] = useState(false);
  const [kategoriId, setKategoriId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [satuan1, setSatuan1] = useState("pcs");
  const [satuan2, setSatuan2] = useState("");
  const [satuan3, setSatuan3] = useState("");
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

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: Barang | null }>({
    show: false,
    item: null,
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

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
    try {
      const [resBarang, resKat, resSup] = await Promise.all([
        fetch("/api/barang"),
        fetch("/api/kategori"),
        fetch("/api/supplier"),
      ]);
      
      if (resBarang.ok && resKat.ok && resSup.ok) {
        setList(await resBarang.json());
        setCategories(await resKat.json());
        setSuppliers(await resSup.json());
      } else {
        showToast("Gagal memuat data katalog barang.", "error");
      }
    } catch {
      showToast("Gagal memuat data katalog barang.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openModal = (barang?: Barang) => {
    setEdit(barang || null);
    setBarcode(barang?.barcode || "");
    setBarcode2(barang?.barcode_satuan_2 || "");
    setBarcode3(barang?.barcode_satuan_3 || "");
    setNama(barang?.nama_barang || "");
    setTipeBarang(barang?.tipe_barang || "STOK");
    setLacakKadaluarsa(Boolean(barang?.lacak_kadaluarsa));
    setKategoriId(barang?.id_kategori?.toString() || "");
    setSupplierId(barang?.id_supplier?.toString() || "");
    setSatuan1(barang?.satuan_1 || "pcs");
    setSatuan2(barang?.satuan_2 || "");
    setSatuan3(barang?.satuan_3 || "");
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

  const openMultiCabangModal = async (item: Barang) => {
    setMultiCabangItem(item);
    setCabangSearch("");
    setShowMultiCabangModal(true);
    setLoadingMultiCabang(true);
    try {
      const res = await fetch(`/api/master/barang/${item.id_barang}/stok-cabang`);
      if (res.ok) {
        setMultiCabangData(await res.json());
      } else {
        showToast("Gagal memuat rincian stok multi-cabang.", "error");
      }
    } catch {
      showToast("Kesalahan jaringan saat memuat stok cabang.", "error");
    } finally {
      setLoadingMultiCabang(false);
    }
  };

  const handleSave = async () => {
    const cleanBarcode = barcode.trim();
    const cleanNama = nama.trim();

    if (!cleanBarcode || !cleanNama) {
      showToast("Barcode dan Nama Barang wajib diisi.", "error");
      return;
    }

    // Validasi harga tidak boleh negatif
    const hb = parseFloat(hargaBeli) || 0;
    if (hb < 0) {
      showToast("Harga beli tidak boleh bernilai negatif.", "error");
      return;
    }

    const prices = [
      { name: "Retail Satuan 1", val: hj_1_1, min: hb },
      { name: "Retail Satuan 2", val: hj_1_2, min: hb * (parseFloat(isi2) || 1) },
      { name: "Retail Satuan 3", val: hj_1_3, min: hb * (parseFloat(isi3) || 1) },
      { name: "Grosir Satuan 1", val: hj_2_1, min: hb },
      { name: "Grosir Satuan 2", val: hj_2_2, min: hb * (parseFloat(isi2) || 1) },
      { name: "Grosir Satuan 3", val: hj_2_3, min: hb * (parseFloat(isi3) || 1) },
      { name: "Khusus Satuan 1", val: hj_3_1, min: hb },
      { name: "Khusus Satuan 2", val: hj_3_2, min: hb * (parseFloat(isi2) || 1) },
      { name: "Khusus Satuan 3", val: hj_3_3, min: hb * (parseFloat(isi3) || 1) },
    ];

    for (const p of prices) {
      const valNum = parseFloat(p.val);
      if (p.val && valNum < 0) {
        showToast(`Harga ${p.name} tidak boleh bernilai negatif.`, "error");
        return;
      }
      
      // Jika jual rugi tidak boleh (jualRugi === "0"), cek apakah harga jual < HPP beli
      if (jualRugi === "0" && p.val && valNum < p.min) {
        showToast(`Harga ${p.name} tidak boleh lebih rendah dari HPP Beli (${formatCurrency(p.min)}) jika jual rugi dilarang.`, "error");
        return;
      }
    }

    setSaving(true);
    
    const payload = {
      barcode: cleanBarcode,
      nama_barang: cleanNama,
      id_kategori: kategoriId || null,
      id_supplier: supplierId || null,
      satuan_1: satuan1,
      satuan_2: satuan2 || null,
      satuan_3: satuan3 || null,
      isi_1: 1, // Konstan 1
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
      barcode_satuan_2: barcode2.trim() || null,
      barcode_satuan_3: barcode3.trim() || null,
      tipe_barang: tipeBarang,
      lacak_kadaluarsa: lacakKadaluarsa,
      keterangan_1: ket1 || null,
      keterangan_2: ket2 || null,
    };

    try {
      const url = edit ? `/api/barang/${edit.id_barang}` : "/api/barang";
      const method = edit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();

      if (res.ok) {
        showToast(edit ? "Barang berhasil diperbarui." : "Barang berhasil ditambahkan.", "success");
        setShowModal(false);
        fetchData();
      } else {
        showToast(data.error || "Gagal menyimpan barang.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: Barang) => {
    setDeleteConfirm({ show: true, item });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.item?.id_barang;
    if (!id) return;

    try {
      const res = await fetch(`/api/barang/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast("Barang berhasil dihapus.", "success");
        fetchData();
      } else {
        showToast(data.error || "Gagal menghapus barang.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setDeleteConfirm({ show: false, item: null });
    }
  };

  const formatRupiah = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return formatCurrency(val);
  };

  const filteredList = list.filter(
    (b) =>
      b.nama_barang.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.barcode.includes(debouncedSearch)
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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-4 overflow-hidden text-on-background relative">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-on-surface font-semibold">{b.nama_barang}</span>
                          {b.tipe_barang && b.tipe_barang !== "STOK" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">
                              {b.tipe_barang === "JASA" ? "JASA" : "HABIS PAKAI"}
                            </span>
                          )}
                          {b.lacak_kadaluarsa && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              FEFO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="text-on-surface-variant font-mono text-xs bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">
                            {b.barcode}
                          </span>
                          {b.barcode_satuan_2 && (
                            <span className="text-on-surface-variant/80 font-mono text-[10px] bg-surface-container/30 px-1 py-0.5 rounded" title="Barcode Satuan 2">
                              S2: {b.barcode_satuan_2}
                            </span>
                          )}
                          {b.barcode_satuan_3 && (
                            <span className="text-on-surface-variant/80 font-mono text-[10px] bg-surface-container/30 px-1 py-0.5 rounded" title="Barcode Satuan 3">
                              S3: {b.barcode_satuan_3}
                            </span>
                          )}
                        </div>
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
                          <button
                            onClick={() => openMultiCabangModal(b)}
                            className="p-1.5 text-on-surface-variant hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Cek Stok 19 Cabang"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                          {can_update && (
                            <button onClick={() => openModal(b)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button onClick={() => confirmDelete(b)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Hapus">
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

              {/* Grid 4 Kolom: Satuan, Retail, Grosir, Khusus */}
              <div className="border-t border-outline-variant/40 pt-4">
                <h3 className="font-semibold text-on-surface mb-3 text-sm">Struktur Satuan & Harga Jual</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-outline-variant/30 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                        <th className="p-2.5 font-semibold">Satuan (Isi)</th>
                        <th className="p-2.5 font-semibold">Retail (L1)</th>
                        <th className="p-2.5 font-semibold">Grosir (L2)</th>
                        <th className="p-2.5 font-semibold">Khusus (L3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      <tr className="hover:bg-surface-container-low/30">
                        <td className="p-2.5 font-medium">{selectedItem.satuan_1} (1)</td>
                        <td className="p-2.5 font-mono text-primary font-bold">{formatRupiah(selectedItem.harga_jual_1_1)}</td>
                        <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_1)}</td>
                        <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_3_1)}</td>
                      </tr>
                      {selectedItem.satuan_2 && (
                        <tr className="hover:bg-surface-container-low/30">
                          <td className="p-2.5 font-medium">{selectedItem.satuan_2} ({selectedItem.isi_2})</td>
                          <td className="p-2.5 font-mono text-primary font-bold">{formatRupiah(selectedItem.harga_jual_1_2)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_2)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_3_2)}</td>
                        </tr>
                      )}
                      {selectedItem.satuan_3 && (
                        <tr className="hover:bg-surface-container-low/30">
                          <td className="p-2.5 font-medium">{selectedItem.satuan_3} ({selectedItem.isi_3})</td>
                          <td className="p-2.5 font-mono text-primary font-bold">{formatRupiah(selectedItem.harga_jual_1_3)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_3)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_3_3)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/40">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openMultiCabangModal(selectedItem);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Building2 className="w-4 h-4" /> Cek Stok 19 Cabang
                </button>
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
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Tipe Produk</label>
                  <select
                    value={tipeBarang}
                    onChange={(e) => setTipeBarang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="STOK" className="bg-surface text-on-surface">📦 Barang Persediaan (Storable)</option>
                    <option value="JASA" className="bg-surface text-on-surface">🛠️ Jasa / Layanan (Service)</option>
                    <option value="HABIS_PAKAI" className="bg-surface text-on-surface">🏷️ Habis Pakai (Consumable/Biaya)</option>
                  </select>
                </div>
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-surface-container-low p-2 rounded-lg border border-outline-variant/40">
                    <input
                      type="checkbox"
                      checked={lacakKadaluarsa}
                      onChange={(e) => setLacakKadaluarsa(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-on-surface font-medium">Lacak Batch & Kadaluarsa (FEFO)</span>
                  </label>
                </div>
              </div>

              {/* Kolom 2: Satuan & HPP */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Struktur Satuan & Barcode Kemasan
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
                      value="1"
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none opacity-60 cursor-not-allowed"
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
                      placeholder="e.g. 40"
                    />
                  </div>
                </div>

                {/* Multi-Barcode per Satuan Kemasan */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/30">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode Satuan 2</label>
                    <input
                      type="text"
                      value={barcode2}
                      onChange={(e) => setBarcode2(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Barcode Pack/Renceng"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode Satuan 3</label>
                    <input
                      type="text"
                      value={barcode3}
                      onChange={(e) => setBarcode3(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Barcode Dus/Karton"
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
                    <label className="block text-xs font-medium text-on-surface-variant mb-1 flex items-center gap-1">
                      HPP Rata-Rata <span className="text-[10px] text-primary">(Auto)</span>
                    </label>
                    <input
                      type="number"
                      value={hargaRata}
                      className="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface/60 rounded-lg px-3 py-2 text-xs font-mono cursor-not-allowed"
                      placeholder="Dihitung dari pembelian"
                      disabled
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

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center gap-2 bg-surface-container-high/40 text-error">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h2 className="font-semibold text-on-surface">Konfirmasi Hapus</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                Apakah Anda yakin ingin menghapus barang <span className="font-semibold text-on-surface">"{deleteConfirm.item.nama_barang}"</span> ({deleteConfirm.item.barcode})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm({ show: false, item: null })}
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

      {/* Modal Multi-Cabang Stock Inspection */}
      {showMultiCabangModal && multiCabangItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                    Ketersediaan Stok Multi-Cabang
                  </h2>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    <span className="font-semibold text-on-surface">{multiCabangItem.nama_barang}</span>
                    <span className="mx-1.5">•</span>
                    <span className="font-mono">{multiCabangItem.barcode}</span>
                    <span className="mx-1.5">•</span>
                    Satuan: <span className="font-semibold">{multiCabangItem.satuan_1 || "pcs"}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMultiCabangModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {loadingMultiCabang ? (
                <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-medium">Menghitung ketersediaan stok fisik di seluruh cabang...</p>
                </div>
              ) : multiCabangData ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Total Stok Global
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-on-surface">
                          {multiCabangData.total_stok_global.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-on-surface-variant">{multiCabangItem.satuan_1 || "pcs"}</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Total Nilai Aset
                      </span>
                      <div className="mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-500">
                          {formatRupiah(multiCabangData.total_nilai_global)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Cakupan Cabang
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-on-surface">
                          {multiCabangData.breakdown.length}
                        </span>
                        <span className="text-xs text-on-surface-variant">Cabang</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Perlu Restok
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-amber-500">
                          {multiCabangData.breakdown.filter((b) => b.status_stok === "MENIPIS" || b.status_stok === "HABIS").length}
                        </span>
                        <span className="text-xs text-on-surface-variant">Cabang</span>
                      </div>
                    </div>
                  </div>

                  {/* Search / Filter Cabang */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-on-surface-variant" />
                      <input
                        type="text"
                        value={cabangSearch}
                        onChange={(e) => setCabangSearch(e.target.value)}
                        placeholder="Filter nama cabang..."
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      Menampilkan {multiCabangData.breakdown.filter((b) => b.nama_cabang.toLowerCase().includes(cabangSearch.toLowerCase())).length} dari {multiCabangData.breakdown.length} cabang
                    </span>
                  </div>

                  {/* Table Cabang Breakdown */}
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/40 select-none">
                          <th className="py-2.5 px-3 font-semibold w-10">#</th>
                          <th className="py-2.5 px-3 font-semibold">Cabang</th>
                          <th className="py-2.5 px-3 font-semibold">Rak</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Stok Fisik</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Buffer (Min/Max)</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Status Buffer</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Nilai Aset</th>
                          <th className="py-2.5 px-3 font-semibold text-center w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {multiCabangData.breakdown
                          .filter((b) => b.nama_cabang.toLowerCase().includes(cabangSearch.toLowerCase()))
                          .map((b, idx) => {
                            const badgeColor =
                              b.status_stok === "HABIS"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : b.status_stok === "MENIPIS"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : b.status_stok === "OVERSTOCK"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                            return (
                              <tr key={b.id_cabang} className="hover:bg-surface-container-high/20 transition-colors">
                                <td className="py-2.5 px-3 text-on-surface-variant font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-on-surface">{b.nama_cabang}</div>
                                  <div className="text-[10px] text-on-surface-variant font-mono">{b.kode_cabang}</div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-on-surface-variant">
                                  {b.posisi_rak}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span
                                    className={`font-mono font-bold text-sm ${
                                      b.stok_akhir <= 0
                                        ? "text-red-500"
                                        : b.status_stok === "MENIPIS"
                                        ? "text-amber-500"
                                        : "text-on-surface"
                                    }`}
                                  >
                                    {b.stok_akhir.toLocaleString("id-ID")}
                                  </span>{" "}
                                  <span className="text-[10px] text-on-surface-variant">{multiCabangItem.satuan_1 || "pcs"}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-on-surface-variant">
                                  {b.minimal_stok} / {b.maksimal_stok || "∞"}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                                    {b.status_stok}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-on-surface">
                                  {formatRupiah(b.nilai_aset)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Link
                                    href={`/distribusi/transfer?q=${encodeURIComponent(multiCabangItem.nama_barang)}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high hover:bg-emerald-600 hover:text-white text-on-surface rounded-lg text-[11px] font-semibold transition-all border border-outline-variant/40"
                                    title="Buat Pengiriman / Transfer Antar-Cabang"
                                  >
                                    <ArrowLeftRight className="w-3 h-3" /> Transfer
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {!multiCabangData.is_manager_or_admin && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-600 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Akun Anda memiliki izin cabang tunggal. Data hanya menampilkan cabang tempat Anda ditugaskan.</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              <span className="text-xs text-on-surface-variant">
                Data diperbarui secara realtime dari ledger kartu stok fisik cabang.
              </span>
              <button
                onClick={() => setShowMultiCabangModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
