"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  TrendingUp,
  Building2,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Edit2,
  Trash2,
  X,
  Save,
  Copy,
  Check,
  Percent,
  Sliders,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Landmark,
  Layers,
  ArrowUpDown,
  Sparkles,
  Info,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvestorItem {
  id_cabang_investor: number;
  nama_investor: string;
  telepon: string | null;
  email: string | null;
  nilai_investasi: number;
  porsi_kepemilikan: number;
  nama_bank: string | null;
  no_rekening: string | null;
  atas_nama_rekening: string | null;
  tanggal_bergabung: string | null;
  status: string;
  catatan: string | null;
  created_at: string;
}

interface InvestorBranch {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  alamat: string;
}

interface SummaryData {
  total_investor: number;
  total_modal: number;
  rata_rata_modal: number;
  total_cabang_investor: number;
}

interface RekeningKasItem {
  id: number;
  nama: string;
  jenis: string;
  saldo: number;
}

export default function InvestorDaftarPage() {
  const currentYear = new Date().getFullYear();
  const [list, setList] = useState<InvestorItem[]>([]);
  const [investorBranches, setInvestorBranches] = useState<InvestorBranch[]>([]);
  const [rekeningKasList, setRekeningKasList] = useState<RekeningKasItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total_investor: 0,
    total_modal: 0,
    rata_rata_modal: 0,
    total_cabang_investor: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState<"modal-desc" | "modal-asc" | "nama-asc" | "terbaru">("modal-desc");

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InvestorItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields (Tanpa Cabang & Tanpa Porsi Manual)
  const [formNama, setFormNama] = useState("");
  const [formNilai, setFormNilai] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formRekening, setFormRekening] = useState("");
  const [formAtasNama, setFormAtasNama] = useState("");
  const [formTelepon, setFormTelepon] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState("AKTIF");
  const [formCatatan, setFormCatatan] = useState("");
  const [formRekeningKas, setFormRekeningKas] = useState("");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<InvestorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper Bulan Aktif (Time-Weighted Capital)
  const getBulanAktif = (tglBergabung: string | null, targetYear = currentYear) => {
    if (!tglBergabung) return 12;
    const d = new Date(tglBergabung);
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-12
    const day = d.getDate();
    if (y < targetYear) return 12;
    if (y > targetYear) return 0;
    // Jika tgl 1 langsung aktif bulan tsb; jika > 1, efektif mulai bulan berikutnya
    const startMonth = day === 1 ? m : Math.min(13, m + 1);
    return Math.max(0, 12 - startMonth + 1);
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, resKas] = await Promise.all([
        fetch("/api/investor/daftar-semua"),
        fetch("/api/investor/rekening-kas"),
      ]);
      const json = await res.json();
      const jsonKas = await resKas.json();

      if (json.success) {
        setList(json.data.list || []);
        setInvestorBranches(json.data.investor_branches || []);
        setSummary(
          json.data.summary || {
            total_investor: 0,
            total_modal: 0,
            rata_rata_modal: 0,
            total_cabang_investor: 0,
          }
        );
      } else {
        throw new Error(json.error || "Gagal memuat daftar investor");
      }

      if (jsonKas.success) {
        setRekeningKasList(jsonKas.data || []);
      }
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered and Sorted List
  const processedList = useMemo(() => {
    let result = list.filter((item) => {
      // Filter Status
      if (filterStatus !== "ALL" && item.status !== filterStatus) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = item.nama_investor.toLowerCase().includes(q);
        const matchKontak =
          (item.telepon && item.telepon.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q));
        const matchRek =
          (item.no_rekening && item.no_rekening.includes(q)) ||
          (item.nama_bank && item.nama_bank.toLowerCase().includes(q));

        if (!matchNama && !matchKontak && !matchRek) {
          return false;
        }
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "modal-desc") return Number(b.nilai_investasi) - Number(a.nilai_investasi);
      if (sortBy === "modal-asc") return Number(a.nilai_investasi) - Number(b.nilai_investasi);
      if (sortBy === "nama-asc") return a.nama_investor.localeCompare(b.nama_investor);
      if (sortBy === "terbaru") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return 0;
    });

    return result;
  }, [list, filterStatus, searchQuery, sortBy]);

  // Dynamic Summary based on filtered list
  const activeSummary = useMemo(() => {
    const totalModal = processedList.reduce((acc, curr) => acc + Number(curr.nilai_investasi || 0), 0);
    const avgModal = processedList.length > 0 ? Math.round(totalModal / processedList.length) : 0;
    return {
      total_investor: processedList.length,
      total_modal: totalModal,
      rata_rata_modal: avgModal,
      total_cabang_investor: investorBranches.length,
    };
  }, [processedList, investorBranches]);

  // Copy Rekening to Clipboard
  const handleCopyRekening = (id: number, rek: string) => {
    navigator.clipboard.writeText(rek);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNama("");
    setFormNilai("");
    setFormBank("");
    setFormRekening("");
    setFormAtasNama("");
    setFormTelepon("");
    setFormEmail("");
    setFormTanggal(new Date().toISOString().slice(0, 10));
    setFormStatus("AKTIF");
    setFormCatatan("");
    setFormRekeningKas("");
    setModalError(null);
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item: InvestorItem) => {
    setEditingItem(item);
    setFormNama(item.nama_investor);
    setFormNilai(String(item.nilai_investasi));
    setFormBank(item.nama_bank || "");
    setFormRekening(item.no_rekening || "");
    setFormAtasNama(item.atas_nama_rekening || "");
    setFormTelepon(item.telepon || "");
    setFormEmail(item.email || "");
    setFormTanggal(item.tanggal_bergabung || new Date().toISOString().slice(0, 10));
    setFormStatus(item.status || "AKTIF");
    setFormCatatan(item.catatan || "");
    setModalError(null);
    setShowModal(true);
  };

  // Projected Ownership Percentage in Modal
  const modalProjectedPercentage = useMemo(() => {
    const inputVal = Number(formNilai || 0);
    if (inputVal <= 0) return "0.00";

    const currentTotalExcludingThis = list
      .filter((i) => (editingItem ? i.id_cabang_investor !== editingItem.id_cabang_investor : true))
      .reduce((acc, curr) => acc + Number(curr.nilai_investasi || 0), 0);

    const projectedTotal = currentTotalExcludingThis + inputVal;
    if (projectedTotal <= 0) return "100.00";

    return ((inputVal / projectedTotal) * 100).toFixed(2);
  }, [formNilai, list, editingItem]);

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        nama_investor: formNama,
        nilai_investasi: formNilai || "0",
        nama_bank: formBank,
        no_rekening: formRekening,
        atas_nama_rekening: formAtasNama,
        telepon: formTelepon,
        email: formEmail,
        tanggal_bergabung: formTanggal,
        status: formStatus,
        catatan: formCatatan,
        id_rekening_kas: formRekeningKas || null,
      };

      const url = editingItem
        ? `/api/investor/daftar-semua/${editingItem.id_cabang_investor}`
        : "/api/investor/daftar-semua";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan data investor");
      }

      setToast({
        type: "success",
        text: editingItem
          ? `Data pemodal "${formNama}" berhasil diperbarui. Porsi saham seluruh pemodal telah disinkronkan otomatis.`
          : `Pemodal "${formNama}" berhasil ditambahkan ke konsorsium seluruh cabang.`,
      });

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/investor/daftar-semua/${deleteTarget.id_cabang_investor}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menghapus investor");
      }

      setToast({
        type: "success",
        text: `Pemodal "${deleteTarget.nama_investor}" berhasil dihapus. Porsi saham pemodal lain telah dihitung ulang secara otomatis.`,
      });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (processedList.length === 0) return;

    const headers = [
      "No",
      "Nama Pemodal",
      "Nilai Modal Investasi (Rp)",
      "Porsi Kepemilikan Konsorsium (%)",
      "Nama Bank",
      "Nomor Rekening",
      "Atas Nama Rekening",
      "Telepon",
      "Email",
      "Tanggal Bergabung",
      "Status",
      "Catatan",
    ];

    const rows = processedList.map((item, idx) => [
      idx + 1,
      `"${item.nama_investor}"`,
      item.nilai_investasi,
      item.porsi_kepemilikan,
      `"${item.nama_bank || "-"}"`,
      `"${item.no_rekening || "-"}"`,
      `"${item.atas_nama_rekening || "-"}"`,
      `"${item.telepon || "-"}"`,
      `"${item.email || "-"}"`,
      `"${item.tanggal_bergabung || "-"}"`,
      `"${item.status}"`,
      `"${item.catatan || "-"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Konsorsium_Pemodal_AlMubarok_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <Link
            href="/investor"
            className="p-2.5 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface-variant transition-colors shadow-xs"
            title="Kembali ke Dasbor Portofolio Investor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-on-surface">
                Daftar Pemodal & Konsorsium Investor
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Penyertaan Terpusat Seluruh Cabang
              </span>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
              Seluruh pemodal memiliki kepemilikan saham di seluruh cabang bertipe INVESTOR secara kolektif
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
            title="Muat ulang data terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={processedList.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pemodal</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST BANNER */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm flex items-center justify-between gap-3 animate-in fade-in ${
            toast.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-surface/50 rounded-lg text-on-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. KPI STAT CARDS & JARINGAN CABANG BINAAN
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pemodal */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Pemodal Aktif
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl lg:text-3xl font-extrabold font-mono text-on-surface">
                {activeSummary.total_investor}{" "}
                <span className="text-xs font-normal text-on-surface-variant">Orang / Entitas</span>
              </h3>
            </div>
          </div>
          <p className="mt-3 pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
            Penyertaan kolektif di seluruh cabang
          </p>
        </div>

        {/* Card 2: Total Modal Investasi */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Modal Konsorsium
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl lg:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(activeSummary.total_modal)}
              </h3>
            </div>
          </div>
          <p className="mt-3 pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
            Akumulasi 100% modal ekuitas investor
          </p>
        </div>

        {/* Card 3: Rata-rata Investasi */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Rata-Rata per Pemodal
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl lg:text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(activeSummary.rata_rata_modal)}
              </h3>
            </div>
          </div>
          <p className="mt-3 pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
            Rata-rata nominal modal disetor
          </p>
        </div>

        {/* Card 4: Cabang Penempatan (Menampilkan Cabang Investor yang Dinaungi) */}
        <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Cabang Investor Dinaungi
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl lg:text-3xl font-extrabold font-mono text-on-surface">
                {investorBranches.length}{" "}
                <span className="text-xs font-normal text-on-surface-variant">Cabang Investor</span>
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant flex items-center gap-1.5 flex-wrap">
            {investorBranches.length > 0 ? (
              investorBranches.map((b) => (
                <span
                  key={b.id_cabang}
                  className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  title={`${b.nama_cabang} (${b.alamat || ""})`}
                >
                  {b.kode_cabang}
                </span>
              ))
            ) : (
              <span className="italic opacity-70">Belum ada cabang bertipe INVESTOR</span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FILTER & SEARCH CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pemodal, nomor rekening, telepon..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Filter & Sorting Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Status: AKTIF</option>
              <option value="NONAKTIF">Status: NONAKTIF</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-semibold focus:outline-none"
            >
              <option value="modal-desc">Modal Terbesar</option>
              <option value="modal-asc">Modal Terkecil</option>
              <option value="nama-asc">Nama Pemodal (A-Z)</option>
              <option value="terbaru">Paling Baru Terdaftar</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN INVESTORS DATA TABLE
             (Kolom Cabang Dihapus, Porsi Dihitung Otomatis)
      ───────────────────────────────────────────────────────────── */}
      <div className="p-5 md:p-6 rounded-3xl border border-outline-variant/30 bg-surface shadow-xs space-y-4">
        {/* Banner Penjelasan Time-Weighted Capital & Siklus Dividen */}
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-on-surface block">
                Prinsip Syariah Adil: Time-Weighted Capital & Dividen Tahunan (Pencairan Februari)
              </span>
              <span className="text-on-surface-variant block mt-0.5 leading-relaxed">
                Pemodal yang menyetor modal di tengah tahun dihitung proporsional berdasarkan bulan aktif bekerja (cut-off: tgl 1 bulan berikutnya). Hak dividen dicairkan pada bulan Februari tahun berikutnya.
              </span>
            </div>
          </div>
          <Link
            href="/investor/bagi-hasil"
            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs whitespace-nowrap self-start sm:self-center shadow-xs hover:bg-primary/90 transition-all"
          >
            Buka Tutup Buku
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Daftar Pemodal Konsorsium</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Menampilkan {processedList.length} pemodal terdaftar dengan hak bagi hasil di seluruh cabang investor
            </p>
          </div>

          <div className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
            <span>Total Modal Konsorsium:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(activeSummary.total_modal)}
            </span>
          </div>
        </div>

        {/* Table Canvas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant bg-surface-container-low/50">
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">No</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Nama Pemodal / Investor</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Nilai Investasi (Modal)</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Porsi Saham (%)</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Bulan Aktif ({currentYear})</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Rekening Bank Pencairan</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px]">Tanggal Bergabung</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="py-3 px-3.5 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs">Memuat data konsorsium investor...</p>
                  </td>
                </tr>
              ) : processedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-on-surface-variant text-xs">
                    <Users className="w-10 h-10 opacity-30 mx-auto mb-2" />
                    <p className="font-bold text-sm text-on-surface">Tidak Ada Data Pemodal Ditemukan</p>
                    <p className="mt-1">
                      {searchQuery || filterStatus !== "ALL"
                        ? "Coba sesuaikan kata kunci pencarian atau filter yang digunakan."
                        : "Belum ada pemodal yang didaftarkan ke konsorsium."}
                    </p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Pemodal Sekarang</span>
                    </button>
                  </td>
                </tr>
              ) : (
                processedList.map((item, idx) => {
                  const isAktif = item.status === "AKTIF";
                  const blnAktif = getBulanAktif(item.tanggal_bergabung);

                  return (
                    <tr
                      key={item.id_cabang_investor}
                      className="hover:bg-surface-container-low/60 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3.5 px-3.5 font-mono text-[11px] text-on-surface-variant">
                        {idx + 1}
                      </td>

                      {/* Nama & Kontak */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-on-surface text-sm">{item.nama_investor}</div>
                        {(item.telepon || item.email) && (
                          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/80 mt-0.5">
                            {item.telepon && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-3 h-3" /> {item.telepon}
                              </span>
                            )}
                            {item.email && (
                              <span className="flex items-center gap-0.5">
                                <Mail className="w-3 h-3" /> {item.email}
                              </span>
                            )}
                          </div>
                        )}
                        {item.catatan && (
                          <span className="text-[10px] text-on-surface-variant/70 italic block mt-0.5">
                            Catatan: {item.catatan}
                          </span>
                        )}
                      </td>

                      {/* Nilai Investasi */}
                      <td className="py-3.5 px-3.5 font-mono text-right font-extrabold text-sm text-on-surface">
                        {formatCurrency(Number(item.nilai_investasi || 0))}
                      </td>

                      {/* Porsi Kepemilikan Konsorsium (Otomatis) */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {Number(item.porsi_kepemilikan || 0).toFixed(2)}%
                        </span>
                      </td>

                      {/* Bulan Aktif di Tahun Berjalan (Time-Weighted) */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            blnAktif === 12
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                          }`}
                          title={`Efektif ${blnAktif} bulan di tahun ${currentYear}`}
                        >
                          {blnAktif} / 12 bln
                        </span>
                      </td>

                      {/* Rekening Bank */}
                      <td className="py-3.5 px-3.5">
                        {item.nama_bank || item.no_rekening ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[11px] text-primary">
                                {item.nama_bank || "Bank"}
                              </span>
                              <span className="font-mono font-semibold text-on-surface">
                                {item.no_rekening}
                              </span>
                              {item.no_rekening && (
                                <button
                                  onClick={() =>
                                    handleCopyRekening(item.id_cabang_investor, item.no_rekening || "")
                                  }
                                  className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                                  title="Salin nomor rekening"
                                >
                                  {copiedId === item.id_cabang_investor ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            {item.atas_nama_rekening && (
                              <span className="text-[10px] text-on-surface-variant block">
                                a.n. {item.atas_nama_rekening}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/50 italic text-[11px]">
                            Belum diatur
                          </span>
                        )}
                      </td>

                      {/* Tanggal Bergabung */}
                      <td className="py-3.5 px-3.5 text-on-surface-variant text-[11px]">
                        {formatDate(item.tanggal_bergabung)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAktif
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-primary transition-colors"
                            title="Edit Data Investor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-rose-500/10 text-rose-600 transition-colors"
                            title="Hapus Investor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL FORM: TAMBAH / EDIT INVESTOR
             (Alur Baru: Tanpa Cabang Penempatan, Porsi Otomatis)
      ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header Modal */}
            <div className="p-5 md:p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base md:text-lg text-on-surface flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{editingItem ? "Edit Data Pemodal" : "Tambah Pemodal Baru"}</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Penyertaan modal terpusat pada seluruh cabang bertipe INVESTOR
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in Modal */}
            {modalError && (
              <div className="m-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Information Notice: Kepemilikan Universal */}
            <div className="mx-5 md:mx-6 mt-5 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-on-surface">Penyertaan Saham Konsorsium Universal</p>
                <p className="text-on-surface-variant mt-0.5 leading-relaxed">
                  Pemodal ini otomatis memiliki penyertaan saham di{" "}
                  <strong>seluruh cabang bertipe INVESTOR ({investorBranches.length} cabang aktif)</strong>.
                  Porsi kepemilikan (%) akan dihitung secara proporsional dan adil terhadap akumulasi total modal
                  seluruh konsorsium.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-5 md:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Investor */}
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Nama Lengkap Pemodal / Entitas *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: H. Ahmad Fauzi / PT Konsorsium Berkah"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Status Pemodal
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="AKTIF">AKTIF (Ikut Bagi Hasil)</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
                </div>

                {/* Nilai Investasi (Modal) */}
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-on-surface-variant block">
                      Nilai Modal Investasi (Rp) *
                    </label>
                    {formNilai && (
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        Proyeksi Porsi Saham: ~{modalProjectedPercentage}%
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formNilai}
                    onChange={(e) => setFormNilai(e.target.value)}
                    placeholder="Contoh: 150000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1">
                    <span className="font-semibold text-primary">
                      {formNilai ? `= ${formatCurrency(Number(formNilai))}` : "Masukkan nominal modal"}
                    </span>
                    <span className="opacity-80">
                      Porsi dihitung otomatis: (Modal Anda ÷ Total Modal Konsorsium) × 100%
                    </span>
                  </div>
                </div>

                {/* Bank, Rekening, Atas Nama */}
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Nama Bank Penerima Dividen
                  </label>
                  <input
                    type="text"
                    value={formBank}
                    onChange={(e) => setFormBank(e.target.value)}
                    placeholder="Contoh: BSI / Mandiri / BCA / BNI"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={formRekening}
                    onChange={(e) => setFormRekening(e.target.value)}
                    placeholder="14300xxxxxxx"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Atas Nama Rekening Sesuai Buku Tabungan
                  </label>
                  <input
                    type="text"
                    value={formAtasNama}
                    onChange={(e) => setFormAtasNama(e.target.value)}
                    placeholder="Nama lengkap pemilik rekening"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Telepon & Email */}
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="investor@domain.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Tanggal Bergabung */}
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Catatan */}
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface-variant block">
                    Catatan Akad / Perjanjian
                  </label>
                  <input
                    type="text"
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    placeholder="Keterangan nomor akta atau catatan perjanjian"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Rekening Kas / Bank Penampung Setoran Modal Masuk (Hanya untuk Tambah Baru) */}
                {!editingItem && (
                  <div className="sm:col-span-2 space-y-1 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                    <label className="font-semibold text-on-surface block">
                      Rekening Kas / Bank Penampung Setoran Modal (Opsional)
                    </label>
                    <select
                      value={formRekeningKas}
                      onChange={(e) => setFormRekeningKas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">-- Jangan Catat Transaksi Kas Sekarang (Hanya Input Master) --</option>
                      {rekeningKasList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama} ({r.jenis}) — Saldo: {formatCurrency(r.saldo)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      Jika dipilih, sistem akan otomatis mencatat mutasi kas masuk dan membukukan jurnal ekuitas Modal Disetor (3.101.01).
                    </p>
                  </div>
                )}
              </div>

              {/* Actions in Modal */}
              <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container transition-all font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                  <span>{submitting ? "Menyimpan & Menghitung Ulang..." : "Simpan Pemodal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL KONFIRMASI HAPUS
      ───────────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/50 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-on-surface">Konfirmasi Hapus Pemodal</h3>
                <p className="text-xs text-on-surface-variant">Tindakan ini akan menghitung ulang porsi saham pemodal lain</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Apakah Anda yakin ingin menghapus pemodal{" "}
              <strong className="text-on-surface">{deleteTarget.nama_investor}</strong> dengan modal penyertaan{" "}
              <strong className="font-mono text-on-surface">
                {formatCurrency(Number(deleteTarget.nilai_investasi || 0))}
              </strong>
              ?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Pemodal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
