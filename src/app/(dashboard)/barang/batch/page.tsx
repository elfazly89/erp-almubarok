"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Boxes,
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
  ShieldAlert,
  ArrowUpDown,
  Edit2,
  Layers,
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BatchItem {
  id_batch: number;
  nomor_batch: string;
  id_barang: number;
  barcode: string;
  nama_barang: string;
  satuan_1: string | null;
  id_cabang: number;
  nama_cabang: string;
  tanggal_masuk: string;
  tanggal_kadaluarsa: string;
  stok_batch: number;
  hpp_batch: number;
  status: "AKTIF" | "KADALUARSA" | "HABIS";
  catatan: string | null;
  created_at: string;
  alert_level: "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE";
  sisa_hari: number;
}

interface BatchSummary {
  total_batches: number;
  expired_batches: number;
  expiring_30_days: number;
  total_stock_qty: number;
  total_batch_value: number;
}

interface CabangOption {
  id_cabang: number;
  nama_cabang: string;
}

interface BarangOption {
  id_barang: number;
  barcode: string;
  nama_barang: string;
  harga_rata: number | null;
  harga_beli: number | null;
}

export default function BatchKadaluarsaPage() {
  const { can_create, can_update, can_read, loading: permissionsLoading } = useMenuPermissions();

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [cabangs, setCabangs] = useState<CabangOption[]>([]);
  const [barangs, setBarangs] = useState<BarangOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [selectedAlert, setSelectedAlert] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<BatchItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    nomor_batch: "",
    id_barang: "",
    id_cabang: "",
    tanggal_masuk: new Date().toISOString().split("T")[0],
    tanggal_kadaluarsa: "",
    stok_batch: "0",
    hpp_batch: "0",
    status: "AKTIF",
    catatan: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCabang) params.append("cabang_id", selectedCabang);
      if (selectedAlert && selectedAlert !== "ALL") params.append("alert", selectedAlert);
      if (selectedStatus) params.append("status", selectedStatus);
      if (search.trim()) params.append("search", search.trim());

      const [resBatches, resSummary, resCabang, resBarang] = await Promise.all([
        fetch(`/api/supply-chain/batch?${params.toString()}`),
        fetch(`/api/supply-chain/batch/summary${selectedCabang ? `?cabang_id=${selectedCabang}` : ""}`),
        fetch("/api/master/cabang"),
        fetch("/api/master/barang"),
      ]);

      if (resBatches.ok) {
        const data = await resBatches.json();
        setBatches(data);
      }
      if (resSummary.ok) {
        const data = await resSummary.json();
        setSummary(data);
      }
      if (resCabang.ok) {
        const data = await resCabang.json();
        setCabangs(data);
      }
      if (resBarang.ok) {
        const data = await resBarang.json();
        setBarangs(data);
      }
    } catch (err) {
      console.error("Error loading batch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCabang, selectedAlert, selectedStatus, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      nomor_batch: `LOT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
      id_barang: barangs.length > 0 ? barangs[0].id_barang.toString() : "",
      id_cabang: cabangs.length > 0 ? cabangs[0].id_cabang.toString() : "",
      tanggal_masuk: new Date().toISOString().split("T")[0],
      tanggal_kadaluarsa: "",
      stok_batch: "50",
      hpp_batch: "0",
      status: "AKTIF",
      catatan: "",
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: BatchItem) => {
    setEditItem(item);
    setFormData({
      nomor_batch: item.nomor_batch,
      id_barang: item.id_barang.toString(),
      id_cabang: item.id_cabang.toString(),
      tanggal_masuk: item.tanggal_masuk,
      tanggal_kadaluarsa: item.tanggal_kadaluarsa,
      stok_batch: item.stok_batch.toString(),
      hpp_batch: item.hpp_batch.toString(),
      status: item.status,
      catatan: item.catatan || "",
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomor_batch || !formData.id_barang || !formData.tanggal_kadaluarsa) {
      setErrorMsg("Nomor batch, barang, dan tanggal kadaluarsa wajib diisi");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const url = editItem
        ? `/api/supply-chain/batch/${editItem.id_batch}`
        : `/api/supply-chain/batch`;
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan batch barang");
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const getAlertBadge = (b: BatchItem) => {
    if (b.status === "HABIS") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Stok Habis
        </span>
      );
    }
    if (b.alert_level === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <XCircle className="w-3.5 h-3.5" /> Kadaluarsa ({Math.abs(b.sisa_hari)} hr lalu)
        </span>
      );
    }
    if (b.alert_level === "CRITICAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <AlertTriangle className="w-3.5 h-3.5" /> Kritis ({b.sisa_hari} hari lagi)
        </span>
      );
    }
    if (b.alert_level === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5" /> Waspada ({b.sisa_hari} hari lagi)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5" /> Aman ({b.sisa_hari} hari)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Batch & Expired Date Tracking</h1>
              <p className="text-sm text-gray-500">
                Pemantauan masa kedaluwarsa nomor lot/batch barang dan sistem peringatan dini (Early Warning).
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {can_create && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Daftarkan Batch Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Batch Terdaftar</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
              {summary ? summary.total_batches : "-"} <span className="text-xs font-normal text-gray-400">Lot</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mendekati Expired (&lt; 30 Hari)</p>
            <h3 className="text-2xl font-bold text-red-600 mt-0.5">
              {summary ? summary.expiring_30_days : "-"} <span className="text-xs font-normal text-gray-400">Batch</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sudah Kadaluarsa</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-0.5">
              {summary ? summary.expired_batches : "-"} <span className="text-xs font-normal text-gray-400">Batch</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Nilai Persediaan Batch</p>
            <h3 className="text-xl font-bold text-emerald-700 mt-0.5">
              {summary ? formatCurrency(summary.total_batch_value) : "-"}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        {/* Early Warning Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          <button
            onClick={() => setSelectedAlert("ALL")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
              selectedAlert === "ALL"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Semua Batch
          </button>
          <button
            onClick={() => setSelectedAlert("EXPIRING_30")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
              selectedAlert === "EXPIRING_30"
                ? "bg-red-600 text-white"
                : "text-red-700 bg-red-50 hover:bg-red-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Mendekati Kadaluarsa (&lt; 30 Hari)
          </button>
          <button
            onClick={() => setSelectedAlert("EXPIRING_60")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
              selectedAlert === "EXPIRING_60"
                ? "bg-amber-600 text-white"
                : "text-amber-700 bg-amber-50 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Waspada (&lt; 60 Hari)
          </button>
          <button
            onClick={() => setSelectedAlert("EXPIRED")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
              selectedAlert === "EXPIRED"
                ? "bg-rose-700 text-white"
                : "text-rose-700 bg-rose-50 hover:bg-rose-100"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Sudah Kadaluarsa
          </button>
          <button
            onClick={() => setSelectedAlert("SAFE")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
              selectedAlert === "SAFE"
                ? "bg-emerald-600 text-white"
                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aman (&gt; 60 Hari)
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no. batch, nama barang, atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Semua Status Operasional</option>
              <option value="AKTIF">Status: AKTIF</option>
              <option value="KADALUARSA">Status: KADALUARSA</option>
              <option value="HABIS">Status: HABIS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Nomor Batch / Lot</th>
                <th className="py-3 px-4">Nama Barang & Barcode</th>
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4">Tgl Masuk</th>
                <th className="py-3 px-4">Kadaluarsa (Sisa Hari)</th>
                <th className="py-3 px-4 text-right">Stok Batch</th>
                <th className="py-3 px-4 text-right">HPP Batch</th>
                <th className="py-3 px-4 text-right">Nilai Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data nomor batch...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Tidak ada batch barang yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id_batch} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-xs border border-gray-200">
                        {b.nomor_batch}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{b.nama_barang}</div>
                      <div className="text-xs text-gray-400 font-mono">{b.barcode || "-"}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-700">
                      {b.nama_cabang}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {formatDate(b.tanggal_masuk)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs text-gray-700 font-medium">
                          {formatDate(b.tanggal_kadaluarsa)}
                        </span>
                        {getAlertBadge(b)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {b.stok_batch} <span className="text-xs text-gray-400">{b.satuan_1 || "pcs"}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      {formatCurrency(b.hpp_batch)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(b.stok_batch * b.hpp_batch)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          b.status === "AKTIF"
                            ? "bg-green-100 text-green-800"
                            : b.status === "KADALUARSA"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {can_update && (
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Batch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Batch */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">
                  {editItem ? "Edit Nomor Batch" : "Registrasi Batch Barang Baru"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Batch / Lot <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: LOT-202610-001"
                  value={formData.nomor_batch}
                  onChange={(e) => setFormData({ ...formData, nomor_batch: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {!editItem && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pilih Barang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.id_barang}
                    onChange={(e) => {
                      const sel = barangs.find((b) => b.id_barang.toString() === e.target.value);
                      setFormData({
                        ...formData,
                        id_barang: e.target.value,
                        hpp_batch: sel?.harga_rata?.toString() || sel?.harga_beli?.toString() || "0",
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Pilih Barang --</option>
                    {barangs.map((b) => (
                      <option key={b.id_barang} value={b.id_barang}>
                        {b.nama_barang} ({b.barcode || "No Barcode"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!editItem && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cabang / Lokasi Gudang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.id_cabang}
                    onChange={(e) => setFormData({ ...formData, id_cabang: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {cabangs.map((c) => (
                      <option key={c.id_cabang} value={c.id_cabang}>
                        {c.nama_cabang}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={formData.tanggal_masuk}
                    onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tanggal Kadaluarsa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_kadaluarsa}
                    onChange={(e) => setFormData({ ...formData, tanggal_kadaluarsa: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stok Batch (Qty)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stok_batch}
                    onChange={(e) => setFormData({ ...formData, stok_batch: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">HPP per Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hpp_batch}
                    onChange={(e) => setFormData({ ...formData, hpp_batch: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {editItem && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="KADALUARSA">KADALUARSA</option>
                    <option value="HABIS">HABIS</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Posisi rak pendingin / kondisi kemasan..."
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Simpan Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

