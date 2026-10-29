"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  DollarSign
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface AssetRow {
  id: number;
  kode_aset: string;
  nama_aset: string;
  id_cabang: number;
  nama_cabang: string | null;
  kategori_aset: string;
  tanggal_perolehan: string;
  harga_perolehan: number;
  nilai_residu: number;
  masa_manfaat_bulan: number;
  metode_penyusutan: string;
  beban_penyusutan_per_bulan: number;
  akumulasi_penyusutan: number;
  nilai_buku: number;
  status: "AKTIF" | "DIHAPUSKAN" | "TERJUAL";
  akun_aset_id: number;
  akun_akumulasi_id: number;
  akun_beban_id: number;
}

interface CabangOption {
  id_cabang: number;
  nama_cabang: string;
}

export default function AsetTetapPage() {
  const { can_create, can_update, can_read, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<AssetRow[]>([]);
  const [cabangList, setCabangList] = useState<CabangOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCabang, setSelectedCabang] = useState<string>("all");

  // Modal Register Asset
  const [showModal, setShowModal] = useState(false);
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formCabang, setFormCabang] = useState("");
  const [formKategori, setFormKategori] = useState("Peralatan");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [formHarga, setFormHarga] = useState("");
  const [formResidu, setFormResidu] = useState("0");
  const [formMasaBulan, setFormMasaBulan] = useState("48");

  // Modal 1-Click Depreciation
  const [showDepreciateModal, setShowDepreciateModal] = useState(false);
  const [depreciateBulan, setDepreciateBulan] = useState(new Date().getMonth() + 1);
  const [depreciateTahun, setDepreciateTahun] = useState(new Date().getFullYear());

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/akuntansi/aset-tetap");
      const data = await res.json();
      if (res.ok && data.success) {
        setList(data.data || []);
      }

      const cabRes = await fetch("/api/cabang");
      if (cabRes.ok) {
        setCabangList(await cabRes.json());
      }
    } catch (e: any) {
      showToast("Gagal memuat data aset tetap", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegisterAsset = async () => {
    if (!formKode.trim() || !formNama.trim() || !formHarga || !formMasaBulan) {
      showToast("Seluruh kolom wajib diisi dengan benar", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode_aset: formKode.trim().toUpperCase(),
        nama_aset: formNama.trim(),
        id_cabang: formCabang || 2,
        kategori_aset: formKategori,
        tanggal_perolehan: formTanggal,
        harga_perolehan: parseInt(formHarga),
        nilai_residu: parseInt(formResidu) || 0,
        masa_manfaat_bulan: parseInt(formMasaBulan),
      };

      const res = await fetch("/api/akuntansi/aset-tetap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        setShowModal(false);
        fetchData();
      } else {
        showToast(data.message || "Gagal mendaftarkan aset", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDepreciation = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/akuntansi/aset-tetap/depresiasi-bulanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulan: depreciateBulan, tahun: depreciateTahun }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `${data.message} (${data.data.jumlah_aset_disusutkan} aset, total ${formatCurrency(data.data.total_nominal_depresiasi)})`,
          "success"
        );
        setShowDepreciateModal(false);
        fetchData();
      } else {
        showToast(data.message || "Gagal mengeksekusi penyusutan", "error");
      }
    } catch (e: any) {
      showToast("Kesalahan jaringan", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filtered List & Totals
  const filteredList = list.filter((item) => {
    const matchSearch =
      item.kode_aset.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_aset.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori_aset.toLowerCase().includes(search.toLowerCase());
    const matchCabang = selectedCabang === "all" || item.id_cabang.toString() === selectedCabang;
    return matchSearch && matchCabang;
  });

  const totalPerolehan = filteredList.reduce((acc, x) => acc + x.harga_perolehan, 0);
  const totalAkumulasi = filteredList.reduce((acc, x) => acc + x.akumulasi_penyusutan, 0);
  const totalNilaiBuku = filteredList.reduce((acc, x) => acc + x.nilai_buku, 0);
  const totalDepresiasiBulanan = filteredList.reduce((acc, x) => acc + (x.status === "AKTIF" ? x.beban_penyusutan_per_bulan : 0), 0);

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
            <Boxes className="w-6 h-6 text-primary" />
            Manajemen Aset Tetap & Depresiasi Garis Lurus
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Registri inventaris aset toko/DC, pelacakan nilai buku, dan eksekusi batch posting penyusutan bulanan ke Buku Besar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDepreciateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Jalankan Depresiasi Bulanan
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrasi Aset Baru
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline/10">
          <span className="text-xs text-on-surface-variant block mb-1">Total Nilai Perolehan</span>
          <span className="text-base md:text-lg font-bold font-mono text-on-surface">
            {formatCurrency(totalPerolehan)}
          </span>
        </div>
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline/10">
          <span className="text-xs text-on-surface-variant block mb-1">Akumulasi Penyusutan</span>
          <span className="text-base md:text-lg font-bold font-mono text-amber-600">
            {formatCurrency(totalAkumulasi)}
          </span>
        </div>
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline/10">
          <span className="text-xs text-on-surface-variant block mb-1">Nilai Buku Bersih (NBV)</span>
          <span className="text-base md:text-lg font-bold font-mono text-emerald-600">
            {formatCurrency(totalNilaiBuku)}
          </span>
        </div>
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline/10">
          <span className="text-xs text-on-surface-variant block mb-1">Beban Depresiasi / Bln</span>
          <span className="text-base md:text-lg font-bold font-mono text-primary">
            {formatCurrency(totalDepresiasiBulanan)}
          </span>
        </div>
      </div>

      {/* Controls & Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline/10 overflow-hidden">
        <div className="p-3.5 border-b border-outline/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode aset, nama aset, atau kategori..."
              className="w-full bg-surface px-3 py-1.5 rounded-lg border border-outline/20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-on-surface">Cabang:</span>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="bg-surface px-2.5 py-1.5 rounded-lg border border-outline/20 focus:outline-none"
            >
              <option value="all">Semua Cabang</option>
              {cabangList.map((c) => (
                <option key={c.id_cabang} value={c.id_cabang}>
                  {c.nama_cabang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-semibold border-b border-outline/10">
              <tr>
                <th className="p-3">Kode Aset</th>
                <th className="p-3">Nama Aset</th>
                <th className="p-3">Cabang</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Tgl Beli</th>
                <th className="p-3 text-right">Harga Beli</th>
                <th className="p-3 text-center">Umur (Bln)</th>
                <th className="p-3 text-right">Beban/Bln</th>
                <th className="p-3 text-right">Akumulasi</th>
                <th className="p-3 text-right">Nilai Buku</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5 text-on-surface">
              {filteredList.map((a) => (
                <tr key={a.id} className="hover:bg-surface-container/50">
                  <td className="p-3 font-mono font-bold text-primary">{a.kode_aset}</td>
                  <td className="p-3 font-semibold">{a.nama_aset}</td>
                  <td className="p-3 text-on-surface-variant">{a.nama_cabang || `Cabang #${a.id_cabang}`}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container">
                      {a.kategori_aset}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{a.tanggal_perolehan}</td>
                  <td className="p-3 text-right font-mono font-medium">{formatCurrency(a.harga_perolehan)}</td>
                  <td className="p-3 text-center font-mono">{a.masa_manfaat_bulan} bln</td>
                  <td className="p-3 text-right font-mono text-primary font-medium">
                    {formatCurrency(a.beban_penyusutan_per_bulan)}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-600 font-medium">
                    {formatCurrency(a.akumulasi_penyusutan)}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-bold">
                    {formatCurrency(a.nilai_buku)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrasi Aset Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-6 rounded-2xl max-w-lg w-full shadow-2xl border border-outline/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" />
              Registrasi Aset Tetap Baru
            </h3>

            <div className="space-y-3 text-xs mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Kode Aset (Unik):</label>
                  <input
                    type="text"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    placeholder="AST-FREEZER-001"
                    className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Kategori:</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full p-2 bg-surface-container rounded border border-outline/30"
                  >
                    <option value="Peralatan">Peralatan Toko</option>
                    <option value="Kendaraan">Kendaraan Armada</option>
                    <option value="Elektronik">Elektronik & POS</option>
                    <option value="Bangunan">Gedung / Bangunan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nama Aset:</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Freezer Es Krim Sharp 300L"
                  className="w-full p-2 bg-surface-container rounded border border-outline/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Cabang Penempatan:</label>
                  <select
                    value={formCabang}
                    onChange={(e) => setFormCabang(e.target.value)}
                    className="w-full p-2 bg-surface-container rounded border border-outline/30"
                  >
                    {cabangList.map((c) => (
                      <option key={c.id_cabang} value={c.id_cabang}>
                        {c.nama_cabang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tanggal Perolehan:</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Harga Beli (Rp):</label>
                  <input
                    type="number"
                    value={formHarga}
                    onChange={(e) => setFormHarga(e.target.value)}
                    placeholder="4800000"
                    className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Nilai Residu (Rp):</label>
                  <input
                    type="number"
                    value={formResidu}
                    onChange={(e) => setFormResidu(e.target.value)}
                    placeholder="0"
                    className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Umur (Bulan):</label>
                  <input
                    type="number"
                    value={formMasaBulan}
                    onChange={(e) => setFormMasaBulan(e.target.value)}
                    placeholder="48"
                    className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono"
                  />
                </div>
              </div>

              {formHarga && formMasaBulan && parseInt(formMasaBulan) > 0 && (
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                  <span className="text-on-surface-variant block">Estimasi Beban Depresiasi Bulanan:</span>
                  <span className="text-sm font-bold font-mono text-primary">
                    {formatCurrency(
                      Math.round(((parseInt(formHarga) || 0) - (parseInt(formResidu) || 0)) / parseInt(formMasaBulan))
                    )}{" "}
                    / bulan
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium bg-surface-container hover:bg-surface-container-high rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleRegisterAsset}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-on-primary rounded-lg disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Aset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eksekusi Depresiasi Bulanan */}
      {showDepreciateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-6 rounded-2xl max-w-md w-full shadow-2xl border border-outline/20">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-amber-600">
              <Play className="w-5 h-5 fill-current" />
              Eksekusi Depresiasi Garis Lurus Bulanan
            </h3>

            <p className="text-xs text-on-surface-variant mb-4">
              Sistem akan menghitung beban depresiasi bulanan untuk seluruh aset tetap bertaraf <b>AKTIF</b> dan secara otomatis memposting ayat jurnal berpasangan (Debit Beban Penyusutan, Kredit Akumulasi) per cabang ke Jurnal Umum.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Periode Bulan:</label>
                <select
                  value={depreciateBulan}
                  onChange={(e) => setDepreciateBulan(parseInt(e.target.value))}
                  className="w-full p-2 bg-surface-container rounded border border-outline/30 font-bold"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Bulan {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Tahun:</label>
                <input
                  type="number"
                  value={depreciateTahun}
                  onChange={(e) => setDepreciateTahun(parseInt(e.target.value))}
                  className="w-full p-2 bg-surface-container rounded border border-outline/30 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDepreciateModal(false)}
                className="px-4 py-2 text-xs font-medium bg-surface-container hover:bg-surface-container-high rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDepreciation}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {saving ? "Memproses..." : "Eksekusi Depresiasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

