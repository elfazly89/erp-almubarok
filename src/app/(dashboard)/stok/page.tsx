"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers,
  Edit2,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Zap,
  History,
  ShoppingCart,
  XCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Upload,
  FileSpreadsheet,
  Download,
  X,
  FileUp,
  Check,
  Building2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import TablePagination from "@/components/ui/TablePagination";

interface Stok {
  id: number;
  id_barang: number;
  kode_barang?: string | null;
  barcode: string;
  nama_barang: string;
  id_kategori: number | null;
  nama_kategori: string | null;
  id_supplier: number | null;
  nama_supplier: string | null;
  id_cabang: number;
  nama_cabang: string;
  stok_akhir: number;
  penjualan: number;
  posisi_rak: string | null;
  minimal_stok: number;
  maksimal_stok: number;
  harga_beli: number | null;
  harga_rata: number | null;
  harga_jual_1_1: number | null;
  satuan_1: string | null;
  satuan_2: string | null;
  satuan_3: string | null;
  isi_1: number | null;
  isi_2: number | null;
  isi_3: number | null;
}

interface KartuStokRow {
  id_kartu: number;
  id_barang: number;
  nama_barang: string;
  barcode: string;
  satuan_1: string;
  id_cabang: number;
  nama_cabang: string;
  tanggal_transaksi: string;
  tipe_transaksi: string;
  nomor_referensi: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  saldo_akhir: number;
  hpp_satuan: number;
  total_nilai: number;
  keterangan: string | null;
  nama_petugas: string | null;
  created_at: string;
}

export default function StokPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Stok[]>([]);
  const [cabangs, setCabangs] = useState<{ id_cabang: number; nama_cabang: string }[]>([]);
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterKondisi, setFilterKondisi] = useState<"ALL" | "HABIS" | "MENIPIS" | "AMAN" | "OVERSTOCK">("ALL");

  // Modal Buffer Settings
  const [showBufferModal, setShowBufferModal] = useState(false);
  const [editItem, setEditItem] = useState<Stok | null>(null);
  const [rak, setRak] = useState("");
  const [minimalStok, setMinimalStok] = useState("");
  const [maksimalStok, setMaksimalStok] = useState("");
  const [savingBuffer, setSavingBuffer] = useState(false);

  // Modal Quick Adjustment
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickItem, setQuickItem] = useState<Stok | null>(null);
  const [qtyAdj, setQtyAdj] = useState("");
  const [tipeAlasan, setTipeAlasan] = useState("BARANG_RUSAK_BOCOR");
  const [tindakanStok, setTindakanStok] = useState("BUANG_HAPUSKAN_STOK");
  const [keteranganAdj, setKeteranganAdj] = useState("");
  const [savingQuick, setSavingQuick] = useState(false);

  // Modal Kartu Stok
  const [showKartuModal, setShowKartuModal] = useState(false);
  const [kartuItem, setKartuItem] = useState<Stok | null>(null);
  const [kartuRows, setKartuRows] = useState<KartuStokRow[]>([]);
  const [loadingKartu, setLoadingKartu] = useState(false);

  // Modal Import Stok
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1); // 1: Upload & Cabang, 2: Preview, 3: Selesai
  const [targetCabangId, setTargetCabangId] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "UPDATE" | "SKIP" | "ERROR">("ALL");
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    nama_cabang?: string;
    total: number;
    updated: number;
    skipped: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [sortField, setSortField] = useState<string>("nama_barang");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
      <ChevronUp className="w-3.5 h-3.5 text-primary shrink-0 animate-in fade-in" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0 animate-in fade-in" />
    );
  };

  useEffect(() => {
    fetch("/api/cabang")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCabangs(data))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(
    async (
      targetPage = page,
      targetLimit = limit,
      targetSearch = debouncedSearch,
      targetCabang = selectedCabang
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: targetLimit.toString(),
        });
        if (targetCabang) params.append("id_cabang", targetCabang);
        if (targetSearch.trim()) params.append("search", targetSearch.trim());

        const res = await fetch(`/api/stok?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.pagination) {
            setList(json.data || []);
            setTotalItems(json.pagination.total);
            setTotalPages(json.pagination.totalPages);
            setPage(json.pagination.page);
          } else {
            const arr = Array.isArray(json) ? json : [];
            setList(arr);
            setTotalItems(arr.length);
            setTotalPages(1);
          }
        } else {
          showToast("Gagal memuat data stok.", "error");
        }
      } catch {
        showToast("Koneksi gagal saat memuat data stok.", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, debouncedSearch, selectedCabang, showToast]
  );

  useEffect(() => {
    fetchData(page, limit, debouncedSearch, selectedCabang);
  }, [page, limit, debouncedSearch, selectedCabang, fetchData]);

  // Debounced search (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Open Buffer Modal (Posisi Rak, Min, Max)
  const openBufferModal = (item: Stok) => {
    setEditItem(item);
    setRak(item.posisi_rak || "");
    setMinimalStok(item.minimal_stok.toString());
    setMaksimalStok(item.maksimal_stok.toString());
    setShowBufferModal(true);
  };

  const handleSaveBuffer = async () => {
    if (!editItem) return;
    setSavingBuffer(true);
    try {
      const res = await fetch(`/api/stok/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posisi_rak: rak,
          minimal_stok: parseInt(minimalStok) || 0,
          maksimal_stok: parseInt(maksimalStok) || 0,
        }),
      });

      if (res.ok) {
        showToast("Pengaturan buffer rak berhasil disimpan.", "success");
        setShowBufferModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Gagal menyimpan buffer.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setSavingBuffer(false);
    }
  };

  // Open Quick Adjustment Modal
  const openQuickModal = (item: Stok) => {
    setQuickItem(item);
    setQtyAdj("-1");
    setTipeAlasan("BARANG_RUSAK_BOCOR");
    setTindakanStok("BUANG_HAPUSKAN_STOK");
    setKeteranganAdj("");
    setShowQuickModal(true);
  };

  const handleSaveQuick = async () => {
    if (!quickItem) return;
    const qty = parseInt(qtyAdj);
    if (isNaN(qty) || qty === 0) {
      showToast("Kuantitas penyesuaian harus angka bukan nol.", "error");
      return;
    }

    setSavingQuick(true);
    try {
      const res = await fetch("/api/master/stok/quick-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_barang: quickItem.id_barang,
          id_cabang: quickItem.id_cabang,
          qty_penyesuaian: qty,
          tipe_alasan: tipeAlasan,
          tindakan_stok: tindakanStok,
          keterangan: keteranganAdj,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Penyesuaian stok berhasil dicatat ke Kartu Stok & Akuntansi.", "success");
        setShowQuickModal(false);
        fetchData();
      } else {
        showToast(data.error || "Gagal melakukan penyesuaian stok.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi server.", "error");
    } finally {
      setSavingQuick(false);
    }
  };

  // Open Kartu Stok Modal
  const openKartuModal = async (item: Stok) => {
    setKartuItem(item);
    setShowKartuModal(true);
    setLoadingKartu(true);
    try {
      const res = await fetch(`/api/master/kartu-stok?id_barang=${item.id_barang}&id_cabang=${item.id_cabang}&limit=100`);
      if (res.ok) {
        setKartuRows(await res.json());
      } else {
        showToast("Gagal memuat kartu stok barang.", "error");
      }
    } catch {
      showToast("Kesalahan jaringan saat memuat kartu stok.", "error");
    } finally {
      setLoadingKartu(false);
    }
  };

  // ==========================================
  // HANDLERS IMPORT STOK EXCEL
  // ==========================================
  const openImportModal = () => {
    setImportStep(1);
    setImportFile(null);
    setParsedData([]);
    setImportResult(null);
    if (selectedCabang && selectedCabang !== "ALL") {
      setTargetCabangId(selectedCabang);
    } else if (cabangs.length > 0) {
      setTargetCabangId(cabangs[0].id_cabang.toString());
    }
    setShowImportModal(true);
  };

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
    XLSX.utils.book_append_sheet(wb, ws, "Stok Fisik");
    XLSX.writeFile(wb, "template_import_stok.xlsx");
  };

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    if (!targetCabangId) {
      showToast("Pilih Cabang tujuan terlebih dahulu sebelum memilih file.", "error");
      return;
    }
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = async (e) => {
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

        // Fetch master barang & current branch stock for accurate comparison
        let branchStocks: any[] = [];
        try {
          const res = await fetch(`/api/stok?id_cabang=${targetCabangId}`);
          if (res.ok) branchStocks = await res.json();
        } catch {
          branchStocks = list.filter((s) => s.id_cabang === parseInt(targetCabangId));
        }

        let allMaster: any[] = [];
        try {
          const res = await fetch("/api/barang");
          if (res.ok) allMaster = await res.json();
        } catch {
          allMaster = [];
        }

        const masterBarcodeMap = new Map<string, any>();
        const masterKodeMap = new Map<string, any>();
        allMaster.forEach((b) => {
          if (b.barcode) masterBarcodeMap.set(b.barcode.trim().toLowerCase(), b);
          if (b.kode_barang) masterKodeMap.set(b.kode_barang.trim().toLowerCase(), b);
        });

        const branchStockMap = new Map<number, any>();
        branchStocks.forEach((s) => {
          branchStockMap.set(s.id_barang, s);
        });

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
          const stockRaw = getVal(row, "STOCK", "stock", "stok", "qty");
          const stockNew = parseInt(stockRaw.replace(/,/g, "")) || 0;

          // Lookup master barang
          const matchedMaster =
            (kdBrg && masterKodeMap.get(kdBrg.toLowerCase())) ||
            (finalBarcode && masterBarcodeMap.get(finalBarcode.toLowerCase())) ||
            null;

          let status = "UPDATE";
          let reason = "Stok siap diperbarui.";
          let currentStockQty = 0;

          if (isNaN(parseInt(stockRaw)) || parseInt(stockRaw) < 0) {
            status = "ERROR";
            reason = `Nilai STOCK '${stockRaw}' tidak valid atau bernilai negatif.`;
          } else if (!matchedMaster) {
            status = "SKIP";
            reason = `Barang belum terdaftar di katalog master barang.`;
          } else {
            const currentStockRecord = branchStockMap.get(matchedMaster.id_barang);
            currentStockQty = currentStockRecord ? (currentStockRecord.stok_akhir ?? 0) : 0;
            const diff = stockNew - currentStockQty;
            reason = diff === 0 ? "Stok sama dengan saldo saat ini" : `Perubahan: ${diff > 0 ? "+" : ""}${diff} unit`;
          }

          parsed.push({
            rowNum,
            kode_barang: kdBrg || matchedMaster?.kode_barang || "",
            barcode: finalBarcode || matchedMaster?.barcode || "",
            nama_barang: nama || matchedMaster?.nama_barang || "-",
            satuan_1: matchedMaster?.satuan_1 || "pcs",
            stok_lama: currentStockQty,
            stok_baru: stockNew,
            selisih: stockNew - currentStockQty,
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
    const validRows = parsedData.filter((d) => d._status === "UPDATE");
    if (validRows.length === 0) {
      showToast("Tidak ada baris stok valid yang dapat diproses.", "error");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/stok/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cabang: parseInt(targetCabangId),
          items: validRows.map((d) => ({
            rowNum: d.rowNum,
            kode_barang: d.kode_barang,
            barcode: d.barcode,
            nama_barang: d.nama_barang,
            stock: d.stok_baru,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengimpor data stok.");
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

  const safeList = Array.isArray(list) ? list : [];
  const filteredList = safeList.filter((s) => {
    if (filterKondisi === "HABIS") return s.stok_akhir <= 0;
    if (filterKondisi === "MENIPIS") return s.stok_akhir > 0 && s.stok_akhir <= s.minimal_stok;
    if (filterKondisi === "AMAN") return s.stok_akhir > s.minimal_stok && (s.maksimal_stok === 0 || s.stok_akhir <= s.maksimal_stok);
    if (filterKondisi === "OVERSTOCK") return s.maksimal_stok > 0 && s.stok_akhir > s.maksimal_stok;
    return true;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === "total_hpp") {
      aVal = a.stok_akhir * (a.harga_rata || a.harga_beli || 0);
      bVal = b.stok_akhir * (b.harga_rata || b.harga_beli || 0);
    } else {
      aVal = a[sortField as keyof Stok] ?? "";
      bVal = b[sortField as keyof Stok] ?? "";
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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toast.type === "success"
                ? "bg-primary text-on-primary border-primary/20 shadow-primary/20"
                : "bg-error text-on-error border-error/20 shadow-error/20"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Monitoring & Mutasi Stok Cabang
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Manajemen persediaan terintegrasi ({totalItems.toLocaleString("id-ID")} jenis barang tercatat)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {cabangs.length > 0 && (
            <div className="w-full sm:w-56">
              <select
                value={selectedCabang}
                onChange={(e) => {
                  setSelectedCabang(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                title="Pilih Cabang / Gudang"
              >
                <option value="">🏢 Cabang Saya (Default)</option>
                <option value="ALL">🌐 Semua Cabang (Konsolidasi)</option>
                {cabangs.map((c) => (
                  <option key={c.id_cabang} value={c.id_cabang}>
                    🏢 {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant" />
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
              placeholder="Cari barcode / barang / rak..."
              className="w-full bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={() => fetchData()}
            title="Refresh Data"
            className="p-2 border border-outline-variant/60 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {(can_create || can_update) && (
            <button
              onClick={openImportModal}
              title="Import Stok Fisik dari Excel (.xlsx / .xls)"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Upload className="w-3.5 h-3.5" /> Import Stok Excel
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Dashboard & Filter Kondisi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterKondisi("ALL")}
          className={`text-left p-3 rounded-xl border transition-all ${
            filterKondisi === "ALL"
              ? "bg-primary/10 border-primary text-primary shadow-sm"
              : "bg-surface border-outline-variant/30 hover:bg-surface-container-low text-on-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">Semua SKU</span>
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold font-mono mt-1">{list.length} <span className="text-xs font-normal">Item</span></div>
        </button>

        <button
          onClick={() => setFilterKondisi("HABIS")}
          className={`text-left p-3 rounded-xl border transition-all ${
            filterKondisi === "HABIS"
              ? "bg-error/15 border-error text-error shadow-sm"
              : "bg-surface border-outline-variant/30 hover:bg-surface-container-low text-on-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">Stok Habis (=0)</span>
            <XCircle className="w-4 h-4 text-error" />
          </div>
          <div className="text-lg font-bold font-mono mt-1 text-error">
            {list.filter((s) => s.stok_akhir <= 0).length} <span className="text-xs font-normal">SKU</span>
          </div>
        </button>

        <button
          onClick={() => setFilterKondisi("MENIPIS")}
          className={`text-left p-3 rounded-xl border transition-all ${
            filterKondisi === "MENIPIS"
              ? "bg-secondary/15 border-secondary text-secondary shadow-sm"
              : "bg-surface border-outline-variant/30 hover:bg-surface-container-low text-on-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">Menipis (&le; Min)</span>
            <AlertTriangle className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-lg font-bold font-mono mt-1 text-secondary">
            {list.filter((s) => s.stok_akhir > 0 && s.stok_akhir <= s.minimal_stok).length} <span className="text-xs font-normal">SKU</span>
          </div>
        </button>

        <div className="bg-surface border border-outline-variant/30 p-3 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">Nilai Total Inventaris</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-base font-bold font-mono mt-1 text-on-surface truncate">
            {formatRupiah(list.reduce((sum, item) => sum + (item.stok_akhir * (item.harga_rata || item.harga_beli || 0)), 0))}
          </div>
        </div>
      </div>

      {/* Tabel Data Stok */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat data persediaan...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none sticky top-0 z-10">
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_barang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Barang {renderSortIndicator("nama_barang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("posisi_rak")}
                  >
                    <div className="flex items-center gap-1.5">
                      Posisi Rak {renderSortIndicator("posisi_rak")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40 text-right"
                    onClick={() => handleSort("stok_akhir")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Stok Fisik {renderSortIndicator("stok_akhir")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40 text-right"
                    onClick={() => handleSort("minimal_stok")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Min / Max {renderSortIndicator("minimal_stok")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40 text-right"
                    onClick={() => handleSort("total_hpp")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total HPP {renderSortIndicator("total_hpp")}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi & Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant text-sm">
                      Tidak ada barang yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((s, idx) => {
                    const isZero = s.stok_akhir <= 0;
                    const isLow = s.stok_akhir > 0 && s.stok_akhir <= s.minimal_stok;
                    const hpp = s.harga_rata || s.harga_beli || 0;

                    return (
                      <tr key={s.id} className="hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-5 py-3 text-on-surface-variant text-sm font-mono">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <span className="text-on-surface font-semibold block">{s.nama_barang}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {s.kode_barang && (
                              <span className="text-primary font-mono text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20" title="Kode Barang">
                                {s.kode_barang}
                              </span>
                            )}
                            <span className="text-on-surface-variant font-mono text-xs bg-surface-container/50 px-1.5 py-0.5 rounded border border-outline-variant/20">
                              {s.barcode}
                            </span>
                            {s.nama_supplier && (
                              <span className="text-on-surface-variant/70 text-[11px] truncate max-w-[150px]">
                                {s.nama_supplier}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-on-surface font-mono text-xs bg-surface-container px-2 py-1 rounded border border-outline-variant/30">
                            {s.posisi_rak || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className={`font-mono text-sm font-bold ${isZero ? "text-error" : isLow ? "text-secondary" : "text-on-surface"}`}>
                            {s.stok_akhir} <span className="text-on-surface-variant font-normal text-xs">{s.satuan_1}</span>
                          </div>
                          {isZero && <span className="text-[10px] text-error font-semibold block">Habis</span>}
                          {isLow && <span className="text-[10px] text-secondary font-semibold block">Menipis</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-on-surface text-xs font-mono">
                          {s.minimal_stok} / {s.maksimal_stok} <span className="text-on-surface-variant text-[11px] font-sans">{s.satuan_1}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-on-surface text-sm font-semibold font-mono">
                          {formatRupiah(s.stok_akhir * hpp)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Tombol Riwayat Kartu Stok */}
                            <button
                              onClick={() => openKartuModal(s)}
                              title="Lihat Riwayat Kartu Stok"
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Kartu</span>
                            </button>

                            {/* Tombol Quick Adjust */}
                            {can_update && (
                              <button
                                onClick={() => openQuickModal(s)}
                                title="Penyesuaian Cepat (Rusak / Selisih / Sampel)"
                                className="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Adjust</span>
                              </button>
                            )}

                            {/* Tombol Buffer Rak & Min/Max */}
                            {can_update && (
                              <button
                                onClick={() => openBufferModal(s)}
                                title="Ubah Posisi Rak & Ambang Buffer"
                                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors inline-flex items-center text-xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 1-Klik Reorder PO jika stok menipis/habis */}
                            {(isLow || isZero) && (
                              <Link
                                href={`/pembelian/pesan-beli?id_barang=${s.id_barang}&supplier_id=${s.id_supplier || ""}`}
                                title={`Pesan Ulang ke Supplier (Saran: ${Math.max(1, (s.maksimal_stok || s.minimal_stok * 2) - s.stok_akhir)} ${s.satuan_1})`}
                                className="p-1.5 text-secondary hover:text-secondary-container hover:bg-secondary/15 rounded-lg transition-colors inline-flex items-center gap-0.5 text-xs font-bold"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">PO</span>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      {/* ============================================================ */}
      {/* MODAL 1: BUFFER RAK & MIN/MAX SETTING (NO DIRECT STOCK EDIT) */}
      {/* ============================================================ */}
      {showBufferModal && editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" /> Pengaturan Rak & Buffer
              </h2>
              <button onClick={() => setShowBufferModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant block">Barang</span>
                <span className="text-on-surface font-semibold text-sm">{editItem.nama_barang}</span>
                <span className="text-on-surface-variant block mt-1">Stok Fisik Saat Ini: <b className="text-primary font-mono">{editItem.stok_akhir} {editItem.satuan_1}</b></span>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Posisi Rak Toko / Lorong</label>
                <input
                  type="text"
                  value={rak}
                  onChange={(e) => setRak(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                  placeholder="Contoh: Lorong A - Rak 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1 font-sans">Minimal Stok (ROP)</label>
                  <input
                    type="number"
                    value={minimalStok}
                    onChange={(e) => setMinimalStok(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1 font-sans">Maksimal Stok</label>
                  <input
                    type="number"
                    value={maksimalStok}
                    onChange={(e) => setMaksimalStok(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container text-[11px] text-on-surface-variant/80 border border-outline-variant/30">
                💡 <i>Kuantitas fisik stok tidak dapat diubah manual di sini demi integritas audit. Gunakan tombol <b>⚡ Adjust</b> untuk penyesuaian berdokumen.</i>
              </div>

              <div className="flex gap-3 pt-3 border-t border-outline-variant/40 mt-2">
                <button
                  onClick={() => setShowBufferModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveBuffer}
                  disabled={savingBuffer}
                  className="flex-1 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  {savingBuffer ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: QUICK ADJUSTMENT (PENYESUAIAN CEPAT BERDOKUMEN)     */}
      {/* ============================================================ */}
      {showQuickModal && quickItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-amber-500/10">
              <h2 className="font-semibold text-on-surface flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Penyesuaian Cepat (Quick Adjustment)
              </h2>
              <button onClick={() => setShowQuickModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-3.5">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant block">Target Barang:</span>
                <span className="text-on-surface font-semibold text-sm">{quickItem.nama_barang}</span>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/20 font-mono">
                  <span>Stok Sistem Saat Ini: <b>{quickItem.stok_akhir} {quickItem.satuan_1}</b></span>
                  <span>HPP: <b>{formatRupiah(quickItem.harga_rata || quickItem.harga_beli || 0)}</b></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Alasan Penyesuaian *</label>
                  <select
                    value={tipeAlasan}
                    onChange={(e) => setTipeAlasan(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="BARANG_RUSAK_BOCOR">Barang Rusak / Bocor</option>
                    <option value="KADALUARSA">Kadaluarsa</option>
                    <option value="SAMPLE_PROMOSI">Sample / Tester</option>
                    <option value="SELISIH_ADMINISTRASI">Koreksi Selisih Temuan</option>
                    <option value="LAIN_LAIN">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Tindakan Fisik *</label>
                  <select
                    value={tindakanStok}
                    onChange={(e) => setTindakanStok(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="BUANG_HAPUSKAN_STOK">Hapus Stok (Auto Jurnal Beban)</option>
                    <option value="PINDAH_KE_KARANTINA">Pindah ke Area Karantina</option>
                    <option value="TAMBAH_STOK_TEMUAN">Tambah Stok (Temuan Fisik)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Kuantitas Selisih ({quickItem.satuan_1}) * <span className="text-[10px] text-on-surface-variant/70">(Gunakan tanda minus untuk mengurangi)</span>
                </label>
                <input
                  type="number"
                  value={qtyAdj}
                  onChange={(e) => setQtyAdj(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                  placeholder="-1"
                />
              </div>

              {/* Kalkulasi Ringkasan Nilai Finansial */}
              {(() => {
                const q = parseInt(qtyAdj) || 0;
                const hpp = quickItem.harga_rata || quickItem.harga_beli || 0;
                const saldoSetelah = tindakanStok === "PINDAH_KE_KARANTINA" ? quickItem.stok_akhir : Math.max(0, quickItem.stok_akhir + q);
                const nilaiTotal = Math.abs(q) * hpp;

                return (
                  <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/30 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Estimasi Saldo Akhir:</span>
                      <b className="text-on-surface">{saldoSetelah} {quickItem.satuan_1}</b>
                    </div>
                    {tindakanStok === "BUANG_HAPUSKAN_STOK" && q < 0 && (
                      <div className="flex justify-between text-error pt-1 border-t border-outline-variant/20">
                        <span>Nilai Kerugian Inventaris:</span>
                        <b>{formatRupiah(nilaiTotal)}</b>
                      </div>
                    )}
                    {tindakanStok === "PINDAH_KE_KARANTINA" && (
                      <div className="flex justify-between text-secondary pt-1 border-t border-outline-variant/20">
                        <span>Status Karantina:</span>
                        <b>Diisolasi untuk Retur Supplier</b>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Catatan Dokumen</label>
                <textarea
                  value={keteranganAdj}
                  onChange={(e) => setKeteranganAdj(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Keterangan kondisi fisik barang..."
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-outline-variant/40 mt-2">
                <button
                  onClick={() => setShowQuickModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveQuick}
                  disabled={savingQuick}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  {savingQuick ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{savingQuick ? "Memproses..." : "Eksekusi Penyesuaian"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: KARTU RIWAYAT STOK (UNIVERSAL STOCK LEDGER)         */}
      {/* ============================================================ */}
      {showKartuModal && kartuItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-semibold text-on-surface text-sm sm:text-base">
                    Kartu Riwayat Stok: {kartuItem.nama_barang}
                  </h2>
                  <span className="text-xs text-on-surface-variant font-mono">
                    Barcode: {kartuItem.barcode} | Cabang: {kartuItem.nama_cabang}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowKartuModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>

            <div className="p-5 flex-1 overflow-auto min-h-0">
              {loadingKartu ? (
                <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-primary" /> Memuat kartu stok...
                </div>
              ) : kartuRows.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant text-sm">
                  Belum ada catatan mutasi kartu stok untuk barang ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                        <th className="px-3 py-2 text-on-surface-variant font-semibold">Waktu Transaksi</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold">Tipe Mutasi</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold">No. Referensi</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold text-right">Saldo Awal</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold text-right text-primary">Masuk</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold text-right text-error">Keluar</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold text-right font-bold">Saldo Akhir</th>
                        <th className="px-3 py-2 text-on-surface-variant font-semibold">Petugas & Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-mono">
                      {kartuRows.map((r) => {
                        const isPlus = r.masuk > 0;
                        const isMinus = r.keluar > 0;

                        return (
                          <tr key={r.id_kartu} className="hover:bg-surface-container-high/20 transition-colors">
                            <td className="px-3 py-2.5 text-on-surface-variant whitespace-nowrap">
                              {r.tanggal_transaksi}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                r.tipe_transaksi.includes("MASUK") || r.tipe_transaksi.includes("PEMBELIAN")
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : r.tipe_transaksi.includes("KELUAR") || r.tipe_transaksi.includes("POS")
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  : r.tipe_transaksi.includes("ADJUSTMENT")
                                  ? "bg-secondary/10 text-secondary border border-secondary/20"
                                  : "bg-surface-container text-on-surface"
                              }`}>
                                {r.tipe_transaksi}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-on-surface whitespace-nowrap">
                              {r.nomor_referensi}
                            </td>
                            <td className="px-3 py-2.5 text-right text-on-surface-variant">
                              {r.saldo_awal}
                            </td>
                            <td className={`px-3 py-2.5 text-right font-bold ${isPlus ? "text-primary" : "text-on-surface-variant/40"}`}>
                              {isPlus ? `+${r.masuk}` : "-"}
                            </td>
                            <td className={`px-3 py-2.5 text-right font-bold ${isMinus ? "text-error" : "text-on-surface-variant/40"}`}>
                              {isMinus ? `-${r.keluar}` : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-on-surface bg-surface-container/30">
                              {r.saldo_akhir}
                            </td>
                            <td className="px-3 py-2.5 font-sans text-[11px] text-on-surface-variant max-w-[220px] truncate">
                              <span className="font-semibold text-on-surface block truncate">{r.nama_petugas || "Sistem"}</span>
                              <span className="text-[10px] truncate block">{r.keterangan || "-"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-outline-variant/40 bg-surface-container-low flex justify-end shrink-0">
              <button
                onClick={() => setShowKartuModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL IMPORT STOK FISIK EXCEL (WIZARD 3 TAHAP)            */}
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
                  <h2 className="font-bold text-on-surface text-base">Import Stok Fisik dari Excel</h2>
                  <p className="text-xs text-on-surface-variant">
                    Perbarui kuantitas persediaan cabang langsung dari file spreadsheet hasil opname
                  </p>
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
                <span className={`text-xs font-medium ${importStep === 1 ? "text-primary font-bold" : "text-on-surface-variant"}`}>Pilih Cabang & Upload</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep >= 2 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>2</span>
                <span className={`text-xs font-medium ${importStep === 2 ? "text-primary font-bold" : "text-on-surface-variant"}`}>Pratinjau & Perbandingan</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${importStep >= 3 ? "bg-emerald-600 text-white" : "bg-surface-container-high text-on-surface-variant"}`}>3</span>
                <span className={`text-xs font-medium ${importStep === 3 ? "text-emerald-500 font-bold" : "text-on-surface-variant"}`}>Hasil Selesai</span>
              </div>
            </div>

            {/* Konten Tiap Tahap */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* TAHAP 1: PILIH CABANG & UPLOAD FILE */}
              {importStep === 1 && (
                <div className="space-y-6 max-w-2xl mx-auto py-2">
                  
                  {/* Pilihan Cabang Tujuan */}
                  <div className="p-4 bg-surface-container-low/80 border border-outline-variant/40 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-on-surface flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Cabang / Toko Tujuan Import Stok:
                    </label>
                    <select
                      value={targetCabangId}
                      onChange={(e) => setTargetCabangId(e.target.value)}
                      className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-sm"
                    >
                      {cabangs.map((c) => (
                        <option key={c.id_cabang} value={c.id_cabang}>
                          🏢 {c.nama_cabang}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-on-surface-variant">
                      Kuantitas pada kolom STOCK akan dialokasikan ke cabang yang dipilih di atas.
                    </p>
                  </div>

                  {/* Banner Unduh Template */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">Template Format Excel Resmi</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Menggunakan header standar (KDBRG, NMBRG, BARCODE, SAT 1..4, ISI 2..4, STOCK, dll).
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
                      Tarik & Letakkan file Excel Stok di sini
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
                      <CheckCircle className="w-4 h-4 text-primary" /> Aturan & Kebijakan Stok:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                      <li>Nilai <b>STOCK</b> pada file Excel akan langsung menimpa saldo fisik di cabang tujuan (*replace / set saldo riil*).</li>
                      <li>Barang yang belum terdaftar di katalog master barang akan otomatis dilewati (*skip*).</li>
                      <li>Perubahan saldo fisik secara otomatis dibukukan ke dalam <b>Kartu Stok (Stock Ledger)</b> cabang dengan tipe transaksi <code>IMPORT_STOK</code>.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAHAP 2: PRATINJAU & PERBANDINGAN STOK */}
              {importStep === 2 && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      onClick={() => setPreviewFilter("UPDATE")}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        previewFilter === "UPDATE"
                          ? "bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500"
                          : "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10"
                      }`}
                    >
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Siap Di-update</span>
                      <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">Belum Terdaftar (*Skip*)</span>
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
                      <span className="text-[10px] text-error font-medium block">Format Error</span>
                      <span className="text-xl font-bold font-mono text-error">
                        {parsedData.filter((d) => d._status === "ERROR").length}
                      </span>
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
                    <span className="font-medium">
                      Cabang Tujuan: <b className="text-primary font-semibold">{cabangs.find((c) => c.id_cabang === parseInt(targetCabangId))?.nama_cabang || `Cabang #${targetCabangId}`}</b>
                      <span className="mx-2">•</span>
                      File: <b className="text-on-surface font-mono">{importFile?.name}</b>
                    </span>
                    <span>Menampilkan baris perbandingan stok fisik.</span>
                  </div>

                  {/* Tabel Pratinjau & Perbandingan */}
                  <div className="border border-outline-variant/40 rounded-2xl overflow-hidden max-h-[46vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-container-high/60 sticky top-0 z-10 border-b border-outline-variant/40 select-none">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant w-12 text-center">Baris</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant w-28">Status</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Kode / Barcode</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Nama Barang</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant text-right">Stok Saat Ini</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant text-right">Stok Baru (Excel)</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant text-right">Selisih Mutasi</th>
                          <th className="px-3 py-2.5 font-semibold text-on-surface-variant">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {parsedData
                          .filter((d) => (previewFilter === "ALL" ? true : d._status === previewFilter))
                          .map((row, i) => {
                            let badgeClass = "bg-surface-container text-on-surface-variant border-outline-variant/30";
                            if (row._status === "UPDATE") badgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold";
                            if (row._status === "SKIP") badgeClass = "bg-blue-500/10 text-blue-600 border-blue-500/30 font-medium";
                            if (row._status === "ERROR") badgeClass = "bg-error/10 text-error border-error/30 font-bold";

                            const isDiffPlus = row.selisih > 0;
                            const isDiffMinus = row.selisih < 0;

                            return (
                              <tr key={i} className="hover:bg-surface-container-high/30 transition-colors">
                                <td className="px-3 py-2 font-mono text-center text-on-surface-variant">{row.rowNum}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}>
                                    {row._status === "UPDATE" ? "Siap Update" : row._status === "SKIP" ? "Dilewati" : "Error"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {row.kode_barang && <div className="font-bold text-primary">{row.kode_barang}</div>}
                                  <div className="text-[11px] text-on-surface-variant">{row.barcode || "-"}</div>
                                </td>
                                <td className="px-3 py-2 font-medium text-on-surface">
                                  {row.nama_barang}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-on-surface-variant">
                                  {row.stok_lama} <span className="text-[10px]">{row.satuan_1}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-on-surface bg-surface-container-low/40">
                                  {row.stok_baru} <span className="text-[10px] font-normal text-on-surface-variant">{row.satuan_1}</span>
                                </td>
                                <td className={`px-3 py-2 text-right font-mono font-bold ${
                                  isDiffPlus ? "text-primary" : isDiffMinus ? "text-error" : "text-on-surface-variant"
                                }`}>
                                  {isDiffPlus ? `+${row.selisih}` : row.selisih}
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
                    <h3 className="text-xl font-bold text-on-surface">Import Stok Berhasil!</h3>
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      Kuantitas persediaan untuk <b>{importResult?.nama_cabang || "cabang tujuan"}</b> telah diperbarui dan mutasi telah tercatat di Kartu Stok.
                    </p>
                  </div>

                  {/* Rekap Angka */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-surface-container-low/70 border border-outline-variant/40 rounded-3xl text-center">
                    <div className="p-3 bg-surface rounded-2xl border border-outline-variant/30">
                      <span className="text-[11px] text-on-surface-variant font-medium block">Total Diproses</span>
                      <span className="text-2xl font-bold font-mono text-on-surface">
                        {importResult?.total ?? 0}
                      </span>
                    </div>
                    <div className="p-3 bg-surface rounded-2xl border border-outline-variant/30">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">Stok Diperbarui</span>
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
                  <span className="text-xs text-on-surface-variant">Pilih cabang tujuan dan file spreadsheet.</span>
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
                    ← Ganti File / Cabang
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant hidden sm:inline">
                      {parsedData.filter((d) => d._status === "UPDATE").length} baris siap diperbarui
                    </span>
                    <button
                      onClick={handleExecuteImport}
                      disabled={isImporting || parsedData.filter((d) => d._status === "UPDATE").length === 0}
                      type="button"
                      className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Memproses Import Stok...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Mulai Import Stok Sekarang
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {importStep === 3 && (
                <div className="w-full flex justify-end">
                  <button
                    onClick={() => {
                      if (targetCabangId) setSelectedCabang(targetCabangId);
                      closeImportModal();
                    }}
                    type="button"
                    className="bg-primary hover:bg-primary-container text-on-primary px-7 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Selesai & Muat Ulang Stok
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
