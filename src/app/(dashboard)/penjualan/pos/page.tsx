"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Ticket,
  HeartHandshake,
  DollarSign,
  Printer,
  Camera,
  RefreshCw,
  X,
  CreditCard,
  QrCode,
  AlertTriangle
} from "lucide-react";
import jsQR from "jsqr";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

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
  harga_rata: number | null;
  harga_jual_1_1: number | null;
  harga_jual_1_2: number | null;
  harga_jual_1_3: number | null;
  harga_jual_2_1: number | null;
  harga_jual_2_2: number | null;
  harga_jual_2_3: number | null;
  harga_jual_3_1: number | null;
  harga_jual_3_2: number | null;
  harga_jual_3_3: number | null;
  jual_rugi: number;
  status: string;
}

interface Pelanggan {
  id_pelanggan: number;
  kode_pelanggan: string;
  nama_lengkap: string;
  total_poin: number;
}

interface CartItem {
  id_barang: number;
  nama_barang: string;
  barcode: string;
  jumlah: number;
  satuan: string; // selected unit
  isi_satuan: number; // conversion
  harga_jual: number; // based on unit & customer tier
  harga_rata: number;
  diskon: number;
  subtotal: number;
}
interface CompletedInvoice {
  no_invoice: string;
  tanggal: string;
  jam: string;
  kembalian: number;
  nama_pelanggan: string;
  items: CartItem[];
  subtotal: number;
  nominal_voucher: number;
  potongan_poin: number;
  poin_digunakan: number;
  infaq: number;
  total_akhir: number;
  jenis_pembayaran: string;
  jumlah_bayar: number;
  poin_didapat: number;
}


export default function PosPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [products, setProducts] = useState<Barang[]>([]);
  const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Customer & Loyalty Poin
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [usePoints, setUsePoints] = useState(false);

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherValidating, setVoucherValidating] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: number; kode: string; nilai: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");

  // Infaq & Payments
  const [infaqVal, setInfaqVal] = useState("0");
  const [paymentType, setPaymentType] = useState("Tunai");
  const [cashGiven, setCashGiven] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashGivenInputRef = useRef<HTMLInputElement>(null);
  const infaqInputRef = useRef<HTMLInputElement>(null);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        // If there's an exact barcode match, prioritize it. Otherwise, take the first item.
        const exactMatch = filteredProducts.find(p => p.barcode === search.trim() || p.nama_barang.toLowerCase() === search.trim().toLowerCase());
        const target = exactMatch || filteredProducts[0];
        addToCart(target);
        setSearch("");
      }
    }
  };

  const handleCashGivenKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheckout();
    }
  };

  // Modals / Overlays
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<CompletedInvoice | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<any>(null);

  // Add Customer modal state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustNama, setNewCustNama] = useState("");
  const [newCustTelp, setNewCustTelp] = useState("");
  const [newCustAlamat, setNewCustAlamat] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Fetch initial data
  const loadData = useCallback(async () => {
    const [resProducts, resCustomers] = await Promise.all([
      fetch("/api/barang"),
      fetch("/api/pelanggan")
    ]);
    setProducts(await resProducts.json());
    setCustomers(await resCustomers.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);



  // Derive selectedCustomer from customers list — avoids setState-in-effect
  const selectedCustomer = customers.find((c) => c.id_pelanggan.toString() === selectedCustomerId) || null;

  // Points redemption logic: 1 point = Rp 100
  const pointsRate = 100;
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const voucherDiscount = appliedVoucher ? appliedVoucher.nilai : 0;
  
  // Calculate maximum points that can be redeemed without making total negative
  const tempTotal = Math.max(0, subtotal - voucherDiscount);
  const maxRedeemablePoints = selectedCustomer ? Math.min(selectedCustomer.total_poin, Math.floor(tempTotal / pointsRate)) : 0;
  
  // Derive pointsRedeemed from usePoints flag — avoids setState-in-effect
  const pointsRedeemed = (usePoints && selectedCustomer) ? maxRedeemablePoints : 0;

  const pointDiscount = pointsRedeemed * pointsRate;
  const infaq = parseInt(infaqVal) || 0;
  const totalAkhir = Math.max(0, subtotal - voucherDiscount - pointDiscount) + infaq;
  const cashChange = cashGiven ? Math.max(0, parseFloat(cashGiven) - totalAkhir) : 0;

  // Global Keyboard Shortcuts for POS Cashier
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;

      // F1: Fokus Cari / Scan
      if (e.key === "F1") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
      
      // F2: Fokus Uang Diterima
      if (e.key === "F2") {
        e.preventDefault();
        if (cashGivenInputRef.current) {
          cashGivenInputRef.current.focus();
          cashGivenInputRef.current.select();
        }
      }

      // F3: Toggle Metode Bayar
      if (e.key === "F3") {
        e.preventDefault();
        setPaymentType(prev => {
          if (prev === "Tunai") return "Transfer";
          if (prev === "Transfer") return "Kredit";
          return "Tunai";
        });
      }

      // F4: Set Uang Pas (Exact)
      if (e.key === "F4") {
        e.preventDefault();
        setCashGiven(totalAkhir.toString());
      }

      // F7: Fokus Infaq
      if (e.key === "F7") {
        e.preventDefault();
        if (infaqInputRef.current) {
          infaqInputRef.current.focus();
          infaqInputRef.current.select();
        }
      }

      // F8: Pelanggan Baru
      if (e.key === "F8") {
        e.preventDefault();
        setShowAddCustomerModal(true);
      }

      // F9: Cetak Struk (When success modal is open)
      if (e.key === "F9") {
        e.preventDefault();
        if (showCheckoutSuccess) {
          window.print();
        }
      }

      // F12: Selesaikan Transaksi
      if (e.key === "F12") {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
      }

      // Esc: Close Modals / Clear Cart
      if (e.key === "Escape") {
        if (showScanner) {
          stopCamera();
        } else if (showCheckoutSuccess) {
          setShowCheckoutSuccess(false);
        } else if (showAddCustomerModal) {
          setShowAddCustomerModal(false);
        } else {
          if (cart.length > 0 && confirm("Kosongkan keranjang belanja?")) {
            setCart([]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [totalAkhir, cart, showScanner, showCheckoutSuccess, showAddCustomerModal]);

  // Add Item to cart
  const addToCart = (prod: Barang, selectedUnitIndex = 1) => {
    // Determine selected unit & price
    let unit = prod.satuan_1 || "pcs";
    let isi = prod.isi_1 || 1;
    let price = prod.harga_jual_1_1 || 0; // Default Retail Satuan 1

    if (selectedUnitIndex === 2 && prod.satuan_2) {
      unit = prod.satuan_2;
      isi = prod.isi_2 || 1;
      price = prod.harga_jual_1_2 || 0;
    } else if (selectedUnitIndex === 3 && prod.satuan_3) {
      unit = prod.satuan_3;
      isi = prod.isi_3 || 1;
      price = prod.harga_jual_1_3 || 0;
    }

    const existingIndex = cart.findIndex((item) => item.id_barang === prod.id_barang && item.satuan === unit);
    
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].jumlah += 1;
      updated[existingIndex].subtotal = updated[existingIndex].jumlah * updated[existingIndex].harga_jual;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id_barang: prod.id_barang,
          nama_barang: prod.nama_barang,
          barcode: prod.barcode,
          jumlah: 1,
          satuan: unit,
          isi_satuan: isi,
          harga_jual: price,
          harga_rata: prod.harga_rata || prod.harga_beli || 0,
          diskon: 0,
          subtotal: price,
        }
      ]);
    }
  };

  const updateCartQty = (idx: number, diff: number) => {
    const updated = [...cart];
    updated[idx].jumlah = Math.max(1, updated[idx].jumlah + diff);
    updated[idx].subtotal = updated[idx].jumlah * updated[idx].harga_jual;
    setCart(updated);
  };

  const changeCartUnit = (idx: number, unitName: string, prod: Barang) => {
    const updated = [...cart];
    let price = prod.harga_jual_1_1 || 0;
    let isi = 1;

    if (unitName === prod.satuan_2) {
      price = prod.harga_jual_1_2 || 0;
      isi = prod.isi_2 || 1;
    } else if (unitName === prod.satuan_3) {
      price = prod.harga_jual_1_3 || 0;
      isi = prod.isi_3 || 1;
    }

    updated[idx].satuan = unitName;
    updated[idx].isi_satuan = isi;
    updated[idx].harga_jual = price;
    updated[idx].subtotal = updated[idx].jumlah * price;
    setCart(updated);
  };

  const removeFromCart = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Voucher validation lookup
  const validateVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherValidating(true);
    setVoucherError("");
    try {
      const res = await fetch(`/api/voucher?code=${encodeURIComponent(voucherCode)}`);
      const data = await res.json();
      if (data.valid) {
        setAppliedVoucher({
          id: data.voucher.id,
          kode: data.voucher.kode_voucher,
          nilai: data.voucher.nilai
        });
        setVoucherCode("");
      } else {
        setVoucherError(data.message || "Voucher tidak valid");
      }
    } catch {
      setVoucherError("Terjadi kesalahan memvalidasi voucher");
    } finally {
      setVoucherValidating(false);
    }
  };

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustNama.trim()) return;
    setAddingCustomer(true);
    try {
      const res = await fetch("/api/pelanggan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lengkap: newCustNama,
          telepon: newCustTelp,
          alamat: newCustAlamat
        })
      });
      const newCust = await res.json();
      setCustomers([...customers, newCust]);
      setSelectedCustomerId(newCust.id_pelanggan.toString());
      setShowAddCustomerModal(false);
      setNewCustNama("");
      setNewCustTelp("");
      setNewCustAlamat("");
    } catch {
      alert("Gagal menambahkan pelanggan baru");
    } finally {
      setAddingCustomer(false);
    }
  };

  // Webcam barcode scanner jsqr loop
  const startCamera = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play().catch((err) => {
          console.warn("Video playback was interrupted or prevented:", err);
        });
        scanIntervalRef.current = setInterval(scanBarcode, 300);
      }
    } catch {
      alert("Kamera tidak dapat diakses.");
      setShowScanner(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowScanner(false);
  };

  const scanBarcode = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Found a barcode! Look it up in products list
          const match = products.find((p) => p.barcode === code.data);
          if (match) {
            addToCart(match);
            stopCamera();
            // beep
            const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAG");
            audio.play().catch(() => {});
          }
        }
      }
    }
  };

  // Transaction Checkout POS
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Auto-earn points: Rp 10.000 = 1 point
    const pointsEarned = Math.floor(totalAkhir / 10000);

    const payload = {
      id_pelanggan: selectedCustomerId || null,
      nama_pelanggan: selectedCustomer?.nama_lengkap || "Umum",
      items: cart,
      subtotal,
      diskon: 0,
      nominal_voucher: voucherDiscount,
      potongan_poin: pointDiscount,
      poin_digunakan: pointsRedeemed,
      infaq,
      total_akhir: totalAkhir,
      jenis_pembayaran: paymentType,
      jumlah_bayar: cashGiven ? parseInt(cashGiven) : totalAkhir,
      id_voucher: appliedVoucher?.id || null,
      poin_didapat: pointsEarned,
    };

    try {
      const res = await fetch("/api/penjualan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Complete transaction! Show Receipt
        setCompletedInvoice({
          ...payload,
          no_invoice: data.no_invoice,
          tanggal: new Date().toLocaleDateString("id-ID"),
          jam: new Date().toLocaleTimeString("id-ID"),
          kembalian: cashChange
        });
        setShowCheckoutSuccess(true);
        
        // Reset POS state
        setCart([]);
        setSelectedCustomerId("");
        setAppliedVoucher(null);
        setInfaqVal("0");
        setCashGiven("");
        setUsePoints(false);
        // pointsRedeemed is derived — resets automatically when usePoints becomes false
        
        // Reload list for stock & loyalty point refresh
        setLoading(true);
        loadData();
      } else {
        alert("Gagal memproses transaksi: " + data.error);
      }
    } catch {
      alert("Error memproses transaksi kasir.");
    }
  };

  // Filtered catalog on POS
  const filteredProducts = products.filter(
    (p) =>
      p.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

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
    <div className="space-y-6 max-h-[88vh] flex flex-col md:grid md:grid-cols-12 gap-6 overflow-hidden">
      
      {/* BAGIAN KIRI: KATALOG BARANG & SCANNER (Col: 7) */}
      <div className="col-span-7 flex flex-col space-y-4 max-h-[85vh] overflow-hidden">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> POS Kasir
          </h1>
          <p className="text-on-background/70 text-xs mt-0.5">Input barang belian dan checkout instan.</p>
        </div>

        {/* Input Barcode & Search */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-on-surface-variant/60" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="[F1] Cari nama barang / scan barcode..."
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
              onFocus={() => setSearchFocused(true)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={startCamera}
            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3.5 py-2.5 rounded-xl hover:bg-primary/20 text-xs font-semibold transition-colors"
          >
            <Camera className="w-4 h-4" /> Scan Kamera
          </button>
        </div>

        {/* List Catalog Grid */}
        <div className="flex-1 bg-surface border border-outline-variant/30 rounded-2xl p-4 overflow-y-auto min-h-[40vh] max-h-[60vh] shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-full text-on-surface-variant">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-primary" /> Memuat katalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60 space-y-2">
              <ShoppingCart className="w-8 h-8 opacity-30 text-primary" />
              <span className="text-xs">Barang tidak ditemukan.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id_barang}
                  onClick={() => addToCart(p)}
                  className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 p-3 rounded-xl flex flex-col text-left space-y-2 transition-all hover:scale-[1.01] group cursor-pointer"
                >
                  <span className="text-on-surface text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">{p.nama_barang}</span>
                  <span className="text-[10px] text-on-surface-variant/70 font-mono">{p.barcode}</span>
                  <div className="flex justify-between items-center pt-1 mt-auto border-t border-outline-variant/20">
                    <span className="text-primary text-xs font-bold">{formatRupiah(p.harga_jual_1_1 || 0)}</span>
                    <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-md uppercase font-mono">{p.satuan_1}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BAGIAN KANAN: KERANJANG BELANJA & PEMBAYARAN (Col: 5) */}
      <div className="col-span-5 flex flex-col space-y-4 max-h-[85vh] overflow-hidden bg-surface-container border-l border-outline-variant/30 pl-4 md:pl-6 pr-1 shadow-inner">
        
        {/* Header Keranjang */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
          <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
            Keranjang Belanja <span className="bg-primary/15 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{cart.length}</span>
          </span>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-error hover:text-error/85 transition-colors font-semibold cursor-pointer">
              Kosongkan
            </button>
          )}
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[28vh] min-h-[15vh]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60 py-6">
              <ShoppingCart className="w-8 h-8 opacity-20 mb-1 text-primary" />
              <span className="text-xs">Keranjang masih kosong.</span>
            </div>
          ) : (
            cart.map((item, idx) => {
              const p = products.find((prod) => prod.id_barang === item.id_barang);
              return (
                <div key={`${item.id_barang}-${item.satuan}`} className="bg-surface border border-outline-variant/20 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex-1 space-y-1">
                    <span className="text-on-surface font-semibold block truncate max-w-[12rem]">{item.nama_barang}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-on-surface-variant/70 font-mono">{item.barcode}</span>
                      
                      {/* Dropdown Satuan */}
                      {p && (p.satuan_2 || p.satuan_3) ? (
                        <select
                          value={item.satuan}
                          onChange={(e) => changeCartUnit(idx, e.target.value, p)}
                          className="bg-surface-container-low border border-outline-variant/40 text-[10px] text-on-surface px-1 py-0.5 rounded focus:outline-none cursor-pointer"
                        >
                          <option value={p.satuan_1 || "pcs"}>{p.satuan_1}</option>
                          {p.satuan_2 && <option value={p.satuan_2}>{p.satuan_2}</option>}
                          {p.satuan_3 && <option value={p.satuan_3}>{p.satuan_3}</option>}
                        </select>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant uppercase font-medium">{item.satuan}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCartQty(idx, -1)} className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-on-surface font-semibold">{item.jumlah}</span>
                    <button onClick={() => updateCartQty(idx, 1)} className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right space-y-1 min-w-[5.5rem]">
                    <span className="text-primary font-semibold block">{formatRupiah(item.subtotal)}</span>
                    <span className="text-[9px] text-on-surface-variant/70 block">{formatRupiah(item.harga_jual)} / {item.satuan}</span>
                  </div>

                  <button onClick={() => removeFromCart(idx)} className="p-1 text-on-surface-variant/70 hover:text-error rounded transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Customer, Voucher, Infaq & Checkout Block */}
        <div className="bg-surface p-4 rounded-2xl border border-outline-variant/35 text-xs space-y-3 shadow-md">
          
          {/* Pilih Pelanggan */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-primary" /> Pelanggan
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="">Umum (Tanpa Poin)</option>
                {customers.filter((c) => c.nama_lengkap !== "Umum").map((c) => (
                  <option key={c.id_pelanggan} value={c.id_pelanggan}>
                    {c.nama_lengkap} ({c.total_poin} pts)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface p-2 rounded-lg transition-colors cursor-pointer"
              title="Tambah Pelanggan Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Loyalty Points Redeeming */}
          {selectedCustomer && selectedCustomer.total_poin > 0 && (
            <div className="bg-primary/10 border border-primary/25 p-2 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant block">Poin Tersedia: <strong className="text-primary font-bold">{selectedCustomer.total_poin} pts</strong></span>
                {maxRedeemablePoints > 0 ? (
                  <span className="text-[9px] text-on-surface-variant/70">Nilai Tukar: {formatRupiah(maxRedeemablePoints * pointsRate)}</span>
                ) : (
                  <span className="text-[9px] text-on-surface-variant/70">Subtotal tidak mencukupi untuk memotong poin</span>
                )}
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-on-surface font-semibold">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  disabled={maxRedeemablePoints === 0}
                  className="rounded border-outline-variant text-primary bg-surface-container-low focus:ring-0 cursor-pointer"
                /> Use Points
              </label>
            </div>
          )}

          {/* Voucher Code & Infaq Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Voucher input */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 flex items-center gap-1">
                <Ticket className="w-3 h-3 text-primary" /> Voucher Belanja
              </label>
              {appliedVoucher ? (
                <div className="bg-primary/15 border border-primary/25 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px]">
                  <span className="text-primary font-bold font-mono">{appliedVoucher.kode}</span>
                  <button onClick={() => setAppliedVoucher(null)} className="text-on-surface-variant hover:text-on-surface font-bold">&times;</button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="KODE"
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none font-mono placeholder:text-on-surface-variant/40"
                  />
                  <button
                    onClick={validateVoucher}
                    disabled={voucherValidating || !voucherCode}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    {voucherValidating ? "..." : "Cek"}
                  </button>
                </div>
              )}
              {voucherError && <span className="text-[9px] text-error font-medium block mt-0.5">{voucherError}</span>}
            </div>

            {/* Infaq input */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-semibold mb-1 flex items-center gap-1">
                <HeartHandshake className="w-3 h-3 text-primary" /> Infaq Shadaqah
              </label>
              <input
                ref={infaqInputRef}
                type="number"
                value={infaqVal}
                onChange={(e) => setInfaqVal(e.target.value)}
                placeholder="[F7] Rupiah"
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-1.5 text-xs text-right focus:outline-none"
              />
            </div>
          </div>

          {/* Kalkulasi Ringkasan Pembayaran */}
          <div className="border-t border-outline-variant/20 pt-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal:</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-error font-medium">
                <span>Potongan Voucher:</span>
                <span>-{formatRupiah(voucherDiscount)}</span>
              </div>
            )}
            {pointDiscount > 0 && (
              <div className="flex justify-between text-error font-medium">
                <span>Potongan Poin ({pointsRedeemed} pts):</span>
                <span>-{formatRupiah(pointDiscount)}</span>
              </div>
            )}
            {infaq > 0 && (
              <div className="flex justify-between text-primary font-medium">
                <span>Infaq Sukarela:</span>
                <span>+{formatRupiah(infaq)}</span>
              </div>
            )}
            <div className="flex justify-between text-on-surface font-extrabold text-sm border-t border-outline-variant/20 pt-1.5">
              <span>TOTAL AKHIR:</span>
              <span className="text-primary text-base font-black">{formatRupiah(totalAkhir)}</span>
            </div>
          </div>

          {/* Pembayaran & Uang Diterima */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-outline-variant/20">
            <div>
              <label className="block text-[10px] text-on-surface-variant font-semibold mb-1">Metode</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="Tunai">Tunai / Cash</option>
                <option value="Transfer">Transfer / QRIS</option>
                <option value="Kredit">Kredit</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-on-surface-variant font-semibold mb-1">Uang Diterima</label>
              <input
                ref={cashGivenInputRef}
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                onKeyDown={handleCashGivenKeyDown}
                placeholder={totalAkhir.toString()}
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-1.5 text-xs text-right focus:outline-none font-bold placeholder:text-on-surface-variant/40"
              />
              {/* Quick Cash Denomination Badges */}
              <div className="flex flex-wrap gap-1 mt-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setCashGiven(totalAkhir.toString())}
                  className="bg-primary/10 hover:bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded border border-primary/20 font-bold transition-all cursor-pointer"
                  title="Uang Pas (F4)"
                >
                  Pas
                </button>
                {[10000, 20000, 50000, 100000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashGiven(amount.toString())}
                    className="bg-surface-container-highest hover:bg-surface-container-high text-on-surface text-[9px] px-2 py-0.5 rounded border border-outline-variant/30 font-bold transition-all cursor-pointer"
                  >
                    {amount >= 1000 ? `${amount / 1000}k` : amount}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {cashGiven && parseFloat(cashGiven) > totalAkhir && (
            <div className="bg-secondary/10 border border-secondary/20 p-2.5 rounded-xl flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-semibold">UANG KEMBALIAN:</span>
              <strong className="text-secondary text-sm font-extrabold">{formatRupiah(cashChange)}</strong>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || !can_create}
            className="w-full bg-primary hover:bg-primary/95 text-on-primary disabled:opacity-40 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-2 text-xs shadow-lg shadow-primary/25 hover:shadow-primary/35 cursor-pointer"
            title={can_create ? "Selesaikan Transaksi (F12)" : "Akses Ditolak"}
          >
            <DollarSign className="w-4 h-4" /> {can_create ? "SELESAIKAN TRANSAKSI [F12]" : "TIDAK MEMILIKI AKSES TAMBAH"}
          </button>

        </div>

      </div>

      {/* WEBCAM SCANNER OVERLAY */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md overflow-hidden relative shadow-xl">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface flex items-center gap-1.5 text-sm">
                <QrCode className="w-4 h-4 text-primary" /> Scanner Barcode Kamera
              </h2>
              <button onClick={stopCamera} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col items-center">
              <div className="w-full aspect-video rounded-xl bg-black overflow-hidden relative border border-outline-variant/40">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-x-8 top-[35%] bottom-[35%] border-2 border-primary border-dashed rounded-lg opacity-60 animate-pulse pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] text-primary font-bold bg-black/50 px-2 py-0.5 rounded">TEMPATKAN BARCODE DI SINI</span>
                </div>
              </div>
              <p className="text-on-surface-variant text-[11px] mt-4 text-center">Arahkan kamera ke barcode produk (Indomie, Aqua, dll) secara terfokus.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINT NOTA (TRANSAKSI BERHASIL) */}
      {showCheckoutSuccess && completedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm my-8 overflow-hidden shadow-xl print:border-0 print:bg-white print:max-w-full print:my-0 print:shadow-none animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between print:hidden">
              <h2 className="font-semibold text-on-surface text-sm">Transaksi Berhasil!</h2>
              <button onClick={() => setShowCheckoutSuccess(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Receipt Body */}
              <div className="bg-white text-black p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-3 shadow-inner print:p-0 print:border-0 print:shadow-none">
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                  <h3 className="font-bold text-sm tracking-wider">ERP AL-MUBAROK</h3>
                  <p className="text-[10px]">Pondok Pesantren Al-Mubarok</p>
                  <p className="text-[9px]">Cabang Sukosari</p>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-gray-300 pb-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{completedInvoice.no_invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{completedInvoice.tanggal} {completedInvoice.jam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>Kasir Toko</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{completedInvoice.nama_pelanggan}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
                  {completedInvoice.items.map((item: CartItem) => (
                    <div key={`${item.id_barang}-${item.satuan}`} className="space-y-0.5">
                      <span className="font-semibold">{item.nama_barang}</span>
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span>{item.jumlah} x {formatRupiah(item.harga_jual)} / {item.satuan}</span>
                        <span>{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Calc */}
                <div className="space-y-1 text-right text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal Belanja:</span>
                    <span>{formatRupiah(completedInvoice.subtotal)}</span>
                  </div>
                  {completedInvoice.nominal_voucher > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Voucher Discount:</span>
                      <span>-{formatRupiah(completedInvoice.nominal_voucher)}</span>
                    </div>
                  )}
                  {completedInvoice.potongan_poin > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Poin Discount ({completedInvoice.poin_digunakan} pts):</span>
                      <span>-{formatRupiah(completedInvoice.potongan_poin)}</span>
                    </div>
                  )}
                  {completedInvoice.infaq > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Infaq Shadaqah:</span>
                      <span>+{formatRupiah(completedInvoice.infaq)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[12px] border-t border-dashed border-gray-300 pt-1.5 text-black">
                    <span>TOTAL BILL:</span>
                    <span>{formatRupiah(completedInvoice.total_akhir)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 pt-0.5">
                    <span>Uang Diterima:</span>
                    <span>{formatRupiah(completedInvoice.jumlah_bayar)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[11px] text-black">
                    <span>Uang Kembalian:</span>
                    <span>{formatRupiah(completedInvoice.kembalian)}</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-dashed border-gray-300 text-[9px] space-y-1">
                  <p className="font-bold">*** TERIMA KASIH ***</p>
                  <p>Infaq yang Anda berikan insyaAllah barokah.</p>
                  <p>Simpan nota ini sebagai bukti transaksi resmi.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-secondary/15 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak Struk
                </button>
                <button
                  onClick={() => setShowCheckoutSuccess(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Tutup & POS Baru
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL TAMBAH PELANGGAN BARU */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface text-sm">Pelanggan Baru</h2>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant mb-1.5 font-medium">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newCustNama}
                  onChange={(e) => setNewCustNama(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/80"
                  placeholder="Nama lengkap pelanggan"
                  required
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1.5 font-medium">No. Telepon</label>
                <input
                  type="text"
                  value={newCustTelp}
                  onChange={(e) => setNewCustTelp(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/80"
                  placeholder="0812xxxxxx"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1.5 font-medium">Alamat</label>
                <input
                  type="text"
                  value={newCustAlamat}
                  onChange={(e) => setNewCustAlamat(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/80"
                  placeholder="Alamat domisili"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddCustomerModal(false)} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2 rounded-lg transition-colors">Batal</button>
                <button onClick={handleAddCustomer} disabled={addingCustomer || !newCustNama} className="flex-1 bg-primary hover:bg-primary/95 text-on-primary py-2 rounded-lg font-bold transition-all shadow-md shadow-primary/10">
                  {addingCustomer ? "..." : "Tambah"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY CSS RULES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-invoice-modal, #print-invoice-modal * {
            visibility: visible;
          }
          /* Hide other elements during print */
          .print\\:hidden, button, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>

      {/* BARIS SHORTCUT TOMBOL (KEYBOARD LEGEND) */}
      <div className="col-span-12 bg-surface border border-outline-variant/35 rounded-2xl p-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] text-on-surface-variant font-bold shadow-sm no-print mt-2">
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F1</span>
          <span>Cari / Scan</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F2</span>
          <span>Uang Bayar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F3</span>
          <span>Metode Bayar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F4</span>
          <span>Uang Pas</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F7</span>
          <span>Infaq</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F8</span>
          <span>Pelanggan Baru</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F9</span>
          <span>Cetak Struk</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">F12</span>
          <span>Selesaikan Transaksi</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[9px] border border-primary/20">Esc</span>
          <span>Batal / Tutup</span>
        </div>
      </div>

    </div>
  );
}
