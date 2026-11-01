"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Printer,
  Search,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { useAppSettings } from "@/components/providers/AppSettingsProvider";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";
import TablePagination from "@/components/ui/TablePagination";

interface Invoice {
  id_penjualan: number;
  no_invoice: string;
  tanggal_invoice: string;
  jam_invoice: string;
  nama_pelanggan: string;
  subtotal: number;
  diskon: number;
  nominal_voucher: number;
  potongan_poin: number;
  infaq: number;
  total_akhir: number;
  jenis_pembayaran: string;
  jumlah_bayar: number;
  poin_didapat: number;
}

export default function HistoryPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const { settings } = useAppSettings();
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [summaryData, setSummaryData] = useState<{
    total_nota: number;
    total_bersih: number;
    omset_tunai: number;
    omset_non_tunai: number;
  }>({
    total_nota: 0,
    total_bersih: 0,
    omset_tunai: 0,
    omset_non_tunai: 0,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Master options for Import Modal
  const [cabangList, setCabangList] = useState<{ id_cabang: number; nama_cabang: string }[]>([]);
  const [kasirList, setKasirList] = useState<{ id: number; nama_user: string }[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Modal Import Excel (Dev Mode)
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [selectedImportCabang, setSelectedImportCabang] = useState<number | string>("");
  const [selectedImportFallbackKasir, setSelectedImportFallbackKasir] = useState<number | string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawRowCount, setRawRowCount] = useState<number>(0);
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total_invoices: number;
    total_items: number;
    skipped_items: number;
    skipped_details: string[];
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const [cashierName, setCashierName] = useState("Kasir Toko");
  const [branchName, setBranchName] = useState("Cabang");

  const fetchData = useCallback(
    async (targetPage = page, targetLimit = limit, targetSearch = debouncedSearch) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: targetLimit.toString(),
        });
        if (targetSearch.trim()) params.append("search", targetSearch.trim());

        const [resList, resSummary, resProfile, resUsers, resCabang] = await Promise.all([
          fetch(`/api/penjualan?${params.toString()}`),
          fetch(`/api/penjualan/summary${targetSearch.trim() ? `?search=${encodeURIComponent(targetSearch.trim())}` : ""}`),
          fetch("/api/pengaturan/profile"),
          fetch("/api/hrd/users?limit=100"),
          fetch("/api/master/cabang")
        ]);

        if (!resList.ok || !resProfile.ok) {
          throw new Error("Gagal memuat data transaksi.");
        }

        const listJson = await resList.json();
        if (listJson && listJson.pagination) {
          setList(listJson.data || []);
          setTotalItems(listJson.pagination.total);
          setTotalPages(listJson.pagination.totalPages);
          setPage(listJson.pagination.page);
        } else {
          const items = Array.isArray(listJson) ? listJson : (Array.isArray(listJson?.data) ? listJson.data : []);
          setList(items);
          setTotalItems(items.length);
          setTotalPages(1);
        }

        if (resSummary.ok) {
          const sumJson = await resSummary.json();
          if (sumJson && sumJson.data) {
            setSummaryData({
              total_nota: Number(sumJson.data.total_nota) || 0,
              total_bersih: Number(sumJson.data.total_bersih) || 0,
              omset_tunai: Number(sumJson.data.omset_tunai) || 0,
              omset_non_tunai: Number(sumJson.data.omset_non_tunai) || 0,
            });
          }
        }

        const profileData = await resProfile.json();
        if (profileData && profileData.id) {
          setUserProfile(profileData);
          if (profileData.id_cabang) setSelectedImportCabang(profileData.id_cabang);
          if (profileData.id) setSelectedImportFallbackKasir(profileData.id);

          const resUser = await fetch(`/api/hrd/users/${profileData.id}`);
          if (resUser.ok) {
            const userData = await resUser.json();
            setCashierName(userData.nama_user || "Kasir Toko");
            setBranchName(userData.nama_cabang || "Cabang");
          }
        }

        if (resUsers.ok) {
          const u = await resUsers.json();
          const items = Array.isArray(u) ? u : u.data || [];
          setKasirList(items);
          if (items.length > 0) setSelectedImportFallbackKasir((prev) => prev || items[0].id);
        }

        if (resCabang.ok) {
          const c = await resCabang.json();
          const items = Array.isArray(c) ? c : c.data || [];
          setCabangList(items);
          if (items.length > 0) setSelectedImportCabang((prev) => prev || items[0].id_cabang);
        }
      } catch (err: any) {
        showToast(err.message || "Gagal memuat data riwayat transaksi.", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, debouncedSearch, showToast]
  );

  useEffect(() => {
    fetchData(page, limit, debouncedSearch);
  }, [page, limit, debouncedSearch, fetchData]);

  // Debounced search (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Helper Parsing
  const parseExcelDate = (val: any): string => {
    if (!val) return new Date().toISOString().slice(0, 10);
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    if (typeof val === "number") {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dt = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${dt}`;
      }
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
      }
      const ymd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (ymd) {
        return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
      }
    }
    return new Date().toISOString().slice(0, 10);
  };

  const parseExcelTime = (val: any): string => {
    if (!val) return "12:00:00";
    if (val instanceof Date) {
      const hh = String(val.getHours()).padStart(2, "0");
      const mm = String(val.getMinutes()).padStart(2, "0");
      const ss = String(val.getSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
    if (typeof val === "number") {
      let fraction = val;
      if (fraction >= 1) fraction = fraction - Math.floor(fraction);
      const totalSeconds = Math.round(fraction * 86400);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.includes(":")) {
        const parts = trimmed.split(":");
        const hh = (parts[0] || "00").padStart(2, "0");
        const mm = (parts[1] || "00").padStart(2, "0");
        const ss = (parts[2] || "00").padStart(2, "0").slice(0, 2);
        return `${hh}:${mm}:${ss}`;
      }
    }
    return "12:00:00";
  };

  const parseExcelNumber = (val: any): number => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val === "string") {
      let clean = val.trim();
      if (clean.includes(".") && clean.includes(",")) {
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else if (clean.includes(",")) {
        clean = clean.replace(",", ".");
      }
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const groupRowsToTransactions = (rows: any[]) => {
    const groups = new Map<string, any>();

    for (const row of rows) {
      const noJual = String(
        row["NOJUAL"] ||
        row["nojual"] ||
        row["Nojual"] ||
        row["no_invoice"] ||
        row["NO_INVOICE"] ||
        row["No. Invoice"] ||
        ""
      ).trim();

      if (!noJual) continue;

      if (!groups.has(noJual)) {
        const rawDate = row["TANGGAL"] || row["TGL1"] || row["tanggal"] || row["Tanggal"];
        const rawTime = row["JAM"] || row["jam"] || row["Jam"] || row["WAKTU"] || row["waktu"];
        const rawCust = row["NMCUST"] || row["nmcust"] || row["nama_pelanggan"] || row["CUSTOMER"] || "Umum";
        const rawUser = row["NMUSER"] || row["nmuser"] || row["kasir"] || row["Kasir"] || "";
        const rawPay = row["CARABAYAR"] || row["carabayar"] || row["jenis_pembayaran"] || "Tunai";
        const rawSubtotal = parseExcelNumber(row["SUBTOTAL"] || row["subtotal"] || 0);
        const rawDiskon = parseExcelNumber(row["POTONGANRP"] || row["potonganrp"] || row["POTONGAN"] || row["potongan"] || 0);
        const rawBayar = parseExcelNumber(row["BAYAR"] || row["bayar"] || 0);

        groups.set(noJual, {
          no_invoice: noJual,
          tanggal_invoice: parseExcelDate(rawDate),
          jam_invoice: parseExcelTime(rawTime),
          nama_pelanggan: String(rawCust).trim(),
          kasir_name: String(rawUser).trim(),
          subtotal: rawSubtotal,
          diskon: rawDiskon,
          total_akhir: 0,
          jenis_pembayaran: String(rawPay).trim(),
          jumlah_bayar: rawBayar,
          items: [],
        });
      }

      const inv = groups.get(noJual);

      const kdBrg = String(row["KDBRG"] || row["kdbrg"] || row["kode_barang"] || "").trim();
      const barcode = String(row["BARCODE"] || row["barcode"] || "").trim();
      const nmBrg = String(row["NMBRG"] || row["nmbrg"] || row["nama_barang"] || "").trim();
      const qty = parseExcelNumber(row["JUMLAH"] || row["jumlah"] || row["QTY"] || row["qty"] || 1);
      const sat = String(row["SAT"] || row["sat"] || row["satuan"] || "PCS").trim();
      const isi = parseExcelNumber(row["ISI"] || row["isi"] || 1);
      const harga = parseExcelNumber(row["HARGA"] || row["harga"] || row["harga_jual"] || 0);
      const disc = parseExcelNumber(row["DISC"] || row["disc"] || row["diskon"] || 0);
      const total = parseExcelNumber(row["TOTAL"] || row["total"] || 0) || (qty * harga - disc);
      const hbt = parseExcelNumber(row["HBT"] || row["hbt"] || row["hpp"] || 0);

      inv.items.push({
        kode_barang: kdBrg,
        barcode: barcode,
        nama_barang: nmBrg,
        jumlah: qty > 0 ? qty : 1,
        satuan: sat || "PCS",
        isi_satuan: isi > 0 ? isi : 1,
        harga_jual: harga,
        harga_rata: hbt,
        diskon: disc,
        subtotal: total,
      });
    }

    const result: any[] = [];
    for (const inv of groups.values()) {
      const sumItems = inv.items.reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
      if (inv.subtotal === 0) {
        inv.subtotal = sumItems;
      }
      const computedTotal = Math.max(0, inv.subtotal - inv.diskon);
      inv.total_akhir = computedTotal;
      if (inv.jumlah_bayar === 0) {
        inv.jumlah_bayar = computedTotal;
      }
      result.push(inv);
    }

    return result;
  };

  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        NO: 1,
        TGL1: "01/07/2026",
        NOJUAL: "JL260701-BS001",
        TANGGAL: "01/07/2026",
        KDCUST: "",
        NMCUST: "Umum",
        ALAMAT: "",
        KDBRG: "BRG-001",
        NMBRG: "Susu UHT Full Cream 1L",
        JUMLAH: 2,
        SAT: "PCS",
        HARGA: 18500,
        DISC: 0,
        TOTAL: 37000,
        POTONGAN: 0,
        PPN: 0,
        CARABAYAR: "Tunai",
        SUBTOTAL: 62000,
        POTONGANRP: 0,
        PPNRP: 0,
        BAYAR: 100000,
        PIUTANG: 0,
        KET: "",
        TGLJTP: "",
        TERMIN: 0,
        NMUSER: "Siti Rahma",
        JMLJUAL: 3,
        HBT: 15000,
        KELOMPOK: "Minuman",
        JAM: "08:15:20",
        KDHRG: "HRG1",
        ISI: 1,
        KDLOKASI: "TK",
        KETERANGAN: "",
        KDSALES: "",
        NMSALES: "",
        NOMOR: 1,
        JASA: 0,
      },
      {
        NO: 2,
        TGL1: "01/07/2026",
        NOJUAL: "JL260701-BS001",
        TANGGAL: "01/07/2026",
        KDCUST: "",
        NMCUST: "Umum",
        ALAMAT: "",
        KDBRG: "BRG-002",
        NMBRG: "Roti Tawar Gandum",
        JUMLAH: 1,
        SAT: "PCS",
        HARGA: 25000,
        DISC: 0,
        TOTAL: 25000,
        POTONGAN: 0,
        PPN: 0,
        CARABAYAR: "Tunai",
        SUBTOTAL: 62000,
        POTONGANRP: 0,
        PPNRP: 0,
        BAYAR: 100000,
        PIUTANG: 0,
        KET: "",
        TGLJTP: "",
        TERMIN: 0,
        NMUSER: "Siti Rahma",
        JMLJUAL: 3,
        HBT: 20000,
        KELOMPOK: "Makanan",
        JAM: "08:15:20",
        KDHRG: "HRG1",
        ISI: 1,
        KDLOKASI: "TK",
        KETERANGAN: "",
        KDSALES: "",
        NMSALES: "",
        NOMOR: 2,
        JASA: 0,
      },
      {
        NO: 3,
        TGL1: "01/07/2026",
        NOJUAL: "JL260701-BS002",
        TANGGAL: "01/07/2026",
        KDCUST: "CUST-05",
        NMCUST: "Ahmad Dahlan",
        ALAMAT: "Sleman",
        KDBRG: "BRG-003",
        NMBRG: "Minyak Goreng 2L",
        JUMLAH: 1,
        SAT: "POUCH",
        HARGA: 34000,
        DISC: 1000,
        TOTAL: 33000,
        POTONGAN: 0,
        PPN: 0,
        CARABAYAR: "QRIS",
        SUBTOTAL: 33000,
        POTONGANRP: 0,
        PPNRP: 0,
        BAYAR: 33000,
        PIUTANG: 0,
        KET: "",
        TGLJTP: "",
        TERMIN: 0,
        NMUSER: "Budi Santoso",
        JMLJUAL: 1,
        HBT: 29500,
        KELOMPOK: "Sembako",
        JAM: "09:42:10",
        KDHRG: "HRG1",
        ISI: 1,
        KDLOKASI: "TK",
        KETERANGAN: "",
        KDSALES: "",
        NMSALES: "",
        NOMOR: 1,
        JASA: 0,
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi_Kasir");
    XLSX.writeFile(wb, "Template_Import_Transaksi_Kasir_Dev.xlsx");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      setRawRowCount(jsonRows.length);
      const grouped = groupRowsToTransactions(jsonRows);
      setParsedTransactions(grouped);
      if (grouped.length === 0) {
        showToast("Tidak ditemukan baris transaksi yang valid dengan kolom NOJUAL.", "error");
      } else {
        setImportStep(2);
      }
    } catch (err: any) {
      showToast("Gagal membaca file Excel: " + (err.message || "File rusak atau tidak didukung."), "error");
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedTransactions.length === 0) {
      showToast("Tidak ada data transaksi yang dapat diimpor.", "error");
      return;
    }

    setIsImporting(true);
    try {
      const payload = {
        id_cabang: selectedImportCabang || userProfile?.id_cabang || 2,
        fallback_user_id: selectedImportFallbackKasir || userProfile?.id || 1,
        transactions: parsedTransactions,
      };

      const res = await fetch("/api/penjualan/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Terjadi kesalahan saat memproses impor di server.");
      }

      setImportResult(resJson);
      setImportStep(3);
      fetchData();
      showToast(`Berhasil mengimpor ${resJson.total_invoices} nota transaksi!`, "success");
    } catch (err: any) {
      showToast(err.message || "Gagal mengimpor transaksi.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const viewInvoiceDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/penjualan?id=${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
      setShowDetailModal(true);
    } catch {
      alert("Gagal memuat detail transaksi.");
    }
  };

  const formatRupiah = (val: number) => {
    return formatCurrency(val);
  };

  const safeList = Array.isArray(list) ? list : [];
  const filteredList = safeList;

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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Riwayat Transaksi Penjualan
          </h1>
          <p className="text-on-background/70 text-sm mt-1">
            Melihat transaksi penjualan terbaru yang diproses di cabang ini.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Tombol Import Excel Dev Mode */}
          <button
            onClick={() => {
              setImportStep(1);
              setImportFile(null);
              setParsedTransactions([]);
              setRawRowCount(0);
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap"
            title="Import data transaksi kasir dari file Excel (Development Mode)"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>Import Excel (Dev)</span>
          </button>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-on-surface-variant/60" />
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
              placeholder="Cari No. Invoice / Pelanggan..."
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/80"
            />
          </div>
        </div>
      </div>

      {/* Ringkasan Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Total Transaksi</span>
            <span className="text-on-surface text-2xl font-bold">
              {(summaryData.total_nota || totalItems).toLocaleString("id-ID")} Nota
            </span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Omset Tunai</span>
            <span className="text-on-surface text-2xl font-bold">
              {formatRupiah(summaryData.omset_tunai)}
            </span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/30 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant text-xs block">Omset Non-Tunai / QRIS</span>
            <span className="text-on-surface text-2xl font-bold">
              {formatRupiah(summaryData.omset_non_tunai)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat riwayat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-2.5 w-12">#</th>
                  <th className="px-5 py-2.5">No. Invoice</th>
                  <th className="px-5 py-2.5">Tanggal & Waktu</th>
                  <th className="px-5 py-2.5">Pelanggan</th>
                  <th className="px-5 py-2.5">Pembayaran</th>
                  <th className="px-5 py-2.5 text-right">Total Akhir</th>
                  <th className="px-5 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant/60">
                      Tidak ada data riwayat penjualan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr key={item.id_penjualan} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-5 py-2.5 text-on-surface-variant/60">{idx + 1}</td>
                      <td className="px-5 py-2.5 font-medium font-mono text-primary">{item.no_invoice}</td>
                      <td className="px-5 py-2.5 text-on-surface-variant">
                        {item.tanggal_invoice} {item.jam_invoice}
                      </td>
                      <td className="px-5 py-2.5 font-medium text-on-surface">{item.nama_pelanggan || "Umum"}</td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            item.jenis_pembayaran === "Tunai"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}
                        >
                          {item.jenis_pembayaran}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right font-bold text-on-surface">
                        {formatRupiah(item.total_akhir)}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <button
                          onClick={() => viewInvoiceDetail(item.id_penjualan)}
                          className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface rounded-lg text-xs font-medium transition-colors"
                        >
                          Detail Struk
                        </button>
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

      {/* DETAIL MODAL & PRINT PREVIEW */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto">
          <div id="print-invoice-modal" className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-sm my-8 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 print:border-0 print:bg-white print:max-w-full print:my-0 print:shadow-none">
            
            <div className="px-6 py-4 border-b border-outline-variant/35 flex items-center justify-between print:hidden">
              <h2 className="font-semibold text-on-surface text-sm">Detail Struk Penjualan</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-on-surface-variant/60 hover:text-on-surface">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white text-black p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-3 shadow-inner print:p-0 print:border-0 print:shadow-none">
                
                {/* Header Struk */}
                <div className="text-center space-y-0.5 border-b border-dashed border-gray-300 pb-3">
                  <h3 className="font-bold text-sm tracking-wide">AL-MUBAROK MART</h3>
                  <p className="text-[10px] text-gray-600">Pusat Belanja Berkah & Terpercaya</p>
                  <p className="text-[9px]">{branchName}</p>
                </div>

                {/* Info Nota */}
                <div className="space-y-0.5 border-b border-dashed border-gray-300 pb-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{selectedInvoice.invoice.no_invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{selectedInvoice.invoice.tanggal_invoice} {selectedInvoice.invoice.jam_invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{selectedInvoice.invoice.nama_pelanggan}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
                  {selectedInvoice.details.map((item: any) => (
                    <div key={item.id} className="space-y-0.5">
                      <span className="font-semibold">{item.nama_barang}</span>
                      <div className="flex justify-between text-gray-600 text-[10px]">
                        <span>{item.jumlah} x {formatRupiah(item.harga_jual)} / {item.satuan}</span>
                        <span>{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="space-y-1 text-right text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal Belanja:</span>
                    <span>{formatRupiah(selectedInvoice.invoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.invoice.nominal_voucher > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Voucher Discount:</span>
                      <span>-{formatRupiah(selectedInvoice.invoice.nominal_voucher)}</span>
                    </div>
                  )}
                  {selectedInvoice.invoice.potongan_poin > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Poin Discount:</span>
                      <span>-{formatRupiah(selectedInvoice.invoice.potongan_poin)}</span>
                    </div>
                  )}
                  {selectedInvoice.invoice.infaq > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Infaq Shadaqah:</span>
                      <span>+{formatRupiah(selectedInvoice.invoice.infaq)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[12px] border-t border-dashed border-gray-300 pt-1.5 text-black">
                    <span>TOTAL BILL:</span>
                    <span>{formatRupiah(selectedInvoice.invoice.total_akhir)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 pt-0.5">
                    <span>Bayar via:</span>
                    <span>{selectedInvoice.invoice.jenis_pembayaran}</span>
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
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-secondary/15 transition-all"
                >
                  <Printer className="w-4 h-4" /> Cetak Nota
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL DEV MODE */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-on-surface text-base">
                      Import Transaksi Kasir dari Excel
                    </h3>
                    <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      🛠️ Dev Mode
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant/70">
                    Import data POS historis langsung ke riwayat penjualan (tanpa potong stok & jurnal kas)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="flex border-b border-outline-variant/30 bg-surface text-xs font-semibold">
              <div
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  importStep === 1
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-on-surface-variant/60"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  importStep === 1 ? "bg-primary text-white" : "bg-surface-container-highest"
                }`}>1</span>
                Konfigurasi & Upload
              </div>
              <div
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  importStep === 2
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-on-surface-variant/60"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  importStep === 2 ? "bg-primary text-white" : "bg-surface-container-highest"
                }`}>2</span>
                Preview & Validasi
              </div>
              <div
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  importStep === 3
                    ? "border-emerald-500 text-emerald-500 bg-emerald-500/5"
                    : "border-transparent text-on-surface-variant/60"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  importStep === 3 ? "bg-emerald-500 text-white" : "bg-surface-container-highest"
                }`}>3</span>
                Hasil & Rekap
              </div>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {importStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed space-y-1">
                      <p className="font-semibold text-amber-600 dark:text-amber-400">
                        Peringatan Khusus Mode Development:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        <li>Hanya mengisi data ke tabel <code>penjualan</code> dan <code>penjualan_detail</code>.</li>
                        <li><strong>TIDAK memotong stok barang fisik</strong> (<code>stok_barang</code> & <code>kartu_stok</code> aman).</li>
                        <li><strong>TIDAK membuat jurnal kas akuntansi</strong>.</li>
                        <li>Duplikasi <code>NOJUAL</code> yang sama otomatis <strong>ditimpa/diperbarui</strong>.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Cabang Tujuan Transaksi <span className="text-error">*</span>
                      </label>
                      <select
                        value={selectedImportCabang}
                        onChange={(e) => setSelectedImportCabang(Number(e.target.value))}
                        className="w-full bg-surface-container border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                      >
                        {cabangList.map((c) => (
                          <option key={c.id_cabang} value={c.id_cabang}>
                            {c.nama_cabang} (Cabang #{c.id_cabang})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Fallback Kasir <span className="text-error">*</span>
                      </label>
                      <select
                        value={selectedImportFallbackKasir}
                        onChange={(e) => setSelectedImportFallbackKasir(Number(e.target.value))}
                        className="w-full bg-surface-container border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-medium"
                      >
                        {kasirList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nama_user} (#{u.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Pilih File Excel Transaksi POS (.xlsx, .xls)
                    </label>
                    <div className="border-2 border-dashed border-outline-variant/60 hover:border-primary rounded-2xl p-6 text-center transition-colors flex flex-col items-center justify-center bg-surface-container-low/50 relative">
                      <FileSpreadsheet className="w-10 h-10 text-primary/70 mb-2" />
                      <p className="text-xs font-bold text-on-surface mb-1">
                        {importFile ? importFile.name : "Klik atau seret file Excel ke sini"}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/70 mb-3">
                        Format sheet transaksi kasir (kolom NOJUAL, TANGGAL, JAM, KDBRG, NMBRG, JUMLAH, HARGA, TOTAL, NMUSER, dsb.)
                      </p>
                      <label className="cursor-pointer bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors">
                        <span>Pilih File Excel</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleFileChange}
                          disabled={isParsing}
                          className="hidden"
                        />
                      </label>
                      {isParsing && (
                        <div className="absolute inset-0 bg-surface/80 flex items-center justify-center rounded-2xl gap-2 text-xs font-semibold text-primary">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Membaca & Mengelompokkan Transaksi...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-on-surface">Belum punya format file yang sesuai?</p>
                        <p className="text-[10px] text-on-surface-variant/70">
                          Unduh template contoh Excel dengan kolom transaksi POS siap pakai.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary rotate-180" />
                      Unduh Template
                    </button>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/30">
                      <span className="text-[10px] text-on-surface-variant block">Baris Excel</span>
                      <span className="text-sm font-bold text-on-surface">{rawRowCount.toLocaleString()} baris</span>
                    </div>
                    <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/30">
                      <span className="text-[10px] text-on-surface-variant block">Total Nota</span>
                      <span className="text-sm font-bold text-primary">{parsedTransactions.length.toLocaleString()} nota</span>
                    </div>
                    <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/30">
                      <span className="text-[10px] text-on-surface-variant block">Total Item Terdaftar</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {parsedTransactions.reduce((acc, t) => acc + (t.items?.length || 0), 0).toLocaleString()} item
                      </span>
                    </div>
                    <div className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/30">
                      <span className="text-[10px] text-on-surface-variant block">Estimasi Omset</span>
                      <span className="text-sm font-bold text-on-surface truncate block">
                        {formatCurrency(parsedTransactions.reduce((acc, t) => acc + (t.total_akhir || 0), 0))}
                      </span>
                    </div>
                  </div>

                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                    <div className="px-3 py-2 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">
                        Daftar Nota Transaksi yang Akan Diimpor ({parsedTransactions.length} Faktur)
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70">
                        Menampilkan 50 nota pertama
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container-lowest text-on-surface-variant text-[11px] uppercase tracking-wider sticky top-0 border-b border-outline-variant/20">
                          <tr>
                            <th className="px-3 py-2">No. Invoice</th>
                            <th className="px-3 py-2">Waktu</th>
                            <th className="px-3 py-2">Pelanggan</th>
                            <th className="px-3 py-2">Kasir (Excel)</th>
                            <th className="px-3 py-2 text-center">Items</th>
                            <th className="px-3 py-2">Metode</th>
                            <th className="px-3 py-2 text-right">Total Nota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                          {parsedTransactions.slice(0, 50).map((t, idx) => (
                            <tr key={t.no_invoice || idx} className="hover:bg-surface-container-high/30">
                              <td className="px-3 py-2 font-mono font-medium text-primary">
                                {t.no_invoice}
                              </td>
                              <td className="px-3 py-2 text-on-surface-variant text-[11px]">
                                {t.tanggal_invoice} <span className="text-[10px] opacity-75">{t.jam_invoice}</span>
                              </td>
                              <td className="px-3 py-2 max-w-[120px] truncate">
                                {t.nama_pelanggan || "Umum"}
                              </td>
                              <td className="px-3 py-2 text-[11px] text-on-surface-variant">
                                {t.kasir_name || <span className="italic text-on-surface-variant/50">Fallback</span>}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[10px] font-semibold">
                                  {t.items?.length || 0} item
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px]">
                                {t.jenis_pembayaran || "Tunai"}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                {formatCurrency(t.total_akhir)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {importStep === 3 && importResult && (
                <div className="space-y-4 py-2">
                  <div className="text-center space-y-1">
                    <div className="inline-flex p-3 rounded-full bg-emerald-500/15 text-emerald-500 mb-2">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-on-surface">Proses Import Selesai!</h4>
                    <p className="text-xs text-on-surface-variant">
                      Data transaksi kasir berhasil dicatat ke dalam database riwayat penjualan.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                        Nota Berhasil
                      </span>
                      <span className="text-xl font-extrabold text-emerald-600">
                        {importResult.total_invoices}
                      </span>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
                        Item Terproses
                      </span>
                      <span className="text-xl font-extrabold text-blue-600">
                        {importResult.total_items}
                      </span>
                    </div>
                    <div className={`p-3 rounded-xl text-center border ${
                      importResult.skipped_items > 0
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                        : "bg-surface-container border-outline-variant/30 text-on-surface-variant"
                    }`}>
                      <span className="text-[10px] uppercase font-bold block">
                        Item Dilewati
                      </span>
                      <span className="text-xl font-extrabold">
                        {importResult.skipped_items}
                      </span>
                    </div>
                  </div>

                  {importResult.skipped_items > 0 && importResult.skipped_details && (
                    <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Catatan Item Dilewati ({importResult.skipped_items} Produk):</span>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-surface-container-low rounded-lg font-mono text-[11px] text-on-surface-variant">
                        {importResult.skipped_details.map((msg, i) => (
                          <div key={i} className="text-amber-600 dark:text-amber-300">
                            • {msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
              {importStep === 1 && (
                <>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    disabled={!importFile || parsedTransactions.length === 0}
                    onClick={() => setImportStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
                  >
                    Lanjut ke Preview
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {importStep === 2 && (
                <>
                  <button
                    disabled={isImporting}
                    onClick={() => setImportStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                  <button
                    disabled={isImporting || parsedTransactions.length === 0}
                    onClick={handleExecuteImport}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors inline-flex items-center gap-2 shadow-xs"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengimpor Data...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Mulai Import ({parsedTransactions.length} Faktur)
                      </>
                    )}
                  </button>
                </>
              )}

              {importStep === 3 && (
                <div className="w-full flex justify-end">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-colors"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              )}
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
          #print-invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden, button, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>

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
