"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Building2,
  Camera,
  QrCode,
  AlertCircle,
  ClipboardList,
  RefreshCw,
  Loader2,
  Clock,
} from "lucide-react";

interface ShipmentItem {
  id: number;
  id_barang: number;
  barang: string;
  barcode: string;
  qtyKirim: number;
}

interface ShipmentToCheck {
  id: number;
  kodeSj: string;
  cabangTujuan: string;
  tanggalKirim: string;
  sopir: string;
  items: ShipmentItem[];
}

interface DiscrepancyReport {
  id: number;
  kodeSj: string;
  cabang: string;
  barang: string;
  qtyKirim: number;
  qtyTerima: number;
  selisih: number;
  jenisSelisih: "KURANG" | "LEBIH" | "RUSAK" | "SALAH_BARANG";
  alasan: string;
  fotoBukti: string;
  pemeriksa: string;
  waktuPemeriksaan: string;
  status: "MENUNGGU_PEMERIKSAAN" | "DISETUJUI" | "DITOLAK";
}

export default function SelisihPengirimanPage() {
  const [activeTab, setActiveTab] = useState<"cabang" | "dc">("cabang");
  const [shipmentsToCheck, setShipmentsToCheck] = useState<ShipmentToCheck[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for checking
  const [selectedSjId, setSelectedSjId] = useState<string>("");
  const [quantitiesReceived, setQuantitiesReceived] = useState<{ [key: number]: string }>({});
  const [discrepancyTypes, setDiscrepancyTypes] = useState<{ [key: number]: string }>({});
  const [discrepancyReasons, setDiscrepancyReasons] = useState<{ [key: number]: string }>({});
  const [simulatedPhotoUploaded, setSimulatedPhotoUploaded] = useState<{ [key: number]: boolean }>({});
  
  const [pemeriksaName, setPemeriksaName] = useState("");
  const [waktuCek] = useState(new Date().toISOString().slice(0, 16).replace("T", " "));
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchQueuedShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/selisih?mode=antrian");
      const json = await res.json();
      if (json.success) {
        const mapped: ShipmentToCheck[] = (json.data || []).map((s: any) => ({
          id: s.id_pengiriman,
          kodeSj: s.kode_pengiriman,
          cabangTujuan: s.nama_cabang_tujuan || "—",
          tanggalKirim: s.tanggal_kirim,
          sopir: s.driver || "—",
          items: (s.items || []).map((i: any) => ({
            id: i.id,
            id_barang: i.id_barang,
            barang: i.nama_barang || "—",
            barcode: i.barcode || "",
            qtyKirim: i.jumlah_dikirim,
          })),
        }));
        setShipmentsToCheck(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/distribusi/selisih?mode=laporan");
      const json = await res.json();
      if (json.success) {
        const mapped: DiscrepancyReport[] = (json.data || []).map((d: any) => ({
          id: d.id,
          kodeSj: d.kode_pengiriman,
          cabang: d.nama_cabang || "—",
          barang: d.nama_barang || "—",
          qtyKirim: d.jumlah_dikirim,
          qtyTerima: d.jumlah_diterima,
          selisih: d.selisih,
          jenisSelisih: d.jenis_selisih,
          alasan: d.alasan || "—",
          fotoBukti: d.foto_bukti || "Tidak ada foto",
          pemeriksa: d.dibuat_oleh || "—",
          waktuPemeriksaan: d.created_at || "—",
          status: d.status,
        }));
        setDiscrepancies(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "cabang") {
      fetchQueuedShipments();
    } else {
      fetchReports();
    }
  }, [activeTab, fetchQueuedShipments, fetchReports]);

  // Select shipment to verify
  const currentSj = shipmentsToCheck.find((s) => s.id.toString() === selectedSjId);

  // Barcode Scanner Simulator
  const simulateBarcodeScan = (itemId: number, maxQty: number) => {
    const currentQtyVal = quantitiesReceived[itemId] || "0";
    const nextQty = Math.min(maxQty, parseInt(currentQtyVal) + 1);
    setQuantitiesReceived((prev) => ({
      ...prev,
      [itemId]: nextQty.toString(),
    }));
  };

  const handleTogglePhotoSimulation = (itemId: number) => {
    setSimulatedPhotoUploaded((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // Submit discrepancy check from branch
  const handleSubmitChecking = async () => {
    if (!currentSj) return;
    if (!pemeriksaName.trim()) {
      triggerNotification("error", "Harap masukkan nama petugas pemeriksa barang.");
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = currentSj.items.map((item) => {
        const qtyTerima = parseInt(quantitiesReceived[item.id] ?? item.qtyKirim.toString());
        const diff = item.qtyKirim - qtyTerima;

        return {
          idBarang: item.id_barang,
          jumlahDikirim: item.qtyKirim,
          jumlahDiterima: qtyTerima,
          jenisSelisih: diff !== 0 ? (discrepancyTypes[item.id] || (diff > 0 ? "KURANG" : "LEBIH")) : undefined,
          alasan: diff !== 0 ? (discrepancyReasons[item.id] || "Pengecekan fisik manual") : undefined,
          fotoBukti: diff !== 0 ? (simulatedPhotoUploaded[item.id] ? `Bukti_Foto_${item.id}.jpg` : "Tidak ada foto") : undefined,
        };
      });

      const res = await fetch("/api/distribusi/selisih", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idPengiriman: currentSj.id,
          pemeriksaName,
          items: itemsPayload,
        }),
      });

      const json = await res.json();
      if (json.success) {
        triggerNotification("success", json.message);
        setSelectedSjId("");
        setQuantitiesReceived({});
        setDiscrepancyTypes({});
        setDiscrepancyReasons({});
        setSimulatedPhotoUploaded({});
        await fetchQueuedShipments();
      } else {
        triggerNotification("error", json.message || "Gagal menyimpan hasil pemeriksaan.");
      }
    } catch {
      triggerNotification("error", "Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  // Supervisor Action
  const handleSupervisorApproval = async (id: number, approved: boolean) => {
    try {
      const res = await fetch("/api/distribusi/selisih", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved, userId: 1 }),
      });
      const json = await res.json();
      if (json.success) {
        triggerNotification("success", json.message);
        await fetchReports();
      } else {
        triggerNotification("error", json.message || "Gagal memproses persetujuan.");
      }
    } catch {
      triggerNotification("error", "Gagal menghubungi server.");
    }
  };

  return (
    <div className="flex flex-col space-y-4 text-on-background">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-secondary animate-bounce" /> Pengelolaan Selisih Pengiriman Barang
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Proses investigasi, rekonsiliasi, dan persetujuan barang selisih (kurang, lebih, rusak, salah barang) per pengiriman.
          </p>
        </div>
        <button
          onClick={activeTab === "cabang" ? fetchQueuedShipments : fetchReports}
          disabled={loading}
          className="bg-surface hover:bg-surface-container-high border border-outline-variant/60 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/40 shrink-0">
        <button
          onClick={() => setActiveTab("cabang")}
          className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "cabang"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Building2 className="w-4 h-4" /> Pemeriksaan Cabang (Penerimaan)
        </button>
        <button
          onClick={() => setActiveTab("dc")}
          className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "dc"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Truck className="w-4 h-4" /> Persetujuan Gudang Pusat (DC)
          {discrepancies.filter((d) => d.status === "MENUNGGU_PEMERIKSAAN").length > 0 && (
            <span className="bg-error text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {discrepancies.filter((d) => d.status === "MENUNGGU_PEMERIKSAAN").length}
            </span>
          )}
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 border rounded-2xl animate-in fade-in duration-200 shrink-0 ${
            notification.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs font-semibold">{notification.message}</div>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "cabang" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Form Pengecekan Barang (Col Span 2) */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-primary" /> Formulir Pemeriksaan Fisik Barang
              </h3>
              <span className="text-[10px] text-on-surface-variant font-semibold">Cabang Penerima</span>
            </div>

            {loading && shipmentsToCheck.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                Memuat antrian pengecekan...
              </div>
            ) : (
              <>
                {/* Select Surat Jalan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Pilih Surat Jalan Diterima *</label>
                    <select
                      value={selectedSjId}
                      onChange={(e) => setSelectedSjId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                    >
                      <option value="">-- Pilih Surat Jalan --</option>
                      {shipmentsToCheck.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.kodeSj} - {s.cabangTujuan} (Sopir: {s.sopir})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nama Petugas Peneriksa *</label>
                    <input
                      type="text"
                      placeholder="Nama lengkap Anda..."
                      value={pemeriksaName}
                      onChange={(e) => setPemeriksaName(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {currentSj ? (
                  <div className="space-y-4 pt-2">
                    <div className="bg-surface-container-low p-3.5 border border-outline-variant/20 rounded-xl grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="font-sans">
                        <span className="text-on-surface-variant block">Surat Jalan:</span>
                        <strong className="text-on-surface font-mono">{currentSj.kodeSj}</strong>
                      </div>
                      <div className="font-sans">
                        <span className="text-on-surface-variant block">Sopir Armada:</span>
                        <strong className="text-on-surface font-sans">{currentSj.sopir}</strong>
                      </div>
                      <div className="font-sans">
                        <span className="text-on-surface-variant block">Tanggal Kirim:</span>
                        <strong className="text-on-surface font-mono">{currentSj.tanggalKirim}</strong>
                      </div>
                      <div className="font-sans">
                        <span className="text-on-surface-variant block">Status Sementara:</span>
                        <strong className="text-warning flex items-center gap-1 font-sans">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Diterima Sementara
                        </strong>
                      </div>
                    </div>

                    {/* Items Checker Table */}
                    <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-container-low border-b border-outline-variant/40">
                          <tr>
                            <th className="px-4 py-2.5">Nama Barang / Barcode</th>
                            <th className="px-4 py-2.5 text-right w-24">Jumlah Dokumen</th>
                            <th className="px-4 py-2.5 text-right w-40">Jumlah Diterima (Fisik)</th>
                            <th className="px-4 py-2.5 w-36">Tipe Selisih</th>
                            <th className="px-4 py-2.5">Bukti Foto & Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                          {currentSj.items.map((item) => {
                            const qtyKirim = item.qtyKirim;
                            const qtyTerima = parseInt(quantitiesReceived[item.id] ?? qtyKirim.toString());
                            const diff = qtyKirim - qtyTerima;
                            const isDiscrepant = diff !== 0;

                            return (
                              <tr key={item.id} className={`hover:bg-surface-container-high/10 transition-colors ${isDiscrepant ? "bg-error/[0.02]" : ""}`}>
                                <td className="px-4 py-3">
                                  <span className="font-semibold block">{item.barang}</span>
                                  <span className="text-[10px] text-on-surface-variant font-mono">{item.barcode}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-semibold">{qtyKirim} pcs</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => simulateBarcodeScan(item.id, qtyKirim)}
                                      className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                      title="Simulasikan Scan Barcode"
                                    >
                                      <QrCode className="w-3.5 h-3.5" /> Scan
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={quantitiesReceived[item.id] ?? qtyKirim}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setQuantitiesReceived((prev) => ({ ...prev, [item.id]: val }));
                                      }}
                                      className="w-16 bg-surface-container border border-outline text-on-surface rounded px-1.5 py-1 text-center font-bold font-mono"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {isDiscrepant ? (
                                    <select
                                      value={discrepancyTypes[item.id] ?? (diff > 0 ? "KURANG" : "LEBIH")}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDiscrepancyTypes((prev) => ({ ...prev, [item.id]: val }));
                                      }}
                                      className="bg-surface border border-outline text-on-surface rounded px-1.5 py-1 text-[10px] font-bold focus:outline-none cursor-pointer text-error border-error/40"
                                    >
                                      <option value="KURANG">KURANG (Hilang)</option>
                                      <option value="LEBIH">LEBIH (Kelebihan)</option>
                                      <option value="RUSAK">RUSAK / CACAT</option>
                                      <option value="SALAH_BARANG">SALAH BARANG</option>
                                    </select>
                                  ) : (
                                    <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" /> Sesuai
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {isDiscrepant ? (
                                    <div className="space-y-1.5">
                                      <button
                                        onClick={() => handleTogglePhotoSimulation(item.id)}
                                        className={`flex items-center justify-center gap-1 border px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                          simulatedPhotoUploaded[item.id]
                                            ? "bg-success/10 text-success border-success/30"
                                            : "bg-surface hover:bg-surface-container-high text-on-surface-variant border-outline-variant"
                                        }`}
                                      >
                                        <Camera className="w-3.5 h-3.5" />
                                        {simulatedPhotoUploaded[item.id] ? "Foto Bukti Terunggah" : "Simulasikan Foto Bukti"}
                                      </button>
                                      <input
                                        type="text"
                                        placeholder="Catatan alasan selisih..."
                                        value={discrepancyReasons[item.id] ?? ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setDiscrepancyReasons((prev) => ({ ...prev, [item.id]: val }));
                                        }}
                                        className="w-full bg-surface border border-outline-variant text-on-surface rounded px-2 py-1 text-[10px] focus:outline-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-on-surface-variant text-[10px]">Tdk ada laporan</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Submit button */}
                    <div className="flex justify-end pt-3">
                      <button
                        disabled={submitting}
                        onClick={handleSubmitChecking}
                        className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Simpan Hasil Pengecekan Cabang
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-on-surface-variant text-xs">
                    Pilih surat jalan terlebih dahulu untuk melakukan pengisian pengecekan fisik barang.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panduan Alur Pengecekan (Side Panel) */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col h-fit space-y-4">
            <div className="border-b border-outline-variant/20 pb-2">
              <h3 className="font-bold text-on-surface text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Panduan Pengecekan
              </h3>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-3 relative items-start">
                <span className="w-5 h-5 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <strong className="text-on-surface">Hitung & Verifikasi Fisik</strong>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Bandingkan jumlah barang yang diterima dengan angka dokumen.</p>
                </div>
              </div>

              <div className="flex gap-3 relative items-start">
                <span className="w-5 h-5 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <strong className="text-on-surface">Pindai Barcode (Opsional)</strong>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Gunakan tombol <strong>Scan</strong> untuk simulasi verifikasi barcode yang lebih akurat.</p>
                </div>
              </div>

              <div className="flex gap-3 relative items-start">
                <span className="w-5 h-5 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div>
                  <strong className="text-on-surface">Lampirkan Foto & Alasan</strong>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Jika terjadi selisih, wajib mengunggah foto bukti fisik/surat jalan untuk supervisor DC.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Persetujuan Gudang Pusat (DC) */
        <div className="flex flex-col space-y-4 flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 shrink-0">
            <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-primary" /> Daftar Kasus Selisih Pengiriman
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Supervisor Investigasi DC</span>
          </div>

          <div className="overflow-auto flex-1 min-h-0">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-xs text-on-surface-variant">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                Memuat laporan selisih...
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold">
                    <th className="px-4 py-2.5">Detail Kasus</th>
                    <th className="px-4 py-2.5">Barang</th>
                    <th className="px-4 py-2.5 text-right">Qty Kirim</th>
                    <th className="px-4 py-2.5 text-right">Qty Terima</th>
                    <th className="px-4 py-2.5 text-right">Selisih</th>
                    <th className="px-4 py-2.5">Jenis / Alasan</th>
                    <th className="px-4 py-2.5">Pemeriksa / Bukti</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right w-44">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                  {discrepancies.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                        Tidak ada kasus selisih yang dilaporkan. Semua transaksi bersih.
                      </td>
                    </tr>
                  ) : (
                    discrepancies.map((caseReport) => (
                      <tr key={caseReport.id} className="hover:bg-surface-container-high/15 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-on-surface block font-mono">{caseReport.kodeSj}</span>
                          <span className="text-[10px] text-primary font-bold block">{caseReport.cabang}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{caseReport.barang}</td>
                        <td className="px-4 py-3 text-right font-mono">{caseReport.qtyKirim} pcs</td>
                        <td className="px-4 py-3 text-right font-mono">{caseReport.qtyTerima} pcs</td>
                        <td className="px-4 py-3 text-right font-mono text-error font-extrabold">-{caseReport.selisih} pcs</td>
                        <td className="px-4 py-3">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-error/15 text-error block w-max uppercase mb-1">
                            {caseReport.jenisSelisih}
                          </span>
                          <span className="text-[10px] text-on-surface-variant block">{caseReport.alasan}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-on-surface-variant block">Petugas: <strong>{caseReport.pemeriksa}</strong></span>
                          <span className="text-[9px] text-primary block hover:underline cursor-pointer">{caseReport.fotoBukti}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            caseReport.status === "MENUNGGU_PEMERIKSAAN"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : caseReport.status === "DISETUJUI"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-error/10 text-error border-error/20"
                          }`}>
                            {caseReport.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {caseReport.status === "MENUNGGU_PEMERIKSAAN" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSupervisorApproval(caseReport.id, true)}
                                className="bg-success/15 hover:bg-success/25 text-success px-2.5 py-1.5 rounded-lg font-bold border border-success/10 cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Setuju
                              </button>
                              <button
                                onClick={() => handleSupervisorApproval(caseReport.id, false)}
                                className="bg-error/15 hover:bg-error/25 text-error px-2.5 py-1.5 rounded-lg font-bold border border-error/10 cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant font-medium italic">Selesai diperiksa</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
