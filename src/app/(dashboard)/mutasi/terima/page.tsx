"use client";

import { useState, useEffect, useCallback } from "react";
import { Inbox, Eye, CheckCircle2, Search, RefreshCw, AlertTriangle, Check, BookOpen, Clock } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface ShipmentHeader {
  id_pengiriman: number;
  kode_pengiriman: string;
  id_cabang_sumber: number;
  id_cabang_tujuan: number;
  status: string;
  tanggal_kirim: string;
  tanggal_terima: string | null;
  cabang_sumber: string;
  cabang_tujuan: string;
}

interface ShipmentDetail {
  id_detail_kirim: number;
  id_barang: number;
  nama_barang: string;
  barcode: string;
  jumlah_dikirim: number;
  jumlah_diterima: number | null;
  satuan_1: string;
  catatan_penerima: string | null;
}

export default function TerimaMutasiPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [transitShipments, setTransitShipments] = useState<ShipmentHeader[]>([]);
  const [historyShipments, setHistoryShipments] = useState<ShipmentHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Details viewer
  const [viewShipment, setViewShipment] = useState<ShipmentHeader | null>(null);
  const [viewDetails, setViewDetails] = useState<ShipmentDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State: Receipt Check
  const [receiveModal, setReceiveModal] = useState<ShipmentHeader | null>(null);
  const [receiveItems, setReceiveItems] = useState<{ id_barang: number; nama_barang: string; barcode: string; qtyKirim: number; qtyTerima: number; catatan: string; unit: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resPending, resHistory] = await Promise.all([
        fetch("/api/mutasi/kirim?filter=received&status=Dikirim"),
        fetch("/api/mutasi/kirim?filter=received"),
      ]);
      setTransitShipments(await resPending.json());

      const allHistory: ShipmentHeader[] = await resHistory.json();
      setHistoryShipments(allHistory.filter((h) => h.status !== "Dikirim"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchShipmentDetails = async (shipment: ShipmentHeader) => {
    setViewShipment(shipment);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/mutasi/kirim?id=${shipment.id_pengiriman}`);
      const data = await res.json();
      setViewDetails(data.details || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenReceiveModal = async (shipment: ShipmentHeader) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mutasi/kirim?id=${shipment.id_pengiriman}`);
      const data = await res.json();
      const details: ShipmentDetail[] = data.details || [];

      // Pre-fill receive items
      const mapped = details.map((d) => ({
        id_barang: d.id_barang,
        nama_barang: d.nama_barang,
        barcode: d.barcode,
        qtyKirim: d.jumlah_dikirim,
        qtyTerima: d.jumlah_dikirim, // pre-fill equal to sent
        catatan: "",
        unit: d.satuan_1,
      }));

      setReceiveItems(mapped);
      setReceiveModal(shipment);
    } catch (e) {
      console.error(e);
      alert("Gagal memuat detail pengiriman untuk diterima.");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyTerimaChange = (idx: number, val: string) => {
    const value = parseInt(val) || 0;
    setReceiveItems((prev) => {
      const copy = [...prev];
      copy[idx].qtyTerima = value;
      return copy;
    });
  };

  const handleCatatanChange = (idx: number, val: string) => {
    setReceiveItems((prev) => {
      const copy = [...prev];
      copy[idx].catatan = val;
      return copy;
    });
  };

  const handleSaveReceipt = async () => {
    if (!receiveModal) return;
    setSaving(true);

    const items = receiveItems.map((item) => ({
      id_barang: item.id_barang,
      jumlah_diterima: item.qtyTerima,
      catatan_penerima: item.catatan,
    }));

    try {
      const res = await fetch("/api/mutasi/terima", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pengiriman: receiveModal.id_pengiriman,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReceiveModal(null);
        setReceiveItems([]);
        loadData();
      } else {
        alert("Gagal memproses penerimaan: " + data.error);
      }
    } catch {
      alert("Error memproses konfirmasi penerimaan.");
    } finally {
      setSaving(false);
    }
  };

  const filteredTransit = transitShipments.filter((t) =>
    t.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
    t.cabang_sumber.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = historyShipments.filter((h) =>
    h.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
    h.cabang_sumber.toLowerCase().includes(search.toLowerCase())
  );

  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <AlertTriangle className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk melihat halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Inbox className="w-6 h-6 text-primary" /> Terima Barang (Receiving)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Konfirmasi kedatangan pengiriman mutasi stok fisik dari cabang pengirim dan laporkan selisih.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode/pengirim..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/40 pb-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "pending"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40"
          }`}
        >
          <Clock className="w-4 h-4" /> Sedang Dikirim (In-Transit)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "history"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Riwayat Diterima
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : activeTab === "pending" ? (
          /* Transit Shipments pending receipt */
          filteredTransit.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              Tidak ada pengiriman barang masuk yang sedang di jalan.
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-2.5">Tanggal Kirim</th>
                    <th className="px-5 py-2.5">Kode Surat Jalan</th>
                    <th className="px-5 py-2.5">Cabang Pengirim</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredTransit.map((t) => (
                    <tr key={t.id_pengiriman} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs font-mono">{t.tanggal_kirim}</td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{t.kode_pengiriman}</td>
                      <td className="px-5 py-2.5 text-on-surface font-medium">{t.cabang_sumber}</td>
                      <td className="px-5 py-2.5">
                        <span className="bg-secondary/10 text-secondary border border-secondary/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {can_create && (
                          <button
                            onClick={() => handleOpenReceiveModal(t)}
                            className="bg-primary hover:bg-primary-container text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Konfirmasi Fisik
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* History received shipments */
          filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              Belum ada riwayat penerimaan mutasi barang.
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-2.5">Tanggal Terima</th>
                    <th className="px-5 py-2.5">Kode Surat Jalan</th>
                    <th className="px-5 py-2.5">Cabang Pengirim</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredHistory.map((h) => (
                    <tr key={h.id_pengiriman} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs font-mono">{h.tanggal_terima}</td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{h.kode_pengiriman}</td>
                      <td className="px-5 py-2.5 text-on-surface font-medium">{h.cabang_sumber}</td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                            h.status === "Diterima Penuh"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-error/10 text-error border-error/20"
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          onClick={() => fetchShipmentDetails(h)}
                          className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-outline-variant/20 shadow-sm transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-primary" /> Surat Jalan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* MODAL RECEIVE CONFIRMATION FORM */}
      {receiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface flex items-center gap-2">
                <Inbox className="w-5 h-5 text-primary" /> Konfirmasi Penerimaan: {receiveModal.kode_pengiriman}
              </h2>
              <button onClick={() => setReceiveModal(null)} className="text-on-surface-variant hover:text-on-surface text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Cabang Asal Pengirim</span>
                  <span className="text-on-surface font-semibold text-sm">{receiveModal.cabang_sumber}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal Pengiriman</span>
                  <span className="text-on-surface font-semibold font-mono">{receiveModal.tanggal_kirim}</span>
                </div>
              </div>

              <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/40 font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">
                  Cek & Verifikasi Jumlah Fisik
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {receiveItems.map((item, idx) => {
                    const hasDiscrepancy = item.qtyTerima !== item.qtyKirim;
                    return (
                      <div
                        key={item.id_barang}
                        className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-colors border-l-4 ${
                          hasDiscrepancy 
                            ? "bg-secondary/5 hover:bg-secondary/10 border-secondary/40 animate-pulse" 
                            : "hover:bg-surface-container-high/10 border-transparent"
                        }`}
                      >
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-on-surface font-semibold block">{item.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">{item.barcode}</span>
                          <span className="text-[10px] text-on-surface-variant block font-medium mt-1">
                            Jumlah Dikirim Pengirim: <span className="font-bold">{item.qtyKirim}</span> {item.unit}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-on-surface-variant text-[10px] font-medium font-sans">Diterima Fisik (pcs):</label>
                            <input
                              type="number"
                              value={item.qtyTerima}
                              onChange={(e) => handleQtyTerimaChange(idx, e.target.value)}
                              className={`w-16 bg-surface-container-low border text-on-surface rounded px-2 py-1 text-center font-bold text-xs font-mono focus:outline-none ${
                                hasDiscrepancy ? "border-secondary text-secondary" : "border-outline-variant"
                              }`}
                              max={item.qtyKirim}
                            />
                          </div>
                          {hasDiscrepancy && (
                            <div className="w-full">
                              <span className="text-secondary text-[10px] flex items-center gap-1 mb-1 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" /> Ada Selisih Kurang {item.qtyKirim - item.qtyTerima} pcs
                              </span>
                              <input
                                type="text"
                                value={item.catatan}
                                onChange={(e) => handleCatatanChange(idx, e.target.value)}
                                placeholder="Alasan / catatan selisih..."
                                className="w-full md:w-48 bg-surface-container-low border border-secondary/40 text-on-surface rounded px-2 py-1 text-[10px] focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end gap-3 bg-surface-container-high/40">
              <button
                onClick={() => setReceiveModal(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveReceipt}
                disabled={saving}
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {saving ? "Memproses..." : "Konfirmasi & Selesaikan Penerimaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL EYE VIEW */}
      {viewShipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Surat Jalan Pengiriman Barang</h2>
              <button onClick={() => setViewShipment(null)} className="text-on-surface-variant hover:text-on-surface text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Nomor Surat Jalan</span>
                  <span className="text-on-surface font-semibold text-sm font-mono">{viewShipment.kode_pengiriman}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Cabang Pengirim (Sumber)</span>
                  <span className="text-on-surface font-semibold">{viewShipment.cabang_sumber}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal Pengiriman</span>
                  <span className="text-on-surface font-semibold font-mono">{viewShipment.tanggal_kirim}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal Penerimaan Cabang Kita</span>
                  <span className="text-on-surface font-semibold font-mono">{viewShipment.tanggal_terima || "-"}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Status Akhir Penerimaan</span>
                  <span className="text-on-surface font-bold flex items-center gap-1 mt-0.5">
                    {viewShipment.status === "Diterima Penuh" ? (
                      <CheckCircle2 className="w-4 h-4 text-primary inline" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-error inline" />
                    )}
                    {viewShipment.status}
                  </span>
                </div>
              </div>

              <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/40 font-semibold text-on-surface-variant uppercase text-[10px]">
                  Rincian Penerimaan Fisik
                </div>
                {loadingDetails ? (
                  <div className="py-8 text-center text-on-surface-variant">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Memuat detail...
                  </div>
                ) : viewDetails.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant">Tidak ada detail barang.</div>
                ) : (
                  <div className="divide-y divide-outline-variant/20 max-h-48 overflow-y-auto">
                    {viewDetails.map((det) => (
                      <div key={det.id_detail_kirim} className="p-3.5 flex justify-between items-center hover:bg-surface-container-high/10 transition-colors">
                        <div>
                          <span className="text-on-surface font-semibold block">{det.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono block">{det.barcode}</span>
                          {det.catatan_penerima && (
                            <span className="text-secondary text-[10px] block mt-1 font-semibold">📝 Memo: &ldquo;{det.catatan_penerima}&rdquo;</span>
                          )}
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-on-surface-variant block font-sans">Kirim: {det.jumlah_dikirim} pcs</span>
                          <span className="text-on-surface font-bold block text-sm">Diterima: {det.jumlah_diterima} pcs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end bg-surface-container-high/40">
              <button
                onClick={() => setViewShipment(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl font-semibold transition-colors border border-outline-variant/20 shadow-sm"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
