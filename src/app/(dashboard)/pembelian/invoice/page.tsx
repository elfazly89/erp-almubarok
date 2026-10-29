"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, Plus, Search, RefreshCw, Eye, ArrowLeft, Trash2, Import, Tag, Percent, 
  DollarSign, ChevronDown, AlertTriangle, CheckCircle, XCircle, ShoppingBag, Calendar
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";

interface PO {
  id_pesan_beli: number;
  nomor_pesan_beli: string;
  nama_supplier: string;
  id_supplier: number;
  tanggal_pesan_beli: string;
  status?: string;
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

interface Barang {
  id_barang: number;
  barcode: string;
  nama_barang: string;
  satuan_1: string | null;
  satuan_2: string | null;
  satuan_3: string | null;
  isi_1: number | null;
  isi_2: number | null;
  isi_3: number | null;
  harga_beli: number | null;
}

interface InvoiceItem {
  id_barang: number;
  nama_barang: string;
  barcode: string;
  qty: number;
  satuan: string;
  isi_satuan: number;
  harga_satuan: number; // cost per selected unit
  subtotal: number;
  nomor_batch?: string;
  tanggal_kadaluarsa?: string;
}

interface Invoice {
  id_faktur: number;
  nomor_faktur: string;
  tanggal_faktur: string;
  nama_supplier: string;
  total_faktur: number;
  status_pembayaran: string;
}

export default function PurchaseInvoicePage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  
  // View states
  const [view, setView] = useState<"list" | "create">("list");
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Invoice[]>([]);
  const [activePOs, setActivePOs] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Barang[]>([]);

  // Search filter for list view
  const [search, setSearch] = useState("");

  // Form State
  const [poId, setPoId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [tanggalFaktur, setTanggalFaktur] = useState(new Date().toISOString().slice(0, 10));
  const [nomorFaktur, setNomorFaktur] = useState("");
  const [statusPembayaran, setStatusPembayaran] = useState("Belum Lunas");
  const [diskonGlobal, setDiskonGlobal] = useState("0");
  const [ppnRate, setPpnRate] = useState("0");
  const [biayaOngkir, setBiayaOngkir] = useState("0");
  const [biayaBongkar, setBiayaBongkar] = useState("0");
  const [metodeAlokasi, setMetodeAlokasi] = useState<"NILAI" | "KUANTITAS">("NILAI");

  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchProd, setSearchProd] = useState("");

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState("");

  // Detail Modal Overlay
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resPO, resSuppliers, resProducts, resInvoices] = await Promise.all([
        fetch("/api/pembelian/po?status=active"),
        fetch("/api/supplier"),
        fetch("/api/barang"),
        fetch("/api/pembelian/invoice")
      ]);

      if (!resPO.ok || !resSuppliers.ok || !resProducts.ok || !resInvoices.ok) {
        throw new Error("Gagal memuat beberapa data referensi dari server.");
      }

      setActivePOs(await resPO.json());
      setSuppliers(await resSuppliers.json());
      setProducts(await resProducts.json());
      setList(await resInvoices.json());
    } catch (err: any) {
      showToast(err.message || "Gagal memuat data referensi.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check URL query param for id_po (from Backorder page shortcut)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlPoId = params.get("id_po") || params.get("po_id");
      if (urlPoId) {
        setView("create");
        handleImportPO(urlPoId);
      }
    }
  }, [products]);

  // Import PO details when selected
  const handleImportPO = async (poVal: string) => {
    setPoId(poVal);
    if (!poVal) {
      setSupplierId("");
      setCart([]);
      return;
    }

    try {
      const res = await fetch(`/api/pembelian/po?id=${poVal}`);
      if (!res.ok) throw new Error("Gagal mengambil detail PO");
      const data = await res.json();
      
      // Auto-set supplier
      setSupplierId(data.po.id_supplier.toString());

      // Map details to invoice cart, prioritizing remaining unfulfilled quantities (sisa_qty)
      const mappedItems = (data.details || [])
        .filter((item: any) => {
          if (typeof item.sisa_qty === "number") {
            return item.sisa_qty > 0;
          }
          return (item.jumlah_barang || 0) > 0;
        })
        .map((item: any) => {
          const originalProd = products.find((p) => p.id_barang === item.id_barang);
          const remainingQty = typeof item.sisa_qty === "number" ? item.sisa_qty : item.jumlah_barang;
          return {
            id_barang: item.id_barang,
            nama_barang: item.nama_barang,
            barcode: originalProd?.barcode || "",
            qty: Math.max(1, remainingQty),
            satuan: originalProd?.satuan_1 || "pcs",
            isi_satuan: 1,
            harga_satuan: item.harga_satuan, // price per pcs
            subtotal: Math.max(1, remainingQty) * item.harga_satuan,
          };
        });

      setCart(mappedItems);
      if (data.po.status === "Sebagian") {
        showToast("Memuat sisa pesanan (Backorder) yang belum tiba untuk PO ini.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal mengimpor data PO", "error");
    }
  };

  const handleAddProduct = (p: Barang) => {
    const defaultUnit = p.satuan_1 || "pcs";
    const defaultIsi = p.isi_1 || 1;
    const defaultPrice = p.harga_beli || 0;

    const existingIdx = cart.findIndex((item) => item.id_barang === p.id_barang && item.satuan === defaultUnit);
    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].qty += 1;
      updated[existingIdx].subtotal = updated[existingIdx].qty * updated[existingIdx].harga_satuan;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id_barang: p.id_barang,
          nama_barang: p.nama_barang,
          barcode: p.barcode,
          qty: 1,
          satuan: defaultUnit,
          isi_satuan: defaultIsi,
          harga_satuan: defaultPrice,
          subtotal: defaultPrice,
        },
      ]);
    }
    setSearchProd("");
  };

  const updateCartItem = (idx: number, key: keyof InvoiceItem, val: any) => {
    const updated = [...cart];
    if (key === "qty") {
      updated[idx].qty = Math.max(1, parseInt(val) || 1);
    } else if (key === "harga_satuan") {
      updated[idx].harga_satuan = Math.max(0, parseInt(val) || 0);
    }
    updated[idx].subtotal = updated[idx].qty * updated[idx].harga_satuan;
    setCart(updated);
  };

  const updateCartUnit = (idx: number, unitName: string, p: Barang) => {
    const updated = [...cart];
    let isi = 1;
    if (unitName === p.satuan_2) isi = p.isi_2 || 1;
    else if (unitName === p.satuan_3) isi = p.isi_3 || 1;

    // Fix BT-2: Reset unit price using base price * isi factor
    const basePrice = p.harga_beli || 0;
    const newUnitPrice = basePrice * isi;

    updated[idx].satuan = unitName;
    updated[idx].isi_satuan = isi;
    updated[idx].harga_satuan = newUnitPrice;
    updated[idx].subtotal = updated[idx].qty * updated[idx].harga_satuan;
    setCart(updated);
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/pembelian/invoice?id=${id}`);
      if (!res.ok) throw new Error("Gagal memuat detail faktur");
      const data = await res.json();
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat detail faktur", "error");
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id_supplier.toString() === supplierId);
  const displaySupplierName = selectedSupplier ? selectedSupplier.nama_supplier : "-- Pilih Supplier --";

  const filteredSuppliers = suppliers.filter((s) =>
    s.nama_supplier.toLowerCase().includes(searchSupplier.toLowerCase())
  );

  // Pricing & Landed Cost calculations
  const subtotalCart = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const diskon = parseInt(diskonGlobal) || 0;
  const ppnRateNum = parseInt(ppnRate) || 0;
  const ongkirNum = parseInt(biayaOngkir) || 0;
  const bongkarNum = parseInt(biayaBongkar) || 0;
  const totalBiayaTambahan = ongkirNum + bongkarNum;
  const totalBefTax = Math.max(0, subtotalCart - diskon);
  const ppnNominal = Math.round((totalBefTax * ppnRateNum) / 100);
  const totalAkhir = totalBefTax + ppnNominal;
  const grandTotal = totalAkhir + totalBiayaTambahan;

  const handleSaveInvoice = async () => {
    if (!supplierId || !nomorFaktur.trim() || cart.length === 0) {
      showToast("Harap lengkapi semua kolom yang bertanda bintang *", "error");
      return;
    }
    setSaving(true);

    const formattedItems = cart.map((item) => ({
      id_barang: item.id_barang,
      nama_barang: item.nama_barang,
      jumlah_beli: item.qty * item.isi_satuan, // in pcs
      harga_satuan: item.harga_satuan / item.isi_satuan, // price per pcs
      subtotal: item.subtotal,
      nomor_batch: item.nomor_batch || null,
      tanggal_kadaluarsa: item.tanggal_kadaluarsa || null,
    }));

    try {
      const res = await fetch("/api/pembelian/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_po: poId || null,
          id_supplier: supplierId,
          tanggal_faktur: tanggalFaktur,
          nomor_faktur: nomorFaktur,
          total_faktur: totalAkhir,
          diskon_total: diskon,
          ppn_rate: ppnRateNum,
          biaya_ongkir: ongkirNum,
          biaya_bongkar: bongkarNum,
          biaya_asuransi: 0,
          metode_alokasi_landed_cost: metodeAlokasi,
          status_pembayaran: statusPembayaran,
          items: formattedItems,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Penerimaan barang & faktur pembelian berhasil disimpan!", "success");
        
        // Reset form
        setCart([]);
        setSupplierId("");
        setNomorFaktur("");
        setPoId("");
        setDiskonGlobal("0");
        setPpnRate("0");
        setBiayaOngkir("0");
        setBiayaBongkar("0");
        setStatusPembayaran("Belum Lunas");
        
        setView("list");
        loadData();
      } else {
        showToast("Gagal menyimpan Faktur: " + (data.error || "Error"), "error");
      }
    } catch {
      showToast("Error menyimpan Faktur Pembelian.", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatRupiah = (val: number) => {
    return formatCurrency(val);
  };

  const filteredList = list.filter(
    (inv) =>
      inv.nomor_faktur.toLowerCase().includes(search.toLowerCase()) ||
      inv.nama_supplier.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCatalog = products.filter(
    (p) =>
      p.nama_barang.toLowerCase().includes(searchProd.toLowerCase()) ||
      p.barcode.includes(searchProd)
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

  const openCreateForm = () => {
    setCart([]);
    setSupplierId("");
    setNomorFaktur("");
    setPoId("");
    setDiskonGlobal("0");
    setPpnRate("0");
    setStatusPembayaran("Belum Lunas");
    setView("create");
  };

  return (
    <div className="space-y-6 text-on-background">
      
      {view === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-primary" /> Penerimaan Barang & Faktur Beli
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">{list.length} Faktur terdaftar</p>
            </div>
            {can_create && (
              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Catat Faktur Baru
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari No. Faktur / Supplier..."
                className="w-full bg-surface border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl transition-all self-end md:self-auto border border-outline-variant/30 flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat data...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant text-sm">
                <ShoppingBag className="w-12 h-12 mb-3 opacity-30 text-primary" />
                <p>Belum ada data Faktur Pembelian</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/35 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      <th className="px-5 py-3.5 w-12">#</th>
                      <th className="px-5 py-3.5">No. Faktur</th>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Supplier</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Total Netto</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {filteredList.map((inv, idx) => (
                      <tr key={inv.id_faktur} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="px-5 py-4 text-on-surface-variant/70 font-mono">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <span className="text-on-surface font-mono text-xs font-semibold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {inv.nomor_faktur}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface/80 font-mono text-xs">{inv.tanggal_faktur}</td>
                        <td className="px-5 py-4 text-on-surface font-semibold">{inv.nama_supplier}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              inv.status_pembayaran === "Lunas"
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : "bg-error/15 text-error border border-error/20"
                            }`}
                          >
                            {inv.status_pembayaran}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-primary font-bold font-mono">{formatRupiah(inv.total_faktur)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => viewDetail(inv.id_faktur)}
                            className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        // CREATE VIEW
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("list")}
              className="p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl transition-colors border border-outline-variant/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <Plus className="w-7 h-7 text-primary" /> Buat Faktur Pembelian Baru
              </h1>
              <p className="text-on-surface-variant text-sm mt-0.5">Mencatat barang masuk dari PO / Faktur supplier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* INPUT FORM PANEL (Col: 4) */}
            <div className="md:col-span-4 bg-surface border border-outline-variant/30 p-5 rounded-2xl space-y-4 text-xs shadow-sm">
              
              {/* Import PO */}
              {activePOs.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
                  <label className="block text-[10px] text-on-surface-variant font-bold mb-1.5 flex items-center gap-1">
                    <Import className="w-3.5 h-3.5 text-primary" /> Import PO Aktif
                  </label>
                  <select
                    value={poId}
                    onChange={(e) => handleImportPO(e.target.value)}
                    className="w-full bg-surface border border-outline-variant text-on-surface rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih PO --</option>
                    {activePOs.map((po) => (
                      <option key={po.id_pesan_beli} value={po.id_pesan_beli} className="bg-surface text-on-surface">
                        {po.nomor_pesan_beli} - {po.nama_supplier} {po.status === "Sebagian" ? "(Sebagian / Backorder)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <label className="block text-on-surface-variant font-bold mb-1.5">Pilih Supplier *</label>
                
                <button
                  type="button"
                  onClick={() => !poId && setShowSupplierDropdown(!showSupplierDropdown)}
                  disabled={!!poId}
                  className={`w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs text-left focus:outline-none focus:ring-1 focus:ring-primary flex items-center justify-between transition-colors ${
                    poId ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-surface-container-high/40"
                  }`}
                >
                  <span className={supplierId ? "text-on-surface font-medium" : "text-on-surface-variant/70"}>
                    {displaySupplierName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant/60 shrink-0" />
                </button>

                {showSupplierDropdown && (
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => {
                      setShowSupplierDropdown(false);
                      setSearchSupplier("");
                    }} 
                  />
                )}

                {showSupplierDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-2xl z-20 p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-on-surface-variant/60" />
                      <input
                        type="text"
                        value={searchSupplier}
                        onChange={(e) => setSearchSupplier(e.target.value)}
                        placeholder="Cari nama supplier..."
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/80"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-0.5 scrollbar-thin">
                      {filteredSuppliers.length === 0 ? (
                        <div className="p-2.5 text-center text-on-surface-variant/60 text-xs italic">
                          Supplier tidak ditemukan
                        </div>
                      ) : (
                        filteredSuppliers.map((s) => (
                          <button
                            key={s.id_supplier}
                            type="button"
                            onClick={() => {
                              setSupplierId(s.id_supplier.toString());
                              setShowSupplierDropdown(false);
                              setSearchSupplier("");
                            }}
                            className={`w-full px-3 py-2 text-left rounded-lg text-xs transition-colors flex items-center justify-between hover:bg-surface-container-high/50 ${
                              supplierId === s.id_supplier.toString()
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-on-surface"
                            }`}
                          >
                            <span>{s.nama_supplier}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-bold mb-1.5">No. Faktur *</label>
                  <input
                    type="text"
                    value={nomorFaktur}
                    onChange={(e) => setNomorFaktur(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Faktur Supplier"
                    required
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-bold mb-1.5">Tanggal Faktur *</label>
                  <input
                    type="date"
                    value={tanggalFaktur}
                    onChange={(e) => setTanggalFaktur(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-bold mb-1.5">Pembayaran *</label>
                <select
                  value={statusPembayaran}
                  onChange={(e) => setStatusPembayaran(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="Belum Lunas" className="bg-surface text-on-surface">Kredit / Belum Lunas (Masuk Hutang Supplier)</option>
                  <option value="Lunas" className="bg-surface text-on-surface">Tunai / Lunas Langsung</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/40 font-mono">
                <div>
                  <label className="block text-on-surface-variant font-bold mb-1.5 flex items-center gap-1 font-sans">
                    <Tag className="w-3.5 h-3.5 text-primary" /> Diskon Global
                  </label>
                  <input
                    type="number"
                    value={diskonGlobal}
                    onChange={(e) => setDiskonGlobal(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-right focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-bold mb-1.5 flex items-center gap-1 font-sans">
                    <Percent className="w-3.5 h-3.5 text-primary" /> Pajak PPn (%)
                  </label>
                  <input
                    type="number"
                    value={ppnRate}
                    onChange={(e) => setPpnRate(e.target.value)}
                    placeholder="11"
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-center focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Landed Cost Allocation Section */}
              <div className="pt-2 border-t border-outline-variant/40 space-y-2">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                  Biaya Tambahan / Landed Cost (Masuk HPP)
                </span>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block text-on-surface-variant text-[11px] font-bold mb-1 font-sans">
                      Ongkir / Freight (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={biayaOngkir}
                      onChange={(e) => setBiayaOngkir(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-right focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant text-[11px] font-bold mb-1 font-sans">
                      Bongkar Muat (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={biayaBongkar}
                      onChange={(e) => setBiayaBongkar(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-right focus:outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-on-surface-variant text-[10px] font-medium mb-1">
                    Metode Alokasi Biaya ke HPP:
                  </label>
                  <select
                    value={metodeAlokasi}
                    onChange={(e) => setMetodeAlokasi(e.target.value as "NILAI" | "KUANTITAS")}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                  >
                    <option value="NILAI">Proporsional Nilai Beli (Subtotal)</option>
                    <option value="KUANTITAS">Proporsional Kuantitas (Qty Item)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* CART & CATALOG SEARCH PANEL (Col: 8) */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Autocomplete Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                  placeholder="Cari barang untuk menambah manual..."
                  className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={!!poId} // block manual additions if importing from PO for alignment
                />

                {searchProd.trim() && (
                  <div className="absolute left-0 right-0 top-11 bg-surface border border-outline-variant rounded-xl max-h-60 overflow-y-auto z-40 p-2 shadow-2xl space-y-1 divide-y divide-outline-variant/20">
                    {filteredCatalog.length === 0 ? (
                      <div className="p-3 text-center text-on-surface-variant text-xs">Produk tidak ditemukan</div>
                    ) : (
                      filteredCatalog.map((p) => (
                        <button
                          key={p.id_barang}
                          onClick={() => handleAddProduct(p)}
                          className="w-full bg-surface hover:bg-surface-container-high/50 p-2 rounded-lg flex items-center justify-between text-left text-xs transition-colors"
                        >
                          <div>
                            <span className="text-on-surface font-semibold">{p.nama_barang}</span>
                            <span className="text-on-surface-variant block font-mono text-[10px]">{p.barcode}</span>
                          </div>
                          <span className="text-primary font-bold font-mono">{formatRupiah(p.harga_beli || 0)}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Keranjang Faktur */}
              <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 space-y-4 shadow-sm">
                <h3 className="font-semibold text-on-surface text-xs border-b border-outline-variant/40 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Daftar Barang Masuk
                </h3>
                
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-xs">
                    Belum ada barang. Silakan pilih PO di kiri atau cari barang di atas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, idx) => {
                      const p = products.find((prod) => prod.id_barang === item.id_barang);
                      return (
                        <div key={`${item.id_barang}-${item.satuan}`} className="bg-surface-container-low border border-outline-variant/30 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
                          
                          <div className="flex-1">
                            <span className="text-on-surface font-semibold block">{item.nama_barang}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-on-surface-variant font-mono">{item.barcode}</span>
                              {p && !poId && (p.satuan_2 || p.satuan_3) ? (
                                <select
                                  value={item.satuan}
                                  onChange={(e) => updateCartUnit(idx, e.target.value, p)}
                                  className="bg-surface border border-outline-variant text-[10px] text-on-surface px-1 py-0.5 rounded focus:outline-none"
                                >
                                  <option value={p.satuan_1 || "pcs"} className="bg-surface text-on-surface">{p.satuan_1}</option>
                                  {p.satuan_2 && <option value={p.satuan_2} className="bg-surface text-on-surface">{p.satuan_2}</option>}
                                  {p.satuan_3 && <option value={p.satuan_3} className="bg-surface text-on-surface">{p.satuan_3}</option>}
                                </select>
                              ) : (
                                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">{item.satuan}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-20">
                              <label className="block text-[9px] text-on-surface-variant mb-0.5 font-sans">Jumlah</label>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateCartItem(idx, "qty", e.target.value)}
                                className="w-full bg-surface border border-outline-variant text-on-surface rounded px-2 py-1 text-center font-bold font-mono focus:outline-none"
                              />
                            </div>
                            <div className="w-28">
                              <label className="block text-[9px] text-on-surface-variant mb-0.5 font-sans">Harga Beli ({item.satuan})</label>
                              <input
                                type="number"
                                value={item.harga_satuan}
                                onChange={(e) => updateCartItem(idx, "harga_satuan", e.target.value)}
                                className="w-full bg-surface border border-outline-variant text-on-surface rounded px-2 py-1 text-right font-mono focus:outline-none"
                              />
                            </div>
                            <div className="text-right w-24">
                              <span className="text-[9px] text-on-surface-variant block font-sans">Subtotal</span>
                              <strong className="text-primary font-bold font-mono">{formatRupiah(item.subtotal)}</strong>
                            </div>
                            
                            {!poId && (
                              <button
                                onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container-high transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}

                    {/* Calculation Ringkasan */}
                    <div className="border-t border-outline-variant/40 pt-3 space-y-1.5 text-xs text-right font-mono">
                      <div className="flex justify-between text-on-surface-variant font-sans font-medium">
                        <span>Subtotal Barang:</span>
                        <span>{formatRupiah(subtotalCart)}</span>
                      </div>
                      {diskon > 0 && (
                        <div className="flex justify-between text-error font-sans font-medium">
                          <span>Diskon Faktur:</span>
                          <span>-{formatRupiah(diskon)}</span>
                        </div>
                      )}
                      {ppnNominal > 0 && (
                        <div className="flex justify-between text-primary font-sans font-medium">
                          <span>Pajak PPn ({ppnRateNum}%):</span>
                          <span>+{formatRupiah(ppnNominal)}</span>
                        </div>
                      )}
                      {totalBiayaTambahan > 0 && (
                        <div className="flex justify-between text-amber-700 font-sans font-medium">
                          <span>Biaya Landed Cost (Ongkir/Bongkar):</span>
                          <span>+{formatRupiah(totalBiayaTambahan)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-on-surface font-bold text-sm border-t border-outline-variant/40 pt-2 font-sans">
                        <span>GRAND TOTAL PEMBELIAN:</span>
                        <span className="text-primary font-extrabold font-mono text-base">{formatRupiah(grandTotal)}</span>
                      </div>
                      {totalBiayaTambahan > 0 && (
                        <div className="text-[10px] text-on-surface-variant font-sans italic text-right">
                          * Biaya tambahan dialokasikan otomatis ke HPP unit barang ({metodeAlokasi}).
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSaveInvoice}
                      disabled={saving || !supplierId || !nomorFaktur || !can_create}
                      className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary py-3 rounded-xl font-bold transition-colors mt-2 text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <DollarSign className="w-4 h-4" /> {can_create ? (saving ? "Menyimpan Faktur..." : "Simpan Faktur Pembelian") : "TIDAK MEMILIKI AKSES TAMBAH"}
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/35 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">Detail Faktur Pembelian</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-on-surface-variant block">No. Faktur</span>
                  <span className="text-on-surface font-semibold font-mono text-sm bg-primary/10 px-2 py-0.5 rounded border border-primary/20 inline-block mt-0.5">{selectedInvoice.invoice.nomor_faktur}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Tanggal Penerimaan</span>
                  <span className="text-on-surface font-semibold font-mono">{selectedInvoice.invoice.tanggal_faktur}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Supplier</span>
                  <span className="text-on-surface font-semibold">{selectedInvoice.invoice.nama_supplier}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-1">Status Pembayaran</span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      selectedInvoice.invoice.status_pembayaran === "Lunas"
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "bg-error/15 text-error border border-error/20"
                    }`}
                  >
                    {selectedInvoice.invoice.status_pembayaran}
                  </span>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-3">
                <h3 className="text-xs text-on-surface font-semibold mb-2">Barang yang Diterima</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedInvoice.details.map((item: any) => (
                    <div key={item.id} className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex justify-between text-xs">
                      <div>
                        <span className="text-on-surface font-semibold">{item.nama_barang || "Produk"}</span>
                        <span className="text-on-surface-variant block text-[9px] mt-0.5 font-mono">{item.jumlah_beli} pcs @ {formatRupiah(item.harga_satuan)}</span>
                      </div>
                      <strong className="text-primary self-center font-bold font-mono">{formatRupiah(item.subtotal)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-2 space-y-1 text-right text-xs font-mono">
                {selectedInvoice.invoice.diskon_total > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Diskon Faktur:</span>
                    <span>-{formatRupiah(selectedInvoice.invoice.diskon_total)}</span>
                  </div>
                )}
                {selectedInvoice.invoice.ppn_rate > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Pajak PPn ({selectedInvoice.invoice.ppn_rate}%):</span>
                    <span>+{formatRupiah(Math.round(((selectedInvoice.invoice.total_faktur - selectedInvoice.invoice.diskon_total) * selectedInvoice.invoice.ppn_rate) / (100 + selectedInvoice.invoice.ppn_rate)))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold border-t border-outline-variant/30 pt-2 text-on-surface font-sans text-sm">
                  <span>TOTAL NETTO INVOICE:</span>
                  <span className="text-primary text-base font-extrabold font-mono">{formatRupiah(selectedInvoice.invoice.total_faktur)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setShowDetailModal(false)} className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-white animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toast.type === "success" 
              ? "bg-emerald-600 border-emerald-500/30" 
              : "bg-rose-600 border-rose-500/30"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
