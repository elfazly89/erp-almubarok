"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";

interface KartuStokRow {
  id_kartu: number;
  id_barang: number;
  nama_barang: string;
  barcode: string;
  satuan_1: string;
  id_cabang: number;
  nama_cabang: string;
  tanggal_transaksi: string;
  tipe_transaksi: string;
  nomor_referensi: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  saldo_akhir: number;
  hpp_satuan: number;
  total_nilai: number;
  keterangan: string | null;
  nama_petugas: string | null;
  created_at: string;
}

interface CabangOption {
  id_cabang: number;
  nama_cabang: string;
}

export default function KartuStokPage() {
  const { can_read, loading: permissionsLoading } = useMenuPermissions();
  const [rows, setRows] = useState<KartuStokRow[]>([]);
  const [cabangs, setCabangs] = useState<CabangOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [search, setSearch] = useState("");
  const [tipeFilter, setTipeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchCabangs = useCallback(async () => {
    try {
      const res = await fetch("/api/cabang");
      if (res.ok) setCabangs(await res.json());
    } catch (e) {
      console.error("Failed to load cabangs:", e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCabang) params.append("id_cabang", selectedCabang);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("limit", "300");

      const res = await fetch(`/api/master/kartu-stok?${params.toString()}`);
      if (res.ok) {
        setRows(await res.json());
      }
    } catch (e) {
      console.error("Failed to load kartu stok:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCabang, startDate, endDate]);

  useEffect(() => {
    fetchCabangs();
    fetchData();
  }, [fetchCabangs, fetchData]);

  const filteredRows = rows.filter((r) => {
    const matchesSearch =
      r.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      r.barcode.includes(search) ||
      r.nomor_referensi.toLowerCase().includes(search.toLowerCase()) ||
      (r.keterangan && r.keterangan.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (tipeFilter !== "ALL" && r.tipe_transaksi !== tipeFilter) {
      return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalMutasiMasuk = filteredRows.reduce((sum, r) => sum + r.masuk, 0);
  const totalMutasiKeluar = filteredRows.reduce((sum, r) => sum + r.keluar, 0);

  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <AlertTriangle className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk melihat Kartu Stok.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <History className="w-6 h-6 text-primary" /> Kartu Riwayat Stok (Stock Ledger)
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Buku besar mutasi persediaan fisik atomik: POS, Pembelian, Transfer SJ, Adjustment & Opname.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-outline-variant/60 rounded-xl hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1.5 text-on-surface-variant"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
          <button
            onClick={fetchData}
            title="Refresh Ledger"
            className="p-2 border border-outline-variant/60 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm space-y-3 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari barcode / item / no ref..."
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Cabang / Gudang</option>
              {cabangs.map((c) => (
                <option key={c.id_cabang} value={c.id_cabang}>{c.nama_cabang}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={tipeFilter}
              onChange={(e) => setTipeFilter(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
            >
              <option value="ALL">Semua Jenis Mutasi</option>
              <option value="PENJUALAN_POS">Penjualan Kasir POS</option>
              <option value="PENERIMAAN_PEMBELIAN">Penerimaan Pembelian (FB)</option>
              <option value="MUTASI_TRANSFER_MASUK">Transfer Masuk (SJ In)</option>
              <option value="MUTASI_TRANSFER_KELUAR">Transfer Keluar (SJ Out)</option>
              <option value="QUICK_ADJUSTMENT">Quick Adjustment (Rusak/Selisih)</option>
              <option value="STOCK_OPNAME">Stock Opname Fisik</option>
              <option value="SALDO_AWAL">Saldo Awal</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        </div>

        {/* Ringkasan Akumulasi */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-outline-variant/20 font-mono">
          <span className="text-on-surface-variant font-sans">Mutasi Periode Terpilih:</span>
          <span className="text-primary font-bold">
            (+) Masuk: {totalMutasiMasuk.toLocaleString("id-ID")} pcs
          </span>
          <span className="text-error font-bold">
            (-) Keluar: {totalMutasiKeluar.toLocaleString("id-ID")} pcs
          </span>
          <span className="text-on-surface font-semibold">
            Total Record: {filteredRows.length} entri
          </span>
        </div>
      </div>

      {/* Tabel Stock Ledger */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-2 text-primary" /> Memuat data buku besar stok...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
            Tidak ada riwayat transaksi kartu stok pada filter ini.
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none sticky top-0 z-10 font-semibold text-on-surface-variant">
                  <th className="px-4 py-2.5">Waktu</th>
                  <th className="px-4 py-2.5">Barang & Cabang</th>
                  <th className="px-4 py-2.5">Tipe Mutasi</th>
                  <th className="px-4 py-2.5">No. Referensi</th>
                  <th className="px-4 py-2.5 text-right">Saldo Awal</th>
                  <th className="px-4 py-2.5 text-right text-primary">Masuk</th>
                  <th className="px-4 py-2.5 text-right text-error">Keluar</th>
                  <th className="px-4 py-2.5 text-right font-bold">Saldo Akhir</th>
                  <th className="px-4 py-2.5">Petugas & Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-mono">
                {filteredRows.map((r) => {
                  const isPlus = r.masuk > 0;
                  const isMinus = r.keluar > 0;

                  return (
                    <tr key={r.id_kartu} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">
                        {r.tanggal_transaksi}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-on-surface block truncate max-w-[220px]">
                          {r.nama_barang}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                          <span>{r.barcode}</span>
                          <span>•</span>
                          <span className="text-primary font-medium">{r.nama_cabang}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.tipe_transaksi.includes("MASUK") || r.tipe_transaksi.includes("PEMBELIAN")
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : r.tipe_transaksi.includes("KELUAR") || r.tipe_transaksi.includes("POS")
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : r.tipe_transaksi.includes("ADJUSTMENT")
                            ? "bg-secondary/10 text-secondary border border-secondary/20"
                            : "bg-surface-container text-on-surface"
                        }`}>
                          {r.tipe_transaksi}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-on-surface whitespace-nowrap">
                        {r.nomor_referensi}
                      </td>
                      <td className="px-4 py-2.5 text-right text-on-surface-variant">
                        {r.saldo_awal}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${isPlus ? "text-primary" : "text-on-surface-variant/40"}`}>
                        {isPlus ? `+${r.masuk}` : "-"}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${isMinus ? "text-error" : "text-on-surface-variant/40"}`}>
                        {isMinus ? `-${r.keluar}` : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-on-surface bg-surface-container/30">
                        {r.saldo_akhir} <span className="text-[10px] font-normal text-on-surface-variant">{r.satuan_1}</span>
                      </td>
                      <td className="px-4 py-2.5 font-sans text-[11px] text-on-surface-variant max-w-[200px]">
                        <span className="font-semibold text-on-surface block truncate">{r.nama_petugas || "Sistem"}</span>
                        <span className="text-[10px] truncate block text-on-surface-variant/80">{r.keterangan || "-"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

