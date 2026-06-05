"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Eye, FileText, Plus, Search, RefreshCw, Trash2, ArrowRightLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface RequestHeader {
  id_request: number;
  kode_request: string;
  id_cabang_peminta: number;
  id_cabang_sumber: number;
  status: string;
  tanggal_request: string;
  cabang_peminta: string;
  cabang_sumber: string;
}

interface RequestDetail {
  id: number;
  id_barang: number;
  nama_barang: string;
  barcode: string;
  jumlah_diminta: number;
  status_item: string;
  satuan_1: string;
}

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

interface Branch {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
}

interface Product {
  id_barang: number;
  barcode: string;
  nama_barang: string;
  satuan_1: string;
  satuan_2: string | null;
  satuan_3: string | null;
  isi_1: number;
  isi_2: number | null;
  isi_3: number | null;
  stok_akhir?: number; // sender's current stock
}

export default function KirimMutasiPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [activeTab, setActiveTab] = useState<"incoming" | "history">("incoming");
  const [incomingRequests, setIncomingRequests] = useState<RequestHeader[]>([]);
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHeader[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Details viewer
  const [viewShipment, setViewShipment] = useState<ShipmentHeader | null>(null);
  const [viewDetails, setViewDetails] = useState<ShipmentDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State: Fulfillment
  const [fulfillModal, setFulfillModal] = useState<RequestHeader | null>(null);
  const [fulfillItems, setFulfillItems] = useState<{ id_request_detail: number; product: Product; qtyDiminta: number; qtyKirim: number; unit: string }[]>([]);

  // Form State: Direct shipment
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [targetCabangId, setTargetCabangId] = useState("");
  const [directBasket, setDirectBasket] = useState<{ product: Product; qty: number; unit: string }[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resIncoming, resHistory, resBranches] = await Promise.all([
        fetch("/api/mutasi/request?filter=incoming&status=Pending"),
        fetch("/api/mutasi/kirim?filter=sent"),
        fetch("/api/cabang"),
      ]);
      setIncomingRequests(await resIncoming.json());
      setShipmentHistory(await resHistory.json());
      setBranches(await resBranches.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Autocomplete
  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setProducts([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetch(`/api/barang?q=${encodeURIComponent(productSearch)}`);
        const list = await res.json();

        // Also fetch current sender branch stock for each found item
        const listWithStok = await Promise.all(
          list.map(async (p: Product) => {
            const resStok = await fetch(`/api/stok?id_barang=${p.id_barang}`);
            const dataStok = await resStok.json();
            return { ...p, stok_akhir: dataStok.stok_akhir || 0 };
          })
        );

        setProducts(listWithStok.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [productSearch]);

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

  const handleOpenFulfillModal = async (req: RequestHeader) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mutasi/request?id=${req.id_request}`);
      const data = await res.json();
      const details: RequestDetail[] = data.details || [];

      // Map to items list with stock checks
      const mappedItems = await Promise.all(
        details.map(async (d) => {
          // Get product detail
          const resProd = await fetch(`/api/barang?q=${encodeURIComponent(d.nama_barang)}`);
          const plist: Product[] = await resProd.json();
          const p = plist.find((prod) => prod.id_barang === d.id_barang) || {
            id_barang: d.id_barang,
            barcode: d.barcode,
            nama_barang: d.nama_barang,
            satuan_1: d.satuan_1,
            satuan_2: null,
            satuan_3: null,
            isi_1: 1,
            isi_2: null,
            isi_3: null,
          };

          // Get sender's stock
          const resStok = await fetch(`/api/stok?id_barang=${d.id_barang}`);
          const dataStok = await resStok.json();
          const stokAkhir = dataStok.stok_akhir || 0;

          return {
            id_request_detail: d.id,
            product: { ...p, stok_akhir: stokAkhir },
            qtyDiminta: d.jumlah_diminta,
            qtyKirim: d.jumlah_diminta, // default to send full quantity
            unit: d.satuan_1,
          };
        })
      );

      setFulfillItems(mappedItems);
      setFulfillModal(req);
    } catch (e) {
      console.error(e);
      alert("Gagal memuat detail permintaan");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyFulfillChange = (idx: number, val: string) => {
    const value = parseInt(val) || 0;
    setFulfillItems((prev) => {
      const copy = [...prev];
      copy[idx].qtyKirim = value;
      return copy;
    });
  };

  const handleSaveFulfillment = async () => {
    if (!fulfillModal) return;
    setSaving(true);

    const items = fulfillItems.map((item) => ({
      id_barang: item.product.id_barang,
      shadow_kirim: item.qtyKirim, // wait, payload key is jumlah_dikirim or something
      jumlah_dikirim: item.qtyKirim,
      id_request_detail: item.id_request_detail,
    }));

    try {
      const res = await fetch("/api/mutasi/kirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cabang_tujuan: fulfillModal.id_cabang_peminta,
          id_request: fulfillModal.id_request,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFulfillModal(null);
        setFulfillItems([]);
        loadData();
      } else {
        alert("Gagal menyimpan pengiriman: " + data.error);
      }
    } catch {
      alert("Error memproses pengiriman stok.");
    } finally {
      setSaving(false);
    }
  };

  // Direct Basket actions
  const handleAddToDirectBasket = (p: Product) => {
    if (directBasket.some((item) => item.product.id_barang === p.id_barang)) {
      alert("Barang sudah ada di keranjang.");
      return;
    }
    setDirectBasket((prev) => [...prev, { product: p, qty: 1, unit: p.satuan_1 }]);
    setProductSearch("");
    setProducts([]);
  };

  const handleDirectQtyChange = (idx: number, val: string) => {
    const value = parseInt(val) || 0;
    setDirectBasket((prev) => {
      const copy = [...prev];
      copy[idx].qty = value;
      return copy;
    });
  };

  const handleDirectUnitChange = (idx: number, unit: string) => {
    setDirectBasket((prev) => {
      const copy = [...prev];
      copy[idx].unit = unit;
      return copy;
    });
  };

  const handleRemoveFromDirectBasket = (idx: number) => {
    setDirectBasket((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveDirectShipment = async () => {
    if (!targetCabangId) {
      alert("Pilih cabang tujuan terlebih dahulu.");
      return;
    }
    if (directBasket.length === 0) {
      alert("Keranjang pengiriman masih kosong.");
      return;
    }
    setSaving(true);

    const items = directBasket.map((item) => {
      const p = item.product;
      let conversion = 1;
      if (item.unit === p.satuan_2 && p.isi_2) conversion = p.isi_2;
      if (item.unit === p.satuan_3 && p.isi_3) conversion = p.isi_3;

      return {
        id_barang: p.id_barang,
        jumlah_dikirim: item.qty * conversion,
      };
    });

    try {
      const res = await fetch("/api/mutasi/kirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cabang_tujuan: parseInt(targetCabangId),
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowDirectModal(false);
        setDirectBasket([]);
        setTargetCabangId("");
        loadData();
      } else {
        alert("Gagal melakukan pengiriman langsung: " + data.error);
      }
    } catch {
      alert("Error memproses pengiriman langsung.");
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = incomingRequests.filter((r) =>
    r.kode_request.toLowerCase().includes(search.toLowerCase()) ||
    r.cabang_peminta.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = shipmentHistory.filter((h) =>
    h.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
    h.cabang_tujuan.toLowerCase().includes(search.toLowerCase())
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
            <Send className="w-6 h-6 text-primary" /> Kirim Barang (Dispatch)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Fulfill permintaan masuk dari cabang retail atau kirim barang langsung untuk mutasi stok.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode/cabang..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {can_create && (
            <button
              onClick={() => setShowDirectModal(true)}
              className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all flex-shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Kirim Langsung
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/40 pb-2">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "incoming"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Permintaan Masuk
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "history"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40"
          }`}
        >
          <FileText className="w-4 h-4" /> Riwayat Surat Jalan (Kirim)
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : activeTab === "incoming" ? (
          /* Incoming Requests */
          filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              Tidak ada permintaan barang masuk yang pending.
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-2.5">Tanggal</th>
                    <th className="px-5 py-2.5">Kode Permintaan</th>
                    <th className="px-5 py-2.5">Cabang Peminta</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredRequests.map((r) => (
                    <tr key={r.id_request} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs font-mono">{r.tanggal_request}</td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{r.kode_request}</td>
                      <td className="px-5 py-2.5 text-on-surface font-medium">{r.cabang_peminta}</td>
                      <td className="px-5 py-2.5">
                        <span className="bg-secondary/10 text-secondary border border-secondary/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {can_create && (
                          <button
                            onClick={() => handleOpenFulfillModal(r)}
                            className="bg-primary hover:bg-primary-container text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Proses Kirim
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
          /* History logs */
          filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              Belum ada riwayat pengiriman mutasi stok.
            </div>
          ) : (
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-5 py-2.5">Tanggal Kirim</th>
                    <th className="px-5 py-2.5">Kode Surat Jalan</th>
                    <th className="px-5 py-2.5">Cabang Tujuan</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredHistory.map((h) => (
                    <tr key={h.id_pengiriman} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs font-mono">{h.tanggal_kirim}</td>
                      <td className="px-5 py-2.5 text-on-surface font-semibold">{h.kode_pengiriman}</td>
                      <td className="px-5 py-2.5 text-on-surface font-medium">{h.cabang_tujuan}</td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                            h.status === "Diterima Penuh"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : h.status === "Ada Selisih"
                              ? "bg-error/10 text-error border-error/20"
                              : "bg-secondary/10 text-secondary border-secondary/20"
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          onClick={() => fetchShipmentDetails(h)}
                          className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-outline-variant/20 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" /> Surat Jalan
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

      {/* MODAL FULFILLMENT FORM */}
      {fulfillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Proses Mutasi: {fulfillModal.kode_request}
              </h2>
              <button onClick={() => setFulfillModal(null)} className="text-on-surface-variant hover:text-on-surface text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Cabang Peminta</span>
                  <span className="text-on-surface font-semibold text-sm">{fulfillModal.cabang_peminta}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal Permintaan</span>
                  <span className="text-on-surface font-semibold font-mono">{fulfillModal.tanggal_request}</span>
                </div>
              </div>

              <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 font-semibold text-on-surface-variant uppercase tracking-wider text-[10px] border-b border-outline-variant/40">
                  Daftar Fulfillment Permintaan
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {fulfillItems.map((item, idx) => {
                    const isInsufficient = (item.product.stok_akhir || 0) < item.qtyKirim;
                    return (
                      <div key={item.product.id_barang} className="p-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 hover:bg-surface-container-high/10 transition-colors">
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-on-surface font-semibold block">{item.product.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">{item.product.barcode}</span>
                          <span className="text-[10px] text-primary block font-semibold">
                            Tersedia di Gudang Kita: {item.product.stok_akhir || 0} {item.product.satuan_1}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-on-surface-variant block text-[10px] font-medium font-sans">Diminta: {item.qtyDiminta} pcs</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <label className="text-on-surface-variant text-[10px] font-medium font-sans">Kirim (pcs):</label>
                            <input
                              type="number"
                              value={item.qtyKirim}
                              onChange={(e) => handleQtyFulfillChange(idx, e.target.value)}
                              className={`w-16 bg-surface-container-low border text-on-surface rounded px-2 py-1 text-center font-bold text-xs font-mono focus:outline-none ${
                                isInsufficient ? "border-error text-error" : "border-outline-variant"
                              }`}
                            />
                          </div>
                          {isInsufficient && (
                            <span className="text-error text-[9px] block mt-1 font-semibold">⚠️ Stok kita kurang!</span>
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
                onClick={() => setFulfillModal(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveFulfillment}
                disabled={saving}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {saving ? "Menyimpan..." : "Kirim Barang & Cetak Surat Jalan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIRECT SHIPMENT FORM */}
      {showDirectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Pengiriman Langsung (Direct Dispatch)
              </h2>
              <button onClick={() => setShowDirectModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant mb-1.5 font-semibold">Cabang Tujuan *</label>
                  <select
                    value={targetCabangId}
                    onChange={(e) => setTargetCabangId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih Cabang Penerima --</option>
                    {branches.map((b) => (
                      <option key={b.id_cabang} value={b.id_cabang} className="bg-surface text-on-surface">
                        {b.nama_cabang} ({b.kode_cabang})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1.5 font-semibold">Tanggal Kirim *</label>
                  <input
                    type="text"
                    value={new Date().toISOString().slice(0, 10)}
                    disabled
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface-variant/70 rounded-lg px-3 py-2 text-xs focus:outline-none cursor-not-allowed font-mono opacity-80"
                  />
                </div>
              </div>

              {/* Product Autocomplete */}
              <div className="relative">
                <label className="block text-on-surface-variant mb-1.5 font-semibold">Cari & Tambah Produk *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Ketik barcode atau nama barang..."
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searchingProducts && (
                    <RefreshCw className="absolute right-3 top-3 w-4 h-4 text-on-surface-variant animate-spin" />
                  )}
                </div>

                {products.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-outline-variant/30 max-h-48 overflow-y-auto">
                    {products.map((p) => (
                      <button
                        key={p.id_barang}
                        type="button"
                        onClick={() => handleAddToDirectBasket(p)}
                        className="w-full px-4 py-2.5 text-left text-on-surface hover:bg-surface-container-high flex justify-between items-center transition-colors font-sans"
                      >
                        <div>
                          <span className="font-semibold block">{p.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">Stok kita: {p.stok_akhir || 0} {p.satuan_1} | {p.barcode}</span>
                        </div>
                        <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded uppercase font-semibold">
                          {p.satuan_1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid basket */}
              <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 text-on-surface-variant font-semibold border-b border-outline-variant/40 uppercase tracking-wider text-[10px]">
                  Keranjang Pengiriman Langsung
                </div>
                {directBasket.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant">Belum ada barang dipilih.</div>
                ) : (
                  <div className="divide-y divide-outline-variant/20">
                    {directBasket.map((item, idx) => {
                      const p = item.product;
                      let conversion = 1;
                      if (item.unit === p.satuan_2 && p.isi_2) conversion = p.isi_2;
                      if (item.unit === p.satuan_3 && p.isi_3) conversion = p.isi_3;

                      const isInsufficient = (p.stok_akhir || 0) < (item.qty * conversion);

                      return (
                        <div key={p.id_barang} className="p-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 hover:bg-surface-container-high/10 transition-colors">
                          <div className="flex-1 min-w-[200px]">
                            <span className="font-semibold text-on-surface block">{p.nama_barang}</span>
                            <span className="text-[10px] text-on-surface-variant font-mono">{p.barcode}</span>
                            <span className="text-[10px] text-primary block font-semibold">Stok kita: {p.stok_akhir || 0} {p.satuan_1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleDirectQtyChange(idx, e.target.value)}
                              className={`w-16 bg-surface-container border text-on-surface rounded px-2 py-1 text-center font-bold font-mono focus:outline-none ${
                                isInsufficient ? "border-error text-error" : "border-outline-variant"
                              }`}
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => handleDirectUnitChange(idx, e.target.value)}
                              className="bg-surface-container border border-outline-variant text-on-surface rounded px-1.5 py-1"
                            >
                              <option value={p.satuan_1} className="bg-surface text-on-surface">{p.satuan_1}</option>
                              {p.satuan_2 && (
                                <option value={p.satuan_2} className="bg-surface text-on-surface">
                                  {p.satuan_2} (x{p.isi_2})
                                </option>
                              )}
                              {p.satuan_3 && (
                                <option value={p.satuan_3} className="bg-surface text-on-surface">
                                  {p.satuan_3} (x{p.isi_3})
                                </option>
                              )}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromDirectBasket(idx)}
                            className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end gap-3 bg-surface-container-high/40">
              <button
                onClick={() => setShowDirectModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDirectShipment}
                disabled={saving || directBasket.length === 0}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {saving ? "Mengirim..." : "Kirim Barang & Cetak Surat Jalan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG VIEW MODAL: SURAT JALAN */}
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
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal Kirim</span>
                  <span className="text-on-surface font-semibold font-mono">{viewShipment.tanggal_kirim}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Cabang Pengirim (Sumber)</span>
                  <span className="text-on-surface font-semibold">{viewShipment.cabang_sumber}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Cabang Penerima (Tujuan)</span>
                  <span className="text-primary font-bold">{viewShipment.cabang_tujuan}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Status Pengiriman</span>
                  <span className="text-on-surface font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                    {viewShipment.status === "Diterima Penuh" ? (
                      <CheckCircle className="w-4 h-4 text-primary inline" />
                    ) : (
                      <Clock className="w-4 h-4 text-secondary inline" />
                    )}
                    {viewShipment.status}
                  </span>
                </div>
              </div>

              <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/40 font-semibold text-on-surface-variant uppercase text-[10px]">
                  Daftar Barang Dikirim
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
                      <div key={det.id_detail_kirim} className="p-3 flex justify-between items-center hover:bg-surface-container-high/10 transition-colors">
                        <div>
                          <span className="text-on-surface font-semibold block">{det.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono block">{det.barcode}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-on-surface font-bold block">Kirim: {det.jumlah_dikirim} pcs</span>
                          <span className="text-[10px] text-on-surface-variant font-semibold block">
                            Diterima: {det.jumlah_diterima !== null ? `${det.jumlah_diterima} pcs` : "-"}
                          </span>
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
