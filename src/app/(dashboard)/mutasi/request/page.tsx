"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Search, RefreshCw, Send, Trash2, Eye, Building2, CheckCircle, Clock } from "lucide-react";

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
}

export default function RequestMutasiPage() {
  const [requests, setRequests] = useState<RequestHeader[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State - List details
  const [viewRequest, setViewRequest] = useState<RequestHeader | null>(null);
  const [viewDetails, setViewDetails] = useState<RequestDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State - Builder
  const [showFormModal, setShowFormModal] = useState(false);
  const [sumberCabangId, setSumberCabangId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [basket, setBasket] = useState<{ product: Product; qty: number; unit: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Product Autocomplete State
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resReq, resBranches] = await Promise.all([
        fetch("/api/mutasi/request?filter=outgoing"),
        fetch("/api/cabang"),
      ]);
      setRequests(await resReq.json());
      setBranches(await resBranches.json());
    } catch (e) {
      console.error("Error loading request page data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Autocomplete search
  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setProducts([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetch(`/api/barang?search=${encodeURIComponent(productSearch)}`);
        const list = await res.json();
        setProducts(list.slice(0, 8)); // Limit results
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [productSearch]);

  const fetchRequestDetails = async (req: RequestHeader) => {
    setViewRequest(req);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/mutasi/request?id=${req.id_request}`);
      const data = await res.json();
      setViewDetails(data.details || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddToBasket = (p: Product) => {
    // Avoid duplicates
    if (basket.some((item) => item.product.id_barang === p.id_barang)) {
      alert("Barang sudah ada di daftar permintaan.");
      return;
    }
    setBasket((prev) => [...prev, { product: p, qty: 1, unit: p.satuan_1 }]);
    setProductSearch("");
    setProducts([]);
  };

  const handleQtyChange = (idx: number, val: string) => {
    const value = parseInt(val) || 0;
    setBasket((prev) => {
      const copy = [...prev];
      copy[idx].qty = value;
      return copy;
    });
  };

  const handleUnitChange = (idx: number, unit: string) => {
    setBasket((prev) => {
      const copy = [...prev];
      copy[idx].unit = unit;
      return copy;
    });
  };

  const handleRemoveFromBasket = (idx: number) => {
    setBasket((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveRequest = async () => {
    if (!sumberCabangId) {
      alert("Silakan pilih cabang sumber terlebih dahulu.");
      return;
    }
    if (basket.length === 0) {
      alert("Silakan masukkan barang yang ingin diminta.");
      return;
    }

    setSaving(true);
    const items = basket.map((item) => {
      const p = item.product;
      let conversion = 1;
      if (item.unit === p.satuan_2 && p.isi_2) conversion = p.isi_2;
      if (item.unit === p.satuan_3 && p.isi_3) conversion = p.isi_3;

      return {
        id_barang: p.id_barang,
        jumlah_diminta: item.qty * conversion, // convert to pcs
      };
    });

    try {
      const res = await fetch("/api/mutasi/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cabang_sumber: parseInt(sumberCabangId),
          tanggal_request: tanggal,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowFormModal(false);
        setBasket([]);
        setSumberCabangId("");
        loadData();
      } else {
        alert("Gagal mengirim permintaan: " + data.error);
      }
    } catch {
      alert("Error memproses pengajuan permintaan stok.");
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.kode_request.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cabang_sumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Permintaan Barang (Request)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Daftar pengajuan pengadaan barang dari cabang Anda ke cabang lain atau gudang utama.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode/cabang..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all flex-shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ajukan Mutasi
          </button>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat data...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">
            Belum ada data pengajuan permintaan barang.
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-2.5">Tanggal</th>
                  <th className="px-5 py-2.5">Kode Permintaan</th>
                  <th className="px-5 py-2.5">Dari Cabang</th>
                  <th className="px-5 py-2.5">Ke Cabang (Sumber)</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {filteredRequests.map((r) => (
                  <tr key={r.id_request} className="hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-5 py-2.5 text-on-surface-variant text-xs font-mono">{r.tanggal_request}</td>
                    <td className="px-5 py-2.5 text-on-surface font-semibold">{r.kode_request}</td>
                    <td className="px-5 py-2.5 text-on-surface-variant text-xs">{r.cabang_peminta}</td>
                    <td className="px-5 py-2.5 text-on-surface font-medium">{r.cabang_sumber}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                          r.status === "Selesai"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : r.status === "Diproses"
                            ? "bg-secondary/10 text-secondary border-secondary/20"
                            : "bg-tertiary/10 text-tertiary border-tertiary/20"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => fetchRequestDetails(r)}
                        className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-outline-variant/20 shadow-sm"
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

      {/* MODAL BUILDER FORM */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Ajukan Permintaan Mutasi Stok
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant mb-1.5 font-semibold">Cabang Sumber (Asal Barang) *</label>
                  <select
                    value={sumberCabangId}
                    onChange={(e) => setSumberCabangId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih Cabang Sumber --</option>
                    {branches.map((b) => (
                      <option key={b.id_cabang} value={b.id_cabang} className="bg-surface text-on-surface">
                        {b.nama_cabang} ({b.kode_cabang})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1.5 font-semibold">Tanggal Permintaan *</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Product Autocomplete Picker */}
              <div className="relative">
                <label className="block text-on-surface-variant mb-1.5 font-semibold">Cari & Tambah Produk *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Ketik barcode atau nama barang..."
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {searchingProducts && (
                    <RefreshCw className="absolute right-3 top-3 w-4 h-4 text-on-surface-variant animate-spin" />
                  )}
                </div>

                {/* Dropdown Results */}
                {products.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-outline-variant/30 max-h-48 overflow-y-auto">
                    {products.map((p) => (
                      <button
                        key={p.id_barang}
                        type="button"
                        onClick={() => handleAddToBasket(p)}
                        className="w-full px-4 py-2.5 text-left text-on-surface hover:bg-surface-container-high flex justify-between items-center transition-colors font-sans"
                      >
                        <div>
                          <span className="font-semibold block">{p.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">{p.barcode}</span>
                        </div>
                        <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded uppercase font-semibold">
                          {p.satuan_1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Items Grid / Basket */}
              <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 text-on-surface-variant font-semibold border-b border-outline-variant/40 uppercase tracking-wider text-[10px]">
                  Keranjang Permintaan Barang
                </div>
                {basket.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant">Belum ada barang dipilih.</div>
                ) : (
                  <div className="divide-y divide-outline-variant/20">
                    {basket.map((item, idx) => (
                      <div key={item.product.id_barang} className="p-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 bg-surface hover:bg-surface-container-high/10 transition-colors">
                        <div className="flex-1 min-w-[200px]">
                          <span className="font-semibold text-on-surface block">{item.product.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">{item.product.barcode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className="w-16 bg-surface-container border border-outline-variant text-on-surface rounded px-2 py-1 text-center font-bold font-mono"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => handleUnitChange(idx, e.target.value)}
                            className="bg-surface-container border border-outline-variant text-on-surface rounded px-1.5 py-1"
                          >
                            <option value={item.product.satuan_1} className="bg-surface text-on-surface">{item.product.satuan_1}</option>
                            {item.product.satuan_2 && (
                              <option value={item.product.satuan_2} className="bg-surface text-on-surface">
                                {item.product.satuan_2} (x{item.product.isi_2})
                              </option>
                            )}
                            {item.product.satuan_3 && (
                              <option value={item.product.satuan_3} className="bg-surface text-on-surface">
                                {item.product.satuan_3} (x{item.product.isi_3})
                              </option>
                            )}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromBasket(idx)}
                          className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end gap-3 bg-surface-container-high/20">
              <button
                onClick={() => setShowFormModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRequest}
                disabled={saving || basket.length === 0}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Kirim Permintaan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL EYE VIEW */}
      {viewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Detail Permintaan Mutasi</h2>
              <button
                onClick={() => setViewRequest(null)}
                className="text-on-surface-variant hover:text-on-surface text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Kode Transaksi</span>
                  <span className="text-on-surface font-semibold text-sm font-mono">{viewRequest.kode_request}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tanggal Pengajuan</span>
                  <span className="text-on-surface font-semibold font-mono">{viewRequest.tanggal_request}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Tujuan (Cabang Sumber)</span>
                  <span className="text-primary font-bold">{viewRequest.cabang_sumber}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block uppercase font-medium">Status Mutasi</span>
                  <span className="text-on-surface font-bold flex items-center gap-1 mt-0.5">
                    {viewRequest.status === "Selesai" ? (
                      <CheckCircle className="w-4 h-4 text-primary inline" />
                    ) : (
                      <Clock className="w-4 h-4 text-secondary inline" />
                    )}
                    {viewRequest.status}
                  </span>
                </div>
              </div>

              <div className="border border-outline-variant/45 rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="bg-surface-container-low px-4 py-2.5 border-b border-outline-variant/40 font-semibold text-on-surface-variant uppercase text-[10px]">
                  Daftar Barang yang Diminta
                </div>
                {loadingDetails ? (
                  <div className="py-8 text-center text-on-surface-variant">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Memuat detail...
                  </div>
                ) : viewDetails.length === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant">Tidak ada barang terdaftar.</div>
                ) : (
                  <div className="divide-y divide-outline-variant/20 max-h-48 overflow-y-auto">
                    {viewDetails.map((det) => (
                      <div key={det.id} className="p-3 flex justify-between items-center hover:bg-surface-container-high/10 transition-colors">
                        <div>
                          <span className="text-on-surface font-semibold block">{det.nama_barang}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono block">{det.barcode}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-on-surface font-bold block">{det.jumlah_diminta} {det.satuan_1}</span>
                          <span className="text-[10px] text-on-surface-variant uppercase font-sans font-medium">{det.status_item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end bg-surface-container-high/40">
              <button
                onClick={() => setViewRequest(null)}
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
