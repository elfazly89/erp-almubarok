"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  XCircle,
  Building2,
  Tag,
  BookOpen,
  Printer,
  ChevronRight,
  Send,
  Check,
  FileSpreadsheet,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OpnameHeader {
  id_opname: number;
  nomor_opname: string;
  id_cabang: number;
  nama_cabang: string;
  tanggal_opname: string;
  id_petugas: number;
  nama_petugas: string;
  status: "DRAFT" | "MENUNGGU_APPROVAL" | "DISETUJUI" | "DIBATALKAN";
  total_selisih_item: number;
  total_selisih_rupiah: number;
  catatan: string | null;
  id_approver: number | null;
  approved_at: string | null;
  id_jurnal: number | null;
  created_at: string;
}

interface OpnameDetailItem {
  id: number;
  id_barang: number;
  barcode: string;
  nama_barang: string;
  satuan_1: string | null;
  stok_sistem: number;
  stok_fisik: number;
  selisih_qty: number;
  hpp_satuan: number;
  selisih_rupiah: number;
  alasan_selisih: string | null;
  catatan: string | null;
}

interface CabangOption {
  id_cabang: number;
  nama_cabang: string;
}

interface KategoriOption {
  id_kategori: number;
  nama_kategori: string;
}

export default function StockOpnamePage() {
  const { can_create, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();

  const [opnameList, setOpnameList] = useState<OpnameHeader[]>([]);
  const [cabangs, setCabangs] = useState<CabangOption[]>([]);
  const [kategoris, setKategoris] = useState<KategoriOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modal Mulai Sesi Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    id_cabang: "",
    tanggal_opname: new Date().toISOString().split("T")[0],
    filter_kategori_id: "",
    catatan: "Sesi penghitungan fisik stok toko/gudang",
  });
  const [creating, setCreating] = useState(false);

  // Sheet / Drawer Sesi Opname (Detail Lembar Hitung)
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [activeHeader, setActiveHeader] = useState<OpnameHeader | null>(null);
  const [activeItems, setActiveItems] = useState<OpnameDetailItem[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetMsg, setSheetMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Print Mode State
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchOpnames = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCabang) params.append("cabang_id", selectedCabang);
      if (selectedStatus && selectedStatus !== "ALL") params.append("status", selectedStatus);

      const [resOpname, resCabang, resKategori] = await Promise.all([
        fetch(`/api/supply-chain/stok-opname?${params.toString()}`),
        fetch("/api/master/cabang"),
        fetch("/api/master/kategori"),
      ]);

      if (resOpname.ok) {
        const data = await resOpname.json();
        setOpnameList(data);
      }
      if (resCabang.ok) {
        const data = await resCabang.json();
        setCabangs(data);
        if (!createData.id_cabang && data.length > 0) {
          setCreateData((prev) => ({ ...prev, id_cabang: data[0].id_cabang.toString() }));
        }
      }
      if (resKategori.ok) {
        const data = await resKategori.json();
        setKategoris(data);
      }
    } catch (err) {
      console.error("Error loading opname list:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCabang, selectedStatus, createData.id_cabang]);

  useEffect(() => {
    fetchOpnames();
  }, [fetchOpnames]);

  // Open Sheet Detail Sesi
  const handleOpenSheet = async (opnameId: number) => {
    setSheetLoading(true);
    setShowSheetModal(true);
    setSheetMsg(null);
    try {
      const res = await fetch(`/api/supply-chain/stok-opname/${opnameId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveHeader(data.header);
        setActiveItems(data.items);
      }
    } catch (err) {
      console.error("Error open sheet:", err);
    } finally {
      setSheetLoading(false);
    }
  };

  // Handle Input Stok Fisik Real-time
  const handlePhysicalCountChange = (itemId: number, newCount: number) => {
    setActiveItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const validCount = isNaN(newCount) ? 0 : Math.max(0, newCount);
          const diffQty = validCount - it.stok_sistem;
          const diffRp = diffQty * it.hpp_satuan;
          let alasan = it.alasan_selisih;
          if (diffQty === 0) {
            alasan = "Sesuai";
          } else if (diffQty < 0 && (!alasan || alasan === "Sesuai")) {
            alasan = "Hilang/Kurang Hitung";
          } else if (diffQty > 0 && (!alasan || alasan === "Sesuai")) {
            alasan = "Barang Lebih";
          }
          return {
            ...it,
            stok_fisik: validCount,
            selisih_qty: diffQty,
            selisih_rupiah: diffRp,
            alasan_selisih: alasan,
          };
        }
        return it;
      })
    );
  };

  const handleAlasanChange = (itemId: number, alasan: string) => {
    setActiveItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, alasan_selisih: alasan } : it))
    );
  };

  // Save Sheet items
  const handleSaveSheet = async () => {
    if (!activeHeader) return;
    setSavingSheet(true);
    setSheetMsg(null);
    try {
      const payload = {
        items: activeItems.map((it) => ({
          id_detail: it.id,
          stok_fisik: it.stok_fisik,
          alasan_selisih: it.alasan_selisih,
          catatan: it.catatan,
        })),
        catatan: activeHeader.catatan,
      };

      const res = await fetch(`/api/supply-chain/stok-opname/${activeHeader.id_opname}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan hasil hitung");

      setSheetMsg({ text: "Hasil hitung fisik berhasil disimpan!", type: "success" });
      fetchOpnames();
    } catch (err: any) {
      setSheetMsg({ text: err.message, type: "error" });
    } finally {
      setSavingSheet(false);
    }
  };

  // Submit for Approval
  const handleSubmitApproval = async () => {
    if (!activeHeader) return;
    setSavingSheet(true);
    try {
      await handleSaveSheet();
      const res = await fetch(`/api/supply-chain/stok-opname/${activeHeader.id_opname}/submit`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setActiveHeader((prev) => (prev ? { ...prev, status: "MENUNGGU_APPROVAL" } : null));
      setSheetMsg({ text: "Sesi telah diajukan untuk approval kepala cabang / finance", type: "success" });
      fetchOpnames();
    } catch (err: any) {
      setSheetMsg({ text: err.message, type: "error" });
    } finally {
      setSavingSheet(false);
    }
  };

  // Approve & Execute Automated GL Adjustment
  const handleApprove = async () => {
    if (!activeHeader) return;
    if (
      !confirm(
        `Apakah Anda yakin menyetujui Stock Opname ${activeHeader.nomor_opname}?\n\nSistem akan secara permanen mengupdate stok kartu gudang dan MEMPOSTING JURNAL SELISIH OTOMATIS ke Buku Besar.`
      )
    ) {
      return;
    }

    setSavingSheet(true);
    try {
      const res = await fetch(`/api/supply-chain/stok-opname/${activeHeader.id_opname}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      alert(json.message || "Stock Opname berhasil disetujui & dijurnal!");
      setShowSheetModal(false);
      fetchOpnames();
    } catch (err: any) {
      alert(`Gagal menyetujui: ${err.message}`);
    } finally {
      setSavingSheet(false);
    }
  };

  // Create Opname Session
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/supply-chain/stok-opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat sesi");

      setShowCreateModal(false);
      fetchOpnames();
      // Auto open sheet for newly created opname
      if (json.data?.id_opname) {
        handleOpenSheet(json.data.id_opname);
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Computed summary for active sheet
  const sheetDiffItemCount = activeItems.filter((i) => i.selisih_qty !== 0).length;
  const sheetTotalDiffRp = activeItems.reduce((sum, i) => sum + i.selisih_rupiah, 0);

  // Filtered sheet items for fast search in table
  const filteredActiveItems = activeItems.filter(
    (i) =>
      i.nama_barang.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (i.barcode && i.barcode.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Stock Opname Fisik & Rekonsiliasi</h1>
              <p className="text-sm text-gray-500">
                Pencacahan fisik persediaan, approval bertingkat, dan posting otomatis jurnal selisih inventaris.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOpnames}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {can_create && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Mulai Sesi Opname Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Selection */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          {["ALL", "DRAFT", "MENUNGGU_APPROVAL", "DISETUJUI", "DIBATALKAN"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
                selectedStatus === st
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {st === "ALL"
                ? "Semua Sesi"
                : st === "MENUNGGU_APPROVAL"
                ? "Menunggu Approval"
                : st}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Cabang / Gudang</option>
              {cabangs.map((c) => (
                <option key={c.id_cabang} value={c.id_cabang}>
                  {c.nama_cabang}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Cari nomor sesi opname..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table of Opname Sessions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">No. Opname</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4">Petugas Pencacah</th>
                <th className="py-3 px-4 text-center">Status Sesi</th>
                <th className="py-3 px-4 text-center">Item Selisih</th>
                <th className="py-3 px-4 text-right">Netto Selisih Nilai (Rp)</th>
                <th className="py-3 px-4 text-center">Jurnal GL</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat daftar sesi stock opname...
                  </td>
                </tr>
              ) : opnameList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Belum ada riwayat sesi Stock Opname.
                  </td>
                </tr>
              ) : (
                opnameList
                  .filter((op) =>
                    search ? op.nomor_opname.toLowerCase().includes(search.toLowerCase()) : true
                  )
                  .map((op) => (
                    <tr key={op.id_opname} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-xs border border-blue-200">
                          {op.nomor_opname}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {formatDate(op.tanggal_opname)}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {op.nama_cabang}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-700">
                        {op.nama_petugas}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            op.status === "DISETUJUI"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : op.status === "MENUNGGU_APPROVAL"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : op.status === "DRAFT"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {op.total_selisih_item > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                            {op.total_selisih_item} Item
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-medium">0 Sesuai</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {op.total_selisih_rupiah < 0 ? (
                          <span className="text-rose-600 font-bold flex items-center justify-end gap-1">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {formatCurrency(op.total_selisih_rupiah)}
                          </span>
                        ) : op.total_selisih_rupiah > 0 ? (
                          <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{formatCurrency(op.total_selisih_rupiah)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Rp 0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {op.id_jurnal ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium border border-emerald-200">
                            <BookOpen className="w-3 h-3" /> #{op.id_jurnal}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenSheet(op.id_opname)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          Buka Lembar Hitung
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Mulai Sesi Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Mulai Sesi Stock Opname</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pilih Cabang / Toko <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={createData.id_cabang}
                  onChange={(e) => setCreateData({ ...createData, id_cabang: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {cabangs.map((c) => (
                    <option key={c.id_cabang} value={c.id_cabang}>
                      {c.nama_cabang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  required
                  value={createData.tanggal_opname}
                  onChange={(e) => setCreateData({ ...createData, tanggal_opname: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Filter Kategori Barang (Opsional)
                </label>
                <select
                  value={createData.filter_kategori_id}
                  onChange={(e) => setCreateData({ ...createData, filter_kategori_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua Kategori (Seluruh Barang Cabang)</option>
                  {kategoris.map((k) => (
                    <option key={k.id_kategori} value={k.id_kategori}>
                      {k.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Petugas</label>
                <textarea
                  rows={2}
                  value={createData.catatan}
                  onChange={(e) => setCreateData({ ...createData, catatan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Generate Sesi Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Full Modal Lembar Hitung & Rekonsiliasi */}
      {showSheetModal && activeHeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">{activeHeader.nomor_opname}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        activeHeader.status === "DISETUJUI"
                          ? "bg-emerald-100 text-emerald-800"
                          : activeHeader.status === "MENUNGGU_APPROVAL"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {activeHeader.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cabang: <span className="font-semibold text-gray-700">{activeHeader.nama_cabang}</span> | Tanggal:{" "}
                    <span className="font-semibold text-gray-700">{formatDate(activeHeader.tanggal_opname)}</span> | Petugas:{" "}
                    <span className="font-semibold text-gray-700">{activeHeader.nama_petugas}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Berita Acara
                </button>
                <button
                  onClick={() => setShowSheetModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification alert in sheet */}
            {sheetMsg && (
              <div
                className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 ${
                  sheetMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                    : "bg-red-50 text-red-800 border-b border-red-200"
                }`}
              >
                {sheetMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {sheetMsg.text}
              </div>
            )}

            {/* Sheet Search & Stats Bar */}
            <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter nama barang / barcode dalam lembar ini..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div>
                  Item Dihitung: <span className="font-bold text-gray-900">{activeItems.length}</span>
                </div>
                <div>
                  Item Selisih: <span className="font-bold text-amber-600">{sheetDiffItemCount}</span>
                </div>
                <div>
                  Netto Selisih:{" "}
                  <span
                    className={`font-bold ${
                      sheetTotalDiffRp < 0
                        ? "text-rose-600"
                        : sheetTotalDiffRp > 0
                        ? "text-emerald-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatCurrency(sheetTotalDiffRp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {sheetLoading ? (
                <div className="py-20 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                  Memuat lembar pencacahan...
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Barang & Barcode</th>
                        <th className="py-2.5 px-3 text-right">Stok Sistem</th>
                        <th className="py-2.5 px-3 text-center w-36">Stok Fisik (Riil)</th>
                        <th className="py-2.5 px-3 text-center">Selisih Qty</th>
                        <th className="py-2.5 px-3 text-right">HPP Satuan</th>
                        <th className="py-2.5 px-3 text-right">Selisih Rp</th>
                        <th className="py-2.5 px-3 w-44">Alasan Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredActiveItems.map((item, idx) => {
                        const isLocked =
                          activeHeader.status === "DISETUJUI" || activeHeader.status === "DIBATALKAN";
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50 transition ${
                              item.selisih_qty !== 0 ? "bg-amber-50/30" : ""
                            }`}
                          >
                            <td className="py-2 px-3 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-gray-900">{item.nama_barang}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{item.barcode || "-"}</div>
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-gray-700">
                              {item.stok_sistem} {item.satuan_1 || "pcs"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isLocked ? (
                                <span className="font-bold text-gray-900">{item.stok_fisik}</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={item.stok_fisik}
                                  onChange={(e) =>
                                    handlePhysicalCountChange(item.id, parseInt(e.target.value))
                                  }
                                  className="w-24 text-center py-1 px-2 text-xs font-bold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.selisih_qty < 0 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                                  {item.selisih_qty}
                                </span>
                              ) : item.selisih_qty > 0 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                                  +{item.selisih_qty}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {formatCurrency(item.hpp_satuan)}
                            </td>
                            <td className="py-2 px-3 text-right font-medium">
                              {item.selisih_rupiah < 0 ? (
                                <span className="text-rose-600 font-semibold">
                                  {formatCurrency(item.selisih_rupiah)}
                                </span>
                              ) : item.selisih_rupiah > 0 ? (
                                <span className="text-emerald-600 font-semibold">
                                  +{formatCurrency(item.selisih_rupiah)}
                                </span>
                              ) : (
                                <span className="text-gray-400">Rp 0</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {isLocked ? (
                                <span className="text-xs text-gray-700">{item.alasan_selisih || "-"}</span>
                              ) : (
                                <select
                                  value={item.alasan_selisih || "Sesuai"}
                                  onChange={(e) => handleAlasanChange(item.id, e.target.value)}
                                  className="w-full py-1 px-2 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                  <option value="Sesuai">Sesuai</option>
                                  <option value="Hilang/Kurang Hitung">Hilang / Kurang Hitung</option>
                                  <option value="Barang Rusak/Bocor">Barang Rusak / Bocor</option>
                                  <option value="Salah Input Kasir">Salah Input Kasir</option>
                                  <option value="Barang Lebih">Barang Lebih / Surplus</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
              <div className="text-xs text-gray-500">
                {activeHeader.status === "DISETUJUI" ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Sesi telah disetujui & dijurnal otomatis ke Buku Besar
                  </span>
                ) : (
                  <span>Pastikan penghitungan fisik diverifikasi sebelum diajukan untuk approval.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSheetModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition"
                >
                  Tutup
                </button>

                {activeHeader.status === "DRAFT" && (
                  <>
                    <button
                      type="button"
                      disabled={savingSheet}
                      onClick={handleSaveSheet}
                      className="px-4 py-2 text-xs font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-xl transition flex items-center gap-1.5"
                    >
                      {savingSheet && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Simpan Draft
                    </button>
                    <button
                      type="button"
                      disabled={savingSheet}
                      onClick={handleSubmitApproval}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Ajukan Approval
                    </button>
                  </>
                )}

                {activeHeader.status === "MENUNGGU_APPROVAL" && (
                  <button
                    type="button"
                    disabled={savingSheet}
                    onClick={handleApprove}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Setujui & Posting Jurnal Selisih Otomatis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Berita Acara (Shown when window.print() is triggered) */}
      {activeHeader && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[9999] text-black">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wider">BERITA ACARA STOCK OPNAME FISIK</h1>
            <p className="text-sm font-semibold">ERP AL MUBAROK — MANAJEMEN LOGISTIK & PERSEDIAAN</p>
            <p className="text-xs text-gray-600">Nomor Dokumen: {activeHeader.nomor_opname}</p>
          </div>

          <div className="grid grid-cols-2 text-xs gap-4 mb-6">
            <div>
              <p>Cabang / Unit: <span className="font-bold">{activeHeader.nama_cabang}</span></p>
              <p>Tanggal Hitung: <span className="font-bold">{formatDate(activeHeader.tanggal_opname)}</span></p>
            </div>
            <div>
              <p>Petugas Pencacah: <span className="font-bold">{activeHeader.nama_petugas}</span></p>
              <p>Status: <span className="font-bold">{activeHeader.status}</span></p>
            </div>
          </div>

          <table className="w-full text-xs border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-left">Nama Barang</th>
                <th className="border border-black p-2 text-right">Stok Sistem</th>
                <th className="border border-black p-2 text-right">Stok Fisik</th>
                <th className="border border-black p-2 text-center">Selisih</th>
                <th className="border border-black p-2 text-right">Selisih Nilai (Rp)</th>
                <th className="border border-black p-2 text-left">Alasan</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="border border-black p-1.5">{item.nama_barang}</td>
                  <td className="border border-black p-1.5 text-right">{item.stok_sistem}</td>
                  <td className="border border-black p-1.5 text-right font-bold">{item.stok_fisik}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{item.selisih_qty}</td>
                  <td className="border border-black p-1.5 text-right font-bold">{formatCurrency(item.selisih_rupiah)}</td>
                  <td className="border border-black p-1.5 text-xs">{item.alasan_selisih}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50 border-t-2 border-black">
                <td colSpan={4} className="border border-black p-2 text-right">TOTAL NETTO SELISIH NILAI:</td>
                <td className="border border-black p-2 text-right">{formatCurrency(sheetTotalDiffRp)}</td>
                <td className="border border-black p-2"></td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-3 text-center text-xs pt-8 mt-12 border-t border-gray-400">
            <div>
              <p className="mb-14">Petugas Pencacah Fisik,</p>
              <p className="font-bold underline">{activeHeader.nama_petugas}</p>
            </div>
            <div>
              <p className="mb-14">Kepala Toko / Gudang,</p>
              <p className="font-bold underline">( ........................................ )</p>
            </div>
            <div>
              <p className="mb-14">Bagian Akuntansi & Keuangan,</p>
              <p className="font-bold underline">( ........................................ )</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

