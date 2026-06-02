"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, ArrowLeft, CalendarDays, Filter, RefreshCw, FileText, ArrowUpRight, ArrowDownRight, Award, Plus } from "lucide-react";
import Link from "next/link";

interface PointRecord {
  id: number;
  id_pelanggan: number;
  nama_lengkap: string;
  kode_pelanggan: string;
  jenis_transaksi: string;
  jumlah_poin: number;
  keterangan: string | null;
  id_referensi_transaksi: string | null;
  waktu: string;
}

interface Customer {
  id_pelanggan: number;
  kode_pelanggan: string;
  nama_lengkap: string;
  total_poin: number;
}

function RiwayatPoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialIdPelanggan = searchParams.get("id_pelanggan") || "";

  const [list, setList] = useState<PointRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [idPelanggan, setIdPelanggan] = useState(initialIdPelanggan);
  const [jenisTransaksi, setJenisTransaksi] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/pelanggan");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("Gagal memuat list pelanggan", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/pelanggan/poin?`;
      if (idPelanggan) url += `id_pelanggan=${idPelanggan}&`;
      if (jenisTransaksi) url += `jenis_transaksi=${jenisTransaksi}&`;
      if (tanggalAwal) url += `tanggal_awal=${tanggalAwal}&`;
      if (tanggalAkhir) url += `tanggal_akhir=${tanggalAkhir}&`;

      const res = await fetch(url);
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error("Gagal memuat riwayat poin", err);
    } finally {
      setLoading(false);
    }
  }, [idPelanggan, jenisTransaksi, tanggalAwal, tanggalAkhir]);

  useEffect(() => {
    loadCustomers();
    loadData();
  }, [loadCustomers, loadData]);

  // Sync initial query parameter if it changes
  useEffect(() => {
    setIdPelanggan(initialIdPelanggan);
  }, [initialIdPelanggan]);

  const handleResetFilters = () => {
    setIdPelanggan("");
    setJenisTransaksi("");
    setTanggalAwal("");
    setTanggalAkhir("");
    router.replace("/pelanggan/poin");
  };

  const getSelectedCustomerDetails = () => {
    if (!idPelanggan) return null;
    return customers.find(c => c.id_pelanggan.toString() === idPelanggan) || null;
  };

  const selectedCust = getSelectedCustomerDetails();

  const totalDapat = list
    .filter(r => r.jenis_transaksi === "DAPAT")
    .reduce((sum, r) => sum + r.jumlah_poin, 0);

  const totalGunakan = list
    .filter(r => r.jenis_transaksi === "GUNAKAN")
    .reduce((sum, r) => sum + r.jumlah_poin, 0);

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "-";
    // standard date formats: YYYY-MM-DD HH:mm:ss
    try {
      const parts = dateTimeStr.split(" ");
      if (parts.length >= 2) {
        const dateParts = parts[0].split("-");
        const timeParts = parts[1].split(":");
        if (dateParts.length === 3 && timeParts.length >= 2) {
          return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
        }
      }
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return dateTimeStr;
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).replace(/\//g, "-");
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="space-y-6 text-on-background">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/pelanggan"
          className="p-3.5 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-2xl transition-all duration-200 border border-outline-variant/10 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-primary" /> Riwayat Poin Pelanggan
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {selectedCust
              ? `Log mutasi poin untuk pelanggan: ${selectedCust.nama_lengkap} (${selectedCust.kode_pelanggan})`
              : "Lacak seluruh log perolehan dan penukaran poin untuk semua pelanggan"}
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-on-surface text-xs flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-primary" /> Filter Pencarian
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5">
              Pilih Pelanggan
            </label>
            <select
              value={idPelanggan}
              onChange={(e) => {
                setIdPelanggan(e.target.value);
                if (e.target.value) {
                  router.replace(`/pelanggan/poin?id_pelanggan=${e.target.value}`);
                } else {
                  router.replace(`/pelanggan/poin`);
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="" className="bg-surface">-- Semua Pelanggan --</option>
              {customers.map((c) => (
                <option key={c.id_pelanggan} value={c.id_pelanggan.toString()} className="bg-surface">
                  {c.nama_lengkap} ({c.kode_pelanggan})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5">
              Jenis Mutasi
            </label>
            <select
              value={jenisTransaksi}
              onChange={(e) => setJenisTransaksi(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="" className="bg-surface">-- Semua Mutasi --</option>
              <option value="DAPAT" className="bg-surface">DAPAT (Tambah Poin)</option>
              <option value="GUNAKAN" className="bg-surface">GUNAKAN (Tukar Poin)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5">
              Tanggal Awal
            </label>
            <input
              type="date"
              value={tanggalAwal}
              onChange={(e) => setTanggalAwal(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={tanggalAkhir}
              onChange={(e) => setTanggalAkhir(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant/30 pt-3">
          <button
            onClick={handleResetFilters}
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
          <button
            onClick={loadData}
            className="bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-green-500/10 rounded-2xl text-green-500">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Total Poin Diperoleh</span>
            <strong className="text-xl font-bold font-mono text-green-500">+{totalDapat.toLocaleString()} Poin</strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-red-500/10 rounded-2xl text-red-500">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Total Poin Ditukarkan</span>
            <strong className="text-xl font-bold font-mono text-red-500">-{totalGunakan.toLocaleString()} Poin</strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Saldo Poin Bersih Terpilih</span>
            <strong className="text-xl font-bold font-mono text-on-surface">
              {selectedCust ? selectedCust.total_poin.toLocaleString() : (totalDapat - totalGunakan).toLocaleString()} Poin
            </strong>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs">Memuat log mutasi poin pelanggan...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-sm">
            <Clock className="w-16 h-16 mb-4 opacity-20 text-primary animate-pulse" />
            <p className="font-semibold text-on-surface">Belum ada riwayat poin</p>
            <p className="text-xs text-on-surface-variant mt-1">Tidak ada catatan transaksi poin pada kriteria ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 w-12 text-center">No</th>
                  <th className="px-6 py-4">Waktu Transaksi</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Jenis Transaksi</th>
                  <th className="px-6 py-4 text-right">Mutasi Poin</th>
                  <th className="px-6 py-4">Keterangan / Memo</th>
                  <th className="px-6 py-4">Ref Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {list.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-surface-container-high/25 transition-colors">
                    <td className="px-6 py-4 text-center text-on-surface-variant font-mono">{idx + 1}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">
                      {formatDateTime(r.waktu)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">{r.nama_lengkap}</div>
                      <span className="text-[10px] text-on-surface-variant/80 font-mono block mt-0.5">{r.kode_pelanggan}</span>
                    </td>
                    <td className="px-6 py-4">
                      {r.jenis_transaksi === "DAPAT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          DAPAT (Kredit)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          GUNAKAN (Debit)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <strong
                        className={`text-sm font-bold font-mono ${
                          r.jenis_transaksi === "DAPAT" ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {r.jenis_transaksi === "DAPAT" ? "+" : "-"}
                        {r.jumlah_poin.toLocaleString()}
                      </strong>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate" title={r.keterangan || ""}>
                      {r.keterangan || "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px]">
                      {r.id_referensi_transaksi ? (
                        <span className="bg-surface-container-high px-2 py-0.5 rounded text-on-surface border border-outline-variant/35 shadow-sm font-bold">
                          {r.id_referensi_transaksi}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/50">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RiwayatPoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-xs">Memuat halaman riwayat poin...</p>
        </div>
      }
    >
      <RiwayatPoinContent />
    </Suspense>
  );
}
