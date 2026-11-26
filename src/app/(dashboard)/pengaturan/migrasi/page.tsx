"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  ArrowRight,
  ArrowLeft,
  Package,
  Layers,
  History,
  Info,
  Clock,
  Building2,
  FileText,
  Search,
  Download,
  BookOpen,
  Terminal,
  ShieldCheck,
  Percent,
  Check,
  ChevronRight,
  XCircle,
  FolderOpen,
  X,
  FileCode,
  Calendar,
  User,
  Filter,
  RotateCcw
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { cn } from "@/lib/utils";

interface Cabang {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
}

interface PreviewData {
  job_id: string;
  nama_file: string;
  ukuran_file_kb: number;
  id_cabang: number;
  tipe_terdeteksi: "MASTER_STOK" | "TRANSAKSI" | "COMBINED" | "UNKNOWN";
  barang_belum_terdaftar: number;
  master_barang: {
    total: number;
    valid: number;
    tanpa_barcode: number;
    sudah_ada_di_db: number;
    kategori_ditemukan: string[];
    kategori_baru: string[];
    supplier_ditemukan: string[];
    supplier_baru: string[];
    sample: any[];
  };
  stok_cabang: {
    total_item: number;
    total_qty: number;
    sample: any[];
  };
  transaksi_historis: {
    total_transaksi: number;
    total_item_detail: number;
    total_omset: number;
    tanggal_terawal: string | null;
    tanggal_terakhir: string | null;
    metode_pembayaran: Record<string, number>;
    kasir_ditemukan: string[];
    sample: any[];
  };
  warnings: string[];
}

interface MigrationLogItem {
  id: number;
  id_cabang: number;
  nama_cabang: string;
  id_user: number;
  nama_user: string;
  nama_file: string;
  tipe_migrasi: string;
  total_baris: number;
  berhasil: number;
  gagal: number;
  summary: any;
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "ROLLED_BACK";
  created_at: string;
  detail_error?: string;
}

// Helper membaca response HTTP secara aman tanpa crash jika server/proxy mengembalikan plain text/HTML
async function parseJsonResponseSafe(res: Response): Promise<{ ok: boolean; data?: any; error?: string; message?: string }> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return {
      ok: res.ok && json.success !== false,
      data: json.data,
      error: json.error || (!res.ok ? (json.message || text) : undefined),
      message: json.message,
    };
  } catch {
    let cleanErr = text.replace(/<[^>]*>?/gm, "").trim();
    if (cleanErr.length > 250) cleanErr = cleanErr.substring(0, 250) + "...";
    return {
      ok: false,
      error: cleanErr || `HTTP ${res.status} (${res.statusText || "Internal Server Error"})`,
    };
  }
}

export default function MigrasiDataPage() {
  const { can_read, can_create, loading: permissionsLoading } = useMenuPermissions();

  const [activeTab, setActiveTab] = useState<"wizard" | "logs">("wizard");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Cabang list
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [selectedCabang, setSelectedCabang] = useState<string>("");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [targetType, setTargetType] = useState<"AUTO" | "MASTER_STOK" | "TRANSAKSI">("AUTO");
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Schema Guide Modal State
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Preview Data State
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewSubTab, setPreviewSubTab] = useState<"barang" | "stok" | "transaksi">("barang");
  const [previewSearch, setPreviewSearch] = useState("");

  // Options State
  const [importMaster, setImportMaster] = useState(true);
  const [importStok, setImportStok] = useState(true);
  const [importTransaksi, setImportTransaksi] = useState(true);
  const [modeDuplikat, setModeDuplikat] = useState<"SKIP" | "UPDATE">("SKIP");

  // Execution State & Progress
  const [committing, setCommitting] = useState(false);
  const [commitProgress, setCommitProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [commitResult, setCommitResult] = useState<any | null>(null);

  // Logs State
  const [logs, setLogs] = useState<MigrationLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [selectedLogDetail, setSelectedLogDetail] = useState<MigrationLogItem | null>(null);
  const [logFilterCabang, setLogFilterCabang] = useState<string>("all");
  const [logToRollback, setLogToRollback] = useState<MigrationLogItem | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExecuteRollback = async () => {
    if (!logToRollback) return;
    if (!can_create) {
      showToast("Role Anda tidak memiliki izin 'Tambah' untuk membatalkan migrasi data.", "error");
      return;
    }
    setRollingBack(true);
    try {
      const res = await fetch(`/api/migrasi/rollback/${logToRollback.id}`, {
        method: "POST",
      });
      const parsed = await parseJsonResponseSafe(res);
      if (parsed.ok) {
        showToast(parsed.message || "Migrasi data berhasil dibatalkan.", "success");
        setLogToRollback(null);
        fetchLogs();
      } else {
        showToast(parsed.error || "Gagal membatalkan migrasi data.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi kesalahan jaringan saat membatalkan migrasi.", "error");
    } finally {
      setRollingBack(false);
    }
  };

  // 1. Fetch Cabang list
  useEffect(() => {
    fetchCabang();
  }, []);

  const fetchCabang = async () => {
    try {
      const res = await fetch("/api/cabang");
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.data || [];
        setCabangList(items);
      }
    } catch (err) {
      console.error("Gagal memuat daftar cabang:", err);
    }
  };

  // 2. Fetch Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const url = logFilterCabang && logFilterCabang !== "all"
        ? `/api/migrasi/log?id_cabang=${logFilterCabang}`
        : `/api/migrasi/log`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil log migrasi:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, logFilterCabang]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    const validExts = [".sql", ".csv", ".tsv", ".txt"];
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      showToast("Format file tidak didukung. Harap unggah berkas .sql atau .csv", "error");
      return;
    }
    setFile(f);
  };

  // 3. Upload & Analyze File
  const handleAnalyzeFile = async () => {
    if (!can_create) {
      showToast("Role Anda tidak memiliki izin 'Tambah' untuk menganalisa/mengimpor berkas migrasi.", "error");
      return;
    }
    if (!file) {
      showToast("Pilih berkas .sql atau .csv terlebih dahulu.", "warning");
      return;
    }
    if (!selectedCabang) {
      showToast("Pilih cabang tujuan migrasi terlebih dahulu.", "warning");
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id_cabang", selectedCabang);
      formData.append("target_type", targetType);

      const res = await fetch("/api/migrasi/upload", {
        method: "POST",
        body: formData,
      });

      const parsed = await parseJsonResponseSafe(res);
      if (parsed.ok && parsed.data) {
        const data: PreviewData = parsed.data;
        setPreview(data);

        // Smart preset for options based on detected type
        if (data.tipe_terdeteksi === "TRANSAKSI") {
          setImportMaster(false);
          setImportStok(false);
          setImportTransaksi(true);
          setPreviewSubTab("transaksi");
        } else if (data.tipe_terdeteksi === "MASTER_STOK") {
          setImportMaster(true);
          setImportStok(true);
          setImportTransaksi(false);
          setPreviewSubTab("barang");
        } else {
          setImportMaster(true);
          setImportStok(true);
          setImportTransaksi(true);
          setPreviewSubTab("barang");
        }

        setStep(2);
        showToast("Berkas berhasil dianalisa! Silakan tinjau ringkasan data.", "success");
      } else {
        showToast(parsed.error || "Gagal menganalisa berkas migrasi.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi kendala jaringan saat mengunggah berkas.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // 4. Commit Migration with Terminal Simulation
  const handleCommitMigration = async () => {
    if (!preview) return;
    if (!can_create) {
      showToast("Role Anda tidak memiliki izin 'Tambah' untuk mengeksekusi migrasi data.", "error");
      return;
    }

    setCommitting(true);
    setCommitProgress(5);
    setStep(4);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Mempersiapkan transaksi atomik PostgreSQL...`,
      `[${new Date().toLocaleTimeString()}] Menghubungkan ke Cabang ID #${selectedCabang}...`,
    ]);

    // Interval to animate progress & logs while waiting for API
    const logInterval = setInterval(() => {
      setCommitProgress((prev) => {
        if (prev < 30) {
          setTerminalLogs((logs) => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] Memeriksa kategori & supplier...`,
          ]);
          return prev + 15;
        } else if (prev < 65) {
          setTerminalLogs((logs) => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] Menulis katalog barang & satuan harga ke database...`,
          ]);
          return prev + 18;
        } else if (prev < 90) {
          setTerminalLogs((logs) => [
            ...logs,
            `[${new Date().toLocaleTimeString()}] Mengalokasikan stok fisik & buku pembantu kartu stok...`,
          ]);
          return prev + 12;
        }
        return prev;
      });
    }, 450);

    try {
      const res = await fetch(`/api/migrasi/commit/${preview.job_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cabang: parseInt(selectedCabang),
          import_master: importMaster,
          import_stok: importStok,
          import_transaksi: importTransaksi,
          mode_duplikat: modeDuplikat,
        }),
      });

      clearInterval(logInterval);
      setCommitProgress(100);

      const parsed = await parseJsonResponseSafe(res);
      if (parsed.ok) {
        setTerminalLogs((logs) => [
          ...logs,
          `[${new Date().toLocaleTimeString()}] ✅ Commit transaksi berhasil!`,
          `[${new Date().toLocaleTimeString()}] Menutup sesi migrasi & menyimpan audit log.`,
          `[${new Date().toLocaleTimeString()}] Selesai tanpa error kritis.`,
        ]);
        setCommitResult(parsed.data);
        showToast(parsed.message || "Migrasi berhasil diselesaikan!", "success");
      } else {
        setTerminalLogs((logs) => [
          ...logs,
          `[${new Date().toLocaleTimeString()}] ❌ Galat terjadi: ${parsed.error || "Gagal komit data."}`,
          `[${new Date().toLocaleTimeString()}] 🔄 ROLLBACK dieksekusi: Seluruh perubahan dibatalkan demi integritas.`,
        ]);
        setCommitResult({
          status: "FAILED",
          errors: [parsed.error || "Gagal mengeksekusi migrasi data."],
        });
        showToast(parsed.error || "Migrasi data gagal.", "error");
      }
    } catch (err: any) {
      clearInterval(logInterval);
      setCommitProgress(100);
      setTerminalLogs((logs) => [
        ...logs,
        `[${new Date().toLocaleTimeString()}] ❌ Exception jaringan: ${err.message}`,
        `[${new Date().toLocaleTimeString()}] 🔄 ROLLBACK selesai.`,
      ]);
      setCommitResult({
        status: "FAILED",
        errors: [err.message || "Terjadi kesalahan internal saat komit data."],
      });
      showToast(err.message || "Gagal mengeksekusi migrasi.", "error");
    } finally {
      setCommitting(false);
    }
  };

  // Reset Wizard
  const handleReset = () => {
    setFile(null);
    setTargetType("AUTO");
    setPreview(null);
    setCommitResult(null);
    setTerminalLogs([]);
    setCommitProgress(0);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = (type: "master" | "transaksi") => {
    let headers = "";
    let sampleRow = "";
    let filename = "";

    if (type === "master") {
      headers = "NO,KDBRG,NMBRG,BARCODE,SAT 1,SAT 2,SAT 3,SAT 4,ISI 2,ISI 3,ISI 4,STOCK,DEPARTEMENT,SUPPLIER,HRGBELI,HBT,PEMBELIAN TERAKHIR,PENJUALAN TERAKHIR,LEVEL,PPN,LPPJK";
      sampleRow = "1,BRG001,INDOMIE AYAM BAWANG 69G,089686010118,PCS,DUS,,,40,,,150,MIE INSTAN,PT INDOFOOD CBP,2900,3050,2026-01-10,2026-02-15,FAST,1,1\n2,BRG002,AQUA AIR MINERAL 600ML,8886008101053,BOTOL,DUS,,,24,,,48,MINUMAN,PT TIRTA INVESTAMA,3200,3200,2026-01-05,2026-02-18,FAST,1,1";
      filename = "template_master_barang_almubarok.csv";
    } else {
      headers = "NO,TGL1,NOJUAL,TANGGAL,KDCUST,NMCUST,ALAMAT,KDBRG,NMBRG,JUMLAH,SAT,HARGA,DISC,TOTAL,POTONGAN,PPN,CARABAYAR,SUBTOTAL,POTONGANRP,PPNRP,BAYAR,PIUTANG,KET,TGLJTP,TERMIN,NMUSER,JMLJUAL,HBT,KELOMPOK,JAM,KDHRG,ISI,KDLOKASI,KETERANGAN,KDSALES,NMSALES,NOMOR,JASA";
      sampleRow = "1,2026-02-10,NJ-2026-001,2026-02-10,CUST01,BAPAK AHMAD,Jl. Merdeka No 1,BRG001,INDOMIE AYAM BAWANG 69G,5,PCS,3500,0,17500,0,0,TUNAI,24500,500,0,24000,0,,,,KASIR_SITI,1,3000,,14:30:00,1,1,GUDANG,,,,1,0\n2,2026-02-10,NJ-2026-001,2026-02-10,CUST01,BAPAK AHMAD,Jl. Merdeka No 1,BRG002,AQUA AIR MINERAL 600ML,2,BOTOL,3500,0,7000,0,0,TUNAI,24500,500,0,24000,0,,,,KASIR_SITI,1,3200,,14:30:00,1,1,GUDANG,,,,2,0";
      filename = "template_riwayat_transaksi_almubarok.csv";
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Template ${filename} berhasil diunduh.`, "success");
  };

  // Selected Branch Name
  const selectedCabangName =
    cabangList.find((c) => String(c.id_cabang) === selectedCabang)?.nama_cabang ||
    (selectedCabang ? "Cabang" : "Belum Dipilih");

  // Calculate Data Health Score (%)
  const dataHealthScore = useMemo(() => {
    if (!preview) return 0;
    const total = preview.master_barang.total;
    if (total === 0) return 100;
    const valid = preview.master_barang.valid;
    const noBarcode = preview.master_barang.tanpa_barcode;
    const score = Math.max(0, Math.round(((valid - noBarcode) / total) * 100));
    return score;
  }, [preview]);

  // Filtered sample preview
  const filteredSamples = useMemo(() => {
    if (!preview) return [];
    const term = previewSearch.toLowerCase().trim();
    if (previewSubTab === "barang") {
      if (!term) return preview.master_barang.sample;
      return preview.master_barang.sample.filter(
        (b) =>
          b.nama_barang?.toLowerCase().includes(term) ||
          b.barcode?.toLowerCase().includes(term) ||
          b.departement?.toLowerCase().includes(term) ||
          b.supplier?.toLowerCase().includes(term)
      );
    } else if (previewSubTab === "stok") {
      if (!term) return preview.stok_cabang.sample;
      return preview.stok_cabang.sample.filter(
        (s) =>
          s.nama_barang?.toLowerCase().includes(term) ||
          s.barcode?.toLowerCase().includes(term)
      );
    } else {
      if (!term) return preview.transaksi_historis.sample;
      return preview.transaksi_historis.sample.filter(
        (t) =>
          t.no_invoice?.toLowerCase().includes(term) ||
          t.nama_pelanggan?.toLowerCase().includes(term) ||
          t.nm_user?.toLowerCase().includes(term)
      );
    }
  }, [preview, previewSubTab, previewSearch]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const term = logSearch.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.nama_file?.toLowerCase().includes(term) ||
        l.nama_cabang?.toLowerCase().includes(term) ||
        l.nama_user?.toLowerCase().includes(term) ||
        l.status?.toLowerCase().includes(term)
    );
  }, [logs, logSearch]);

  // Permission Guard
  if (!permissionsLoading && !can_read) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/60">
        <AlertTriangle className="w-16 h-16 text-error mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-on-surface">Akses Ditolak</h3>
        <p className="text-xs mt-1">Anda tidak memiliki hak akses untuk membuka modul Migrasi Data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200",
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
              : toast.type === "warning"
              ? "bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
              : "bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : toast.type === "warning" ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" /> Migrasi Data Toko
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Impor database sistem kasir lama (.sql / .csv) ke ERP Al Mubarok secara aman, cepat, dan terisolasi per cabang.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 bg-surface-container rounded-xl border border-outline-variant/40">
            <button
              onClick={() => setActiveTab("wizard")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
                activeTab === "wizard"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Wizard Migrasi
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
                activeTab === "logs"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <History className="w-3.5 h-3.5" />
              Riwayat Log
            </button>
          </div>
        </div>
      </div>

      {/* Banner Peringatan Mode Read-Only jika role pengguna tidak memiliki izin Tambah (can_create) */}
      {!permissionsLoading && !can_create && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium shrink-0 shadow-2xs">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Mode Akses Lihat Saja:</strong> Role akun Anda tidak memiliki izin <em>Tambah</em> untuk modul Migrasi Data. Anda dapat meninjau data dan riwayat log, namun tombol analisa berkas, eksekusi impor, dan pembatalan migrasi dinonaktifkan. Hubungi Administrator di menu <em>Pengaturan Hak Akses</em> jika memerlukan izin ini.
          </span>
        </div>
      )}

      {/* ─── TAB 1: WIZARD MIGRASI ────────────────────────────────────────── */}
      {activeTab === "wizard" && (
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          {/* Stepper Horizontal Interaktif (Theme Standard) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
            {[
              { num: 1, label: "1. Upload & Cabang", desc: "Pilih file & target cabang" },
              { num: 2, label: "2. Review & Validasi", desc: "Analisa kualitas & pratinjau" },
              { num: 3, label: "3. Konfigurasi Impor", desc: "Tentukan opsi & duplikasi" },
              { num: 4, label: "4. Eksekusi & Laporan", desc: "Progress bar & log terminal" },
            ].map((s) => (
              <div
                key={s.num}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3 shadow-xs",
                  step === s.num
                    ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40"
                    : step > s.num
                    ? "bg-surface border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-surface border-outline-variant/30 text-on-surface-variant/60"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-colors",
                    step === s.num
                      ? "bg-primary text-on-primary border-primary shadow-xs"
                      : step > s.num
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-surface-container text-on-surface-variant/60 border-outline-variant/40"
                  )}
                >
                  {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-on-surface truncate">{s.label}</div>
                  <div className="text-[11px] text-on-surface-variant truncate">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stepper Content Area (Scrollable Card) */}
          <div className="flex-1 rounded-2xl bg-surface border border-outline-variant/40 overflow-y-auto p-4 md:p-6 shadow-xs">
            {/* ──────── STEP 1: UPLOAD & CABANG ──────── */}
            {step === 1 && (
              <div className="max-w-5xl mx-auto h-full flex flex-col justify-center">
                {/* Cabang & Dropzone Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column: Branch & Target Type Cards */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Card 1: Pilih Cabang Toko */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs">
                          <Building2 className="w-4 h-4" />
                          Pilih Cabang Toko Tujuan
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-medium">Cabang Al Mubarok</span>
                      </div>
                      <div>
                        <select
                          value={selectedCabang}
                          onChange={(e) => setSelectedCabang(e.target.value)}
                          className={cn(
                            "w-full bg-surface border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer",
                            !selectedCabang
                              ? "border-amber-500/80 focus:ring-amber-500/30 text-amber-800 dark:text-amber-300 bg-amber-50/30 dark:bg-amber-950/20"
                              : "border-outline-variant text-on-surface focus:ring-primary/30"
                          )}
                        >
                          <option value="">-- Pilih Cabang Toko Tujuan (Wajib) --</option>
                          {cabangList.map((c) => (
                            <option key={c.id_cabang} value={c.id_cabang}>
                              [{c.kode_cabang}] {c.nama_cabang}
                            </option>
                          ))}
                        </select>
                      </div>
                      {!selectedCabang ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Wajib memilih cabang toko tujuan sebelum melanjutkan.</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-on-surface-variant/80">
                          Stok awal fisik dan riwayat transaksi akan dialokasikan ke cabang ini.
                        </p>
                      )}
                    </div>

                    {/* Card 2: Jenis Berkas yang Diimpor */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-3 shadow-xs flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-primary font-bold text-xs">
                            <Filter className="w-4 h-4" />
                            Jenis Berkas yang Diimpor
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium">Filter Skema</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant">
                          Tentukan jenis data berkas atau biarkan sistem menganalisa otomatis.
                        </p>
                      </div>

                      <div className="space-y-2 my-auto">
                        <label
                          onClick={() => setTargetType("AUTO")}
                          className={cn(
                            "px-3 py-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                            targetType === "AUTO"
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : "border-outline-variant/60 bg-surface hover:bg-surface-container"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="radio"
                              name="targetType"
                              checked={targetType === "AUTO"}
                              onChange={() => setTargetType("AUTO")}
                              className="text-primary focus:ring-primary shrink-0 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface truncate">🔍 Deteksi Otomatis</span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                            Rekomendasi
                          </span>
                        </label>

                        <label
                          onClick={() => setTargetType("MASTER_STOK")}
                          className={cn(
                            "px-3 py-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                            targetType === "MASTER_STOK"
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : "border-outline-variant/60 bg-surface hover:bg-surface-container"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="radio"
                              name="targetType"
                              checked={targetType === "MASTER_STOK"}
                              onChange={() => setTargetType("MASTER_STOK")}
                              className="text-primary focus:ring-primary shrink-0 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface truncate">📦 Master Barang & Stok</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant/70 shrink-0">
                            Katalog & Saldo
                          </span>
                        </label>

                        <label
                          onClick={() => setTargetType("TRANSAKSI")}
                          className={cn(
                            "px-3 py-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                            targetType === "TRANSAKSI"
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : "border-outline-variant/60 bg-surface hover:bg-surface-container"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="radio"
                              name="targetType"
                              checked={targetType === "TRANSAKSI"}
                              onChange={() => setTargetType("TRANSAKSI")}
                              className="text-primary focus:ring-primary shrink-0 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface truncate">🛒 Riwayat Transaksi</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant/70 shrink-0">
                            Arsip Nota Kasir
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dropzone & Integrated Quick Tools */}
                  <div className="lg:col-span-7 flex flex-col gap-3 justify-between">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-150 flex-1 flex flex-col items-center justify-center min-h-[220px] gap-2.5",
                        isDragging
                          ? "border-primary bg-primary/5 scale-[0.99]"
                          : file
                          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                          : "border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container-low/50"
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".sql,.csv,.tsv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            validateAndSetFile(e.target.files[0]);
                          }
                        }}
                      />

                      {file ? (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                            <FileSpreadsheet className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{file.name}</p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB • Format:{" "}
                              {file.name.substring(file.name.lastIndexOf(".")).toUpperCase()}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Berkas Siap Dianalisa (Klik untuk mengganti)
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                            <UploadCloud className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">
                              Tarik & Lepaskan Berkas Database di Sini
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Dump MySQL (.sql) dari phpMyAdmin/HeidiSQL atau berkas Excel/CSV (.csv)
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/80 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                              .sql
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                              .csv
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/40 font-mono text-[10px]">
                              Maks 100 MB
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom Toolbar: Helper Templates & Action Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadSampleCsv("master")}
                          className="py-1.5 px-2.5 rounded-xl bg-surface border border-outline-variant hover:bg-surface-container text-[11px] font-semibold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Unduh contoh CSV Master Barang & Stok"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" />
                          <span>Template Master</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSampleCsv("transaksi")}
                          className="py-1.5 px-2.5 rounded-xl bg-surface border border-outline-variant hover:bg-surface-container text-[11px] font-semibold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Unduh contoh CSV Riwayat Transaksi"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Template Transaksi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSchemaModal(true)}
                          className="py-1.5 px-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-[11px] font-bold text-primary flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Lihat kamus kolom dan aturan tipe data"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Panduan Skema</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-xs text-on-surface-variant hidden xl:inline">
                          Target:{" "}
                          <strong className={selectedCabang ? "text-on-surface" : "text-amber-600 dark:text-amber-400 font-semibold"}>
                            {selectedCabang ? selectedCabangName : "Belum Dipilih"}
                          </strong>
                        </span>
                        <button
                          onClick={handleAnalyzeFile}
                          disabled={!file || analyzing || !selectedCabang || !can_create}
                          title={
                            !can_create
                              ? "Role Anda tidak memiliki izin 'Tambah' untuk menganalisa/mengimpor berkas migrasi"
                              : !selectedCabang
                              ? "Pilih cabang tujuan terlebih dahulu"
                              : !file
                              ? "Pilih berkas terlebih dahulu"
                              : "Analisa & Validasi berkas migrasi"
                          }
                          className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {analyzing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Menganalisa Berkas...
                            </>
                          ) : (
                            <>
                              Analisa & Validasi
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────── STEP 2: REVIEW & VALIDASI ──────── */}
            {step === 2 && preview && (
              <div className="space-y-5">
                {/* Type Indicator Banner */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 border",
                        preview.tipe_terdeteksi === "MASTER_STOK"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : preview.tipe_terdeteksi === "TRANSAKSI"
                          ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      )}
                    >
                      {preview.tipe_terdeteksi === "MASTER_STOK" ? "📦" : preview.tipe_terdeteksi === "TRANSAKSI" ? "🛒" : "📦🛒"}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-on-surface">
                          {preview.tipe_terdeteksi === "MASTER_STOK" && "Katalog Master Barang & Saldo Stok Fisik"}
                          {preview.tipe_terdeteksi === "TRANSAKSI" && "Riwayat Transaksi Penjualan Kasir"}
                          {preview.tipe_terdeteksi === "COMBINED" && "Paket Lengkap: Master Barang, Stok, & Riwayat Transaksi"}
                          {preview.tipe_terdeteksi === "UNKNOWN" && "Berkas Belum Dikenali Secara Pasti"}
                        </h3>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                            preview.tipe_terdeteksi === "MASTER_STOK"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                              : preview.tipe_terdeteksi === "TRANSAKSI"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          )}
                        >
                          {preview.tipe_terdeteksi}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {preview.tipe_terdeteksi === "MASTER_STOK" && "Berkas ini akan mengisi katalog barang, satuan harga, departemen/kategori, dan menginisiasi saldo stok fisik toko."}
                        {preview.tipe_terdeteksi === "TRANSAKSI" && "Berkas ini murni mencatat riwayat nota & omset penjualan terdahulu. Saldo stok fisik toko TIDAK akan terpotong."}
                        {preview.tipe_terdeteksi === "COMBINED" && "Berkas dump gabungan yang memuat master produk, saldo stok toko, dan seluruh arsip penjualan historis."}
                      </p>
                    </div>
                  </div>
                  {preview.barang_belum_terdaftar > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{preview.barang_belum_terdaftar} item belum di Master</span>
                    </div>
                  )}
                </div>

                {/* Health Score & Health Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Health Score Card */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-on-surface-variant block">Skor Kesiapan Data</span>
                      <div className="text-2xl font-black text-on-surface mt-0.5 flex items-center gap-1.5">
                        <span className={cn(
                          dataHealthScore >= 90 ? "text-emerald-500" : dataHealthScore >= 70 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {dataHealthScore}%
                        </span>
                        <span className="text-xs font-normal text-on-surface-variant">Siap Impor</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        {preview.master_barang.tanpa_barcode === 0 ? "Semua barcode valid" : `${preview.master_barang.tanpa_barcode} baris tanpa barcode`}
                      </span>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border",
                      dataHealthScore >= 90
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    )}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card: Master Barang */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-xs">
                    <div className="flex items-center justify-between text-on-surface-variant text-xs">
                      <span>Katalog Barang</span>
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black text-on-surface mt-1">
                      {preview.master_barang.total.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      <span className="text-emerald-500 font-semibold">{preview.master_barang.valid} valid</span> •{" "}
                      <span>{preview.master_barang.sudah_ada_di_db} di ERP</span>
                    </div>
                  </div>

                  {/* Card: Stok Fisik */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-xs">
                    <div className="flex items-center justify-between text-on-surface-variant text-xs">
                      <span>Total Stok Fisik</span>
                      <Layers className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-on-surface mt-1">
                      {preview.stok_cabang.total_qty.toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">pcs</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                      Cabang: <strong className="text-on-surface">{selectedCabangName}</strong>
                    </div>
                  </div>

                  {/* Card: Transaksi Penjualan */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-xs">
                    <div className="flex items-center justify-between text-on-surface-variant text-xs">
                      <span>Nota Penjualan</span>
                      <History className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-2xl font-black text-on-surface mt-1">
                      {preview.transaksi_historis.total_transaksi.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Total Omset: <strong className="text-on-surface font-mono">Rp {preview.transaksi_historis.total_omset.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Warnings Banner if any */}
                {preview.warnings.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-on-surface text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Catatan Temuan Analisa
                    </div>
                    {preview.warnings.map((w, idx) => (
                      <p key={idx} className="text-on-surface-variant text-[11px] pl-5">• {w}</p>
                    ))}
                  </div>
                )}

                {/* Sub-Tab Navigation & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center p-1 bg-surface-container rounded-xl border border-outline-variant/40 shrink-0">
                    <button
                      onClick={() => { setPreviewSubTab("barang"); setPreviewSearch(""); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        previewSubTab === "barang"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      Master Barang ({preview.master_barang.total.toLocaleString()})
                    </button>
                    <button
                      onClick={() => { setPreviewSubTab("stok"); setPreviewSearch(""); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        previewSubTab === "stok"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      Stok Cabang ({preview.stok_cabang.total_item.toLocaleString()})
                    </button>
                    <button
                      onClick={() => { setPreviewSubTab("transaksi"); setPreviewSearch(""); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        previewSubTab === "transaksi"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      Nota Penjualan ({preview.transaksi_historis.total_transaksi.toLocaleString()})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari dalam 50 sampel pratinjau..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Table Data Preview Container */}
                <div className="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface shadow-xs">
                  {/* Preview Table Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 py-2 bg-surface-container border-b border-outline-variant/40 text-[11px] text-on-surface-variant gap-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                      {previewSubTab === "barang" && (
                        <span>
                          Menampilkan <strong>{filteredSamples.length} sampel awal</strong> dari total <strong>{preview.master_barang.total.toLocaleString()} barang valid</strong>.
                        </span>
                      )}
                      {previewSubTab === "stok" && (
                        <span>
                          Menampilkan <strong>{filteredSamples.length} sampel awal</strong> dari total <strong>{preview.stok_cabang.total_item.toLocaleString()} item stok</strong> ({preview.stok_cabang.total_qty.toLocaleString()} pcs).
                        </span>
                      )}
                      {previewSubTab === "transaksi" && (
                        <span>
                          Menampilkan <strong>{filteredSamples.length} sampel awal</strong> dari total <strong>{preview.transaksi_historis.total_transaksi.toLocaleString()} faktur nota</strong> (Rp {preview.transaksi_historis.total_omset.toLocaleString()}).
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 shrink-0 self-start sm:self-auto">
                      Seluruh {previewSubTab === "barang" ? preview.master_barang.total.toLocaleString() : previewSubTab === "stok" ? preview.stok_cabang.total_item.toLocaleString() : preview.transaksi_historis.total_transaksi.toLocaleString()} data siap diimpor
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[320px]">
                    {previewSubTab === "barang" && (
                      <table className="w-full text-xs text-left">
                        <thead className="sticky top-0 bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/40 z-10">
                          <tr>
                            <th className="p-2.5">Barcode</th>
                            <th className="p-2.5">Nama Barang</th>
                            <th className="p-2.5">Kategori</th>
                            <th className="p-2.5">Pemasok</th>
                            <th className="p-2.5 text-right">Harga Beli</th>
                            <th className="p-2.5 text-center">Level</th>
                            <th className="p-2.5 text-center">Status Pajak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {filteredSamples.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-on-surface-variant">
                                Tidak ada data yang sesuai pencarian.
                              </td>
                            </tr>
                          ) : (
                            filteredSamples.map((b: any, i: number) => (
                              <tr key={i} className="hover:bg-surface-container-high/30 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-primary">{b.barcode}</td>
                                <td className="p-2.5 text-on-surface font-medium">{b.nama_barang}</td>
                                <td className="p-2.5 text-on-surface-variant">{b.departement || "-"}</td>
                                <td className="p-2.5 text-on-surface-variant">{b.supplier || "-"}</td>
                                <td className="p-2.5 text-right font-mono text-on-surface">Rp {b.harga_beli?.toLocaleString()}</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container border border-outline-variant/40">
                                    {b.level}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center">
                                  {b.lapor_pajak ? (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Fiskal</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-on-surface-variant">Non-Fiskal</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {previewSubTab === "stok" && (
                      <table className="w-full text-xs text-left">
                        <thead className="sticky top-0 bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/40 z-10">
                          <tr>
                            <th className="p-2.5">Barcode</th>
                            <th className="p-2.5">Nama Barang</th>
                            <th className="p-2.5 text-right">Stok Fisik Toko</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {filteredSamples.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-on-surface-variant">
                                Tidak ada data yang sesuai pencarian.
                              </td>
                            </tr>
                          ) : (
                            filteredSamples.map((s: any, i: number) => (
                              <tr key={i} className="hover:bg-surface-container-high/30 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-primary">{s.barcode}</td>
                                <td className="p-2.5 text-on-surface font-medium">{s.nama_barang}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {s.stock?.toLocaleString()} pcs
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {previewSubTab === "transaksi" && (
                      <table className="w-full text-xs text-left">
                        <thead className="sticky top-0 bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/40 z-10">
                          <tr>
                            <th className="p-2.5">No. Faktur</th>
                            <th className="p-2.5">Tanggal & Waktu</th>
                            <th className="p-2.5">Pelanggan</th>
                            <th className="p-2.5">Kasir</th>
                            <th className="p-2.5 text-center">Metode Bayar</th>
                            <th className="p-2.5 text-right">Total Akhir</th>
                            <th className="p-2.5 text-center">Item</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {filteredSamples.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-on-surface-variant">
                                Tidak ada data yang sesuai pencarian.
                              </td>
                            </tr>
                          ) : (
                            filteredSamples.map((t: any, i: number) => (
                              <tr key={i} className="hover:bg-surface-container-high/30 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-primary">{t.no_invoice}</td>
                                <td className="p-2.5 font-mono text-on-surface-variant">{t.tanggal_invoice} {t.jam_invoice}</td>
                                <td className="p-2.5 text-on-surface font-medium">{t.nama_pelanggan}</td>
                                <td className="p-2.5 text-on-surface-variant">{t.nm_user || "-"}</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container border border-outline-variant/40">
                                    {t.jenis_pembayaran}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-on-surface">
                                  Rp {t.total_akhir?.toLocaleString()}
                                </td>
                                <td className="p-2.5 text-center font-mono">{t.items?.length || 0}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface font-semibold text-xs flex items-center gap-1.5 hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Ganti Berkas / Kembali
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    Lanjut ke Konfigurasi
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ──────── STEP 3: KONFIGURASI IMPOR ──────── */}
            {step === 3 && preview && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h2 className="text-base font-bold text-on-surface">Konfigurasi Opsi Migrasi</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Pilih modul data yang ingin disinkronkan ke cabang <strong>{selectedCabangName}</strong>.
                  </p>
                </div>

                {/* Checkboxes Card */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={importMaster}
                      onChange={(e) => setImportMaster(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-primary" />
                        Impor Data Master Barang ({preview.master_barang.total.toLocaleString()} Produk)
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Menyimpan kode, nama, barcode, multi-satuan, kategori otomatis, dan harga beli dasar.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={importStok}
                      onChange={(e) => setImportStok(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-500" />
                        Impor Saldo Stok Fisik Cabang ({preview.stok_cabang.total_qty.toLocaleString()} pcs)
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Menyetel stok akhir toko cabang {selectedCabangName} dan mencatat kartu stok saldo awal.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={importTransaksi}
                      onChange={(e) => setImportTransaksi(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <History className="w-4 h-4 text-indigo-500" />
                        Impor Riwayat Nota Penjualan ({preview.transaksi_historis.total_transaksi.toLocaleString()} Nota)
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Memasukkan nota historis dengan prefix <code className="font-mono text-primary">MIG-</code> untuk pelaporan laba rugi cabang.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Duplicate Policy Card */}
                <div className="p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low space-y-3">
                  <h3 className="text-xs font-bold text-on-surface">Jika Barcode Sudah Ada di Database ERP:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModeDuplikat("SKIP")}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer",
                        modeDuplikat === "SKIP"
                          ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                          : "bg-surface border-outline-variant/40 hover:bg-surface-container"
                      )}
                    >
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary" /> Lewati (Skip)
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Direkomendasikan agar data produk yang sedang aktif di sistem tidak tertimpa.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModeDuplikat("UPDATE")}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer",
                        modeDuplikat === "UPDATE"
                          ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                          : "bg-surface border-outline-variant/40 hover:bg-surface-container"
                      )}
                    >
                      <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-amber-500" /> Perbarui (Update)
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Memperbarui nama barang, kategori, supplier, dan harga beli sesuai data berkas import.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface font-semibold text-xs flex items-center gap-1.5 hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                  <button
                    onClick={handleCommitMigration}
                    disabled={(!importMaster && !importStok && !importTransaksi) || !can_create}
                    title={!can_create ? "Role Anda tidak memiliki izin 'Tambah' untuk mengeksekusi migrasi data" : undefined}
                    className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Mulai Eksekusi Migrasi
                  </button>
                </div>
              </div>
            )}

            {/* ──────── STEP 4: EKSEKUSI PROGRESS BAR & TERMINAL ──────── */}
            {step === 4 && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Single Progress Bar (0 - 100%) */}
                <div className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/40 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className={cn("w-5 h-5 text-primary", committing && "animate-pulse")} />
                      <span className="text-xs font-bold text-on-surface">
                        {committing ? "Sedang Memproses Migrasi Transaksi Database..." : commitResult?.status === "SUCCESS" ? "Migrasi Selesai 100%" : "Proses Selesai"}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">{commitProgress}%</span>
                  </div>

                  {/* The Linear Progress Bar */}
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden border border-outline-variant/40">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 ease-out rounded-full",
                        commitResult?.status === "FAILED"
                          ? "bg-rose-500"
                          : "bg-primary"
                      )}
                      style={{ width: `${commitProgress}%` }}
                    />
                  </div>
                </div>

                {/* Log Teks Terminal di Bawah Progress Bar */}
                <div className="rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 overflow-hidden shadow-md">
                  <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 flex items-center gap-1.5 text-zinc-300">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL Atomic Migration Stream
                      </span>
                    </div>
                    <span>Cabang #{selectedCabang}</span>
                  </div>

                  <div className="p-4 font-mono text-xs space-y-1.5 max-h-60 overflow-y-auto">
                    {terminalLogs.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          "leading-relaxed",
                          log.includes("❌")
                            ? "text-rose-400 font-bold"
                            : log.includes("✅")
                            ? "text-emerald-400 font-bold"
                            : log.includes("ROLLBACK")
                            ? "text-amber-400"
                            : "text-zinc-300"
                        )}
                      >
                        {log}
                      </div>
                    ))}
                    {committing && (
                      <div className="flex items-center gap-2 text-emerald-400 animate-pulse pt-1">
                        <span>&gt; Menulis baris ke database PostgreSQL...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Result Card when finished */}
                {commitResult && (
                  <div className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/40 space-y-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      {commitResult.status === "SUCCESS" ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                      ) : commitResult.status === "PARTIAL" ? (
                        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">
                          {commitResult.status === "SUCCESS"
                            ? "Migrasi Berhasil Diselesaikan Sepenuhnya!"
                            : commitResult.status === "PARTIAL"
                            ? "Migrasi Selesai dengan Sebagian Data Dilewati"
                            : "Migrasi Gagal"}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {commitResult.status === "SUCCESS"
                            ? `Seluruh entitas berhasil dicatat ke sistem ERP Al Mubarok untuk cabang ${selectedCabangName}.`
                            : "Periksa daftar catatan galat di bawah ini untuk rekonsiliasi."}
                        </p>
                      </div>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="p-3 rounded-xl bg-surface border border-outline-variant/40">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase">Barang Baru</span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {(commitResult.master_inserted || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-outline-variant/40">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase">Barang Diperbarui</span>
                        <div className="text-lg font-black text-primary mt-0.5">
                          {(commitResult.master_updated || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-outline-variant/40">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase">Stok Disetel</span>
                        <div className="text-lg font-black text-on-surface mt-0.5">
                          {(commitResult.stok_updated || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-outline-variant/40">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase">Nota Penjualan</span>
                        <div className="text-lg font-black text-indigo-500 mt-0.5">
                          {(commitResult.transaksi_inserted || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Quick Navigation directly to operational modules */}
                    <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/40 flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-xs font-semibold text-on-surface">Pintasan ke modul terkait:</span>
                      <div className="flex items-center flex-wrap gap-2">
                        {commitResult.transaksi_inserted > 0 && (
                          <a
                            href="/penjualan/history?source=MIGRASI"
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <History className="w-3.5 h-3.5" /> Lihat Penjualan
                          </a>
                        )}
                        {commitResult.stok_updated > 0 && (
                          <a
                            href="/stok"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Layers className="w-3.5 h-3.5" /> Lihat Stok
                          </a>
                        )}
                        {(commitResult.master_inserted > 0 || commitResult.master_updated > 0) && (
                          <a
                            href="/barang"
                            className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Package className="w-3.5 h-3.5" /> Lihat Katalog Barang
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Finish Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer"
                      >
                        Impor Berkas Lainnya
                      </button>
                      <button
                        onClick={() => { setActiveTab("logs"); handleReset(); }}
                        className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" /> Lihat Riwayat Log
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: RIWAYAT LOG MIGRASI ───────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari file, cabang, user..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <select
                value={logFilterCabang}
                onChange={(e) => setLogFilterCabang(e.target.value)}
                className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none shrink-0"
              >
                <option value="all">Semua Cabang</option>
                {cabangList.map((c) => (
                  <option key={c.id_cabang} value={c.id_cabang}>
                    {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="px-3.5 py-1.5 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-all self-end sm:self-auto cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loadingLogs && "animate-spin")} />
              Segarkan
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface shadow-xs flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-surface-container text-on-surface-variant font-semibold border-b border-outline-variant/40 z-10">
                  <tr>
                    <th className="p-3">Waktu Migrasi</th>
                    <th className="p-3">Cabang Toko</th>
                    <th className="p-3">Pelaksana</th>
                    <th className="p-3">Nama Berkas</th>
                    <th className="p-3 text-right">Total Baris</th>
                    <th className="p-3 text-right">Berhasil</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-on-surface-variant">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        Memuat riwayat migrasi...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-on-surface-variant">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-surface-variant" />
                        Belum ada riwayat migrasi data yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-high/30 transition-colors">
                        <td className="p-3 font-mono text-on-surface-variant">
                          {log.created_at ? log.created_at.substring(0, 19).replace("T", " ") : "-"}
                        </td>
                        <td className="p-3 font-semibold text-on-surface">{log.nama_cabang || `Cabang #${log.id_cabang}`}</td>
                        <td className="p-3 text-on-surface-variant">{log.nama_user || `User #${log.id_user}`}</td>
                        <td className="p-3 font-mono text-[11px] text-on-surface">{log.nama_file}</td>
                        <td className="p-3 text-right font-mono">{log.total_baris?.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {log.berhasil?.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border",
                              log.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : log.status === "PARTIAL"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : log.status === "ROLLED_BACK"
                                ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            )}
                          >
                            {log.status === "ROLLED_BACK" ? "DIBATALKAN" : log.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedLogDetail(log)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-all cursor-pointer"
                            >
                              Rincian
                            </button>
                            {log.status !== "ROLLED_BACK" && log.status !== "FAILED" && (
                              <button
                                onClick={() => setLogToRollback(log)}
                                disabled={!can_create}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1",
                                  can_create
                                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 cursor-pointer"
                                    : "opacity-40 bg-surface-container border-outline-variant/40 text-on-surface-variant cursor-not-allowed"
                                )}
                                title={
                                  can_create
                                    ? "Batalkan data migrasi ini"
                                    : "Memerlukan hak akses 'Tambah' untuk membatalkan migrasi"
                                }
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Batalkan</span>
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
          </div>
        </div>
      )}

      {/* ─── MODAL 1: PANDUAN SKEMA KOLOM LENGKAP ─────────────────────────── */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-3xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-on-surface">Panduan Skema Kolom Berkas Migrasi</h3>
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="w-7 h-7 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs text-on-surface-variant">
              <div>
                <h4 className="font-bold text-on-surface text-xs mb-1">1. Format Master Barang (.sql / .csv)</h4>
                <p className="text-[11px] mb-2">
                  Daftar kolom yang otomatis dikenali oleh mesin migrasi saat mengekstrak katalog barang:
                </p>
                <div className="rounded-xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest">
                  <table className="w-full text-[11px]">
                    <thead className="bg-surface-container text-on-surface font-semibold">
                      <tr>
                        <th className="p-2 text-left">Nama Header</th>
                        <th className="p-2 text-left">Target ERP</th>
                        <th className="p-2 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      <tr>
                        <td className="p-2 font-mono text-primary font-bold">BARCODE / KDBRG</td>
                        <td className="p-2 font-mono">barcode</td>
                        <td className="p-2">Kunci unik produk (Wajib)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-primary font-bold">NMBRG</td>
                        <td className="p-2 font-mono">nama_barang</td>
                        <td className="p-2">Nama barang (Wajib)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">SAT 1 - 4</td>
                        <td className="p-2 font-mono">satuan_1 .. 3</td>
                        <td className="p-2">Satuan PCS, DUS, KARTON</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">ISI 2 - 4</td>
                        <td className="p-2 font-mono">isi_2 .. 3</td>
                        <td className="p-2">Konversi isi satuan ke satuan 1</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">STOCK</td>
                        <td className="p-2 font-mono">stok_barang</td>
                        <td className="p-2">Stok fisik saat ini per cabang</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">DEPARTEMENT</td>
                        <td className="p-2 font-mono">kategori_barang</td>
                        <td className="p-2">Kategori otomatis dibuat jika baru</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">HRGBELI / HBT</td>
                        <td className="p-2 font-mono">harga_beli</td>
                        <td className="p-2">Prioritas pada HBT (harga terakhir)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">LEVEL</td>
                        <td className="p-2 font-mono">level_barang</td>
                        <td className="p-2">F $\rightarrow$ FAST, M $\rightarrow$ MEDIUM, S $\rightarrow$ SLOW</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">PPN / LPPJK</td>
                        <td className="p-2 font-mono">lapor_pajak</td>
                        <td className="p-2">1/Y = Fiskal, 0/N = Non-Fiskal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-xs mb-1">2. Format Riwayat Transaksi (.sql / .csv)</h4>
                <p className="text-[11px] mb-2">
                  Dikelompokkan otomatis per nomor nota <code className="font-mono text-primary">NOJUAL</code>:
                </p>
                <div className="rounded-xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest">
                  <table className="w-full text-[11px]">
                    <thead className="bg-surface-container text-on-surface font-semibold">
                      <tr>
                        <th className="p-2 text-left">Nama Header</th>
                        <th className="p-2 text-left">Target ERP</th>
                        <th className="p-2 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      <tr>
                        <td className="p-2 font-mono text-primary font-bold">NOJUAL</td>
                        <td className="p-2 font-mono">no_invoice</td>
                        <td className="p-2">Otomatis diberi prefix MIG-</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">TANGGAL, JAM</td>
                        <td className="p-2 font-mono">tanggal_invoice</td>
                        <td className="p-2">Format YYYY-MM-DD / DD/MM/YYYY</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">NMCUST</td>
                        <td className="p-2 font-mono">nama_pelanggan</td>
                        <td className="p-2">Nama pembeli</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">CARABAYAR</td>
                        <td className="p-2 font-mono">jenis_pembayaran</td>
                        <td className="p-2">TUNAI, DEBIT, KREDIT, TRANSFER</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">JUMLAH, HARGA, TOTAL</td>
                        <td className="p-2 font-mono">penjualan_detail</td>
                        <td className="p-2">Item per baris faktur</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant/40 flex justify-end shrink-0">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: RINCIAN LOG MIGRASI ─────────────────────────────────── */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-3xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-low shrink-0">
              <h3 className="text-sm font-bold text-on-surface">
                Rincian Log Migrasi #{selectedLogDetail.id}
              </h3>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="w-7 h-7 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <span className="text-[10px] text-on-surface-variant block">Cabang Toko</span>
                  <span className="font-bold text-on-surface">{selectedLogDetail.nama_cabang}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <span className="text-[10px] text-on-surface-variant block">Pelaksana</span>
                  <span className="font-bold text-on-surface">{selectedLogDetail.nama_user}</span>
                </div>
              </div>

              {selectedLogDetail.summary && (
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest space-y-2">
                  <span className="font-bold text-on-surface block text-xs">Statistik Pemrosesan:</span>
                  <div className="grid grid-cols-2 gap-2 text-on-surface-variant text-[11px]">
                    <div>• Barang Baru: <strong className="text-on-surface">{selectedLogDetail.summary.master_inserted || 0}</strong></div>
                    <div>• Barang Diperbarui: <strong className="text-on-surface">{selectedLogDetail.summary.master_updated || 0}</strong></div>
                    <div>• Stok Disetel: <strong className="text-on-surface">{selectedLogDetail.summary.stok_updated || 0}</strong></div>
                    <div>• Nota Penjualan: <strong className="text-on-surface">{selectedLogDetail.summary.transaksi_inserted || 0}</strong></div>
                    <div>• Kategori Dibuat: <strong className="text-on-surface">{selectedLogDetail.summary.kategori_created || 0}</strong></div>
                    <div>• Supplier Dibuat: <strong className="text-on-surface">{selectedLogDetail.summary.supplier_created || 0}</strong></div>
                  </div>
                </div>
              )}

              {selectedLogDetail.detail_error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-1">
                  <span className="font-bold block text-xs">Catatan Galat:</span>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                    {selectedLogDetail.detail_error}
                  </pre>
                </div>
              )}

              {/* Quick Navigation Links */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <span className="font-bold text-on-surface block text-xs">Pintasan Menuju Data Terkait:</span>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/penjualan/history?source=MIGRASI"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-xs font-semibold text-primary flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Lihat Riwayat Penjualan</span>
                  </a>
                  <a
                    href="/stok"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Lihat Stok Cabang</span>
                  </a>
                  <a
                    href="/barang"
                    className="px-3 py-1.5 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <span>Lihat Master Barang</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant/40 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: KONFIRMASI BAHAYA PEMBATALAN MIGRASI ───────────────── */}
      {logToRollback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-lg rounded-3xl border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col">
            {/* Header Merah */}
            <div className="p-5 border-b border-rose-500/20 bg-rose-500/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Konfirmasi Pembatalan Migrasi</h3>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    Tindakan ini akan membatalkan data impor terkait
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLogToRollback(null)}
                disabled={rollingBack}
                className="w-7 h-7 rounded-xl hover:bg-rose-500/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rincian Berkas */}
            <div className="p-5 space-y-4 text-xs text-on-surface">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-sans">Berkas Migrasi:</span>
                  <span className="font-bold text-on-surface">{logToRollback.nama_file}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-sans">Cabang Toko:</span>
                  <span className="font-bold text-primary">{logToRollback.nama_cabang || `Cabang #${logToRollback.id_cabang}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-sans">Waktu Impor:</span>
                  <span>{logToRollback.created_at ? logToRollback.created_at.substring(0, 19).replace("T", " ") : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-sans">Total Baris:</span>
                  <span>{logToRollback.total_baris?.toLocaleString()} baris ({logToRollback.berhasil?.toLocaleString()} berhasil)</span>
                </div>
              </div>

              {/* Peringatan Dampak */}
              <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Dampak Pembatalan:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-on-surface-variant">
                  <li>Riwayat mutasi saldo awal di <strong className="text-on-surface">Kartu Stok</strong> cabang ini akan ditarik/dihapus.</li>
                  <li>Stok fisik di <strong className="text-on-surface">Stok Cabang</strong> untuk cabang ini akan di-reset ke <strong className="text-on-surface">0</strong>.</li>
                  <li>Seluruh nota transaksi penjualan migrasi (<strong className="text-on-surface">MIG-...</strong>) pada cabang ini akan dihapus jika ada.</li>
                  <li><strong className="text-emerald-600 dark:text-emerald-400">Master Katalog Barang pusat tetap aman</strong> dan tidak akan dihapus.</li>
                </ul>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setLogToRollback(null)}
                disabled={rollingBack}
                className="px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handleExecuteRollback}
                disabled={rollingBack}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {rollingBack ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Membatalkan Data...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Batalkan Data Migrasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
