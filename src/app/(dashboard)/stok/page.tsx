"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, Edit2, RefreshCw, Search, CheckCircle, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Stok {
  id: number;
  id_barang: number;
  barcode: string;
  nama_barang: string;
  id_kategori: number | null;
  nama_kategori: string | null;
  id_supplier: number | null;
  nama_supplier: string | null;
  id_cabang: number;
  nama_cabang: string;
  stok_akhir: number;
  penjualan: number;
  posisi_rak: string | null;
  minimal_stok: number;
  maksimal_stok: number;
  harga_beli: number | null;
  harga_rata: number | null;
  harga_jual_1_1: number | null;
  satuan_1: string | null;
  satuan_2: string | null;
  satuan_3: string | null;
  isi_1: number | null;
  isi_2: number | null;
  isi_3: number | null;
}

export default function StokPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Stok[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Stok | null>(null);

  // Form Fields for adjustment
  const [rak, setRak] = useState("");
  const [stokAkhir, setStokAkhir] = useState("");
  const [minimalStok, setMinimalStok] = useState("");
  const [maksimalStok, setMaksimalStok] = useState("");
  
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
      <ChevronUp className="w-3.5 h-3.5 text-primary shrink-0 animate-in fade-in" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0 animate-in fade-in" />
    );
  };

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/stok");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item: Stok) => {
    setEditItem(item);
    setRak(item.posisi_rak || "");
    setStokAkhir(item.stok_akhir.toString());
    setMinimalStok(item.minimal_stok.toString());
    setMaksimalStok(item.maksimal_stok.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    
    await fetch(`/api/stok/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posisi_rak: rak,
        stok_akhir: parseInt(stokAkhir) || 0,
        minimal_stok: parseInt(minimalStok) || 0,
        maksimal_stok: parseInt(maksimalStok) || 0,
      }),
    });

    setSaving(false);
    setShowModal(false);
    setLoading(true);
    fetchData();
  };

  const formatRupiah = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredList = list.filter(
    (s) =>
      s.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      s.barcode.includes(search) ||
      (s.posisi_rak && s.posisi_rak.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === "total_hpp") {
      aVal = a.stok_akhir * (a.harga_rata || a.harga_beli || 0);
      bVal = b.stok_akhir * (b.harga_rata || b.harga_beli || 0);
    } else {
      aVal = a[sortField as keyof Stok] ?? "";
      bVal = b[sortField as keyof Stok] ?? "";
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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Stok Cabang
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Daftar stok inventaris aktif untuk cabang yang sedang Anda kelola.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari barang / rak..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Ringkasan Dashboard Stok */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Total SKU Aktif</span>
            <span className="text-on-surface text-lg font-bold font-mono">{list.length} Item</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Stok Menipis (&lt; Min)</span>
            <span className="text-secondary text-lg font-bold font-mono">
              {list.filter((s) => s.stok_akhir <= s.minimal_stok).length} SKU
            </span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Total Nilai Inventaris</span>
            <span className="text-on-surface text-lg font-bold font-mono">
              {formatRupiah(list.reduce((sum, item) => sum + (item.stok_akhir * (item.harga_rata || item.harga_beli || 0)), 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_barang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Barang {renderSortIndicator("nama_barang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Cabang {renderSortIndicator("nama_cabang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("posisi_rak")}
                  >
                    <div className="flex items-center gap-1.5">
                      Posisi Rak {renderSortIndicator("posisi_rak")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40 text-right"
                    onClick={() => handleSort("stok_akhir")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Stok Akhir {renderSortIndicator("stok_akhir")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40 text-right"
                    onClick={() => handleSort("minimal_stok")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Min / Max Stok {renderSortIndicator("minimal_stok")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40 text-right"
                    onClick={() => handleSort("total_hpp")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total Nilai HPP {renderSortIndicator("total_hpp")}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Belum ada stok barang terdaftar di cabang ini.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((s, idx) => {
                    const isLow = s.stok_akhir <= s.minimal_stok;
                    return (
                      <tr key={s.id} className="hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-5 py-2.5 text-on-surface-variant text-sm font-mono">{idx + 1}</td>
                        <td className="px-5 py-2.5">
                          <span className="text-on-surface font-semibold block">{s.nama_barang}</span>
                          <span className="text-on-surface-variant font-mono text-xs bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">{s.barcode}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="text-on-surface font-medium block">{s.nama_cabang}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="text-on-surface font-mono text-sm">{s.posisi_rak || "-"}</span>
                        </td>
                        <td className={`px-5 py-2.5 text-right font-bold text-sm ${isLow ? "text-secondary" : "text-on-surface"}`}>
                          <span className="font-mono">{s.stok_akhir}</span> <span className="text-on-surface-variant font-normal text-xs">{s.satuan_1}</span>
                          {isLow && (
                            <span className="block text-[10px] text-secondary font-semibold">⚠ Stok Menipis</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right text-on-surface text-sm font-mono">
                          {s.minimal_stok} / {s.maksimal_stok} <span className="text-on-surface-variant text-xs font-normal">{s.satuan_1}</span>
                        </td>
                        <td className="px-5 py-2.5 text-right text-on-surface text-sm font-semibold font-mono">
                          {formatRupiah(s.stok_akhir * (s.harga_rata || s.harga_beli || 0))}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          {can_update && (
                            <button
                              onClick={() => openModal(s)}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adjust Stock */}
      {showModal && editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Adjustment Stok</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant block">Barang</span>
                <span className="text-on-surface font-semibold text-sm">{editItem.nama_barang}</span>
                <span className="text-on-surface-variant block mt-1">Barcode: {editItem.barcode}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Posisi Rak</label>
                <input
                  type="text"
                  value={rak}
                  onChange={(e) => setRak(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Contoh: A1-03"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Stok Akhir ({editItem.satuan_1})</label>
                <input
                  type="number"
                  value={stokAkhir}
                  onChange={(e) => setStokAkhir(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5 font-sans">Minimal Stok</label>
                  <input
                    type="number"
                    value={minimalStok}
                    onChange={(e) => setMinimalStok(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5 font-sans">Maksimal Stok</label>
                  <input
                    type="number"
                    value={maksimalStok}
                    onChange={(e) => setMaksimalStok(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/40 mt-2">
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
