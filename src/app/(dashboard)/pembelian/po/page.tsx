"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Search, RefreshCw, Eye, ArrowLeft, Trash2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface PO {
  id_pesan_beli: number;
  nomor_pesan_beli: string;
  tanggal_pesan_beli: string;
  nama_supplier: string;
  total_harga_pesan_beli: number;
  status: string;
  keterangan: string;
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

interface POItem {
  id_barang: number;
  nama_barang: string;
  barcode: string;
  qty: number;
  satuan: string;
  isi_satuan: number;
  harga_satuan: number; // price per unit selected
  subtotal: number;
}

export default function PoPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [view, setView] = useState<"list" | "create">("list");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPoDetail, setSelectedPoDetail] = useState<any>(null);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");
  const [cart, setCart] = useState<POItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Search product autocomplete inside create form
  const [searchProd, setSearchProd] = useState("");
  
  const loadData = useCallback(async () => {
    setLoading(true);
    const [resPO, resSuppliers, resProducts] = await Promise.all([
      fetch("/api/pembelian/po"),
      fetch("/api/supplier"),
      fetch("/api/barang"),
    ]);
    setList(await resPO.json());
    setSuppliers(await resSuppliers.json());
    setProducts(await resProducts.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const viewDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/pembelian/po?id=${id}`);
      const data = await res.json();
      setSelectedPoDetail(data);
      setShowDetail(true);
    } catch {
      alert("Gagal memuat detail PO");
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

  const updateCartItem = (idx: number, key: keyof POItem, val: any) => {
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

  const handleSavePO = async () => {
    if (!supplierId || cart.length === 0) return;
    setSaving(true);

    const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const formattedItems = cart.map((item) => ({
      id_barang: item.id_barang,
      nama_barang: item.nama_barang,
      jumlah_barang: item.qty * item.isi_satuan, // in pcs
      harga_satuan: item.harga_satuan / item.isi_satuan, // price per pcs
      subtotal: item.subtotal,
    }));

    try {
      const res = await fetch("/api/pembelian/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_supplier: supplierId,
          tanggal_pesan_beli: tanggal,
          keterangan,
          total_harga_pesan_beli: totalHarga,
          items: formattedItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCart([]);
        setSupplierId("");
        setKeterangan("");
        setView("list");
        loadData();
      } else {
        alert("Gagal menyimpan PO: " + data.error);
      }
    } catch {
      alert("Error menyimpan PO.");
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
    <div className="space-y-6 text-on-background">
      {view === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary" /> Pemesanan Pembelian (PO)
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">{list.length} PO terdaftar</p>
            </div>
            {can_create && (
              <button
                onClick={() => setView("create")}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Buat PO Baru
              </button>
            )}
          </div>

          <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant text-sm">
                <FileText className="w-12 h-12 mb-3 opacity-30 text-primary" />
                <p>Belum ada data Pemesanan Pembelian</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      <th className="px-5 py-3.5 w-12">#</th>
                      <th className="px-5 py-3.5">No. PO</th>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Supplier</th>
                      <th className="px-5 py-3.5 text-right">Total Estimasi</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {list.map((po, idx) => (
                      <tr key={po.id_pesan_beli} className="hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-5 py-4 text-on-surface-variant font-mono">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <span className="text-primary font-mono text-xs font-semibold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {po.nomor_pesan_beli}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant font-mono text-xs">{po.tanggal_pesan_beli}</td>
                        <td className="px-5 py-4 text-on-surface font-semibold">{po.nama_supplier}</td>
                        <td className="px-5 py-4 text-right text-on-surface font-bold font-mono">{formatRupiah(po.total_harga_pesan_beli)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              po.status === "PENDING"
                                ? "bg-secondary/10 text-secondary border-secondary/20"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {po.status === "PENDING" ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {po.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => viewDetail(po.id_pesan_beli)}
                            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-outline-variant/20 shadow-sm transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" /> Detail
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
              className="p-2 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Buat Purchase Order Baru</h1>
              <p className="text-on-surface-variant text-sm mt-0.5">Form pembuatan PO pemesanan barang ke supplier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Form Inputs (Col: 4) */}
            <div className="md:col-span-4 bg-surface border border-outline-variant/30 p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Pilih Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="" className="bg-surface text-on-surface-variant">-- Pilih Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id_supplier} value={s.id_supplier} className="bg-surface text-on-surface">{s.nama_supplier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Tanggal PO *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Keterangan / Memo</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none h-20 focus:ring-1 focus:ring-primary"
                  placeholder="Catatan tambahan PO..."
                />
              </div>
            </div>

            {/* Cart & Product Selector (Col: 8) */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Product Autocomplete Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                  placeholder="Ketik nama barang / barcode untuk menambah..."
                  className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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

              {/* Cart Table */}
              <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 space-y-4 shadow-sm">
                <h3 className="font-semibold text-on-surface text-xs border-b border-outline-variant/40 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Daftar Barang Dipesan
                </h3>
                
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-xs">
                    Keranjang PO kosong. Cari dan tambahkan barang di atas.
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
                              {p && (p.satuan_2 || p.satuan_3) ? (
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
                              <label className="block text-[9px] text-on-surface-variant mb-0.5">Jumlah</label>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateCartItem(idx, "qty", e.target.value)}
                                className="w-full bg-surface border border-outline-variant text-on-surface rounded px-2 py-1 text-center font-bold font-mono focus:outline-none"
                              />
                            </div>
                            <div className="w-28">
                              <label className="block text-[9px] text-on-surface-variant mb-0.5 font-sans">Harga ({item.satuan})</label>
                              <input
                                type="number"
                                value={item.harga_satuan}
                                onChange={(e) => updateCartItem(idx, "harga_satuan", e.target.value)}
                                className="w-full bg-surface border border-outline-variant text-on-surface rounded px-2 py-1 text-right font-mono focus:outline-none"
                              />
                            </div>
                            <div className="text-right w-24">
                              <span className="text-[9px] text-on-surface-variant block">Subtotal</span>
                              <strong className="text-primary font-bold font-mono">{formatRupiah(item.subtotal)}</strong>
                            </div>
                            <button
                              onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                              className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container-high transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      );
                    })}

                    <div className="flex justify-between items-center border-t border-outline-variant/40 pt-3">
                      <span className="text-xs text-on-surface-variant font-semibold">Total PO Belanja:</span>
                      <strong className="text-base text-primary font-extrabold font-mono">
                        {formatRupiah(cart.reduce((sum, i) => sum + i.subtotal, 0))}
                      </strong>
                    </div>

                    <button
                      onClick={handleSavePO}
                      disabled={saving || !supplierId}
                      className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary py-3 rounded-xl font-bold transition-colors mt-2 text-xs uppercase tracking-wide shadow-sm"
                    >
                      {saving ? "Menyimpan PO..." : "Simpan Purchase Order"}
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DETAIL PO MODAL OVERLAY */}
      {showDetail && selectedPoDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Detail Purchase Order</h2>
              <button onClick={() => setShowDetail(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">No. PO</span>
                  <span className="text-primary font-mono font-semibold text-sm">{selectedPoDetail.po.nomor_pesan_beli}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal PO</span>
                  <span className="text-on-surface font-semibold font-mono">{selectedPoDetail.po.tanggal_pesan_beli}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Supplier</span>
                  <span className="text-on-surface font-semibold">{selectedPoDetail.po.nama_supplier}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Status PO</span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      selectedPoDetail.po.status === "PENDING"
                        ? "bg-secondary/10 text-secondary border-secondary/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {selectedPoDetail.po.status}
                  </span>
                </div>
                {selectedPoDetail.po.keterangan && (
                  <div className="col-span-2">
                    <span className="text-on-surface-variant block uppercase font-medium">Keterangan / Memo</span>
                    <span className="text-on-surface font-medium leading-relaxed">{selectedPoDetail.po.keterangan}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-outline-variant/40 pt-3">
                <h3 className="text-xs text-on-surface font-semibold mb-2">Daftar Barang Pesanan</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {selectedPoDetail.details.map((item: any) => (
                    <div key={item.id} className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 flex justify-between text-xs">
                      <div>
                        <span className="text-on-surface font-semibold">{item.nama_barang}</span>
                        <span className="text-on-surface-variant block text-[9px] font-mono mt-1">{item.jumlah_barang} pcs @ {formatRupiah(item.harga_satuan)}</span>
                      </div>
                      <strong className="text-primary font-bold font-mono self-center">{formatRupiah(item.subtotal)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-outline-variant/40 pt-3">
                <span className="text-xs text-on-surface-variant font-semibold">Total Harga Estimasi:</span>
                <strong className="text-primary text-sm font-extrabold font-mono">{formatRupiah(selectedPoDetail.po.total_harga_pesan_beli)}</strong>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end bg-surface-container-high/40">
              <button
                onClick={() => setShowDetail(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors border border-outline-variant/20 shadow-sm"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
