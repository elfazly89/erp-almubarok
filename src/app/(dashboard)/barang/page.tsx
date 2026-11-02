"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  ExternalLink,
  ArrowLeftRight,
  Upload,
  FileSpreadsheet,
  Download,
  X,
  FileUp,
  Check,
  FileCheck2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import TablePagination from "@/components/ui/TablePagination";

interface Kategori {
  id_kategori: number;
  nama_kategori: string;
}

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
}

interface Barang {
  id_barang: number;
  kode_barang?: string | null;
  barcode: string;
  nama_barang: string;
  id_kategori: number | null;
  nama_kategori?: string | null;
  id_supplier: number | null;
  nama_supplier?: string | null;
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
  status_pajak: string | null;
  barcode_satuan_2?: string | null;
  barcode_satuan_3?: string | null;
  tipe_barang?: string | null;
  lacak_kadaluarsa?: boolean;
  keterangan_1: string | null;
  keterangan_2: string | null;
  level_barang?: string | null;
  level_mode?: string | null;
  terakhir_terjual?: string | null;
  lapor_pajak?: boolean | null;
  level_cabang?: string | null;
  terakhir_terjual_cabang?: string | null;
}

interface MultiCabangBreakdown {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  stok_akhir: number;
  posisi_rak: string;
  minimal_stok: number;
  maksimal_stok: number;
  status_stok: string;
  nilai_aset: number;
  level_cabang?: string;
  terakhir_terjual_cabang?: string | null;
}

export default function BarangPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Barang[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Barang | null>(null);
  const [edit, setEdit] = useState<Barang | null>(null);

  // Multi-Cabang Stock Inspection Modal
  const [showMultiCabangModal, setShowMultiCabangModal] = useState(false);
  const [multiCabangItem, setMultiCabangItem] = useState<Barang | null>(null);
  const [multiCabangData, setMultiCabangData] = useState<{
    barang: any;
    total_stok_global: number;
    total_nilai_global: number;
    is_manager_or_admin: boolean;
    breakdown: MultiCabangBreakdown[];
  } | null>(null);
  const [loadingMultiCabang, setLoadingMultiCabang] = useState(false);
  const [cabangSearch, setCabangSearch] = useState("");

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Validation, 3: Success Result
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "BARU" | "UPDATE" | "SKIP" | "ERROR">("ALL");
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [kodeBarang, setKodeBarang] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcode2, setBarcode2] = useState("");
  const [barcode3, setBarcode3] = useState("");
  const [nama, setNama] = useState("");
  const [tipeBarang, setTipeBarang] = useState("STOK");
  const [lacakKadaluarsa, setLacakKadaluarsa] = useState(false);
  const [kategoriId, setKategoriId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [satuan1, setSatuan1] = useState("pcs");
  const [satuan2, setSatuan2] = useState("");
  const [satuan3, setSatuan3] = useState("");
  const [isi2, setIsi2] = useState("");
  const [isi3, setIsi3] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaRata, setHargaRata] = useState("");
  
  // Prices
  const [hj_1_1, setHj11] = useState("");
  const [hj_1_2, setHj12] = useState("");
  const [hj_1_3, setHj13] = useState("");
  const [hj_2_1, setHj21] = useState("");
  const [hj_2_2, setHj22] = useState("");
  const [hj_2_3, setHj23] = useState("");
  const [hj_3_1, setHj31] = useState("");
  const [hj_3_2, setHj32] = useState("");
  const [hj_3_3, setHj33] = useState("");

  const [jualRugi, setJualRugi] = useState("0");
  const [status, setStatus] = useState("Aktif");
  const [statusPajak, setStatusPajak] = useState("Non PPn");
  const [laporPajak, setLaporPajak] = useState(true);
  const [ket1, setKet1] = useState("");
  const [ket2, setKet2] = useState("");
  const [levelBarang, setLevelBarang] = useState("MEDIUM");
  const [levelMode, setLevelMode] = useState("AUTO");

  // Table Filter & Recalculate States
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("ALL");
  const [selectedFiskalFilter, setSelectedFiskalFilter] = useState<"ALL" | "LAPOR" | "NON_LAPOR">("ALL");
  const [isRecalculating, setIsRecalculating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<string>("nama_barang");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: Barang | null }>({
    show: false,
    item: null,
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary shrink-0" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0" />
    );
  };

  const fetchData = useCallback(
    async (
      targetPage = page,
      targetLimit = limit,
      targetSearch = debouncedSearch,
      targetLevel = selectedLevelFilter,
      targetFiskal = selectedFiskalFilter
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: targetLimit.toString(),
        });
        if (targetSearch.trim()) params.append("search", targetSearch.trim());
        if (targetLevel !== "ALL") params.append("level", targetLevel);
        if (targetFiskal === "LAPOR") params.append("lapor_pajak", "true");
        if (targetFiskal === "NON_LAPOR") params.append("lapor_pajak", "false");

        const [resBarang, resKat, resSup] = await Promise.all([
          fetch(`/api/barang?${params.toString()}`),
          fetch("/api/kategori"),
          fetch("/api/supplier"),
        ]);

        if (resBarang.status === 401 || resKat.status === 401 || resSup.status === 401) {
          showToast("Sesi login Anda telah berakhir. Mengalihkan ke halaman login...", "error");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1200);
          return;
        }

        if (resBarang.ok && resKat.ok && resSup.ok) {
          const barangJson = await resBarang.json();
          if (barangJson && barangJson.pagination) {
            setList(barangJson.data || []);
            setTotalItems(barangJson.pagination.total);
            setTotalPages(barangJson.pagination.totalPages);
            setPage(barangJson.pagination.page);
          } else {
            const arr = Array.isArray(barangJson) ? barangJson : [];
            setList(arr);
            setTotalItems(arr.length);
            setTotalPages(1);
          }
          setCategories(await resKat.json());
          setSuppliers(await resSup.json());
        } else {
          let errMsg = "Gagal memuat data katalog barang.";
          try {
            if (!resBarang.ok) {
              const errJson = await resBarang.json();
              if (errJson?.error) {
                const lowerErr = String(errJson.error).toLowerCase();
                if (lowerErr.includes("failed query") || lowerErr.includes("select \"barang\"") || lowerErr.includes("syntax error")) {
                  console.error("Database Query Error:", errJson.error);
                  errMsg = "Terjadi kendala pada database server saat memuat katalog barang.";
                } else {
                  errMsg = errJson.error;
                }
              }
            }
          } catch {}
          showToast(errMsg, "error");
        }
      } catch {
        showToast("Gagal memuat data katalog barang. Periksa koneksi ke server.", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, debouncedSearch, selectedLevelFilter, selectedFiskalFilter, showToast]
  );

  useEffect(() => {
    fetchData(page, limit, debouncedSearch, selectedLevelFilter, selectedFiskalFilter);
  }, [page, limit, debouncedSearch, selectedLevelFilter, selectedFiskalFilter, fetchData]);

  // Debounced search (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const openModal = (barang?: Barang) => {
    setEdit(barang || null);
    setKodeBarang(barang?.kode_barang || "");
    setBarcode(barang?.barcode || "");
    setBarcode2(barang?.barcode_satuan_2 || "");
    setBarcode3(barang?.barcode_satuan_3 || "");
    setNama(barang?.nama_barang || "");
    setTipeBarang(barang?.tipe_barang || "STOK");
    setLacakKadaluarsa(Boolean(barang?.lacak_kadaluarsa));
    setKategoriId(barang?.id_kategori?.toString() || "");
    setSupplierId(barang?.id_supplier?.toString() || "");
    setSatuan1(barang?.satuan_1 || "pcs");
    setSatuan2(barang?.satuan_2 || "");
    setSatuan3(barang?.satuan_3 || "");
    setIsi2(barang?.isi_2?.toString() || "");
    setIsi3(barang?.isi_3?.toString() || "");
    setHargaBeli(barang?.harga_beli?.toString() || "");
    setHargaRata(barang?.harga_rata?.toString() || "");
    
    setHj11(barang?.harga_jual_1_1?.toString() || "");
    setHj12(barang?.harga_jual_1_2?.toString() || "");
    setHj13(barang?.harga_jual_1_3?.toString() || "");
    setHj21(barang?.harga_jual_2_1?.toString() || "");
    setHj22(barang?.harga_jual_2_2?.toString() || "");
    setHj23(barang?.harga_jual_2_3?.toString() || "");
    setHj31(barang?.harga_jual_3_1?.toString() || "");
    setHj32(barang?.harga_jual_3_2?.toString() || "");
    setHj33(barang?.harga_jual_3_3?.toString() || "");

    setJualRugi(barang?.jual_rugi?.toString() || "0");
    setStatus(barang?.status || "Aktif");
    setStatusPajak(barang?.status_pajak || "Non PPn");
    setLaporPajak(barang?.lapor_pajak !== undefined && barang?.lapor_pajak !== null ? Boolean(barang.lapor_pajak) : true);
    setKet1(barang?.keterangan_1 || "");
    setKet2(barang?.keterangan_2 || "");
    setLevelBarang(barang?.level_barang || "MEDIUM");
    setLevelMode(barang?.level_mode || "AUTO");
    
    setShowModal(true);
  };

  const handleRecalculateLevel = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch("/api/barang/recalculate-level", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const stats = data.data;
        showToast(
          `Level FSN berhasil disinkronkan: ${stats.fast} Fast, ${stats.medium} Medium, ${stats.slow} Slow, ${stats.dead} Dead Stock.`,
          "success"
        );
        fetchData();
      } else {
        showToast(data.error || "Gagal sinkronisasi level barang.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan saat menghitung ulang level.", "error");
    } finally {
      setIsRecalculating(false);
    }
  };

  const openViewModal = (item: Barang) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const openMultiCabangModal = async (item: Barang) => {
    setMultiCabangItem(item);
    setCabangSearch("");
    setShowMultiCabangModal(true);
    setLoadingMultiCabang(true);
    try {
      const res = await fetch(`/api/master/barang/${item.id_barang}/stok-cabang`);
      if (res.ok) {
        setMultiCabangData(await res.json());
      } else {
        showToast("Gagal memuat rincian stok multi-cabang.", "error");
      }
    } catch {
      showToast("Kesalahan jaringan saat memuat stok cabang.", "error");
    } finally {
      setLoadingMultiCabang(false);
    }
  };

  const handleSave = async () => {
    const cleanBarcode = barcode.trim();
    const cleanNama = nama.trim();

    if (!cleanBarcode || !cleanNama) {
      showToast("Barcode dan Nama Barang wajib diisi.", "error");
      return;
    }

    // Validasi harga tidak boleh negatif
    const hb = parseFloat(hargaBeli) || 0;
    if (hb < 0) {
      showToast("Harga beli tidak boleh bernilai negatif.", "error");
      return;
    }

    const prices = [
      { name: "Retail Satuan 1", val: hj_1_1, min: hb },
      { name: "Retail Satuan 2", val: hj_1_2, min: hb * (parseFloat(isi2) || 1) },
      { name: "Retail Satuan 3", val: hj_1_3, min: hb * (parseFloat(isi3) || 1) },
      { name: "Grosir Satuan 1", val: hj_2_1, min: hb },
      { name: "Grosir Satuan 2", val: hj_2_2, min: hb * (parseFloat(isi2) || 1) },
      { name: "Grosir Satuan 3", val: hj_2_3, min: hb * (parseFloat(isi3) || 1) },
      { name: "Khusus Satuan 1", val: hj_3_1, min: hb },
      { name: "Khusus Satuan 2", val: hj_3_2, min: hb * (parseFloat(isi2) || 1) },
      { name: "Khusus Satuan 3", val: hj_3_3, min: hb * (parseFloat(isi3) || 1) },
    ];

    for (const p of prices) {
      const valNum = parseFloat(p.val);
      if (p.val && valNum < 0) {
        showToast(`Harga ${p.name} tidak boleh bernilai negatif.`, "error");
        return;
      }
      
      // Jika jual rugi tidak boleh (jualRugi === "0"), cek apakah harga jual < HPP beli
      if (jualRugi === "0" && p.val && valNum < p.min) {
        showToast(`Harga ${p.name} tidak boleh lebih rendah dari HPP Beli (${formatCurrency(p.min)}) jika jual rugi dilarang.`, "error");
        return;
      }
    }

    setSaving(true);
    
    const payload = {
      kode_barang: kodeBarang.trim() || null,
      barcode: cleanBarcode,
      nama_barang: cleanNama,
      id_kategori: kategoriId || null,
      id_supplier: supplierId || null,
      satuan_1: satuan1,
      satuan_2: satuan2 || null,
      satuan_3: satuan3 || null,
      isi_1: 1, // Konstan 1
      isi_2: isi2 || null,
      isi_3: isi3 || null,
      harga_beli: hargaBeli || null,
      harga_rata: hargaRata || null,
      harga_jual_1_1: hj_1_1 || null,
      harga_jual_1_2: hj_1_2 || null,
      harga_jual_1_3: hj_1_3 || null,
      harga_jual_2_1: hj_2_1 || null,
      harga_jual_2_2: hj_2_2 || null,
      harga_jual_2_3: hj_2_3 || null,
      harga_jual_3_1: hj_3_1 || null,
      harga_jual_3_2: hj_3_2 || null,
      harga_jual_3_3: hj_3_3 || null,
      jual_rugi: parseInt(jualRugi),
      status,
      status_pajak: statusPajak || null,
      lapor_pajak: laporPajak,
      barcode_satuan_2: barcode2.trim() || null,
      barcode_satuan_3: barcode3.trim() || null,
      tipe_barang: tipeBarang,
      lacak_kadaluarsa: lacakKadaluarsa,
      keterangan_1: ket1 || null,
      keterangan_2: ket2 || null,
      level_barang: levelBarang,
      level_mode: levelMode,
    };

    try {
      const url = edit ? `/api/barang/${edit.id_barang}` : "/api/barang";
      const method = edit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();

      if (res.ok) {
        showToast(edit ? "Barang berhasil diperbarui." : "Barang berhasil ditambahkan.", "success");
        setShowModal(false);
        fetchData();
      } else {
        showToast(data.error || "Gagal menyimpan barang.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: Barang) => {
    setDeleteConfirm({ show: true, item });
  };

  const handleDelete = async () => {
    const id = deleteConfirm.item?.id_barang;
    if (!id) return;

    try {
      const res = await fetch(`/api/barang/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast("Barang berhasil dihapus.", "success");
        fetchData();
      } else {
        showToast(data.error || "Gagal menghapus barang.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setDeleteConfirm({ show: false, item: null });
    }
  };

  // ==========================================
  // HANDLERS IMPORT DARI EXCEL
  // ==========================================
  const handleDownloadTemplate = () => {
    const headers = [
      "NO",
      "KDBRG",
      "NMBRG",
      "BARCODE",
      "SAT 1",
      "SAT 2",
      "SAT 3",
      "SAT 4",
      "ISI 2",
      "ISI 3",
      "ISI 4",
      "STOCK",
      "DEPARTEMENT",
      "SUPPLIER",
      "HRGBELI",
      "KELOMPOK",
      "HBT",
      "PEMBELIAN TERAKHIR",
      "PENJUALAN TERAKHIR",
      "LEVEL",
    ];

    const sampleRows = [
      [1, "MU001-0004", "A SATU BOLD 20", "8997016060802", "PCS", "PRS", "BAL", "", 10, 100, 0, 20, "ROKOK", "TOKO TOTOK", 25900, "-", 25900, "26/10/2026", "30/10/2026", 2],
      [2, "MU001-0005", "A SATU FILTER 12", "8997016060499", "PCS", "PRS", "BAL", "", 10, 200, 0, 0, "ROKOK", "TOKO TOTOK", 15850, "-", 15850, "26/10/2026", "29/10/2026", 2],
      [3, "MU001-0006", "A SATU FILTER 16", "8997016060512", "PCS", "PRS", "BAL", "", 10, 100, 0, 80, "ROKOK", "TOKO TOTOK", 21400, "-", 21400, "26/10/2026", "30/10/2026", 2],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 25 },
      { wch: 16 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 8 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Barang");
    XLSX.writeFile(wb, "template_import_barang.xlsx");
  };

  const handleFileSelected = (file: File) => {
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheet];
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rawRows || rawRows.length === 0) {
          showToast("File Excel tidak memiliki baris data.", "error");
          setImportFile(null);
          return;
        }

        const existingBarcodes = new Set(list.map((b) => (b.barcode || "").toLowerCase().trim()).filter(Boolean));
        const existingKodes = new Set(list.map((b) => (b.kode_barang || "").toLowerCase().trim()).filter(Boolean));

        const getVal = (row: any, ...keys: string[]) => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
              return String(row[k]).trim();
            }
            const lowerK = k.toLowerCase().replace(/\s+/g, "");
            for (const actualKey of Object.keys(row)) {
              if (actualKey.toLowerCase().replace(/\s+/g, "") === lowerK) {
                if (row[actualKey] !== undefined && row[actualKey] !== null && String(row[actualKey]).trim() !== "") {
                  return String(row[actualKey]).trim();
                }
              }
            }
          }
          return "";
        };

        const parsed: any[] = [];
        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const kdBrg = getVal(row, "KDBRG", "kode_barang", "kode barang", "kd_brg");
          const nama = getVal(row, "NMBRG", "nama_barang", "nama barang", "nm_brg");
          const barcodeRaw = getVal(row, "BARCODE", "barcode");
          const finalBarcode = barcodeRaw || kdBrg;
          const sat1 = getVal(row, "SAT 1", "satuan_1", "sat 1") || "PCS";
          const sat2 = getVal(row, "SAT 2", "satuan_2", "sat 2");
          const sat3 = getVal(row, "SAT 3", "satuan_3", "sat 3");
          const isi2 = getVal(row, "ISI 2", "isi_2", "isi 2");
          const isi3 = getVal(row, "ISI 3", "isi_3", "isi 3");
          const dept = getVal(row, "DEPARTEMENT", "departement", "departemen", "kategori");
          const supp = getVal(row, "SUPPLIER", "supplier");
          const hrgBeli = getVal(row, "HRGBELI", "harga_beli", "harga beli");
          const hbt = getVal(row, "HBT", "hbt", "harga_rata");
          const kelompok = getVal(row, "KELOMPOK", "kelompok");
          const level = getVal(row, "LEVEL", "level");

          let status = "BARU";
          let reason = "Barang baru akan ditambahkan.";

          if (!nama) {
            status = "SKIP";
            reason = "Nama Barang (NMBRG) kosong, baris ini dilewati.";
          } else if (!finalBarcode) {
            status = "ERROR";
            reason = "KDBRG & BARCODE keduanya kosong.";
          } else if (
            (kdBrg && existingKodes.has(kdBrg.toLowerCase())) ||
            (finalBarcode && existingBarcodes.has(finalBarcode.toLowerCase()))
          ) {
            status = "UPDATE";
            reason = "Data barang sudah terdaftar, akan diperbarui.";
          }

          parsed.push({
            rowNum,
            kode_barang: kdBrg,
            nama_barang: nama,
            barcode: finalBarcode,
            barcode_asli: barcodeRaw,
            satuan_1: sat1,
            satuan_2: sat2,
            satuan_3: sat3,
            isi_2: isi2 ? parseInt(isi2) : null,
            isi_3: isi3 ? parseInt(isi3) : null,
            departement: dept,
            supplier: supp,
            harga_beli: hrgBeli ? parseInt(hrgBeli) : 0,
            hbt: hbt ? parseInt(hbt) : 0,
            kelompok,
            level,
            _status: status,
            _reason: reason,
          });
        });

        setParsedData(parsed);
        setImportStep(2);
      } catch (err: any) {
        showToast("Gagal membaca file Excel: " + err.message, "error");
        setImportFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedData.filter((d) => d._status === "BARU" || d._status === "UPDATE");
    if (validRows.length === 0) {
      showToast("Tidak ada baris data valid yang dapat diimpor.", "error");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/barang/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRows),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengimpor data barang.");
      }

      setImportResult(data);
      setImportStep(3);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportStep(1);
    setImportFile(null);
    setParsedData([]);
    setImportResult(null);
  };

  const formatRupiah = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return formatCurrency(val);
  };

  const renderLevelBadge = (level?: string | null, daysSince?: string | null) => {
    const lvl = (level || "MEDIUM").toUpperCase();
    switch (lvl) {
      case "FAST":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25" title="Fast Moving: Penjualan aktif dalam 3 hari terakhir">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Fast Moving
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25" title="Medium Moving: Penjualan reguler 4-14 hari terakhir (atau produk baru)">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Medium Moving
          </span>
        );
      case "SLOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25" title="Slow Moving: Penjualan lambat 15-60 hari terakhir">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Slow Moving
          </span>
        );
      case "DEAD":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25" title="Dead Stock: Tidak terjual > 60 hari">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Dead Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant">
            {level || "-"}
          </span>
        );
    }
  };

  const renderFiskalBadge = (isLapor?: boolean | null) => {
    const lapor = isLapor !== false; // default true jika null / undefined
    if (lapor) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25" title="Lapor Pajak: Transaksi produk ini dilaporkan ke SPT / e-Faktur Pajak">
          <span>🏛️</span> Lapor Pajak
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25" title="Tidak Lapor Pajak: Khusus pembukuan internal toko / non-fiskal">
        <span>🔒</span> Non-Lapor
      </span>
    );
  };

  const safeList = Array.isArray(list) ? list : [];
  const sortedList = [...safeList].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === "nama_kategori") {
      aVal = a.nama_kategori || "";
      bVal = b.nama_kategori || "";
    } else if (sortField === "nama_supplier") {
      aVal = a.nama_supplier || "";
      bVal = b.nama_supplier || "";
    } else {
      aVal = a[sortField as keyof Barang] ?? "";
      bVal = b[sortField as keyof Barang] ?? "";
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-4 overflow-hidden text-on-background relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl animate-in slide-in-from-top-5 duration-200 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 backdrop-blur-md" 
            : "bg-error/10 border-error/25 text-error backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Katalog Barang
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{totalItems.toLocaleString("id-ID")} barang terdaftar</p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setDebouncedSearch(search);
                  setPage(1);
                }
              }}
              placeholder="Cari nama / barcode..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="shrink-0">
            <select
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value);
                setPage(1);
              }}
              className="bg-surface border border-outline-variant text-on-surface rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              title="Filter Berdasarkan Level Perputaran Barang (FSN)"
            >
              <option value="ALL">Semua Level</option>
              <option value="FAST">🟢 Fast Moving</option>
              <option value="MEDIUM">🔵 Medium Moving</option>
              <option value="SLOW">🟡 Slow Moving</option>
              <option value="DEAD">🔴 Dead Stock</option>
            </select>
          </div>

          <div className="shrink-0">
            <select
              value={selectedFiskalFilter}
              onChange={(e) => {
                setSelectedFiskalFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-surface border border-outline-variant text-on-surface rounded-xl px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              title="Filter Berdasarkan Status Pelaporan Pajak (Fiskal)"
            >
              <option value="ALL">Semua Fiskal</option>
              <option value="LAPOR">🏛️ Lapor Pajak</option>
              <option value="NON_LAPOR">🔒 Tidak Lapor</option>
            </select>
          </div>

          <button
            onClick={handleRecalculateLevel}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
            title="Hitung Ulang Level FSN Berdasarkan Riwayat Penjualan Terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRecalculating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRecalculating ? "Menghitung..." : "Hitung Level"}</span>
          </button>

          {can_create && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setImportStep(1);
                  setImportFile(null);
                  setParsedData([]);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0 shadow-sm cursor-pointer"
                title="Import data barang dari file Excel (.xlsx / .xls)"
              >
                <Upload className="w-4 h-4 text-primary" /> Import Excel
              </button>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_barang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Barang {renderSortIndicator("nama_barang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_kategori")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kategori & Supplier {renderSortIndicator("nama_kategori")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("harga_beli")}
                  >
                    <div className="flex items-center gap-1.5">
                      Harga Beli {renderSortIndicator("harga_beli")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("harga_jual_1_1")}
                  >
                    <div className="flex items-center gap-1.5">
                      Harga Jual (Retail) {renderSortIndicator("harga_jual_1_1")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status {renderSortIndicator("status")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("level_barang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Level (FSN) {renderSortIndicator("level_barang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("lapor_pajak")}
                  >
                    <div className="flex items-center gap-1.5">
                      Fiskal {renderSortIndicator("lapor_pajak")}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Belum ada katalog barang yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((b, idx) => (
                    <tr key={b.id_barang} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-4 text-on-surface-variant text-sm font-mono">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-on-surface font-semibold">{b.nama_barang}</span>
                          {b.tipe_barang && b.tipe_barang !== "STOK" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">
                              {b.tipe_barang === "JASA" ? "JASA" : "HABIS PAKAI"}
                            </span>
                          )}
                          {b.lacak_kadaluarsa && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              FEFO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {b.kode_barang && (
                            <span className="text-primary font-mono text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20" title="Kode Barang">
                              {b.kode_barang}
                            </span>
                          )}
                          <span className="text-on-surface-variant font-mono text-xs bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">
                            {b.barcode}
                          </span>
                          {b.barcode_satuan_2 && (
                            <span className="text-on-surface-variant/80 font-mono text-[10px] bg-surface-container/30 px-1 py-0.5 rounded" title="Barcode Satuan 2">
                              S2: {b.barcode_satuan_2}
                            </span>
                          )}
                          {b.barcode_satuan_3 && (
                            <span className="text-on-surface-variant/80 font-mono text-[10px] bg-surface-container/30 px-1 py-0.5 rounded" title="Barcode Satuan 3">
                              S3: {b.barcode_satuan_3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface text-sm block font-medium">{b.nama_kategori || "-"}</span>
                        <span className="text-on-surface-variant text-xs">{b.nama_supplier || "-"}</span>
                      </td>
                      <td className="px-5 py-4 text-on-surface font-mono text-sm">
                        {formatRupiah(b.harga_beli)}
                      </td>
                      <td className="px-5 py-4 text-primary text-sm font-bold font-mono">
                        {formatRupiah(b.harga_jual_1_1)} <span className="text-on-surface-variant font-normal text-xs">/ {b.satuan_1}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.status === "Aktif"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-error/10 text-error border border-error/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 items-start">
                          {renderLevelBadge(b.level_barang, b.terakhir_terjual)}
                          {b.level_mode === "MANUAL" ? (
                            <span className="text-[10px] text-on-surface-variant/70 italic">Manual</span>
                          ) : b.terakhir_terjual ? (
                            <span className="text-[10px] text-on-surface-variant/60" title={`Terakhir terjual: ${b.terakhir_terjual}`}>
                              {b.terakhir_terjual.split(" ")[0]}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderFiskalBadge(b.lapor_pajak)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openViewModal(b)} className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Lihat detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openMultiCabangModal(b)}
                            className="p-1.5 text-on-surface-variant hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Cek Stok 19 Cabang"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>
                          {can_update && (
                            <button onClick={() => openModal(b)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button onClick={() => confirmDelete(b)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Hapus">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          page={page}
          limit={limit}
          total={totalItems}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          isLoading={loading}
        />
      </div>

      {/* Modal View Detail */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Detail Barang</h2>
              <button onClick={() => setShowViewModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-on-surface-variant text-xs block">Nama Barang</span>
                  <span className="text-on-surface font-semibold">{selectedItem.nama_barang}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Barcode & Kode</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedItem.kode_barang && (
                      <span className="text-primary font-mono font-bold text-xs bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20" title="Kode Barang">
                        {selectedItem.kode_barang}
                      </span>
                    )}
                    <span className="text-on-surface font-mono font-semibold">{selectedItem.barcode}</span>
                  </div>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Kategori</span>
                  <span className="text-on-surface font-semibold">{selectedItem.nama_kategori || "-"}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Supplier</span>
                  <span className="text-on-surface font-semibold">{selectedItem.nama_supplier || "-"}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Harga Beli</span>
                  <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_beli)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Harga HPP Rata-Rata</span>
                  <span className="text-on-surface font-mono font-semibold">{formatRupiah(selectedItem.harga_rata)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Level Perputaran (FSN)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {renderLevelBadge(selectedItem.level_barang, selectedItem.terakhir_terjual)}
                    <span className="text-[10px] text-on-surface-variant/70">
                      ({selectedItem.level_mode === "MANUAL" ? "Mode Manual" : "Auto-Kalkulasi"})
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Terakhir Terjual</span>
                  <span className="text-on-surface font-medium text-xs">
                    {selectedItem.terakhir_terjual || "Belum ada riwayat penjualan"}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block">Pelaporan Pajak (Fiskal)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {renderFiskalBadge(selectedItem.lapor_pajak)}
                    <span className="text-[10px] text-on-surface-variant/70">
                      ({selectedItem.status_pajak || "Non PPn"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 4 Kolom: Satuan, Retail, Grosir, Khusus */}
              <div className="border-t border-outline-variant/40 pt-4">
                <h3 className="font-semibold text-on-surface mb-3 text-sm">Struktur Satuan & Harga Jual</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-outline-variant/30 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                        <th className="p-2.5 font-semibold">Satuan (Isi)</th>
                        <th className="p-2.5 font-semibold">Retail (L1)</th>
                        <th className="p-2.5 font-semibold">Grosir (L2)</th>
                        <th className="p-2.5 font-semibold">Khusus (L3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      <tr className="hover:bg-surface-container-low/30">
                        <td className="p-2.5 font-medium">{selectedItem.satuan_1} (1)</td>
                        <td className="p-2.5 font-mono text-primary font-bold">{formatRupiah(selectedItem.harga_jual_1_1)}</td>
                        <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_1)}</td>
                        <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_3_1)}</td>
                      </tr>
                      {selectedItem.satuan_2 && (
                        <tr className="hover:bg-surface-container-low/30">
                          <td className="p-2.5 font-medium">{selectedItem.satuan_2} ({selectedItem.isi_2})</td>
                          <td className="p-2.5 font-mono text-primary font-bold">{formatRupiah(selectedItem.harga_jual_1_2)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_2)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_3_2)}</td>
                        </tr>
                      )}
                      {selectedItem.satuan_3 && (
                        <tr className="hover:bg-surface-container-low/30">
                          <td className="p-2.5 font-medium">{selectedItem.satuan_3} ({selectedItem.isi_3})</td>
                          <td className="p-2.5 font-mono text-primary font-bold">{formatRupiah(selectedItem.harga_jual_1_3)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_2_3)}</td>
                          <td className="p-2.5 font-mono font-semibold">{formatRupiah(selectedItem.harga_jual_3_3)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/40">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openMultiCabangModal(selectedItem);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Building2 className="w-4 h-4" /> Cek Stok 19 Cabang
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Barang" : "Tambah Barang Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Kolom 1: Data Dasar */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Informasi Produk
                </h3>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Kode Barang (KDBRG / Internal)</label>
                  <input
                    type="text"
                    value={kodeBarang}
                    onChange={(e) => setKodeBarang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Contoh: MU001-0004"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode *</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Barcode scanner scan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Nama lengkap barang"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Kategori</label>
                  <select
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id_kategori} value={c.id_kategori} className="bg-surface text-on-surface">{c.nama_kategori}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="" className="bg-surface text-on-surface-variant">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id_supplier} value={s.id_supplier} className="bg-surface text-on-surface">{s.nama_supplier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Status Pajak</label>
                  <select
                    value={statusPajak}
                    onChange={(e) => setStatusPajak(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="Non PPn" className="bg-surface text-on-surface">Non PPn</option>
                    <option value="PPn" className="bg-surface text-on-surface">PPn</option>
                    <option value="Cukai" className="bg-surface text-on-surface">Cukai</option>
                    <option value="Konsinyasi" className="bg-surface text-on-surface">Konsinyasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Pelaporan Pajak (Fiskal)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLaporPajak(true)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        laporPajak
                          ? "bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400 shadow-xs"
                          : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high/40"
                      }`}
                    >
                      <span>🏛️</span> Lapor Pajak
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaporPajak(false)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !laporPajak
                          ? "bg-slate-500/15 border-slate-500/50 text-slate-700 dark:text-slate-300 shadow-xs"
                          : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high/40"
                      }`}
                    >
                      <span>🔒</span> Tidak Lapor
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70 mt-1">
                    {laporPajak
                      ? "✅ Transaksi dilaporkan ke SPT Masa & e-Faktur DJP."
                      : "⚠️ Khusus pembukuan internal toko (non-fiskal)."}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Tipe Produk</label>
                  <select
                    value={tipeBarang}
                    onChange={(e) => setTipeBarang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="STOK" className="bg-surface text-on-surface">📦 Barang Persediaan (Storable)</option>
                    <option value="JASA" className="bg-surface text-on-surface">🛠️ Jasa / Layanan (Service)</option>
                    <option value="HABIS_PAKAI" className="bg-surface text-on-surface">🏷️ Habis Pakai (Consumable/Biaya)</option>
                  </select>
                </div>
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-surface-container-low p-2 rounded-lg border border-outline-variant/40">
                    <input
                      type="checkbox"
                      checked={lacakKadaluarsa}
                      onChange={(e) => setLacakKadaluarsa(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-on-surface font-medium">Lacak Batch & Kadaluarsa (FEFO)</span>
                  </label>
                </div>
                <div className="pt-2 border-t border-outline-variant/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-on-surface">Level Perputaran (FSN)</label>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="level_mode"
                          checked={levelMode === "AUTO"}
                          onChange={() => setLevelMode("AUTO")}
                          className="text-primary text-xs"
                        />
                        <span>Auto</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="level_mode"
                          checked={levelMode === "MANUAL"}
                          onChange={() => setLevelMode("MANUAL")}
                          className="text-primary text-xs"
                        />
                        <span>Manual</span>
                      </label>
                    </div>
                  </div>
                  <select
                    value={levelBarang}
                    onChange={(e) => setLevelBarang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="FAST">🟢 Fast Moving (&lt; 3 hari)</option>
                    <option value="MEDIUM">🔵 Medium Moving (4-14 hari / Baru)</option>
                    <option value="SLOW">🟡 Slow Moving (15-60 hari)</option>
                    <option value="DEAD">🔴 Dead Stock (&gt; 60 hari)</option>
                  </select>
                  <p className="text-[10px] text-on-surface-variant/70 leading-tight">
                    💡 Inkubasi 30 hari untuk produk baru agar tidak langsung dicap Dead Stock.
                  </p>
                </div>
              </div>

              {/* Kolom 2: Satuan & HPP */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Struktur Satuan & Barcode Kemasan
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Satuan 1 (Kecil)</label>
                    <input
                      type="text"
                      value={satuan1}
                      onChange={(e) => setSatuan1(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. pcs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Isi 1</label>
                    <input
                      type="number"
                      value="1"
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none opacity-60 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Satuan 2 (Tengah)</label>
                    <input
                      type="text"
                      value={satuan2}
                      onChange={(e) => setSatuan2(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. pak"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Isi 2 (jml pcs)</label>
                    <input
                      type="number"
                      value={isi2}
                      onChange={(e) => setIsi2(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Satuan 3 (Besar)</label>
                    <input
                      type="text"
                      value={satuan3}
                      onChange={(e) => setSatuan3(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="e.g. dus"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Isi 3 (jml pcs)</label>
                    <input
                      type="number"
                      value={isi3}
                      onChange={(e) => setIsi3(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="e.g. 40"
                    />
                  </div>
                </div>

                {/* Multi-Barcode per Satuan Kemasan */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/30">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode Satuan 2</label>
                    <input
                      type="text"
                      value={barcode2}
                      onChange={(e) => setBarcode2(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Barcode Pack/Renceng"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode Satuan 3</label>
                    <input
                      type="text"
                      value={barcode3}
                      onChange={(e) => setBarcode3(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Barcode Dus/Karton"
                    />
                  </div>
                </div>

                <div className="border-t border-outline-variant/40 pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Harga Beli</label>
                    <input
                      type="number"
                      value={hargaBeli}
                      onChange={(e) => setHargaBeli(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                      placeholder="Nominal Rp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1 flex items-center gap-1">
                      HPP Rata-Rata <span className="text-[10px] text-primary">(Auto)</span>
                    </label>
                    <input
                      type="number"
                      value={hargaRata}
                      className="w-full bg-surface-container-low/50 border border-outline-variant/50 text-on-surface/60 rounded-lg px-3 py-2 text-xs font-mono cursor-not-allowed"
                      placeholder="Dihitung dari pembelian"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Kolom 3: Harga Jual */}
              <div className="space-y-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/30">
                <h3 className="font-semibold text-on-surface text-sm border-b border-outline-variant/40 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Susunan Harga Jual
                </h3>
                
                {/* Level 1: Retail */}
                <div>
                  <span className="text-on-surface font-semibold text-xs mb-1 block">Level 1 (Retail)</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    <input
                      type="number"
                      value={hj_1_1}
                      onChange={(e) => setHj11(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      placeholder="Sat 1"
                    />
                    <input
                      type="number"
                      value={hj_1_2}
                      onChange={(e) => setHj12(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 2"
                      disabled={!satuan2}
                    />
                    <input
                      type="number"
                      value={hj_1_3}
                      onChange={(e) => setHj13(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 3"
                      disabled={!satuan3}
                    />
                  </div>
                </div>

                {/* Level 2: Grosir */}
                <div>
                  <span className="text-on-surface font-semibold text-xs mb-1 block">Level 2 (Grosir)</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    <input
                      type="number"
                      value={hj_2_1}
                      onChange={(e) => setHj21(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      placeholder="Sat 1"
                    />
                    <input
                      type="number"
                      value={hj_2_2}
                      onChange={(e) => setHj22(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 2"
                      disabled={!satuan2}
                    />
                    <input
                      type="number"
                      value={hj_2_3}
                      onChange={(e) => setHj23(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 3"
                      disabled={!satuan3}
                    />
                  </div>
                </div>

                {/* Level 3: Khusus */}
                <div>
                  <span className="text-on-surface font-semibold text-xs mb-1 block">Level 3 (Khusus)</span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    <input
                      type="number"
                      value={hj_3_1}
                      onChange={(e) => setHj31(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none"
                      placeholder="Sat 1"
                    />
                    <input
                      type="number"
                      value={hj_3_2}
                      onChange={(e) => setHj32(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 2"
                      disabled={!satuan2}
                    />
                    <input
                      type="number"
                      value={hj_3_3}
                      onChange={(e) => setHj33(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none disabled:opacity-50"
                      placeholder="Sat 3"
                      disabled={!satuan3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/40 pt-2">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Jual Rugi</label>
                    <select
                      value={jualRugi}
                      onChange={(e) => setJualRugi(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="0" className="bg-surface text-on-surface">Tidak Boleh</option>
                      <option value="1" className="bg-surface text-on-surface">Boleh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="Aktif" className="bg-surface text-on-surface">Aktif</option>
                      <option value="Nonaktif" className="bg-surface text-on-surface">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Baris Bawah: Keterangan & Button */}
              <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/40 pt-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Keterangan 1</label>
                  <input
                    type="text"
                    value={ket1}
                    onChange={(e) => setKet1(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Informasi deskripsi tambahan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Keterangan 2</label>
                  <input
                    type="text"
                    value={ket2}
                    onChange={(e) => setKet2(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Informasi deskripsi tambahan lain"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-3 flex gap-3 pt-4 border-t border-outline-variant/40">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {saving ? "Menyimpan..." : "Simpan Barang"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center gap-2 bg-surface-container-high/40 text-error">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h2 className="font-semibold text-on-surface">Konfirmasi Hapus</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                Apakah Anda yakin ingin menghapus barang <span className="font-semibold text-on-surface">"{deleteConfirm.item.nama_barang}"</span> ({deleteConfirm.item.barcode})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm({ show: false, item: null })}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-error hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Multi-Cabang Stock Inspection */}
      {showMultiCabangModal && multiCabangItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                    Ketersediaan Stok Multi-Cabang
                  </h2>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    <span className="font-semibold text-on-surface">{multiCabangItem.nama_barang}</span>
                    <span className="mx-1.5">•</span>
                    <span className="font-mono">{multiCabangItem.barcode}</span>
                    <span className="mx-1.5">•</span>
                    Satuan: <span className="font-semibold">{multiCabangItem.satuan_1 || "pcs"}</span>
                    <span className="mx-1.5">•</span>
                    Level: {renderLevelBadge(multiCabangItem.level_barang, multiCabangItem.terakhir_terjual)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMultiCabangModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {loadingMultiCabang ? (
                <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-medium">Menghitung ketersediaan stok fisik di seluruh cabang...</p>
                </div>
              ) : multiCabangData ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Total Stok Global
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-on-surface">
                          {multiCabangData.total_stok_global.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-on-surface-variant">{multiCabangItem.satuan_1 || "pcs"}</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Total Nilai Aset
                      </span>
                      <div className="mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-500">
                          {formatRupiah(multiCabangData.total_nilai_global)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Cakupan Cabang
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-on-surface">
                          {multiCabangData.breakdown.length}
                        </span>
                        <span className="text-xs text-on-surface-variant">Cabang</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3.5">
                      <span className="text-[11px] font-medium text-on-surface-variant block uppercase tracking-wider">
                        Perlu Restok
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-amber-500">
                          {multiCabangData.breakdown.filter((b) => b.status_stok === "MENIPIS" || b.status_stok === "HABIS").length}
                        </span>
                        <span className="text-xs text-on-surface-variant">Cabang</span>
                      </div>
                    </div>
                  </div>

                  {/* Search / Filter Cabang */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-on-surface-variant" />
                      <input
                        type="text"
                        value={cabangSearch}
                        onChange={(e) => setCabangSearch(e.target.value)}
                        placeholder="Filter nama cabang..."
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      Menampilkan {multiCabangData.breakdown.filter((b) => b.nama_cabang.toLowerCase().includes(cabangSearch.toLowerCase())).length} dari {multiCabangData.breakdown.length} cabang
                    </span>
                  </div>

                  {/* Table Cabang Breakdown */}
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/40 select-none">
                          <th className="py-2.5 px-3 font-semibold w-10">#</th>
                          <th className="py-2.5 px-3 font-semibold">Cabang</th>
                          <th className="py-2.5 px-3 font-semibold">Rak</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Stok Fisik</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Buffer (Min/Max)</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Status Buffer</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Level Cabang</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Nilai Aset</th>
                          <th className="py-2.5 px-3 font-semibold text-center w-28">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {multiCabangData.breakdown
                          .filter((b) => b.nama_cabang.toLowerCase().includes(cabangSearch.toLowerCase()))
                          .map((b, idx) => {
                            const badgeColor =
                              b.status_stok === "HABIS"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : b.status_stok === "MENIPIS"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : b.status_stok === "OVERSTOCK"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                            return (
                              <tr key={b.id_cabang} className="hover:bg-surface-container-high/20 transition-colors">
                                <td className="py-2.5 px-3 text-on-surface-variant font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-on-surface">{b.nama_cabang}</div>
                                  <div className="text-[10px] text-on-surface-variant font-mono">{b.kode_cabang}</div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-on-surface-variant">
                                  {b.posisi_rak}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span
                                    className={`font-mono font-bold text-sm ${
                                      b.stok_akhir <= 0
                                        ? "text-red-500"
                                        : b.status_stok === "MENIPIS"
                                        ? "text-amber-500"
                                        : "text-on-surface"
                                    }`}
                                  >
                                    {b.stok_akhir.toLocaleString("id-ID")}
                                  </span>{" "}
                                  <span className="text-[10px] text-on-surface-variant">{multiCabangItem.satuan_1 || "pcs"}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-on-surface-variant">
                                  {b.minimal_stok} / {b.maksimal_stok || "∞"}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                                    {b.status_stok}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  {renderLevelBadge(b.level_cabang, b.terakhir_terjual_cabang)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-on-surface">
                                  {formatRupiah(b.nilai_aset)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Link
                                    href={`/distribusi/transfer?q=${encodeURIComponent(multiCabangItem.nama_barang)}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high hover:bg-emerald-600 hover:text-white text-on-surface rounded-lg text-[11px] font-semibold transition-all border border-outline-variant/40"
                                    title="Buat Pengiriman / Transfer Antar-Cabang"
                                  >
                                    <ArrowLeftRight className="w-3 h-3" /> Transfer
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {!multiCabangData.is_manager_or_admin && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-600 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Akun Anda memiliki izin cabang tunggal. Data hanya menampilkan cabang tempat Anda ditugaskan.</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              <span className="text-xs text-on-surface-variant">
                Data diperbarui secara realtime dari ledger kartu stok fisik cabang.
              </span>
              <button
                onClick={() => setShowMultiCabangModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL IMPORT EXCEL (WIZARD 3 TAHAP)                      */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base">Import Data Barang dari Excel</h2>
                  <p className="text-xs text-on-surface-variant">Tambahkan & perbarui data master barang secara massal</p>
                </div>
              </div>
              <button
                onClick={closeImportModal}
                disabled={isImporting}
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indikator */}
            <div className="px-6 py-3 bg-surface-container-low/60 border-b border-outline-variant/20 flex justify-center items-center gap-4 sm:gap-8 select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep >= 1 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>1</span>
                <span className={`text-xs font-medium ${importStep === 1 ? "text-primary font-bold" : "text-on-surface-variant"}`}>Upload File</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep >= 2 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>2</span>
                <span className={`text-xs font-medium ${importStep === 2 ? "text-primary font-bold" : "text-on-surface-variant"}`}>Pratinjau & Validasi</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep >= 3 ? "bg-emerald-600 text-white" : "bg-surface-container-high text-on-surface-variant"}`}>3</span>
                <span className={`text-xs font-medium ${importStep === 3 ? "text-emerald-500 font-bold" : "text-on-surface-variant"}`}>Hasil Selesai</span>
              </div>
            </div>

            {/* Konten Tiap Tahap */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* TAHAP 1: UPLOAD FILE & UNDUH TEMPLATE */}
              {importStep === 1 && (
                <div className="space-y-6 max-w-2xl mx-auto py-2">
                  {/* Banner Unduh Template */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">Format Template Excel Resmi</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Header mengacu pada format standar (KDBRG, NMBRG, BARCODE, SAT 1..4, ISI 2..4, STOCK, DEPARTEMENT, SUPPLIER, HRGBELI, dll).
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      type="button"
                      className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Unduh Template .xlsx
                    </button>
                  </div>

                  {/* Dropzone Upload */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-primary bg-primary/10 scale-[0.99]"
                        : "border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container-high/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-3xl bg-surface-container-high text-primary flex items-center justify-center mx-auto mb-4 border border-outline-variant/40 shadow-sm">
                      <FileUp className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-on-surface">
                      Tarik & Letakkan file Excel Anda di sini
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm mx-auto">
                      Atau <span className="text-primary font-bold underline">klik untuk memilih file</span> dari komputer Anda (.xlsx, .xls, .csv)
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/70">
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">.XLSX</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">.XLS</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">.CSV</span>
                    </div>
                  </div>

                  {/* Catatan Panduan */}
                  <div className="p-4 bg-surface-container/50 border border-outline-variant/40 rounded-2xl text-xs space-y-1.5 text-on-surface-variant">
                    <p className="font-semibold text-on-surface flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-primary" /> Panduan & Logika Sistem:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                      <li>Kolom <b>NMBRG</b> (Nama Barang) wajib terisi. Baris dengan nama kosong akan otomatis dilewati (*skip*).</li>
                      <li>Jika kolom <b>BARCODE</b> kosong, sistem otomatis menggunakan nilai <b>KDBRG</b> sebagai barcode.</li>
                      <li>Barang yang sudah terdaftar akan otomatis diperbarui (*update*) jika kode/barcodenya cocok.</li>
                      <li>Jika nama <b>DEPARTEMENT</b> atau <b>SUPPLIER</b> belum ada di database, sistem akan otomatis mendaftarkannya.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAHAP 2: PRATINJAU & VALIDASI DATA */}
              {importStep === 2 && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div
                      onClick={() => setPreviewFilter("ALL")}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        previewFilter === "ALL"
                          ? "bg-surface-container-high border-primary ring-1 ring-primary"
                          : "bg-surface-container-low border-outline-variant/40 hover:bg-surface-container-high/50"
                      }`}
                    >
                      <span className="text-[10px] text-on-surface-variant font-medium block">Total Baris</span>
                      <span className="text-xl font-bold font-mono text-on-surface">{parsedData.length}</span>
                    </div>
                    <div
                      onClick={() => setPreviewFilter("BARU")}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        previewFilter === "BARU"
                          ? "bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500"
                          : "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10"
                      }`}
                    >
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Barang Baru</span>
                      <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {parsedData.filter((d) => d._status === "BARU").length}
                      </span>
                    </div>
                    <div
                      onClick={() => setPreviewFilter("UPDATE")}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        previewFilter === "UPDATE"
                          ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500"
                          : "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10"
                      }`}
                    >
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">Akan Di-update</span>
                      <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                        {parsedData.filter((d) => d._status === "UPDATE").length}
                      </span>
                    </div>
                    <div
                      onClick={() => setPreviewFilter("SKIP")}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        previewFilter === "SKIP"
                          ? "bg-blue-500/15 border-blue-500 ring-1 ring-blue-500"
                          : "bg-blue-500/5 border-blue-500/30 hover:bg-blue-500/10"
                      }`}
                    >
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">Dilewati (*Skip*)</span>
                      <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                        {parsedData.filter((d) => d._status === "SKIP").length}
                      </span>
                    </div>
                    <div
                      onClick={() => setPreviewFilter("ERROR")}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        previewFilter === "ERROR"
                          ? "bg-error/15 border-error ring-1 ring-error"
                          : "bg-error/5 border-error/30 hover:bg-error/10"
                      }`}
                    >
                      <span className="text-[10px] text-error font-medium block">Error / Invalid</span>
                      <span className="text-xl font-bold font-mono text-error">
                        {parsedData.filter((d) => d._status === "ERROR").length}
                      </span>
                    </div>
                  </div>

                  {/* Info Bar */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
                    <span className="font-medium">
                      File: <b className="text-on-surface font-mono">{importFile?.name}</b>
                    </span>
                    <span>Menampilkan baris yang disaring berdasarkan kategori di atas.</span>
                  </div>

                  {/* Tabel Pratinjau */}
                  <div className="border border-outline-variant/40 rounded-2xl overflow-hidden max-h-[46vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-container-high/60 sticky top-0 z-10 border-b border-outline-variant/40 select-none">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant w-12 text-center">Baris</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant w-24">Status</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Kode / Barcode</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Nama Barang</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Kategori & Supplier</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Satuan & Isi</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant text-right">Harga Beli / HBT</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {parsedData
                          .filter((d) => (previewFilter === "ALL" ? true : d._status === previewFilter))
                          .map((row, i) => {
                            let badgeClass = "bg-surface-container text-on-surface-variant border-outline-variant/30";
                            if (row._status === "BARU") badgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold";
                            if (row._status === "UPDATE") badgeClass = "bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold";
                            if (row._status === "SKIP") badgeClass = "bg-blue-500/10 text-blue-600 border-blue-500/30";
                            if (row._status === "ERROR") badgeClass = "bg-error/10 text-error border-error/30 font-bold";

                            return (
                              <tr key={i} className="hover:bg-surface-container-high/30 transition-colors">
                                <td className="px-3 py-2 font-mono text-center text-on-surface-variant">{row.rowNum}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}>
                                    {row._status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {row.kode_barang && <div className="font-bold text-primary">{row.kode_barang}</div>}
                                  <div className="text-[11px] text-on-surface-variant">{row.barcode || "-"}</div>
                                </td>
                                <td className="px-3 py-2 font-medium text-on-surface">
                                  {row.nama_barang || <span className="italic text-error">(Nama Kosong)</span>}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="font-medium text-on-surface">{row.departement || "-"}</div>
                                  <div className="text-[10px] text-on-surface-variant">{row.supplier || "-"}</div>
                                </td>
                                <td className="px-3 py-2 font-mono text-[11px]">
                                  <span>{row.satuan_1 || "PCS"}</span>
                                  {row.satuan_2 && <span className="text-on-surface-variant"> • {row.satuan_2} ({row.isi_2})</span>}
                                  {row.satuan_3 && <span className="text-on-surface-variant"> • {row.satuan_3} ({row.isi_3})</span>}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  <div className="text-on-surface font-semibold">{formatRupiah(row.harga_beli)}</div>
                                  {row.hbt && row.hbt !== row.harga_beli && (
                                    <div className="text-[10px] text-on-surface-variant">HBT: {formatRupiah(row.hbt)}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-[11px] text-on-surface-variant">
                                  {row._reason}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAHAP 3: HASIL SUKSES & KONFIRMASI */}
              {importStep === 3 && (
                <div className="max-w-xl mx-auto py-6 text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-75 duration-200">
                    <Check className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Proses Import Selesai!</h3>
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      Data master barang dari file Excel berhasil diproses ke dalam database ERP Al Mubarok.
                    </p>
                  </div>

                  {/* Detail Rekap */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-surface-container-low/70 border border-outline-variant/40 rounded-3xl text-center">
                    <div className="p-3 bg-surface rounded-2xl border border-outline-variant/30">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">Barang Baru</span>
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {importResult?.inserted ?? 0}
                      </span>
                    </div>
                    <div className="p-3 bg-surface rounded-2xl border border-outline-variant/30">
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">Diperbarui</span>
                      <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                        {importResult?.updated ?? 0}
                      </span>
                    </div>
                    <div className="p-3 bg-surface rounded-2xl border border-outline-variant/30">
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">Dilewati</span>
                      <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                        {importResult?.skipped ?? 0}
                      </span>
                    </div>
                  </div>

                  {importResult?.errors && importResult.errors.length > 0 && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left text-xs space-y-1.5 max-h-36 overflow-y-auto">
                      <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> Catatan Baris Dilewati ({importResult.errors.length}):
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-on-surface-variant text-[11px]">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>Baris {err.row}: {err.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer Modal Actions */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              {importStep === 1 && (
                <>
                  <span className="text-xs text-on-surface-variant">Pilih file spreadsheet untuk melanjutkan.</span>
                  <button
                    onClick={closeImportModal}
                    type="button"
                    className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </>
              )}

              {importStep === 2 && (
                <>
                  <button
                    onClick={() => setImportStep(1)}
                    disabled={isImporting}
                    type="button"
                    className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ← Ganti File
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant hidden sm:inline">
                      {parsedData.filter((d) => d._status === "BARU" || d._status === "UPDATE").length} baris siap diproses
                    </span>
                    <button
                      onClick={handleExecuteImport}
                      disabled={isImporting || parsedData.filter((d) => d._status === "BARU" || d._status === "UPDATE").length === 0}
                      type="button"
                      className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Memproses Import...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Mulai Import Sekarang
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {importStep === 3 && (
                <div className="w-full flex justify-end">
                  <button
                    onClick={closeImportModal}
                    type="button"
                    className="bg-primary hover:bg-primary-container text-on-primary px-7 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
