"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Percent,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  PlusCircle,
  MinusCircle,
  Building,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

interface Branch {
  id_cabang: number;
  nama_cabang: string;
}

interface Category {
  id_kategori: number;
  nama_kategori: string;
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

interface PromoListItem {
  id_promo: number;
  nama_promo: string;
  tipe_promo: string;
  deskripsi: string | null;
  berlaku_untuk: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  berlaku_kelipatan: number;
  id_cabang_pembuat: number | null;
  created_at: string | null;
}

// Tailored item interfaces for the state
interface ProductItem {
  id_barang: number;
  nama_barang: string;
  jumlah: number;
  id_satuan: number;
}

interface DiskonBarangItem {
  id_barang: number;
  nama_barang: string;
  jumlah: number;
  id_satuan: number;
  jenis_diskon: "PERSEN" | "NOMINAL";
  nilai_diskon: number;
  berlaku_kelipatan: boolean;
}

interface PoinBarangItem {
  id_barang: number;
  nama_barang: string;
  jumlah_barang: number;
  id_satuan: number;
  jumlah_poin: number;
  berlaku_kelipatan: boolean;
}

interface TebusMurahItem {
  id_barang: number;
  nama_barang: string;
  jumlah: number;
  id_satuan: number;
  harga_tebus: number;
}

export default function PromoPage() {
  const [list, setList] = useState<PromoListItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [typeFilter, setTypeFilter] = useState("Semua");

  // Lookup dictionaries
  const [branchMap, setBranchMap] = useState<{ [id: number]: string }>({});
  const [categoryMap, setCategoryMap] = useState<{ [id: number]: string }>({});
  const [supplierMap, setSupplierMap] = useState<{ [id: number]: string }>({});

  // Dialog Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailedPromo, setDetailedPromo] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [wizardStep, setWizardStep] = useState(1); // 1: General Info, 2: Rules & Rewards
  const [saving, setSaving] = useState(false);

  // --- Wizard Form States ---
  const [namaPromo, setNamaPromo] = useState("");
  const [tipePromo, setTipePromo] = useState("BELI_GRATIS");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [berlakuKelipatan, setBerlakuKelipatan] = useState(false);
  const [berlakuUntuk, setBerlakuUntuk] = useState("UMUM"); // "UMUM", "1", "2", "3"
  const [selectedCabang, setSelectedCabang] = useState<number[]>([]);

  // Child states for conditional configuration
  const [minimumPembelanjaan, setMinimumPembelanjaan] = useState(0);
  const [syaratBelanjaKelipatan, setSyaratBelanjaKelipatan] = useState(false);
  const [kategoriIds, setKategoriIds] = useState<number[]>([]);
  const [supplierIds, setSupplierIds] = useState<number[]>([]);
  const [hadiahPoinHadiah, setHadiahPoinHadiah] = useState(0);
  const [jenisDiskonHadiah, setJenisDiskonHadiah] = useState<"PERSEN" | "NOMINAL">("PERSEN");
  const [nilaiDiskonHadiah, setNilaiDiskonHadiah] = useState(0);

  // Lists of products associated with specific promo configs
  const [syaratBeli, setSyaratBeli] = useState<ProductItem[]>([]);
  const [hadiahGratis, setHadiahGratis] = useState<ProductItem[]>([]);
  const [diskonBarang, setDiskonBarang] = useState<DiskonBarangItem[]>([]);
  const [poinBarang, setPoinBarang] = useState<PoinBarangItem[]>([]);
  const [hadiahBarang, setHadiahBarang] = useState<ProductItem[]>([]);
  const [tebusMurah, setTebusMurah] = useState<TebusMurahItem[]>([]);
  const [idBarangTertentu, setIdBarangTertentu] = useState<{ id_barang: number; nama_barang: string }[]>([]);

  // Product Autocomplete States
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string>(""); // e.g. "syarat_beli", "hadiah_gratis", "diskon_barang", "poin_barang", "hadiah_barang", "tebus_murah", "syarat_barang_tertentu"

  // Load Main Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Promos
      const res = await fetch("/api/promo");
      const data = await res.json();
      if (Array.isArray(data)) {
        setList(data);
      } else {
        console.error("Gagal memuat daftar promo:", data?.error || data);
        setList([]);
      }

      // 2. Fetch Branches
      const branchRes = await fetch("/api/cabang");
      const branchData = await branchRes.json();
      setBranches(branchData);
      const bMap: any = {};
      branchData.forEach((b: Branch) => {
        bMap[b.id_cabang] = b.nama_cabang;
      });
      setBranchMap(bMap);

      // 3. Fetch Categories
      const katRes = await fetch("/api/kategori");
      const katData = await katRes.json();
      setCategories(katData);
      const kMap: any = {};
      katData.forEach((k: Category) => {
        kMap[k.id_kategori] = k.nama_kategori;
      });
      setCategoryMap(kMap);

      // 4. Fetch Suppliers
      const supRes = await fetch("/api/supplier");
      const supData = await supRes.json();
      setSuppliers(supData);
      const sMap: any = {};
      supData.forEach((s: Supplier) => {
        sMap[s.id_supplier] = s.nama_supplier;
      });
      setSupplierMap(sMap);
    } catch (err) {
      console.error("Gagal memuat data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Autocomplete Product Search
  const handleProductSearch = async (term: string) => {
    setProductQuery(term);
    if (!term.trim()) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/barang?q=${term}`);
      const data = await res.json();
      setProductResults(data.slice(0, 8)); // Limit to top 8
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingProducts(false);
    }
  };

  const addProductToTarget = (prod: any) => {
    if (activeTarget === "syarat_beli") {
      if (syaratBeli.some((p) => p.id_barang === prod.id_barang)) return;
      setSyaratBeli([...syaratBeli, { id_barang: prod.id_barang, nama_barang: prod.nama_barang, jumlah: 1, id_satuan: 1 }]);
    } else if (activeTarget === "hadiah_gratis") {
      if (hadiahGratis.some((p) => p.id_barang === prod.id_barang)) return;
      setHadiahGratis([...hadiahGratis, { id_barang: prod.id_barang, nama_barang: prod.nama_barang, jumlah: 1, id_satuan: 1 }]);
    } else if (activeTarget === "diskon_barang") {
      if (diskonBarang.some((p) => p.id_barang === prod.id_barang)) return;
      setDiskonBarang([...diskonBarang, { id_barang: prod.id_barang, nama_barang: prod.nama_barang, jumlah: 1, id_satuan: 1, jenis_diskon: "PERSEN", nilai_diskon: 0, berlaku_kelipatan: false }]);
    } else if (activeTarget === "poin_barang") {
      if (poinBarang.some((p) => p.id_barang === prod.id_barang)) return;
      setPoinBarang([...poinBarang, { id_barang: prod.id_barang, nama_barang: prod.nama_barang, jumlah_barang: 1, id_satuan: 1, jumlah_poin: 0, berlaku_kelipatan: false }]);
    } else if (activeTarget === "hadiah_barang") {
      if (hadiahBarang.some((p) => p.id_barang === prod.id_barang)) return;
      setHadiahBarang([...hadiahBarang, { id_barang: prod.id_barang, nama_barang: prod.nama_barang, jumlah: 1, id_satuan: 1 }]);
    } else if (activeTarget === "tebus_murah") {
      if (tebusMurah.some((p) => p.id_barang === prod.id_barang)) return;
      setTebusMurah([...tebusMurah, { id_barang: prod.id_barang, nama_barang: prod.nama_barang, jumlah: 1, id_satuan: 1, harga_tebus: 0 }]);
    } else if (activeTarget === "syarat_barang_tertentu") {
      if (idBarangTertentu.some((p) => p.id_barang === prod.id_barang)) return;
      setIdBarangTertentu([...idBarangTertentu, { id_barang: prod.id_barang, nama_barang: prod.nama_barang }]);
    }
    
    // Clear autocomplete
    setProductQuery("");
    setProductResults([]);
    setActiveTarget("");
  };

  // Main CRUD actions
  const openDetail = async (id: number) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const res = await fetch(`/api/promo?id=${id}`);
      const data = await res.json();
      setDetailedPromo(data);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat detail promo");
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openCreateWizard = () => {
    setWizardType("create");
    setEditingId(null);
    setWizardStep(1);
    
    // Reset inputs
    setNamaPromo("");
    setTipePromo("BELI_GRATIS");
    setDeskripsi("");
    setTanggalMulai("");
    setTanggalSelesai("");
    setStatus("Aktif");
    setBerlakuKelipatan(false);
    setBerlakuUntuk("UMUM");
    setSelectedCabang(branches.map((b) => b.id_cabang)); // Default all branches selected
    
    setMinimumPembelanjaan(0);
    setSyaratBelanjaKelipatan(false);
    setKategoriIds([]);
    setSupplierIds([]);
    setHadiahPoinHadiah(0);
    setJenisDiskonHadiah("PERSEN");
    setNilaiDiskonHadiah(0);

    setSyaratBeli([]);
    setHadiahGratis([]);
    setDiskonBarang([]);
    setPoinBarang([]);
    setHadiahBarang([]);
    setTebusMurah([]);
    setIdBarangTertentu([]);

    setShowWizard(true);
  };

  const openEditWizard = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/promo?id=${id}`);
      const data = await res.json();

      setWizardType("edit");
      setEditingId(id);
      setWizardStep(1);

      const p = data.promo;
      setNamaPromo(p.nama_promo);
      setTipePromo(p.tipe_promo);
      setDeskripsi(p.deskripsi || "");
      setTanggalMulai(p.tanggal_mulai ? p.tanggal_mulai.slice(0, 10) : "");
      setTanggalSelesai(p.tanggal_selesai ? p.tanggal_selesai.slice(0, 10) : "");
      setStatus(p.status);
      setBerlakuKelipatan(p.berlaku_kelipatan === 1);
      setBerlakuUntuk(p.berlaku_untuk);
      setSelectedCabang(data.cabang || []);

      if (data.syarat_pembelanjaan) {
        setMinimumPembelanjaan(data.syarat_pembelanjaan.minimum_pembelanjaan);
        setSyaratBelanjaKelipatan(data.syarat_pembelanjaan.berlaku_kelipatan === 1);
      } else {
        setMinimumPembelanjaan(0);
        setSyaratBelanjaKelipatan(false);
      }

      setKategoriIds(data.kategori || []);
      setSupplierIds(data.supplier || []);
      
      if (data.hadiah_poin) {
        setHadiahPoinHadiah(data.hadiah_poin.jumlah_poin);
      } else {
        setHadiahPoinHadiah(0);
      }

      if (data.hadiah_diskon) {
        setJenisDiskonHadiah(data.hadiah_diskon.jenis_diskon);
        setNilaiDiskonHadiah(data.hadiah_diskon.nilai_diskon);
      } else {
        setJenisDiskonHadiah("PERSEN");
        setNilaiDiskonHadiah(0);
      }

      // Map joined barang arrays
      setIdBarangTertentu(data.syarat_barang_tertentu || []);
      setSyaratBeli(data.syarat_beli || []);
      setHadiahGratis(data.hadiah_gratis || []);
      
      setDiskonBarang((data.diskon_barang || []).map((x: any) => ({
        ...x,
        berlaku_kelipatan: x.berlaku_kelipatan === 1
      })));

      setPoinBarang((data.poin_barang || []).map((x: any) => ({
        ...x,
        berlaku_kelipatan: x.berlaku_kelipatan === 1
      })));

      setHadiahBarang(data.hadiah_barang || []);
      setTebusMurah(data.tebus_murah || []);

      setShowWizard(true);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data edit");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromo = async () => {
    if (!namaPromo.trim()) {
      alert("Nama promo wajib diisi.");
      return;
    }
    if (!tanggalMulai || !tanggalSelesai) {
      alert("Tanggal mulai dan selesai wajib diisi.");
      return;
    }
    if (selectedCabang.length === 0) {
      alert("Pilih minimal satu cabang yang memberlakukan promo ini.");
      return;
    }

    setSaving(true);

    const payload = {
      nama_promo: namaPromo,
      tipe_promo: tipePromo,
      deskripsi,
      berlaku_untuk: berlakuUntuk,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      status,
      berlaku_kelipatan: berlakuKelipatan,
      id_cabang_pembuat: selectedCabang[0] || null,
      
      id_cabang: selectedCabang,
      syarat_pembelanjaan: {
        minimum_pembelanjaan: minimumPembelanjaan,
        berlaku_kelipatan: syaratBelanjaKelipatan
      },
      id_kategori: kategoriIds,
      id_supplier: supplierIds,
      hadiah_poin: hadiahPoinHadiah,
      hadiah_diskon: {
        jenis_diskon: jenisDiskonHadiah,
        nilai_diskon: nilaiDiskonHadiah
      },
      id_barang_tertentu: idBarangTertentu.map(b => b.id_barang),
      syarat_beli: syaratBeli,
      hadiah_gratis: hadiahGratis,
      diskon_barang: diskonBarang,
      poin_barang: poinBarang,
      hadiah_barang: hadiahBarang,
      tebus_murah: tebusMurah
    };

    try {
      const url = wizardType === "create" ? "/api/promo" : `/api/promo/${editingId}`;
      const method = wizardType === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan promo");
      }

      setShowWizard(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus promo ini secara permanen?\nSeluruh data syarat dan aturan promo yang terikat akan dihapus secara otomatis.")) return;
    try {
      const res = await fetch(`/api/promo/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert("Gagal menghapus promo: " + (err.error || ""));
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memproses penghapusan.");
    }
  };

  // Helper utility functions
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getTipeBadge = (tipe: string) => {
    const formatted = tipe.replace(/_/g, " ");
    let color = "bg-primary/10 text-primary border-primary/20";
    if (tipe.includes("DISKON")) color = "bg-green-500/10 text-green-400 border-green-500/20";
    else if (tipe.includes("POIN")) color = "bg-purple-500/10 text-purple-400 border-purple-500/20";
    else if (tipe.includes("TEBUS")) color = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    else if (tipe.includes("GRATIS")) color = "bg-sky-500/10 text-sky-400 border-sky-500/20";

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${color}`}>
        {formatted}
      </span>
    );
  };

  const getStatusBadge = (statusStr: string) => {
    if (statusStr === "Aktif") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/25">
          <CheckCircle2 className="w-3 h-3 text-green-400" /> Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/25">
        <AlertCircle className="w-3 h-3 text-slate-400" /> Non-Aktif
      </span>
    );
  };

  const getEligibleLabel = (level: string) => {
    switch (level) {
      case "1":
        return "Silver";
      case "2":
        return "Gold";
      case "3":
        return "Platinum";
      default:
        return "Semua Pelanggan";
    }
  };

  const getSatuanLabel = (idSatuan: number) => {
    if (idSatuan === 3) return "Satuan 3";
    if (idSatuan === 2) return "Satuan 2";
    return "Satuan 1";
  };

  // Filter Logic
  const filteredList = list.filter((item) => {
    const matchesSearch = item.nama_promo.toLowerCase().includes(search.toLowerCase()) || 
                          item.tipe_promo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Semua" || item.status === statusFilter;
    const matchesType = typeFilter === "Semua" || item.tipe_promo === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 text-on-background">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2.5">
            <Tags className="w-7 h-7 text-primary animate-pulse" /> Manajemen Promo
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Konfigurasi mesin promosi penjualan, bonus poin belanja, tebus murah, dan program loyalitas cabang
          </p>
        </div>

        <button
          onClick={openCreateWizard}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-md hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Buat Promo Baru
        </button>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Total Program</span>
            <strong className="text-xl font-bold font-mono text-on-surface">{list.length} Promo</strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-green-500/10 rounded-2xl text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Promo Aktif</span>
            <strong className="text-xl font-bold font-mono text-on-surface">
              {list.filter(p => p.status === "Aktif").length} Promo
            </strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-purple-500/10 rounded-2xl text-purple-400">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Poin & Loyalitas</span>
            <strong className="text-xl font-bold font-mono text-on-surface">
              {list.filter(p => p.tipe_promo.includes("POIN")).length} Program
            </strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-500">
            <Percent className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Diskon Penjualan</span>
            <strong className="text-xl font-bold font-mono text-on-surface">
              {list.filter(p => p.tipe_promo.includes("DISKON")).length} Program
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari promo berdasarkan nama atau jenis..."
            className="w-full bg-surface border border-outline-variant/30 text-on-surface placeholder-on-surface-variant/60 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm min-w-[130px]"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-Aktif">Non-Aktif</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm min-w-[200px]"
          >
            <option value="Semua">Semua Jenis Promo</option>
            <option value="BELI_GRATIS">Beli A Gratis B</option>
            <option value="DISKON_BARANG">Diskon Produk</option>
            <option value="POIN_BARANG">Poin Produk</option>
            <option value="DISKON_PEMBELANJAAN">Diskon Pembelian</option>
            <option value="POIN_PEMBELANJAAN">Poin Pembelian</option>
            <option value="GRATIS_BARANG_PEMBELANJAAN">Gratis Barang Pembelian</option>
            <option value="TEBUS_MURAH">Tebus Murah</option>
            <option value="TEBUS_MURAH_BARANG_TERTENTU">Tebus Murah Produk</option>
            <option value="DISKON_BELANJA_BARANG_TERTENTU">Diskon Pembelian Produk</option>
            <option value="GRATIS_BARANG_BELANJA_TERTENTU">Gratis Barang Produk</option>
          </select>

          <button
            onClick={loadData}
            className="flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-4 py-3.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Segarkan
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs">Memuat skema aturan mesin promosi...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-sm">
            <Tags className="w-16 h-16 mb-4 opacity-20 text-primary animate-pulse" />
            <p className="font-semibold text-on-surface">Tidak ada program promosi terdaftar</p>
            <p className="text-xs text-on-surface-variant mt-1">Coba buat promo baru untuk mengaktifkan aturan kasir</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 w-12 text-center">No</th>
                  <th className="px-6 py-4">Nama Program Promo</th>
                  <th className="px-6 py-4">Tipe Aturan Kasir</th>
                  <th className="px-6 py-4">Periode Berlaku</th>
                  <th className="px-6 py-4">Sasaran Pelanggan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {filteredList.map((item, idx) => (
                  <tr key={item.id_promo} className="hover:bg-surface-container-high/25 transition-colors">
                    <td className="px-6 py-4 text-center text-on-surface-variant font-mono">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface text-sm">{item.nama_promo}</div>
                      {item.deskripsi && (
                        <div className="text-[10px] text-on-surface-variant/80 mt-1 max-w-sm truncate" title={item.deskripsi}>
                          {item.deskripsi}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getTipeBadge(item.tipe_promo)}</td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-semibold font-mono">
                        <Calendar className="w-3.5 h-3.5 text-primary/70" />
                        {formatDate(item.tanggal_mulai)}
                      </div>
                      <div className="text-[10px] text-on-surface-variant pl-5">
                        s.d. {formatDate(item.tanggal_selesai)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-medium text-on-surface shadow-sm">
                        {getEligibleLabel(item.berlaku_untuk)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetail(item.id_promo)}
                          className="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-150 cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditWizard(item.id_promo)}
                          className="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-150 cursor-pointer"
                          title="Edit Aturan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_promo)}
                          className="p-2 hover:bg-error/10 hover:text-error text-on-surface-variant rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-150 cursor-pointer"
                          title="Hapus Promo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* 1. COMPREHENSIVE DETAIL MODAL */}
      {/* ======================================= */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-surface border border-outline-variant/60 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-3">
                <Tags className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-bold text-on-surface text-lg">
                    {loadingDetail ? "Memuat..." : detailedPromo?.promo?.nama_promo}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                    Detil Rinci Mekanisme & Parameter Aturan Kasir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors hover:scale-105 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-xs">Mengunduh relasi database promo...</p>
                </div>
              ) : detailedPromo ? (
                <>
                  {/* Grid 1: Basic Info */}
                  <div className="bg-surface-container-low border border-outline-variant/25 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4" /> Ringkasan Promo
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-on-surface-variant font-medium">Tipe Aturan</span>
                        <div className="mt-1">{getTipeBadge(detailedPromo.promo.tipe_promo)}</div>
                      </div>
                      <div>
                        <span className="text-on-surface-variant font-medium">Status Kasir</span>
                        <div className="mt-1">{getStatusBadge(detailedPromo.promo.status)}</div>
                      </div>
                      <div>
                        <span className="text-on-surface-variant font-medium">Sasaran Level Harga</span>
                        <p className="text-on-surface font-semibold mt-1">
                          {getEligibleLabel(detailedPromo.promo.berlaku_untuk)}
                        </p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant font-medium">Kelipatan Transaksi</span>
                        <p className="text-on-surface font-semibold mt-1">
                          {detailedPromo.promo.berlaku_kelipatan === 1 ? "Berlaku Kelipatan" : "Tidak Berlaku Kelipatan"}
                        </p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant font-medium">Tanggal Berlaku Mulai</span>
                        <p className="text-on-surface font-bold font-mono mt-1">
                          {formatDate(detailedPromo.promo.tanggal_mulai)}
                        </p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant font-medium">Selesai Berakhir</span>
                        <p className="text-on-surface font-bold font-mono mt-1">
                          {formatDate(detailedPromo.promo.tanggal_selesai)}
                        </p>
                      </div>
                    </div>

                    {detailedPromo.promo.deskripsi && (
                      <div className="pt-2 border-t border-outline-variant/30 text-xs">
                        <span className="text-on-surface-variant font-medium block mb-1">Deskripsi</span>
                        <p className="text-on-surface leading-relaxed bg-surface p-3 rounded-xl border border-outline-variant/10 text-[11px]">
                          {detailedPromo.promo.deskripsi}
                        </p>
                      </div>
                    )}

                    {/* Branches */}
                    <div className="pt-2 border-t border-outline-variant/30 text-xs">
                      <span className="text-on-surface-variant font-medium block mb-1.5 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-primary" /> Cabang yang Memberlakukan ({detailedPromo.cabang?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {detailedPromo.cabang?.length > 0 ? (
                          detailedPromo.cabang.map((cid: number) => (
                            <span key={cid} className="px-2.5 py-1 rounded bg-surface border border-outline-variant/15 font-mono text-[10px] text-on-surface font-medium">
                              {branchMap[cid] || `Cabang #${cid}`}
                            </span>
                          ))
                        ) : (
                          <span className="text-on-surface-variant italic">Belum ditentukan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Syarat Aturan (Conditions) */}
                  <div className="bg-surface-container-low border border-outline-variant/25 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Parameter Syarat & Validasi Kasir
                    </h4>

                    {detailedPromo.syarat_pembelanjaan && (
                      <div className="text-xs border-b border-outline-variant/20 pb-3 flex justify-between items-center">
                        <div>
                          <span className="text-on-surface-variant font-medium block">Minimum Pembelanjaan</span>
                          <span className="text-sm font-bold text-on-surface font-mono">
                            {formatRupiah(detailedPromo.syarat_pembelanjaan.minimum_pembelanjaan)}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25 text-[10px] font-bold">
                          {detailedPromo.syarat_pembelanjaan.berlaku_kelipatan === 1 ? "Kelipatan Berlaku" : "Sekali Pakai"}
                        </span>
                      </div>
                    )}

                    {detailedPromo.kategori && detailedPromo.kategori.length > 0 && (
                      <div className="text-xs border-b border-outline-variant/20 pb-3">
                        <span className="text-on-surface-variant font-medium block mb-1.5">Syarat Kategori Produk</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailedPromo.kategori.map((kid: number) => (
                            <span key={kid} className="px-2.5 py-0.5 rounded bg-primary/5 text-primary text-[10px] border border-primary/20">
                              {categoryMap[kid] || `Kategori #${kid}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {detailedPromo.supplier && detailedPromo.supplier.length > 0 && (
                      <div className="text-xs border-b border-outline-variant/20 pb-3">
                        <span className="text-on-surface-variant font-medium block mb-1.5">Syarat Supplier Produk</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailedPromo.supplier.map((sid: number) => (
                            <span key={sid} className="px-2.5 py-0.5 rounded bg-primary/5 text-primary text-[10px] border border-primary/20">
                              {supplierMap[sid] || `Supplier #${sid}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products syarat_barang_tertentu */}
                    {detailedPromo.syarat_barang_tertentu && detailedPromo.syarat_barang_tertentu.length > 0 && (
                      <div className="text-xs border-b border-outline-variant/20 pb-3">
                        <span className="text-on-surface-variant font-medium block mb-1.5">Batasan Produk Tertentu</span>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {detailedPromo.syarat_barang_tertentu.map((item: any) => (
                            <div key={item.id_barang} className="p-2 bg-surface rounded-lg border border-outline-variant/10 font-mono text-[10px] text-on-surface font-semibold">
                              {item.nama_barang || `Barang #${item.id_barang}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Syarat Beli Table (BELI_GRATIS) */}
                    {detailedPromo.syarat_beli && detailedPromo.syarat_beli.length > 0 && (
                      <div className="text-xs border-b border-outline-variant/20 pb-3 space-y-2">
                        <span className="text-on-surface-variant font-medium block">Daftar Produk yang Wajib Dibeli</span>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-container-high font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2 pl-3">Produk</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2 text-center w-24">Satuan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {detailedPromo.syarat_beli.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="p-2 pl-3 font-semibold">{item.nama_barang || `Barang #${item.id_barang}`}</td>
                                  <td className="p-2 text-right font-mono font-bold">{item.jumlah}</td>
                                  <td className="p-2 text-center text-on-surface-variant font-mono">{getSatuanLabel(item.id_satuan)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* If no conditions shown */}
                    {!detailedPromo.syarat_pembelanjaan && 
                     (!detailedPromo.kategori || detailedPromo.kategori.length === 0) &&
                     (!detailedPromo.supplier || detailedPromo.supplier.length === 0) &&
                     (!detailedPromo.syarat_barang_tertentu || detailedPromo.syarat_barang_tertentu.length === 0) &&
                     (!detailedPromo.syarat_beli || detailedPromo.syarat_beli.length === 0) && (
                       <p className="text-xs text-on-surface-variant italic py-2">Promo ini tidak memiliki kondisi khusus. Aturan di kasir akan berlaku umum sesuai tipe promosi.</p>
                     )}
                  </div>

                  {/* Grid 3: Hadiah (Rewards) */}
                  <div className="bg-surface-container-low border border-outline-variant/25 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Percent className="w-4 h-4" /> Hadiah & Bonus yang Diperoleh
                    </h4>

                    {detailedPromo.hadiah_poin && (
                      <div className="text-xs p-3.5 bg-purple-500/5 rounded-xl border border-purple-500/25 flex justify-between items-center">
                        <span className="font-bold text-purple-400">Bonus Saldo Poin Belanja</span>
                        <strong className="text-sm font-extrabold font-mono text-purple-400">
                          +{detailedPromo.hadiah_poin.jumlah_poin} POIN
                        </strong>
                      </div>
                    )}

                    {detailedPromo.hadiah_diskon && (
                      <div className="text-xs p-3.5 bg-green-500/5 rounded-xl border border-green-500/25 flex justify-between items-center">
                        <span className="font-bold text-green-400">Nilai Diskon Langsung</span>
                        <strong className="text-sm font-extrabold font-mono text-green-400">
                          {detailedPromo.hadiah_diskon.jenis_diskon === "PERSEN"
                            ? `${detailedPromo.hadiah_diskon.nilai_diskon}%`
                            : formatRupiah(detailedPromo.hadiah_diskon.nilai_diskon)}
                        </strong>
                      </div>
                    )}

                    {/* Hadiah Gratis Table */}
                    {detailedPromo.hadiah_gratis && detailedPromo.hadiah_gratis.length > 0 && (
                      <div className="text-xs space-y-2">
                        <span className="text-on-surface-variant font-medium block">Daftar Produk yang Diberikan Gratis</span>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-container-high font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2 pl-3">Produk Gratis</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2 text-center w-24">Satuan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {detailedPromo.hadiah_gratis.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="p-2 pl-3 font-semibold text-green-400">{item.nama_barang || `Barang #${item.id_barang}`}</td>
                                  <td className="p-2 text-right font-mono font-bold">{item.jumlah}</td>
                                  <td className="p-2 text-center text-on-surface-variant font-mono">{getSatuanLabel(item.id_satuan)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Diskon Barang Table */}
                    {detailedPromo.diskon_barang && detailedPromo.diskon_barang.length > 0 && (
                      <div className="text-xs space-y-2">
                        <span className="text-on-surface-variant font-medium block">Aturan Potongan Harga Khusus Produk</span>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-container-high font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2 pl-3">Nama Produk</th>
                                <th className="p-2 text-right">Min Qty</th>
                                <th className="p-2 text-center">Satuan</th>
                                <th className="p-2 text-right">Besaran Diskon</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 font-mono">
                              {detailedPromo.diskon_barang.map((item: any) => (
                                <tr key={item.id} className="text-xs">
                                  <td className="p-2 pl-3 font-sans font-semibold text-on-surface">{item.nama_barang || `Barang #${item.id_barang}`}</td>
                                  <td className="p-2 text-right font-bold">{item.jumlah}</td>
                                  <td className="p-2 text-center text-on-surface-variant">{getSatuanLabel(item.id_satuan)}</td>
                                  <td className="p-2 text-right font-bold text-green-400">
                                    {item.jenis_diskon === "PERSEN" ? `${item.nilai_diskon}%` : formatRupiah(item.nilai_diskon)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Poin Barang Table */}
                    {detailedPromo.poin_barang && detailedPromo.poin_barang.length > 0 && (
                      <div className="text-xs space-y-2">
                        <span className="text-on-surface-variant font-medium block">Bonus Poin Khusus Produk</span>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-container-high font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2 pl-3">Nama Produk</th>
                                <th className="p-2 text-right">Beli Qty</th>
                                <th className="p-2 text-center">Satuan</th>
                                <th className="p-2 text-right">Hadiah Poin</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 font-mono">
                              {detailedPromo.poin_barang.map((item: any) => (
                                <tr key={item.id} className="text-xs">
                                  <td className="p-2 pl-3 font-sans font-semibold text-on-surface">{item.nama_barang || `Barang #${item.id_barang}`}</td>
                                  <td className="p-2 text-right font-bold">{item.jumlah_barang}</td>
                                  <td className="p-2 text-center text-on-surface-variant">{getSatuanLabel(item.id_satuan)}</td>
                                  <td className="p-2 text-right font-bold text-purple-400">+{item.jumlah_poin} POIN</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Hadiah Barang Table */}
                    {detailedPromo.hadiah_barang && detailedPromo.hadiah_barang.length > 0 && (
                      <div className="text-xs space-y-2">
                        <span className="text-on-surface-variant font-medium block">Daftar Barang yang Diberikan Cuma-cuma</span>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-container-high font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2 pl-3">Produk Bonus</th>
                                <th className="p-2 text-right">Jumlah</th>
                                <th className="p-2 text-center w-24">Satuan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 font-mono">
                              {detailedPromo.hadiah_barang.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="p-2 pl-3 font-sans font-semibold text-sky-400">{item.nama_barang || `Barang #${item.id_barang}`}</td>
                                  <td className="p-2 text-right font-bold">{item.jumlah}</td>
                                  <td className="p-2 text-center text-on-surface-variant">{getSatuanLabel(item.id_satuan)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tebus Murah Table */}
                    {detailedPromo.tebus_murah && detailedPromo.tebus_murah.length > 0 && (
                      <div className="text-xs space-y-2">
                        <span className="text-on-surface-variant font-medium block">Daftar Produk Tebus Murah Khusus</span>
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-surface-container-high font-bold text-on-surface-variant">
                              <tr>
                                <th className="p-2 pl-3">Produk Tebus</th>
                                <th className="p-2 text-right">Qty Maks</th>
                                <th className="p-2 text-center">Satuan</th>
                                <th className="p-2 text-right">Harga Tebus</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 font-mono">
                              {detailedPromo.tebus_murah.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="p-2 pl-3 font-sans font-semibold text-amber-500">{item.nama_barang || `Barang #${item.id_barang}`}</td>
                                  <td className="p-2 text-right font-bold">{item.jumlah}</td>
                                  <td className="p-2 text-center text-on-surface-variant">{getSatuanLabel(item.id_satuan)}</td>
                                  <td className="p-2 text-right font-extrabold text-amber-500">{formatRupiah(item.harga_tebus)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-outline-variant/40 flex justify-end gap-2 bg-surface-container-low">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. MODERN HIGH-FIDELITY PROMO WIZARD */}
      {/* ======================================= */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-surface border border-outline-variant/60 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Wizard Header */}
            <div className="p-6 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-3">
                <Tags className="w-6 h-6 text-primary animate-pulse" />
                <div>
                  <h3 className="font-bold text-on-surface text-lg">
                    {wizardType === "create" ? "Konfigurasi Program Promo Baru" : "Edit Aturan Program Promo"}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                    Langkah {wizardStep} dari 2: {wizardStep === 1 ? "Informasi & Berlaku Umum" : "Mesin Aturan & Hadiah"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors hover:scale-105 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Navigation Progress */}
            <div className="px-6 py-3 bg-surface-container-low/60 border-b border-outline-variant/30 flex items-center justify-between gap-4 text-xs font-bold text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${wizardStep === 1 ? "bg-primary text-on-primary animate-pulse" : "bg-green-500/20 text-green-400 border border-green-500/20"}`}>1</span>
                <span className={wizardStep === 1 ? "text-primary" : "text-green-400"}>Informasi & Berlaku Umum</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono ${wizardStep === 2 ? "bg-primary text-on-primary animate-pulse" : "bg-surface-container-high text-on-surface-variant/40"}`}>2</span>
                <span className={wizardStep === 2 ? "text-primary" : "opacity-40"}>Mesin Aturan & Hadiah</span>
              </div>
            </div>

            {/* Wizard Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
              {/* ======================= */}
              {/* STEP 1: GENERAL INFO */}
              {/* ======================= */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Nama Program Promo <span className="text-error">*</span></label>
                      <input
                        type="text"
                        value={namaPromo}
                        onChange={(e) => setNamaPromo(e.target.value)}
                        placeholder="Contoh: Promo Milad Toko 2026"
                        className="bg-surface border border-outline-variant/30 text-on-surface placeholder-on-surface-variant/60 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Tipe Aturan Promo <span className="text-error">*</span></label>
                      <select
                        value={tipePromo}
                        disabled={wizardType === "edit"} // Prevent changing type in edit mode to preserve relational integrity
                        onChange={(e) => setTipePromo(e.target.value)}
                        className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="BELI_GRATIS">Beli A Gratis B (BELI_GRATIS)</option>
                        <option value="DISKON_BARANG">Diskon Khusus Produk (DISKON_BARANG)</option>
                        <option value="POIN_BARANG">Poin Khusus Produk (POIN_BARANG)</option>
                        <option value="DISKON_PEMBELANJAAN">Diskon Total Belanja (DISKON_PEMBELANJAAN)</option>
                        <option value="POIN_PEMBELANJAAN">Poin Total Belanja (POIN_PEMBELANJAAN)</option>
                        <option value="GRATIS_BARANG_PEMBELANJAAN">Gratis Barang Total Belanja (GRATIS_BARANG_PEMBELANJAAN)</option>
                        <option value="TEBUS_MURAH">Tebus Murah Total Belanja (TEBUS_MURAH)</option>
                        <option value="TEBUS_MURAH_BARANG_TERTENTU">Tebus Murah Produk Tertentu (TEBUS_MURAH_BARANG_TERTENTU)</option>
                        <option value="DISKON_BELANJA_BARANG_TERTENTU">Diskon Belanja Produk Tertentu (DISKON_BELANJA_BARANG_TERTENTU)</option>
                        <option value="GRATIS_BARANG_BELANJA_TERTENTU">Gratis Barang Belanja Produk (GRATIS_BARANG_BELANJA_TERTENTU)</option>
                      </select>
                      {wizardType === "edit" && (
                        <span className="text-[10px] text-on-surface-variant/80 italic">Tipe promo tidak dapat diubah saat mode edit.</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Tanggal Mulai Berlaku <span className="text-error">*</span></label>
                      <input
                        type="date"
                        value={tanggalMulai}
                        onChange={(e) => setTanggalMulai(e.target.value)}
                        className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Tanggal Berakhir Selesai <span className="text-error">*</span></label>
                      <input
                        type="date"
                        value={tanggalSelesai}
                        onChange={(e) => setTanggalSelesai(e.target.value)}
                        className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Sasaran Pelanggan</label>
                      <select
                        value={berlakuUntuk}
                        onChange={(e) => setBerlakuUntuk(e.target.value)}
                        className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="UMUM">Semua Pelanggan (Umum)</option>
                        <option value="1">Pelanggan Silver</option>
                        <option value="2">Pelanggan Gold</option>
                        <option value="3">Pelanggan Platinum</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Non-Aktif">Non-Aktif</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-center items-start gap-1.5 pt-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer">
                        <input
                          type="checkbox"
                          checked={berlakuKelipatan}
                          onChange={(e) => setBerlakuKelipatan(e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary bg-surface border-outline-variant"
                        />
                        Promo Berlaku Kelipatan
                      </label>
                      <span className="text-[10px] text-on-surface-variant pl-6">
                        Jika dicentang, kasir dapat memberikan kelipatan hadiah jika belanja berkelipatan.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Deskripsi Program Promo</label>
                    <textarea
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      placeholder="Masukkan catatan rincian promo, syarat, atau catatan internal toko..."
                      rows={3}
                      className="bg-surface border border-outline-variant/30 text-on-surface placeholder-on-surface-variant/60 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  {/* Branch Multi-select check list */}
                  <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                      <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-primary" /> Cabang yang Memberlakukan <span className="text-error">*</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCabang(branches.map((b) => b.id_cabang))}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-on-surface-variant">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCabang([])}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Hapus Semua
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {branches.map((b) => {
                        const isChecked = selectedCabang.includes(b.id_cabang);
                        return (
                          <label
                            key={b.id_cabang}
                            className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                              isChecked
                                ? "bg-primary/5 border-primary text-primary"
                                : "bg-surface border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCabang([...selectedCabang, b.id_cabang]);
                                } else {
                                  setSelectedCabang(selectedCabang.filter((id) => id !== b.id_cabang));
                                }
                              }}
                              className="w-4 h-4 text-primary bg-surface border-outline-variant"
                            />
                            {b.nama_cabang}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================== */}
              {/* STEP 2: DYNAMIC RULES & REWARDS CONFIG */}
              {/* ===================================== */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  {/* Info helper about selected promo style */}
                  <div className="bg-primary/5 border border-primary/25 rounded-2xl p-4 flex gap-3 text-xs">
                    <Info className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold text-primary">Mekanisme Aturan: {tipePromo.replace(/_/g, " ")}</h4>
                      <p className="text-on-surface-variant mt-1 text-[11px] leading-relaxed">
                        Atur parameter syarat validasi transaksi di kasir serta bonus hadiah gratis, poin, atau diskon yang akan dipicu oleh modul POS otomatis.
                      </p>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* CONFIGURE MINIMUM TOTAL SPENDING CONDITIONAL FOR APPLICABLE TYPES */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {(tipePromo === "DISKON_PEMBELANJAAN" ||
                    tipePromo === "POIN_PEMBELANJAAN" ||
                    tipePromo === "GRATIS_BARANG_PEMBELANJAAN" ||
                    tipePromo === "TEBUS_MURAH" ||
                    tipePromo === "TEBUS_MURAH_BARANG_TERTENTU" ||
                    tipePromo === "DISKON_BELANJA_BARANG_TERTENTU" ||
                    tipePromo === "GRATIS_BARANG_BELANJA_TERTENTU") && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-4">
                      <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Syarat Belanja Nominal</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Minimum Nilai Pembelanjaan (Rp)</label>
                          <input
                            type="number"
                            value={minimumPembelanjaan || ""}
                            onChange={(e) => setMinimumPembelanjaan(parseInt(e.target.value) || 0)}
                            placeholder="Contoh: 100000"
                            className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-mono font-bold"
                          />
                        </div>

                        <div className="flex flex-col justify-center items-start gap-1.5 pt-4">
                          <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant cursor-pointer">
                            <input
                              type="checkbox"
                              checked={syaratBelanjaKelipatan}
                              onChange={(e) => setSyaratBelanjaKelipatan(e.target.checked)}
                              className="w-4 h-4 rounded text-primary bg-surface border-outline-variant"
                            />
                            Syarat Belanja Berlaku Kelipatan
                          </label>
                          <span className="text-[10px] text-on-surface-variant pl-6">
                            Kelipatan belanja memicu kelipatan reward.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* CONFIGURE CATEGORIES & SUPPLIERS CONDITIONAL FOR PEMBELANJAAN TYPES */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {(tipePromo === "DISKON_PEMBELANJAAN" ||
                    tipePromo === "POIN_PEMBELANJAAN" ||
                    tipePromo === "GRATIS_BARANG_PEMBELANJAAN" ||
                    tipePromo === "TEBUS_MURAH") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Categories check list */}
                      <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                        <label className="text-xs font-bold text-on-surface-variant block border-b border-outline-variant/20 pb-2">
                          Batasan Kategori Produk (Opsional)
                        </label>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {categories.map((k) => {
                            const isChecked = kategoriIds.includes(k.id_kategori);
                            return (
                              <label key={k.id_kategori} className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setKategoriIds([...kategoriIds, k.id_kategori]);
                                    } else {
                                      setKategoriIds(kategoriIds.filter((id) => id !== k.id_kategori));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-primary bg-surface border-outline-variant rounded"
                                />
                                {k.nama_kategori}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Suppliers check list */}
                      <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                        <label className="text-xs font-bold text-on-surface-variant block border-b border-outline-variant/20 pb-2">
                          Batasan Supplier Produk (Opsional)
                        </label>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {suppliers.map((s) => {
                            const isChecked = supplierIds.includes(s.id_supplier);
                            return (
                              <label key={s.id_supplier} className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSupplierIds([...supplierIds, s.id_supplier]);
                                    } else {
                                      setSupplierIds(supplierIds.filter((id) => id !== s.id_supplier));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-primary bg-surface border-outline-variant rounded"
                                />
                                {s.nama_supplier}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* CONFIGURE PRODUCT SEARCH & ADD UTILITY FOR TABLES */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {/* Product Autocomplete UI Component */}
                  {activeTarget && (
                    <div className="bg-surface-container-high border border-primary/30 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Cari & Tambah Produk</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTarget("");
                            setProductQuery("");
                            setProductResults([]);
                          }}
                          className="p-1 text-on-surface-variant hover:text-on-surface"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
                        <input
                          type="text"
                          value={productQuery}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          placeholder="Ketik minimal 2 karakter barcode atau nama produk..."
                          className="w-full bg-surface border border-outline-variant/30 text-on-surface placeholder-on-surface-variant/60 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                        />
                      </div>

                      {/* Dropdown Results */}
                      {productResults.length > 0 && (
                        <div className="border border-outline-variant/20 rounded-xl bg-surface divide-y divide-outline-variant/15 overflow-hidden max-h-48 overflow-y-auto">
                          {productResults.map((prod) => (
                            <button
                              key={prod.id_barang}
                              type="button"
                              onClick={() => addProductToTarget(prod)}
                              className="w-full text-left p-3 hover:bg-primary/5 text-xs flex justify-between items-center transition-colors cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-on-surface">{prod.nama_barang}</span>
                                <span className="text-[10px] text-on-surface-variant/80 font-mono block mt-0.5">Barcode: {prod.barcode}</span>
                              </div>
                              <PlusCircle className="w-4 h-4 text-primary shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                      {searchingProducts && <p className="text-[10px] text-on-surface-variant italic animate-pulse">Menghubungi index master data...</p>}
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* 10 CONFIGURABLE OPTIONS CORRESPONDING TO TIPE PROMO */}
                  {/* ────────────────────────────────────────────────────────── */}

                  {/* OPTION 1: BELI_GRATIS */}
                  {tipePromo === "BELI_GRATIS" && (
                    <div className="space-y-4">
                      {/* Syarat Beli Table */}
                      <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">1. Syarat Barang Pembelian</label>
                          {!activeTarget && (
                            <button
                              type="button"
                              onClick={() => setActiveTarget("syarat_beli")}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Produk
                            </button>
                          )}
                        </div>

                        {syaratBeli.length === 0 ? (
                          <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada produk syarat belanja. Klik Tambah Produk di atas.</p>
                        ) : (
                          <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-surface-container-high font-bold">
                                <tr>
                                  <th className="p-3 pl-4">Nama Produk</th>
                                  <th className="p-3 text-right w-24">Jumlah</th>
                                  <th className="p-3 text-center w-28">Satuan</th>
                                  <th className="p-3 text-center w-16">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/15">
                                {syaratBeli.map((item, idx) => (
                                  <tr key={item.id_barang}>
                                    <td className="p-3 pl-4 font-semibold text-on-surface">{item.nama_barang}</td>
                                    <td className="p-3 text-right">
                                      <input
                                        type="number"
                                        value={item.jumlah || ""}
                                        onChange={(e) => {
                                          const copy = [...syaratBeli];
                                          copy[idx].jumlah = parseInt(e.target.value) || 0;
                                          setSyaratBeli(copy);
                                        }}
                                        className="w-16 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-2 py-1 text-xs"
                                      />
                                    </td>
                                    <td className="p-3 text-center">
                                      <select
                                        value={item.id_satuan}
                                        onChange={(e) => {
                                          const copy = [...syaratBeli];
                                          copy[idx].id_satuan = parseInt(e.target.value);
                                          setSyaratBeli(copy);
                                        }}
                                        className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-2 py-1 text-xs"
                                      >
                                        <option value={1}>Satuan 1 (Utama)</option>
                                        <option value={2}>Satuan 2</option>
                                        <option value={3}>Satuan 3</option>
                                      </select>
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => setSyaratBeli(syaratBeli.filter((p) => p.id_barang !== item.id_barang))}
                                        className="text-error hover:scale-105 transition-transform"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Hadiah Gratis Table */}
                      <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-green-400">2. Hadiah Barang Gratis</label>
                          {!activeTarget && (
                            <button
                              type="button"
                              onClick={() => setActiveTarget("hadiah_gratis")}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Produk Hadiah
                            </button>
                          )}
                        </div>

                        {hadiahGratis.length === 0 ? (
                          <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada bonus produk gratis yang diatur.</p>
                        ) : (
                          <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-surface-container-high font-bold">
                                <tr>
                                  <th className="p-3 pl-4">Nama Produk</th>
                                  <th className="p-3 text-right w-24">Jumlah</th>
                                  <th className="p-3 text-center w-28">Satuan</th>
                                  <th className="p-3 text-center w-16">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/15">
                                {hadiahGratis.map((item, idx) => (
                                  <tr key={item.id_barang}>
                                    <td className="p-3 pl-4 font-semibold text-green-400">{item.nama_barang}</td>
                                    <td className="p-3 text-right">
                                      <input
                                        type="number"
                                        value={item.jumlah || ""}
                                        onChange={(e) => {
                                          const copy = [...hadiahGratis];
                                          copy[idx].jumlah = parseInt(e.target.value) || 0;
                                          setHadiahGratis(copy);
                                        }}
                                        className="w-16 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-2 py-1 text-xs"
                                      />
                                    </td>
                                    <td className="p-3 text-center">
                                      <select
                                        value={item.id_satuan}
                                        onChange={(e) => {
                                          const copy = [...hadiahGratis];
                                          copy[idx].id_satuan = parseInt(e.target.value);
                                          setHadiahGratis(copy);
                                        }}
                                        className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-2 py-1 text-xs"
                                      >
                                        <option value={1}>Satuan 1 (Utama)</option>
                                        <option value={2}>Satuan 2</option>
                                        <option value={3}>Satuan 3</option>
                                      </select>
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => setHadiahGratis(hadiahGratis.filter((p) => p.id_barang !== item.id_barang))}
                                        className="text-error hover:scale-105 transition-transform"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* OPTION 2: DISKON_BARANG */}
                  {tipePromo === "DISKON_BARANG" && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-green-400">Aturan Diskon Khusus Produk</label>
                        {!activeTarget && (
                          <button
                            type="button"
                            onClick={() => setActiveTarget("diskon_barang")}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk
                          </button>
                        )}
                      </div>

                      {diskonBarang.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada aturan diskon produk. Klik Tambah Produk di atas.</p>
                      ) : (
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-container-high font-bold">
                              <tr>
                                <th className="p-3 pl-4">Produk</th>
                                <th className="p-3 text-right w-20">Min Qty</th>
                                <th className="p-3 text-center w-28">Satuan</th>
                                <th className="p-3 text-center w-24">Tipe Diskon</th>
                                <th className="p-3 text-right w-24">Nilai Diskon</th>
                                <th className="p-3 text-center w-12">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/15">
                              {diskonBarang.map((item, idx) => (
                                <tr key={item.id_barang}>
                                  <td className="p-3 pl-4 font-semibold text-on-surface">{item.nama_barang}</td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.jumlah || ""}
                                      onChange={(e) => {
                                        const copy = [...diskonBarang];
                                        copy[idx].jumlah = parseInt(e.target.value) || 0;
                                        setDiskonBarang(copy);
                                      }}
                                      className="w-14 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-1.5 py-1 text-xs"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <select
                                      value={item.id_satuan}
                                      onChange={(e) => {
                                        const copy = [...diskonBarang];
                                        copy[idx].id_satuan = parseInt(e.target.value);
                                        setDiskonBarang(copy);
                                      }}
                                      className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-1.5 py-1 text-xs"
                                    >
                                      <option value={1}>Satuan 1</option>
                                      <option value={2}>Satuan 2</option>
                                      <option value={3}>Satuan 3</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-center">
                                    <select
                                      value={item.jenis_diskon}
                                      onChange={(e) => {
                                        const copy = [...diskonBarang];
                                        copy[idx].jenis_diskon = e.target.value as any;
                                        setDiskonBarang(copy);
                                      }}
                                      className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-1.5 py-1 text-xs"
                                    >
                                      <option value="PERSEN">Persen (%)</option>
                                      <option value="NOMINAL">Nominal (Rp)</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.nilai_diskon || ""}
                                      onChange={(e) => {
                                        const copy = [...diskonBarang];
                                        copy[idx].nilai_diskon = parseInt(e.target.value) || 0;
                                        setDiskonBarang(copy);
                                      }}
                                      placeholder="0"
                                      className="w-20 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-1.5 py-1 text-xs text-green-400"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setDiskonBarang(diskonBarang.filter((p) => p.id_barang !== item.id_barang))}
                                      className="text-error hover:scale-105 transition-transform"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPTION 3: POIN_BARANG */}
                  {tipePromo === "POIN_BARANG" && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-purple-400">Bonus Poin Khusus Produk</label>
                        {!activeTarget && (
                          <button
                            type="button"
                            onClick={() => setActiveTarget("poin_barang")}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk
                          </button>
                        )}
                      </div>

                      {poinBarang.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada aturan bonus poin produk. Klik Tambah Produk di atas.</p>
                      ) : (
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-container-high font-bold">
                              <tr>
                                <th className="p-3 pl-4">Produk</th>
                                <th className="p-3 text-right w-24">Beli Qty</th>
                                <th className="p-3 text-center w-28">Satuan</th>
                                <th className="p-3 text-right w-28">Hadiah Poin</th>
                                <th className="p-3 text-center w-16">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/15">
                              {poinBarang.map((item, idx) => (
                                <tr key={item.id_barang}>
                                  <td className="p-3 pl-4 font-semibold text-on-surface">{item.nama_barang}</td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.jumlah_barang || ""}
                                      onChange={(e) => {
                                        const copy = [...poinBarang];
                                        copy[idx].jumlah_barang = parseInt(e.target.value) || 0;
                                        setPoinBarang(copy);
                                      }}
                                      className="w-16 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-2 py-1 text-xs"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <select
                                      value={item.id_satuan}
                                      onChange={(e) => {
                                        const copy = [...poinBarang];
                                        copy[idx].id_satuan = parseInt(e.target.value);
                                        setPoinBarang(copy);
                                      }}
                                      className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-2 py-1 text-xs"
                                    >
                                      <option value={1}>Satuan 1</option>
                                      <option value={2}>Satuan 2</option>
                                      <option value={3}>Satuan 3</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.jumlah_poin || ""}
                                      onChange={(e) => {
                                        const copy = [...poinBarang];
                                        copy[idx].jumlah_poin = parseInt(e.target.value) || 0;
                                        setPoinBarang(copy);
                                      }}
                                      placeholder="+Poin"
                                      className="w-20 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-2 py-1 text-xs text-purple-400"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setPoinBarang(poinBarang.filter((p) => p.id_barang !== item.id_barang))}
                                      className="text-error hover:scale-105 transition-transform"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPTION 4: DISKON_PEMBELANJAAN & DISKON_BELANJA_BARANG_TERTENTU */}
                  {(tipePromo === "DISKON_PEMBELANJAAN" || tipePromo === "DISKON_BELANJA_BARANG_TERTENTU") && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-4">
                      <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-green-400">Bonus Hadiah Diskon Langsung</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Jenis Potongan Diskon</label>
                          <select
                            value={jenisDiskonHadiah}
                            onChange={(e) => setJenisDiskonHadiah(e.target.value as any)}
                            className="bg-surface border border-outline-variant/30 text-on-surface rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                          >
                            <option value="PERSEN">Persentase (%)</option>
                            <option value="NOMINAL">Nominal Tunai (Rp)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Nilai Potongan Diskon</label>
                          <input
                            type="number"
                            value={nilaiDiskonHadiah || ""}
                            onChange={(e) => setNilaiDiskonHadiah(parseInt(e.target.value) || 0)}
                            placeholder="Contoh: 10 atau 15000"
                            className="bg-surface border border-outline-variant/30 text-on-surface text-green-400 font-bold rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPTION 5: POIN_PEMBELANJAAN */}
                  {tipePromo === "POIN_PEMBELANJAAN" && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-4">
                      <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider text-purple-400">Bonus Hadiah Poin Loyalti</h4>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Jumlah Bonus Poin Belanja (+Poin)</label>
                        <input
                          type="number"
                          value={hadiahPoinHadiah || ""}
                          onChange={(e) => setHadiahPoinHadiah(parseInt(e.target.value) || 0)}
                          placeholder="Contoh: 50"
                          className="bg-surface border border-outline-variant/30 text-on-surface text-purple-400 font-bold rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* OPTION 6: GRATIS_BARANG_PEMBELANJAAN & GRATIS_BARANG_BELANJA_TERTENTU */}
                  {(tipePromo === "GRATIS_BARANG_PEMBELANJAAN" || tipePromo === "GRATIS_BARANG_BELANJA_TERTENTU") && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-sky-400">Bonus Hadiah Barang Gratis</label>
                        {!activeTarget && (
                          <button
                            type="button"
                            onClick={() => setActiveTarget("hadiah_barang")}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk
                          </button>
                        )}
                      </div>

                      {hadiahBarang.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada barang gratis yang diatur. Klik Tambah Produk di atas.</p>
                      ) : (
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-container-high font-bold">
                              <tr>
                                <th className="p-3 pl-4">Nama Produk Gratis</th>
                                <th className="p-3 text-right w-24">Jumlah</th>
                                <th className="p-3 text-center w-28">Satuan</th>
                                <th className="p-3 text-center w-16">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/15">
                              {hadiahBarang.map((item, idx) => (
                                <tr key={item.id_barang}>
                                  <td className="p-3 pl-4 font-semibold text-sky-400">{item.nama_barang}</td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.jumlah || ""}
                                      onChange={(e) => {
                                        const copy = [...hadiahBarang];
                                        copy[idx].jumlah = parseInt(e.target.value) || 0;
                                        setHadiahBarang(copy);
                                      }}
                                      className="w-16 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-2 py-1 text-xs"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <select
                                      value={item.id_satuan}
                                      onChange={(e) => {
                                        const copy = [...hadiahBarang];
                                        copy[idx].id_satuan = parseInt(e.target.value);
                                        setHadiahBarang(copy);
                                      }}
                                      className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-2 py-1 text-xs"
                                    >
                                      <option value={1}>Satuan 1</option>
                                      <option value={2}>Satuan 2</option>
                                      <option value={3}>Satuan 3</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setHadiahBarang(hadiahBarang.filter((p) => p.id_barang !== item.id_barang))}
                                      className="text-error hover:scale-105 transition-transform"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPTION 7: TEBUS_MURAH & TEBUS_MURAH_BARANG_TERTENTU */}
                  {(tipePromo === "TEBUS_MURAH" || tipePromo === "TEBUS_MURAH_BARANG_TERTENTU") && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-amber-500">Daftar Barang Tebus Murah</label>
                        {!activeTarget && (
                          <button
                            type="button"
                            onClick={() => setActiveTarget("tebus_murah")}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk
                          </button>
                        )}
                      </div>

                      {tebusMurah.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada barang tebus murah yang diatur. Klik Tambah Produk di atas.</p>
                      ) : (
                        <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-container-high font-bold">
                              <tr>
                                <th className="p-3 pl-4">Nama Produk</th>
                                <th className="p-3 text-right w-20">Qty Maks</th>
                                <th className="p-3 text-center w-28">Satuan</th>
                                <th className="p-3 text-right w-28">Harga Tebus (Rp)</th>
                                <th className="p-3 text-center w-12">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/15">
                              {tebusMurah.map((item, idx) => (
                                <tr key={item.id_barang}>
                                  <td className="p-3 pl-4 font-semibold text-on-surface">{item.nama_barang}</td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.jumlah || ""}
                                      onChange={(e) => {
                                        const copy = [...tebusMurah];
                                        copy[idx].jumlah = parseInt(e.target.value) || 0;
                                        setTebusMurah(copy);
                                      }}
                                      className="w-14 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-1.5 py-1 text-xs"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <select
                                      value={item.id_satuan}
                                      onChange={(e) => {
                                        const copy = [...tebusMurah];
                                        copy[idx].id_satuan = parseInt(e.target.value);
                                        setTebusMurah(copy);
                                      }}
                                      className="bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-lg px-1.5 py-1 text-xs"
                                    >
                                      <option value={1}>Satuan 1</option>
                                      <option value={2}>Satuan 2</option>
                                      <option value={3}>Satuan 3</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      value={item.harga_tebus || ""}
                                      onChange={(e) => {
                                        const copy = [...tebusMurah];
                                        copy[idx].harga_tebus = parseInt(e.target.value) || 0;
                                        setTebusMurah(copy);
                                      }}
                                      placeholder="0"
                                      className="w-24 bg-surface-container-high border border-outline-variant/20 text-on-surface text-right font-bold rounded-lg px-2 py-1 text-xs text-amber-500"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setTebusMurah(tebusMurah.filter((p) => p.id_barang !== item.id_barang))}
                                      className="text-error hover:scale-105 transition-transform"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* OPTIONAL CONFIGURE FOR "BARANG TERTENTU" TYPES */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {(tipePromo === "TEBUS_MURAH_BARANG_TERTENTU" ||
                    tipePromo === "DISKON_BELANJA_BARANG_TERTENTU" ||
                    tipePromo === "GRATIS_BARANG_BELANJA_TERTENTU") && (
                    <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Syarat Belanja Harus Mengandung Produk Ini</label>
                        {!activeTarget && (
                          <button
                            type="button"
                            onClick={() => setActiveTarget("syarat_barang_tertentu")}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk Syarat
                          </button>
                        )}
                      </div>

                      {idBarangTertentu.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic py-3 text-center bg-surface rounded-xl border border-dashed border-outline-variant/30">Belum ada barang syarat belanja yang ditentukan.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {idBarangTertentu.map((item) => (
                            <span
                              key={item.id_barang}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-surface border border-outline-variant/20 text-on-surface shadow-sm font-mono"
                            >
                              {item.nama_barang}
                              <button
                                type="button"
                                onClick={() => setIdBarangTertentu(idBarangTertentu.filter((p) => p.id_barang !== item.id_barang))}
                                className="text-error hover:scale-110"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="p-5 border-t border-outline-variant/40 flex justify-between bg-surface-container-low">
              <div>
                {wizardStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>

                {wizardStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-md hover:scale-[1.01] cursor-pointer"
                  >
                    Lanjut <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSavePromo}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-md hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Simpan Program Aturan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
