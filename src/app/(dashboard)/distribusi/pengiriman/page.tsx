"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  X,
  Printer,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  Loader2,
} from "lucide-react";

interface ShipmentDetail {
  id: number;
  id_barang: number;
  jumlah_dikirim: number;
  jumlah_diterima: number | null;
  nama_barang: string;
  satuan: string;
}

interface Shipment {
  id_pengiriman: number;
  kode_pengiriman: string;
  id_cabang_sumber: number;
  id_cabang_tujuan: number;
  jenis_pengiriman: string;
  id_rekomendasi: number | null;
  armada: string | null;
  driver: string | null;
  status: string;
  tanggal_kirim: string;
  tanggal_terima: string | null;
  nama_cabang_sumber: string;
  nama_cabang_tujuan: string;
  items: ShipmentDetail[];
}

export default function PengirimanDCPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showPrintSj, setShowPrintSj] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/pengiriman?jenis=DC");
      const json = await res.json();
      if (json.success) {
        setShipments(json.data || []);
        // Maintain selection if possible
        if (selectedShipment) {
          const updated = (json.data || []).find((s: Shipment) => s.id_pengiriman === selectedShipment.id_pengiriman);
          if (updated) {
            setSelectedShipment(updated);
          }
        } else if (json.data?.length > 0) {
          setSelectedShipment(json.data[0]);
        }
      } else {
        triggerNotification("error", "Gagal memuat data pengiriman.");
      }
    } catch {
      triggerNotification("error", "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [selectedShipment]);

  useEffect(() => {
    fetchShipments();
  }, []);

  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/distribusi/pengiriman", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        triggerNotification("success", `Status berhasil diperbarui ke: ${newStatus}`);
        
        // Local update
        setShipments((prev) =>
          prev.map((s) => (s.id_pengiriman === id ? { ...s, status: newStatus } : s))
        );
        if (selectedShipment?.id_pengiriman === id) {
          setSelectedShipment((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        triggerNotification("error", json.message || "Gagal memperbarui status.");
      }
    } catch {
      triggerNotification("error", "Gagal menghubungi server.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
      s.nama_cabang_tujuan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-4 text-on-background">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Pengiriman DC & Surat Jalan
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Kelola pengiriman barang dari Gudang DC ke Cabang. Pantau proses picking, packing, hingga armada berangkat.
          </p>
        </div>
        <button
          onClick={fetchShipments}
          disabled={loading}
          className="bg-surface hover:bg-surface-container-high border border-outline-variant/60 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl animate-in fade-in duration-250 border ${
            notification.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">{notification.message}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-surface-container/40 px-4 py-2 border border-outline-variant/30 rounded-xl shrink-0">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Surat Jalan / Cabang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
          />
        </div>
        <span className="text-on-surface-variant text-xs font-semibold">
          {filteredShipments.length} Surat Jalan
        </span>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* List of Shipments (Col Span 2) */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-surface border border-outline-variant/30 py-24 text-center text-on-surface-variant text-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              Memuat data pengiriman...
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="bg-surface border border-outline-variant/30 py-12 text-center text-on-surface-variant text-sm rounded-2xl">
              Tidak ada surat jalan pengiriman saat ini.
            </div>
          ) : (
            filteredShipments.map((s) => (
              <div
                key={s.id_pengiriman}
                onClick={() => setSelectedShipment(s)}
                className={`bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  selectedShipment?.id_pengiriman === s.id_pengiriman
                    ? "border-primary bg-primary/[0.02] ring-1 ring-primary/25"
                    : "border-outline-variant/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-on-surface text-sm font-mono">{s.kode_pengiriman}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        s.status === "Draft"
                          ? "bg-surface-container-high text-on-surface-variant border-outline-variant/60"
                          : ["Pengambilan Barang", "Pengepakan"].includes(s.status)
                          ? "bg-warning/10 text-warning border-warning/20"
                          : s.status === "Dalam Perjalanan"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-success/10 text-success border-success/20"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant block mt-1 font-semibold">Tujuan: {s.nama_cabang_tujuan}</span>
                  </div>
                  <div className="text-left sm:text-right text-xs font-mono">
                    <span className="text-on-surface-variant block font-sans">Tanggal: <strong className="text-on-surface font-medium">{s.tanggal_kirim}</strong></span>
                    <span className="text-on-surface-variant block mt-0.5 font-sans">Armada: <strong className="text-on-surface font-medium">{s.driver || "—"} ({s.armada || "—"})</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Shipment Detail Side Panel */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col h-fit">
          {selectedShipment ? (
            <div className="space-y-4">
              <div className="border-b border-outline-variant/20 pb-3">
                <h3 className="font-bold text-on-surface text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> Rincian Surat Jalan
                </h3>
                <span className="text-[10px] font-mono text-on-surface-variant block mt-1">{selectedShipment.kode_pengiriman}</span>
              </div>

              {/* Status Stepper */}
              <div className="bg-surface-container-low border border-outline-variant/20 p-3 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-semibold">Status Alur Pengiriman:</span>
                  <span className="font-bold text-primary font-mono text-[10px]">
                    {selectedShipment.status}
                  </span>
                </div>
                
                {/* Stepper buttons */}
                <div className="flex flex-wrap gap-1.5 justify-stretch">
                  <button
                    disabled={selectedShipment.status === "Draft" || updatingId !== null}
                    onClick={() => updateStatus(selectedShipment.id_pengiriman, "Draft")}
                    className="flex-1 text-[10px] font-bold bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 text-on-surface py-1 rounded transition-colors cursor-pointer"
                  >
                    DRAF
                  </button>
                  <button
                    disabled={selectedShipment.status === "Pengambilan Barang" || updatingId !== null}
                    onClick={() => updateStatus(selectedShipment.id_pengiriman, "Pengambilan Barang")}
                    className="flex-1 text-[10px] font-bold bg-warning/15 hover:bg-warning/20 disabled:opacity-40 text-warning py-1 rounded transition-colors cursor-pointer"
                  >
                    AMBIL
                  </button>
                  <button
                    disabled={selectedShipment.status === "Pengepakan" || updatingId !== null}
                    onClick={() => updateStatus(selectedShipment.id_pengiriman, "Pengepakan")}
                    className="flex-1 text-[10px] font-bold bg-warning/15 hover:bg-warning/20 disabled:opacity-40 text-warning py-1 rounded transition-colors cursor-pointer"
                  >
                    KEMAS
                  </button>
                  <button
                    disabled={selectedShipment.status === "Dalam Perjalanan" || updatingId !== null}
                    onClick={() => updateStatus(selectedShipment.id_pengiriman, "Dalam Perjalanan")}
                    className="flex-1 text-[10px] font-bold bg-primary/15 hover:bg-primary/20 disabled:opacity-40 text-primary py-1 rounded transition-colors cursor-pointer"
                  >
                    KIRIM
                  </button>
                </div>
              </div>

              {/* General info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tujuan Cabang:</span>
                  <strong className="text-on-surface">{selectedShipment.nama_cabang_tujuan}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Armada Kendaraan:</span>
                  <strong className="text-on-surface">{selectedShipment.armada || "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Driver Pengirim:</span>
                  <strong className="text-on-surface">{selectedShipment.driver || "—"}</strong>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-low text-xs">
                <div className="bg-surface-container-high/40 px-3 py-2 font-semibold border-b border-outline-variant/20 uppercase tracking-wider text-[10px]">
                  Daftar Barang Kirim
                </div>
                <div className="divide-y divide-outline-variant/20 max-h-40 overflow-y-auto">
                  {selectedShipment.items && selectedShipment.items.length > 0 ? (
                    selectedShipment.items.map((item) => (
                      <div key={item.id} className="px-3 py-2 flex justify-between items-center bg-surface hover:bg-surface-container-high/15">
                        <span className="font-medium text-on-surface">{item.nama_barang}</span>
                        <strong className="text-primary font-mono shrink-0">{item.jumlah_dikirim} {item.satuan}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-on-surface-variant/70 text-center">Tidak ada detail barang.</div>
                  )}
                </div>
              </div>

              {/* Print action */}
              <button
                onClick={() => setShowPrintSj(selectedShipment)}
                className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-primary" /> Cetak Surat Jalan (PDF)
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant/70 text-xs">
              Pilih salah satu surat jalan di sebelah kiri untuk melihat rincian pengiriman.
            </div>
          )}
        </div>
      </div>

      {/* PDF Simulation Modal */}
      {showPrintSj && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white text-black rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-8 space-y-6 max-h-[90vh] overflow-y-auto font-sans">
            
            {/* Header simulation */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4">
              <div>
                <h2 className="text-lg font-black tracking-wide uppercase">DISTRIBUTION CENTER (DC) ALMUBAROK</h2>
                <p className="text-[10px] text-gray-600">Jl. Raya Sukowono, Jember, Jawa Timur | Telp: 082337522221</p>
              </div>
              <div className="text-right">
                <h3 className="text-md font-bold uppercase tracking-wider">SURAT JALAN</h3>
                <span className="text-xs font-mono font-bold block mt-1">{showPrintSj.kode_pengiriman}</span>
              </div>
            </div>

            {/* General info simulator */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-600 block text-[9px] uppercase font-bold">Kirim Ke:</span>
                <strong className="text-sm font-bold uppercase">{showPrintSj.nama_cabang_tujuan}</strong>
                <p className="text-gray-600 mt-1">Sistem Distribusi Smart Replenishment</p>
              </div>
              <div className="text-right">
                <span className="text-gray-600 block text-[9px] uppercase font-bold">Detail Ekspedisi:</span>
                <p className="font-bold">Tanggal: {showPrintSj.tanggal_kirim}</p>
                <p className="mt-0.5">Armada: {showPrintSj.armada || "—"}</p>
                <p className="mt-0.5">Sopir: {showPrintSj.driver || "—"}</p>
              </div>
            </div>

            {/* Items Table simulator */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-black text-[10px] font-bold uppercase">
                  <th className="py-2 w-12">No</th>
                  <th className="py-2">Deskripsi Produk</th>
                  <th className="py-2 text-right w-32">Kuantitas Kirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {showPrintSj.items && showPrintSj.items.map((item, idx) => (
                  <tr key={item.id} className="py-2">
                    <td className="py-2 font-mono">{idx + 1}</td>
                    <td className="py-2 font-bold">{item.nama_barang}</td>
                    <td className="py-2 text-right font-mono font-bold text-sm">{item.jumlah_dikirim} {item.satuan}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signatures simulator */}
            <div className="grid grid-cols-3 gap-6 text-center text-xs pt-12">
              <div>
                <p className="text-gray-500">Penerima Cabang,</p>
                <div className="h-16" />
                <p className="border-t border-black pt-1 font-semibold uppercase">( ............................ )</p>
              </div>
              <div>
                <p className="text-gray-500">Sopir/Driver,</p>
                <div className="h-16" />
                <p className="border-t border-black pt-1 font-semibold uppercase">( {showPrintSj.driver || "............................"} )</p>
              </div>
              <div>
                <p className="text-gray-500">Petugas DC,</p>
                <div className="h-16" />
                <p className="border-t border-black pt-1 font-semibold uppercase">( Administrator DC )</p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 bg-white">
              <button
                onClick={() => setShowPrintSj(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Preview
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-black hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Mulai Cetak
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
