"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Percent,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  Building2,
  FileSpreadsheet,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface TaxRow {
  id: number;
  kode_pajak: string;
  nama_pajak: string;
  tipe_pajak: string;
  tarif_persen: string;
  akun_pajak_keluaran: number | null;
  akun_pajak_masukan: number | null;
  nama_akun_keluaran: string | null;
  kode_akun_keluaran: string | null;
  nama_akun_masukan: string | null;
  kode_akun_masukan: string | null;
  is_aktif: boolean;
}

interface RekapitulasiData {
  pajak_keluaran: {
    total_omzet: number;
    dpp: number;
    ppn: number;
    jumlah_transaksi: number;
  };
  pajak_masukan: {
    total_pembelian: number;
    ppn_masukan: number;
    jumlah_faktur: number;
  };
  spt_masa: {
    selisih: number;
    status: "KURANG_BAYAR" | "LEBIH_BAYAR" | "NIHIL";
  };
}

export default function MasterPajakPage() {
  const { can_create, can_update, can_read, loading: permissionsLoading } = useMenuPermissions();
  const [activeTab, setActiveTab] = useState<"master" | "rekapitulasi">("master");

  // Master Pajak State
  const [taxes, setTaxes] = useState<TaxRow[]>([]);
  const [coaList, setCoaList] = useState<{ id: number; kode_akun: string; nama_akun: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<TaxRow | null>(null);
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formTipe, setFormTipe] = useState("PPN");
  const [formTarif, setFormTarif] = useState("12");
  const [formAkunKeluaran, setFormAkunKeluaran] = useState("");
  const [formAkunMasukan, setFormAkunMasukan] = useState("");

  // Rekapitulasi State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rekap, setRekap] = useState<RekapitulasiData | null>(null);
  const [loadingRekap, setLoadingRekap] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/akuntansi/pajak");
      const data = await res.json();
      if (res.ok && data.success) {
        setTaxes(data.data || []);
      }

      const coaRes = await fetch("/api/akuntansi/daftar-akun");
      if (coaRes.ok) {
        setCoaList(await coaRes.json());
      }
    } catch (e: any) {
      showToast("Gagal memuat data pajak", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchRekap = useCallback(async () => {
    setLoadingRekap(true);
    try {
      const res = await fetch(`/api/akuntansi/pajak/rekapitulasi?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRekap(data.data);
      }
    } catch (e: any) {
      showToast("Gagal memuat rekapitulasi pajak", "error");
    } finally {
      setLoadingRekap(false);
    }
  }, [startDate, endDate, showToast]);

  useEffect(() => {
    if (activeTab === "master") fetchTaxes();
    if (activeTab === "rekapitulasi") fetchRekap();
  }, [activeTab, fetchTaxes, fetchRekap]);

  const openModal = (item?: TaxRow) => {
    if (item) {
      setEditItem(item);
      setFormKode(item.kode_pajak);
      setFormNama(item.nama_pajak);
      setFormTipe(item.tipe_pajak);
      setFormTarif(item.tarif_persen);
      setFormAkunKeluaran(item.akun_pajak_keluaran?.toString() || "");
      setFormAkunMasukan(item.akun_pajak_masukan?.toString() || "");
    } else {
      setEditItem(null);
      setFormKode("");
      setFormNama("");
      setFormTipe("PPN");
      setFormTarif("12");
      setFormAkunKeluaran("");
      setFormAkunMasukan("");
    }
    setShowModal(true);
  };

  const handleSaveTax = async () => {
    if (!formKode.trim() || !formNama.trim() || !formTarif) {
      showToast("Kode, nama pajak, dan tarif wajib diisi", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode_pajak: formKode.trim().toUpperCase(),
        nama_pajak: formNama.trim(),
        tipe_pajak: formTipe,
        tarif_persen: formTarif,
        akun_pajak_keluaran: formAkunKeluaran || null,
        akun_pajak_masukan: formAkunMasukan || null,
      };

      const url = editItem ? `/api/akuntansi/pajak/${editItem.id}` : "/api/akuntansi/pajak";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        setShowModal(false);
        fetchTaxes();
      } else {
        showToast(data.message || "Gagal menyimpan pajak", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (!rekap) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Tipe Pajak,Kategori,Nominal DPP,Nominal PPN,Jumlah Dokumen\n" +
      `Pajak Keluaran (POS),Penjualan Konsumen,${rekap.pajak_keluaran.dpp},${rekap.pajak_keluaran.ppn},${rekap.pajak_keluaran.jumlah_transaksi}\n` +
      `Pajak Masukan (Faktur Beli),Pembelian Supplier,${rekap.pajak_masukan.total_pembelian},${rekap.pajak_masukan.ppn_masukan},${rekap.pajak_masukan.jumlah_faktur}\n` +
      `Status SPT Masa PPN,${rekap.spt_masa.status},,${rekap.spt_masa.selisih},\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_PPN_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-4 p-4 md:p-6 text-on-surface">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-xl border border-outline/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Percent className="w-6 h-6 text-primary" />
            Manajemen Pajak & Fiskal (PPN / PPh / PB1)
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Konfigurasi tarif multi-pajak, integrasi split jurnal POS otomatis, dan rekapitulasi SPT Masa PPN.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-outline/20">
          <button
            onClick={() => setActiveTab("master")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "master"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Tarif Multi-Pajak
          </button>
          <button
            onClick={() => setActiveTab("rekapitulasi")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "rekapitulasi"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Rekapitulasi SPT PPN
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER MULTI-PAJAK */}
      {activeTab === "master" && (
        <div className="bg-surface-container-low rounded-xl border border-outline/10 overflow-hidden">
          <div className="p-4 border-b border-outline/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              Daftar Tarif Pajak Aktif
            </h3>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Pajak
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-on-surface-variant font-semibold border-b border-outline/10">
                <tr>
                  <th className="p-3">Kode Pajak</th>
                  <th className="p-3">Nama Pajak</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3 text-right">Tarif (%)</th>
                  <th className="p-3">Akun Hutang PPN Keluaran</th>
                  <th className="p-3">Akun Piutang PPN Masukan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/5 text-on-surface">
                {taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container/50">
                    <td className="p-3 font-mono font-bold text-primary">{t.kode_pajak}</td>
                    <td className="p-3 font-medium">{t.nama_pajak}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                        {t.tipe_pajak}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-base">{t.tarif_persen}%</td>
                    <td className="p-3 text-on-surface-variant">
                      {t.nama_akun_keluaran ? `${t.kode_akun_keluaran} - ${t.nama_akun_keluaran}` : "-"}
                    </td>
                    <td className="p-3 text-on-surface-variant">
                      {t.nama_akun_masukan ? `${t.kode_akun_masukan} - ${t.nama_akun_masukan}` : "-"}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600">
                        {t.is_aktif ? "AKTIF" : "NON-AKTIF"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openModal(t)}
                        className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI SPT MASA PPN */}
      {activeTab === "rekapitulasi" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">Periode Pajak:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-surface rounded border border-outline/30 focus:outline-none"
              />
              <span>s.d.</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-surface rounded border border-outline/30 focus:outline-none"
              />
              <button
                onClick={fetchRekap}
                className="px-3 py-1.5 bg-primary text-on-primary font-semibold rounded hover:bg-primary-hover flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" /> Filter
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV SPT
            </button>
          </div>

          {/* Metric Cards */}
          {rekap && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pajak Keluaran */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                    Pajak Keluaran (Penjualan POS)
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {rekap.pajak_keluaran.jumlah_transaksi} Nota
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600">
                  {formatCurrency(rekap.pajak_keluaran.ppn)}
                </div>
                <div className="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline/10 flex justify-between">
                  <span>DPP Penjualan:</span>
                  <span className="font-mono font-medium">{formatCurrency(rekap.pajak_keluaran.dpp)}</span>
                </div>
              </div>

              {/* Pajak Masukan */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <ArrowDownCircle className="w-4 h-4 text-blue-500" />
                    Pajak Masukan (Faktur Beli)
                  </span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">
                    {rekap.pajak_masukan.jumlah_faktur} Faktur
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-blue-600">
                  {formatCurrency(rekap.pajak_masukan.ppn_masukan)}
                </div>
                <div className="text-xs text-on-surface-variant mt-2 pt-2 border-t border-outline/10 flex justify-between">
                  <span>Total Pembelian:</span>
                  <span className="font-mono font-medium">{formatCurrency(rekap.pajak_masukan.total_pembelian)}</span>
                </div>
              </div>

              {/* Status SPT Masa */}
              <div
                className={`p-4 rounded-xl border ${
                  rekap.spt_masa.status === "KURANG_BAYAR"
                    ? "bg-red-500/10 border-red-500/30 text-red-600"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    Status SPT Masa PPN
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-surface">
                    {rekap.spt_masa.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono">
                  {formatCurrency(rekap.spt_masa.selisih)}
                </div>
                <p className="text-[11px] mt-2 opacity-80">
                  {rekap.spt_masa.status === "KURANG_BAYAR"
                    ? "Pajak Keluaran > Pajak Masukan: Nominal ini wajib disetorkan ke Kas Negara via e-Billing DJP."
                    : "Pajak Masukan > Pajak Keluaran: Dapat dikompensasikan ke periode bulan berikutnya."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah / Edit Pajak */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-6 rounded-2xl max-w-md w-full shadow-2xl border border-outline/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              {editItem ? "Edit Tarif Pajak" : "Tambah Tarif Pajak Baru"}
            </h3>

            <div className="space-y-3.5 text-xs mb-5">
              <div>
                <label className="font-semibold block mb-1">Kode Pajak (Unik):</label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  placeholder="Contoh: PPN12, PB1"
                  className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Nama Pajak:</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: PPN Dalam Negeri 12%"
                  className="w-full p-2 bg-surface-container rounded border border-outline/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Tipe Pajak:</label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value)}
                    className="w-full p-2 bg-surface-container rounded border border-outline/30"
                  >
                    <option value="PPN">PPN</option>
                    <option value="PPH">PPh</option>
                    <option value="PAJAK_DAERAH">Pajak Daerah (PB1)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Tarif (%):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTarif}
                    onChange={(e) => setFormTarif(e.target.value)}
                    className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Akun Hutang Pajak Keluaran (CoA):</label>
                <select
                  value={formAkunKeluaran}
                  onChange={(e) => setFormAkunKeluaran(e.target.value)}
                  className="w-full p-2 bg-surface-container rounded border border-outline/30"
                >
                  <option value="">-- Pilih Akun Kewajiban --</option>
                  {coaList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.kode_akun} - {a.nama_akun}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Akun Piutang Pajak Masukan (CoA):</label>
                <select
                  value={formAkunMasukan}
                  onChange={(e) => setFormAkunMasukan(e.target.value)}
                  className="w-full p-2 bg-surface-container rounded border border-outline/30"
                >
                  <option value="">-- Pilih Akun Aset --</option>
                  {coaList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.kode_akun} - {a.nama_akun}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium bg-surface-container hover:bg-surface-container-high rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTax}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-on-primary rounded-lg disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Pajak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

