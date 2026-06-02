"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Search, RefreshCw, Eye, ArrowLeft, Trash2, Import, Tag, Percent, DollarSign, ChevronDown } from "lucide-react";

interface PO {
  id_pesan_beli: number;
  nomor_pesan_beli: string;
  nama_supplier: string;
  id_supplier: number;
  tanggal_pesan_beli: string;
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
}

export default function PurchaseInvoicePage() {
  const [activePOs, setActivePOs] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [poId, setPoId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [tanggalFaktur, setTanggalFaktur] = useState(new Date().toISOString().slice(0, 10));
  const [nomorFaktur, setNomorFaktur] = useState("");
  const [statusPembayaran, setStatusPembayaran] = useState("Belum Dibayar");
  const [diskonGlobal, setDiskonGlobal] = useState("0");
  const [ppnRate, setPpnRate] = useState("0");

  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchProd, setSearchProd] = useState("");

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [resPO, resSuppliers, resProducts] = await Promise.all([
      fetch("/api/pembelian/po?status=PENDING"),
      fetch("/api/supplier"),
      fetch("/api/barang"),
    ]);
    setActivePOs(await resPO.json());
    setSuppliers(await resSuppliers.json());
    setProducts(await resProducts.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const data = await res.json();
      
      // Auto-set supplier
      setSupplierId(data.po.id_supplier.toString());

      // Map details to invoice cart
      // pesan_beli_detail has: jumlah_barang (pcs), harga_satuan (pcs), subtotal
      // We will map it back to pcs unit
      const mappedItems = data.details.map((item: any) => {
        // Look up original product
        const originalProd = products.find((p) => p.id_barang === item.id_barang);
        return {
          id_barang: item.id_barang,
          nama_barang: item.nama_barang,
          barcode: originalProd?.barcode || "",
          qty: item.jumlah_barang, // default to pcs unit
          satuan: originalProd?.satuan_1 || "pcs",
          isi_satuan: 1,
          harga_satuan: item.harga_satuan, // price per pcs
          subtotal: item.subtotal,
        };
      });

      setCart(mappedItems);
    } catch {
      alert("Gagal mengimpor data PO");
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

    updated[idx].satuan = unitName;
    updated[idx].isi_satuan = isi;
    updated[idx].subtotal = updated[idx].qty * updated[idx].harga_satuan;
    setCart(updated);
  };

  const selectedSupplier = suppliers.find((s) => s.id_supplier.toString() === supplierId);
  const displaySupplierName = selectedSupplier ? selectedSupplier.nama_supplier : "-- Pilih Supplier --";

  const filteredSuppliers = suppliers.filter((s) =>
    s.nama_supplier.toLowerCase().includes(searchSupplier.toLowerCase())
  );

  // Pricing calculations
  const subtotalCart = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const diskon = parseInt(diskonGlobal) || 0;
  const ppnRateNum = parseInt(ppnRate) || 0;
  const totalBefTax = Math.max(0, subtotalCart - diskon);
  const ppnNominal = Math.round((totalBefTax * ppnRateNum) / 100);
  const totalAkhir = totalBefTax + ppnNominal;

  const handleSaveInvoice = async () => {
    if (!supplierId || !nomorFaktur.trim() || cart.length === 0) {
      alert("Harap lengkapi semua kolom yang bertanda bintang *");
      return;
    }
    setSaving(true);

    const formattedItems = cart.map((item) => ({
      id_barang: item.id_barang,
      nama_barang: item.nama_barang,
      jumlah_beli: item.qty * item.isi_satuan, // in pcs
      harga_satuan: item.harga_satuan / item.isi_satuan, // price per pcs
      subtotal: item.subtotal,
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
          status_pembayaran: statusPembayaran,
          items: formattedItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Reset and reload
        setCart([]);
        setSupplierId("");
        setNomorFaktur("");
        setPoId("");
        setDiskonGlobal("0");
        setPpnRate("0");
        setStatusPembayaran("Belum Dibayar");
        
        alert("Penerimaan barang & faktur pembelian berhasil disimpan!");
        loadData();
      } else {
        alert("Gagal menyimpan Faktur: " + data.error);
      }
    } catch {
      alert("Error menyimpan Faktur Pembelian.");
    } finally {
      setSaving(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const filteredCatalog = products.filter(
    (p) =>
      p.nama_barang.toLowerCase().includes(searchProd.toLowerCase()) ||
      p.barcode.includes(searchProd)
  );

  return (
    <div className="space-y-6 text-on-background">
      
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Plus className="w-7 h-7 text-primary" /> Penerimaan Barang & Faktur Beli
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
                    {po.nomor_pesan_beli} ({po.nama_supplier})
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
              <option value="Belum Dibayar" className="bg-surface text-on-surface">Kredit / Belum Dibayar (Masuk Hutang)</option>
              <option value="Lunas" className="bg-surface text-on-surface">Lunas</option>
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
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-right focus:outline-none"
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
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-center focus:outline-none"
              />
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
                  <div className="flex justify-between text-on-surface font-bold text-sm border-t border-outline-variant/40 pt-2 font-sans">
                    <span>TOTAL AKHIR INVOICE:</span>
                    <span className="text-primary font-extrabold font-mono text-base">{formatRupiah(totalAkhir)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveInvoice}
                  disabled={saving || !supplierId || !nomorFaktur}
                  className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary py-3 rounded-xl font-bold transition-colors mt-2 text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <DollarSign className="w-4 h-4" /> {saving ? "Menyimpan Faktur..." : "Simpan Faktur Pembelian"}
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
