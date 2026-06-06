"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  MapPin,
  TrendingUp,
  Compass,
  Truck,
  Loader2,
} from "lucide-react";

interface ActiveDelivery {
  id: number;
  kodeSj: string;
  cabangTujuan: string;
  sopir: string;
  kendaraan: string;
  posisiSaatIni: string;
  jarakKm: number;
  etaMenit: number;
  statusKirim: string;
  progressPercent: number;
}

interface ServiceLevel {
  cabang: string;
  totalOrder: number;
  fulfilledOrder: number;
  serviceLevelPercent: number;
}

export default function MonitoringDistribusiPage() {
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<ActiveDelivery | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/monitoring");
      const json = await res.json();
      if (json.success) {
        // Map service level
        setServiceLevel(json.serviceLevel || []);

        // Map active shipments and inject GPS simulation fields
        const mapped: ActiveDelivery[] = (json.activeShipments || []).map((s: any) => {
          let pos = "Gudang DC";
          let progress = 10;
          let distance = 8.5;
          let eta = 25;

          if (s.status === "Pengambilan Barang") {
            pos = "Gudang DC (Proses Dimuat)";
            progress = 25;
            distance = 10.0;
            eta = 30;
          } else if (s.status === "Pengepakan") {
            pos = "Gudang DC (Selesai Pengepakan)";
            progress = 40;
            distance = 10.0;
            eta = 30;
          } else if (s.status === "Dalam Perjalanan") {
            pos = "Jalan Raya (Menuju Cabang)";
            progress = 70;
            distance = 4.8;
            eta = 12;
          } else if (s.status === "Diterima Sementara" || s.status === "Sedang Dicek") {
            pos = `Cabang ${s.nama_cabang_tujuan} (Proses Bongkar)`;
            progress = 90;
            distance = 0.1;
            eta = 1;
          }

          return {
            id: s.id_pengiriman,
            kodeSj: s.kode_pengiriman,
            cabangTujuan: s.nama_cabang_tujuan || "—",
            sopir: s.driver || "Driver DC",
            kendaraan: s.armada || "L300",
            posisiSaatIni: pos,
            jarakKm: distance,
            etaMenit: eta,
            statusKirim: s.status,
            progressPercent: progress,
          };
        });

        setDeliveries(mapped);
        if (mapped.length > 0) {
          setSelectedDelivery(mapped[0]);
        } else {
          setSelectedDelivery(null);
        }
      }
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Simulate GPS updating every 4 seconds for "Dalam Perjalanan" deliveries
  useEffect(() => {
    const timer = setInterval(() => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.statusKirim === "Dalam Perjalanan" && d.jarakKm > 0.2) {
            const nextJarak = parseFloat((d.jarakKm - 0.2).toFixed(1));
            const nextEta = Math.max(1, d.etaMenit - 1);
            return {
              ...d,
              jarakKm: nextJarak,
              etaMenit: nextEta,
              progressPercent: Math.min(95, d.progressPercent + 2),
              posisiSaatIni: nextJarak <= 1.0 ? `Mendekati ${d.cabangTujuan}` : "Jalan Raya (Menuju Cabang)",
            };
          }
          return d;
        })
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col space-y-4 text-on-background">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" /> Pemantauan Distribusi & Tingkat Pemenuhan Stok
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Lacak secara langsung posisi pengiriman barang DC (simulasi GPS) dan evaluasi pemenuhan kebutuhan stok cabang (tingkat pemenuhan stok/service level).
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-surface hover:bg-surface-container-high border border-outline-variant/60 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Deliveries List (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4.5 h-4.5 text-primary" /> Pengiriman DC Aktif (GPS Waktu Nyata)
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full animate-pulse">
                LANGSUNG
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-xs text-on-surface-variant">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                Memuat data GPS...
              </div>
            ) : deliveries.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-xs">
                Tidak ada pengiriman DC yang sedang aktif/dalam perjalanan saat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveries.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDelivery(d)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedDelivery?.id === d.id
                        ? "border-primary bg-primary/[0.02] ring-1 ring-primary/20 shadow-md"
                        : "border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-on-surface text-xs font-mono">{d.kodeSj}</span>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5 font-bold uppercase">{d.cabangTujuan}</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                        {d.statusKirim}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-on-surface-variant">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Posisi: <strong>{d.posisiSaatIni}</strong></span>
                      </div>
                      {d.statusKirim === "Dalam Perjalanan" && (
                        <div className="flex justify-between text-[10px] font-mono mt-1">
                          <span>Jarak: {d.jarakKm} km lagi</span>
                          <span>ETA: {d.etaMenit} menit</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-primary"
                          style={{ width: `${d.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Level Table */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-success" /> Tingkat Pemenuhan Stok Cabang (Service Level)
              </h3>
              <span className="text-xs text-on-surface-variant font-medium">Evaluasi 30 Hari Terakhir</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold">
                    <th className="px-4 py-2.5">Nama Cabang</th>
                    <th className="px-4 py-2.5 text-right">Total Permintaan Item</th>
                    <th className="px-4 py-2.5 text-right">Item Terpenuhi (DC)</th>
                    <th className="px-4 py-2.5 text-right">Tingkat Pemenuhan (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-on-surface-variant">
                        Memuat data pemenuhan...
                      </td>
                    </tr>
                  ) : serviceLevel.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-on-surface-variant">
                        Tidak ada data pemenuhan pengiriman 30 hari terakhir.
                      </td>
                    </tr>
                  ) : (
                    serviceLevel.map((sl, index) => (
                      <tr key={index} className="hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">{sl.cabang}</td>
                        <td className="px-4 py-3 text-right font-mono">{sl.totalOrder} SKU</td>
                        <td className="px-4 py-3 text-right font-mono">{sl.fulfilledOrder} SKU</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sl.serviceLevelPercent >= 95
                              ? "bg-success/10 text-success border border-success/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}>
                            {sl.serviceLevelPercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Selected Shipment GPS Timeline detail (Side Panel) */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col h-fit">
          {selectedDelivery ? (
            <div className="space-y-4">
              <div className="border-b border-outline-variant/20 pb-3">
                <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Detail Pelacakan GPS
                </h3>
                <span className="text-[10px] font-mono text-on-surface-variant block mt-1">{selectedDelivery.kodeSj}</span>
              </div>

              {/* Driver info card */}
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Sopir / Armada:</span>
                  <strong className="text-on-surface">{selectedDelivery.sopir}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kendaraan:</span>
                  <strong className="text-on-surface font-mono">{selectedDelivery.kendaraan}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status Kiriman:</span>
                  <strong className="text-primary">{selectedDelivery.statusKirim}</strong>
                </div>
              </div>

              {/* Vertical Timeline simulator */}
              <div className="space-y-4 text-xs pl-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                
                {/* Step 1: Dibuat */}
                <div className="flex gap-3 relative items-start">
                  <div className="w-3.5 h-3.5 rounded-full bg-success border-2 border-white z-10 flex items-center justify-center shadow-sm" />
                  <div>
                    <span className="font-bold text-on-surface">Surat Jalan Terbit</span>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Dibuat otomatis oleh Smart Replenishment</p>
                  </div>
                </div>

                {/* Step 2: Picking */}
                <div className="flex gap-3 relative items-start">
                  <div className="w-3.5 h-3.5 rounded-full bg-success border-2 border-white z-10 flex items-center justify-center shadow-sm" />
                  <div>
                    <span className="font-bold text-on-surface">Pengambilan & Pengemasan</span>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Barang dimuat ke armada kendaraan</p>
                  </div>
                </div>

                {/* Step 3: Transit */}
                <div className="flex gap-3 relative items-start">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 flex items-center justify-center shadow-sm ${
                    selectedDelivery.statusKirim === "Dalam Perjalanan"
                      ? "bg-primary animate-ping"
                      : "bg-success"
                  }`} />
                  <div>
                    <span className="font-bold text-on-surface">Dalam Perjalanan</span>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Menuju {selectedDelivery.cabangTujuan}</p>
                    {selectedDelivery.statusKirim === "Dalam Perjalanan" && (
                      <span className="text-[9px] text-primary font-bold block mt-0.5 font-mono">
                        📍 Posisi: {selectedDelivery.posisiSaatIni} ({selectedDelivery.jarakKm} km lagi)
                      </span>
                    )}
                  </div>
                </div>

                {/* Step 4: Arrive */}
                <div className="flex gap-3 relative items-start">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 flex items-center justify-center shadow-sm ${
                    ["Diterima Sementara", "Sedang Dicek"].includes(selectedDelivery.statusKirim)
                      ? "bg-warning animate-pulse"
                      : ["Diterima Lengkap", "Ada Selisih", "Selesai"].includes(selectedDelivery.statusKirim)
                      ? "bg-success"
                      : "bg-surface-container-high"
                  }`} />
                  <div>
                    <span className="font-bold text-on-surface">Bongkar Muat</span>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Pembongkaran & verifikasi item fisik cabang</p>
                  </div>
                </div>

                {/* Step 5: Complete */}
                <div className="flex gap-3 relative items-start">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 flex items-center justify-center shadow-sm ${
                    ["Diterima Lengkap", "Ada Selisih", "Selesai"].includes(selectedDelivery.statusKirim) ? "bg-success" : "bg-surface-container-high"
                  }`} />
                  <div>
                    <span className="font-bold text-on-surface">Selesai (Diterima)</span>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Stok ter-update otomatis di inventaris Cabang</p>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-on-surface-variant/70 text-xs">
              Pilih salah satu surat jalan di sebelah kiri untuk melihat rincian lacak GPS.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
