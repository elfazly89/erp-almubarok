"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Search,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Eye,
  X,
  LineChart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface ForecastItem {
  id: number;
  id_barang: number;
  id_cabang: number;
  barang: string;
  barcode: string;
  kategori: string;
  cabang: string;
  stok: number;
  ads: number;
  estimasiHabisHari: number;
  tanggalHabis: string;
  status: "AMAN" | "PERHATIAN" | "KRITIS";
  lastUpdate: string;
}

// Fallback mock data
const MOCK_FORECAST: ForecastItem[] = [
  { id: 1, id_barang: 1, id_cabang: 1, barang: "Minyak Goreng Sunco 2L", barcode: "8991234567890", kategori: "Sembako", cabang: "SUKOWONO", stok: 12, ads: 8.5, estimasiHabisHari: 1, tanggalHabis: "—", status: "KRITIS", lastUpdate: "—" },
  { id: 2, id_barang: 2, id_cabang: 2, barang: "Beras Cap Mangkok 5kg", barcode: "8992345678901", kategori: "Sembako", cabang: "KALISAT", stok: 8, ads: 4.2, estimasiHabisHari: 1, tanggalHabis: "—", status: "KRITIS", lastUpdate: "—" },
  { id: 3, id_barang: 3, id_cabang: 3, barang: "Gula Pasir Gulaku 1kg", barcode: "8990123456789", kategori: "Sembako", cabang: "PONPES", stok: 25, ads: 10.0, estimasiHabisHari: 2, tanggalHabis: "—", status: "PERHATIAN", lastUpdate: "—" },
  { id: 4, id_barang: 4, id_cabang: 4, barang: "Aqua Gelas Dus", barcode: "8993456789012", kategori: "Minuman", cabang: "LEDOKOMBO", stok: 18, ads: 6.0, estimasiHabisHari: 3, tanggalHabis: "—", status: "PERHATIAN", lastUpdate: "—" },
  { id: 5, id_barang: 5, id_cabang: 5, barang: "Indomie Goreng Spesial", barcode: "8994567890123", kategori: "Mie Instan", cabang: "GUNUNG MALANG", stok: 45, ads: 12.5, estimasiHabisHari: 3, tanggalHabis: "—", status: "PERHATIAN", lastUpdate: "—" },
];

export default function ForecastStokPage() {
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Semua Cabang");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [selectedItemForChart, setSelectedItemForChart] = useState<ForecastItem | null>(null);
  const [data, setData] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const res = await fetch(`/api/distribusi/forecast?${params}`);
      const json = await res.json();

      if (json.success && json.data?.length > 0) {
        setData(json.data);
        setUsingMock(false);
      } else {
        setData(MOCK_FORECAST);
        setUsingMock(true);
      }
    } catch {
      setData(MOCK_FORECAST);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/distribusi/forecast", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setNotification(`✅ ${json.message}`);
        await fetchData();
      } else {
        setNotification(`❌ ${json.message}`);
      }
    } catch {
      setNotification("❌ Gagal menghubungi server.");
    } finally {
      setCalculating(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Unique values for filters
  const uniqueBranches = [...new Set(data.map((d) => d.cabang))];

  // Filter
  const filteredList = data.filter((item) => {
    const matchSearch = !search || item.barang.toLowerCase().includes(search.toLowerCase());
    const matchBranch = selectedBranch === "Semua Cabang" || item.cabang === selectedBranch;
    const matchStatus = selectedStatus === "Semua Status" || item.status === selectedStatus;
    return matchSearch && matchBranch && matchStatus;
  });

  return (
    <div className="flex flex-col space-y-4 text-on-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Proyeksi Ketersediaan Stok
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Analisis ketahanan persediaan stok per SKU di setiap cabang beserta tanggal perkiraan habis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {usingMock && (
            <span className="text-[10px] bg-warning/10 text-warning border border-warning/20 px-2 py-1 rounded-full font-bold">
              Data Simulasi
            </span>
          )}
          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? "animate-spin" : ""}`} />
            {calculating ? "Menghitung..." : "Hitung Ulang Forecast"}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold border animate-in fade-in ${
          notification.startsWith("✅") ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
        }`}>
          {notification}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-surface-container/40 px-4 py-3 border border-outline-variant/30 rounded-xl shrink-0">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="Semua Cabang">Semua Cabang</option>
            {uniqueBranches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="KRITIS">KRITIS</option>
            <option value="PERHATIAN">PERHATIAN</option>
            <option value="AMAN">AMAN</option>
          </select>

          {(search || selectedBranch !== "Semua Cabang" || selectedStatus !== "Semua Status") && (
            <button
              onClick={() => { setSearch(""); setSelectedBranch("Semua Cabang"); setSelectedStatus("Semua Status"); }}
              className="text-primary hover:bg-primary/5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <span className="text-on-surface-variant text-xs font-semibold shrink-0">
          Menampilkan {filteredList.length} dari {data.length} Proyeksi
        </span>
      </div>

      {/* Forecast Table */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-auto min-h-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none text-on-surface-variant font-semibold">
                <th className="px-5 py-3.5 w-12">#</th>
                <th className="px-5 py-3.5">Nama Barang</th>
                <th className="px-5 py-3.5">Cabang</th>
                <th className="px-5 py-3.5 text-right">Stok Sekarang</th>
                <th className="px-5 py-3.5 text-right">Laju Jual Harian (ADS)</th>
                <th className="px-5 py-3.5 text-right">Ketahanan Stok (Hari)</th>
                <th className="px-5 py-3.5 text-right">Estimasi Habis</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-on-surface-variant text-sm">Memuat data proyeksi...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-on-surface-variant text-sm">Tidak ada data proyeksi yang cocok.</td></tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-on-surface-variant">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <span className="font-semibold block">{item.barang}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium uppercase">{item.kategori}</span>
                    </td>
                    <td className="px-5 py-3 text-on-surface font-medium">{item.cabang}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold">{item.stok} pcs</td>
                    <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{item.ads.toFixed(1)} pcs</td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      {item.estimasiHabisHari >= 999 ? "Tak Terbatas" : `${item.estimasiHabisHari} Hari`}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-on-surface-variant">{item.tanggalHabis}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === "KRITIS"
                          ? "bg-error/10 text-error border-error/20"
                          : item.status === "PERHATIAN"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-success/10 text-success border-success/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedItemForChart(item)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                        title="Lihat Proyeksi Grafik"
                      >
                        <LineChart className="w-3.5 h-3.5" /> Grafik
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projection Chart Modal */}
      {selectedItemForChart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 text-sm uppercase">
                <LineChart className="w-5 h-5 text-primary" /> Proyeksi Penurunan Stok
              </h2>
              <button
                onClick={() => setSelectedItemForChart(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 hover:bg-surface-container-high rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Nama Produk</span>
                <span className="text-on-surface font-extrabold text-sm block mt-0.5">{selectedItemForChart.barang}</span>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <span className="text-on-surface-variant block">Cabang</span>
                    <span className="text-on-surface font-semibold">{selectedItemForChart.cabang}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Stok Saat Ini</span>
                    <span className="text-on-surface font-semibold font-mono">{selectedItemForChart.stok} pcs</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Rata-rata Jual Harian (ADS)</span>
                    <span className="text-on-surface font-semibold font-mono">{selectedItemForChart.ads.toFixed(1)} pcs/hari</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Ketahanan Stok</span>
                    <span className={`font-semibold font-mono ${selectedItemForChart.status === "KRITIS" ? "text-error" : selectedItemForChart.status === "PERHATIAN" ? "text-warning" : "text-success"}`}>
                      {selectedItemForChart.estimasiHabisHari >= 999 ? "Tak Terbatas" : `${selectedItemForChart.estimasiHabisHari} Hari`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart simulasi */}
              <div className="border border-outline-variant/40 rounded-xl p-4 bg-surface-container-low flex flex-col justify-end h-40">
                <div className="flex-1 flex items-end justify-between px-2 gap-2 relative">
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-outline-variant/40" />
                  <div className="absolute inset-x-0 bottom-[30%] border-b border-dashed border-outline-variant/30 text-[8px] text-on-surface-variant/70 pl-1">Safety Stock</div>
                  <div className="absolute inset-x-0 bottom-[70%] border-b border-dashed border-outline-variant/30 text-[8px] text-on-surface-variant/70 pl-1">Batas Pengiriman Ulang</div>
                  {[
                    { label: "Hari 0", color: "bg-success", height: "h-28" },
                    { label: "Hari 1", color: "bg-success", height: "h-20" },
                    { label: "Hari 2", color: "bg-warning", height: "h-12" },
                    { label: "Hari 3", color: "bg-error", height: "h-4" },
                    { label: "Habis!", color: "bg-error/45 border border-dashed border-error/50", height: "h-1" },
                  ].map((bar, i) => (
                    <div key={i} className="w-full flex flex-col items-center gap-1">
                      <div className={`w-8 ${bar.color} rounded-t-sm ${bar.height}`} />
                      <span className="text-[8px] font-mono">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedItemForChart(null)}
                  className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
