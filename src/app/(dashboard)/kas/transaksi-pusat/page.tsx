"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  Clock,
  ShieldCheck,
  Check,
  Eye,
  Plus,
  Coins,
  Layers,
  Store,
  BookOpen
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Transaction {
  id: number;
  nomor_transaksi: string;
  id_rekening: number;
  nama_rekening: string;
  kode_rekening: string;
  jenis_rekening: string;
  tipe: "MASUK" | "KELUAR" | "TRANSFER";
  kategori: string;
  nominal: number;
  tanggal: string;
  keterangan: string;
  status: "APPROVED" | "PENDING" | "REVERSED";
  bukti: string | null;
  id_akun_lawan_coa: number | null;
  nama_akun_lawan: string | null;
  kode_akun_lawan: string | null;
  created_by_nama: string | null;
}

interface Rekening {
  id: number;
  kode: string;
  nama: string;
  jenis: string;
  saldo: number;
  id_akun_coa: number | null;
  nama_akun_coa?: string;
  kode_akun_coa?: string;
  is_active: boolean;
}

interface CoaOption {
  id: number;
  kode_akun: string;
  nama_akun: string;
  tipe_akun_id: number;
  nama_tipe?: string | null;
  posisi_saldo_normal?: string | null;
}

const KATEGORI_KELUAR_PUSAT = [
  { value: "HUTANG_SUPPLIER", label: "Pembayaran Utang Usaha Supplier", defaultCoaId: 18 },
  { value: "PAJAK", label: "Setoran Pajak (PPN / PPh)", defaultCoaId: 21 },
  { value: "GAJI_PUSAT", label: "Beban Gaji Staff & Manajemen Pusat", defaultCoaId: 37 },
  { value: "OPERASIONAL_DC", label: "Beban Listrik, Internet & Operasional DC", defaultCoaId: 40 },
  { value: "LOGISTIK", label: "Ongkos Angkut & Distribusi Logistik", defaultCoaId: 45 },
  { value: "MODAL_INVESTOR", label: "Pengembalian Modal Investor", defaultCoaId: 25 },
  { value: "DIVIDEN", label: "Pembagian Bagi Hasil / Dividen", defaultCoaId: 28 },
  { value: "ASET_TETAP", label: "Perolehan Aset Tetap / Peralatan", defaultCoaId: 13 },
  { value: "LAIN", label: "Pengeluaran Lain-lain", defaultCoaId: 40 },
];

const KATEGORI_MASUK_PUSAT = [
  { value: "MODAL_INVESTOR", label: "Penyetoran Modal Investor", defaultCoaId: 25 },
  { value: "PENJUALAN", label: "Penerimaan Penjualan DC / Grosir", defaultCoaId: 29 },
  { value: "OPERASIONAL", label: "Pengembalian Panjar / Operasional", defaultCoaId: 40 },
  { value: "LAIN", label: "Penerimaan Lain-lain / Bunga Bank", defaultCoaId: 49 },
];

const APPROVAL_THRESHOLD = 10000000; // Rp 10.000.000

export default function KasTransaksiPusatPage() {
  const { can_create, can_read, can_update, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Transaction[]>([]);
  const [rekenings, setRekenings] = useState<Rekening[]>([]);
  const [coaList, setCoaList] = useState<CoaOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRekening, setFilterRekening] = useState("");
  const [activeFilterCard, setActiveFilterCard] = useState<"ALL" | "MASUK" | "KELUAR" | "PENDING">("ALL");

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [viewDetailTx, setViewDetailTx] = useState<Transaction | null>(null);

  // Form States
  const [formRekening, setFormRekening] = useState("");
  const [formNominal, setFormNominal] = useState("");
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [formKategori, setFormKategori] = useState("");
  const [formCoa, setFormCoa] = useState<string>("");
  const [coaSearch, setCoaSearch] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formBukti, setFormBukti] = useState("");

  // Approval Modal State
  const [approvingTx, setApprovingTx] = useState<Transaction | null>(null);

  // Toast & Saving State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const qParams = new URLSearchParams();
      if (startDate) qParams.append("startDate", startDate);
      if (endDate) qParams.append("endDate", endDate);
      if (filterTipe) qParams.append("tipe", filterTipe);
      if (filterStatus) qParams.append("status", filterStatus);
      if (filterRekening) qParams.append("id_rekening", filterRekening);

      const [txRes, rekRes, coaRes] = await Promise.all([
        fetch(`/api/kas/transaksi-pusat?${qParams.toString()}`),
        fetch("/api/kas/rekening-pusat"),
        fetch("/api/kas/coa-options"),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success) setList(txData.data || []);
      } else {
        const err = await txRes.json();
        setErrorMsg(err.error || "Gagal memuat transaksi pusat");
      }

      if (rekRes.ok) {
        const rekData = await rekRes.json();
        if (rekData.success) {
          setRekenings(rekData.data || []);
        }
      }

      if (coaRes.ok) {
        const cData = await coaRes.json();
        if (cData.success) {
          setCoaList(cData.data || []);
        }
      }
    } catch {
      setErrorMsg("Koneksi gagal saat memuat data transaksi pusat.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterTipe, filterStatus, filterRekening]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Date Filter Presets
  const setDatePreset = (preset: "today" | "week" | "month" | "year") => {
    const today = new Date();
    let start = new Date();
    const end = new Date();

    if (preset === "today") {
      start = today;
    } else if (preset === "week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
    } else if (preset === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === "year") {
      start = new Date(today.getFullYear(), 0, 1);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // Click-to-filter on the 4 metric cards
  const handleCardClick = (card: "ALL" | "MASUK" | "KELUAR" | "PENDING") => {
    if (activeFilterCard === card && card !== "ALL") {
      setActiveFilterCard("ALL");
      setFilterTipe("");
      setFilterStatus("");
    } else {
      setActiveFilterCard(card);
      if (card === "ALL") {
        setFilterTipe("");
        setFilterStatus("");
      } else if (card === "MASUK") {
        setFilterTipe("MASUK");
        setFilterStatus("");
      } else if (card === "KELUAR") {
        setFilterTipe("KELUAR");
        setFilterStatus("");
      } else if (card === "PENDING") {
        setFilterTipe("");
        setFilterStatus("PENDING");
      }
    }
  };

  // Set default COA when kategori changes
  const handleKategoriChange = (newKat: string) => {
    setFormKategori(newKat);
    const lookup = modalType === "KELUAR" ? KATEGORI_KELUAR_PUSAT : KATEGORI_MASUK_PUSAT;
    const item = lookup.find((k) => k.value === newKat);
    if (item && item.defaultCoaId) {
      setFormCoa(item.defaultCoaId.toString());
    }
  };

  const openForm = (type: "MASUK" | "KELUAR") => {
    setErrorMsg("");
    setModalType(type);
    setFormRekening(rekenings.length > 0 ? rekenings[0].id.toString() : "");
    setFormNominal("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    const defaultKategori = type === "MASUK" ? "MODAL_INVESTOR" : "HUTANG_SUPPLIER";
    setFormKategori(defaultKategori);
    const lookup = type === "KELUAR" ? KATEGORI_KELUAR_PUSAT : KATEGORI_MASUK_PUSAT;
    const matched = lookup.find((k) => k.value === defaultKategori);
    setFormCoa(matched ? matched.defaultCoaId.toString() : "");
    setCoaSearch("");
    setFormKeterangan("");
    setFormBukti("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRekening) {
      setErrorMsg("Silakan pilih rekening kas atau bank.");
      return;
    }

    const nominalNum = parseInt(formNominal.replace(/[^0-9]/g, ""));
    if (isNaN(nominalNum) || nominalNum <= 0) {
      setErrorMsg("Nominal transaksi harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const endpoint =
      modalType === "MASUK"
        ? "/api/kas/transaksi-pusat/masuk"
        : "/api/kas/transaksi-pusat/keluar";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_rekening: parseInt(formRekening),
          nominal: nominalNum,
          tanggal: formTanggal,
          kategori: formKategori,
          id_akun_lawan_coa: formCoa ? parseInt(formCoa) : undefined,
          keterangan: formKeterangan,
          bukti: formBukti || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        if (data.needsApproval) {
          showToast(
            `Transaksi kas keluar Rp ${formatCurrency(nominalNum)} berhasil dicatat & masuk antrean persetujuan pimpinan (> Rp 10 Juta).`,
            "success"
          );
        } else {
          showToast("Transaksi kas pusat berhasil dibukukan.", "success");
        }
        fetchData();
      } else {
        setErrorMsg(data.error || "Gagal menyimpan transaksi.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat mengirim data.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approvingTx) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/kas/transaksi-pusat/${approvingTx.id}/approve`, {
        method: "PUT",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Transaksi ${approvingTx.nomor_transaksi} berhasil disetujui & dibukukan ke jurnal.`, "success");
        setApprovingTx(null);
        fetchData();
      } else {
        showToast(data.error || "Gagal menyetujui transaksi", "error");
      }
    } catch {
      showToast("Kesalahan jaringan saat melakukan persetujuan", "error");
    } finally {
      setSaving(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const totalSaldoKasBank = rekenings.reduce((acc, r) => acc + (r.saldo || 0), 0);
    const saldoBank = rekenings.filter((r) => r.jenis === "BANK").reduce((acc, r) => acc + (r.saldo || 0), 0);
    const saldoKasDc = rekenings.filter((r) => r.jenis !== "BANK").reduce((acc, r) => acc + (r.saldo || 0), 0);

    const totalMasuk = list
      .filter((t) => t.tipe === "MASUK" && t.status === "APPROVED")
      .reduce((acc, t) => acc + t.nominal, 0);

    const totalKeluar = list
      .filter((t) => t.tipe === "KELUAR" && t.status === "APPROVED")
      .reduce((acc, t) => acc + t.nominal, 0);

    const pendingList = list.filter((t) => t.status === "PENDING" && t.tipe === "KELUAR");
    const totalPending = pendingList.reduce((acc, t) => acc + t.nominal, 0);

    return {
      totalSaldoKasBank,
      saldoBank,
      saldoKasDc,
      totalMasuk,
      totalKeluar,
      pendingCount: pendingList.length,
      totalPending,
    };
  }, [rekenings, list]);

  // Filtered List by Search Query
  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.nomor_transaksi.toLowerCase().includes(q) ||
        (t.keterangan && t.keterangan.toLowerCase().includes(q)) ||
        (t.nama_rekening && t.nama_rekening.toLowerCase().includes(q)) ||
        (t.nama_akun_lawan && t.nama_akun_lawan.toLowerCase().includes(q)) ||
        (t.created_by_nama && t.created_by_nama.toLowerCase().includes(q)) ||
        (t.kategori && t.kategori.toLowerCase().includes(q))
    );
  }, [list, search]);

  const selectedRekeningObj = useMemo(() => {
    return rekenings.find((r) => r.id.toString() === formRekening);
  }, [rekenings, formRekening]);

  const parsedFormNominal = useMemo(() => {
    const num = parseInt(formNominal.replace(/[^0-9]/g, ""));
    return isNaN(num) ? 0 : num;
  }, [formNominal]);

  // Selected COA Object for real-time double entry preview
  const selectedCoaObj = useMemo(() => {
    return coaList.find((c) => c.id.toString() === formCoa);
  }, [coaList, formCoa]);

  // Grouped & Filtered COA Options by modalType (Masuk vs Keluar)
  const groupedCoaOptions = useMemo(() => {
    const q = coaSearch.toLowerCase().trim();
    const searchMatch = (c: CoaOption) =>
      !q || c.nama_akun.toLowerCase().includes(q) || c.kode_akun.toLowerCase().includes(q);

    if (modalType === "MASUK") {
      // 1. Penerimaan Pendapatan (tipe_akun_id = 4)
      const pendapatan = coaList.filter((c) => c.tipe_akun_id === 4 && searchMatch(c));
      // 2. Penyetoran Modal & Ekuitas (tipe_akun_id = 3, kecuali prive id 28)
      const modal = coaList.filter((c) => c.tipe_akun_id === 3 && c.id !== 28 && searchMatch(c));
      // 3. Penerimaan Liabilitas & Titipan Dana (tipe_akun_id = 2)
      const liabilitas = coaList.filter((c) => c.tipe_akun_id === 2 && searchMatch(c));
      // 4. Pelunasan Piutang & Pendapatan Lain-lain (tipe_akun_id = 8 || 1.103.xx)
      const piutangLain = coaList.filter(
        (c) =>
          ((c.tipe_akun_id === 8 && !c.kode_akun.startsWith("8.2")) ||
            c.kode_akun.startsWith("1.103") ||
            c.kode_akun.startsWith("7.")) &&
          searchMatch(c)
      );

      return [
        { label: "📈 Penerimaan Pendapatan (Penjualan / Grosir DC)", accounts: pendapatan },
        { label: "💼 Penyetoran Modal & Ekuitas (Investor)", accounts: modal },
        { label: "🤝 Penerimaan Liabilitas & Titipan Dana", accounts: liabilitas },
        { label: "💵 Pelunasan Piutang & Pendapatan Lain-lain", accounts: piutangLain },
      ].filter((g) => g.accounts.length > 0);
    } else {
      // KELUAR
      // 1. Beban Operasional & Logistik DC (tipe_akun_id = 6)
      const beban = coaList.filter((c) => c.tipe_akun_id === 6 && searchMatch(c));
      // 2. Pelunasan Utang Usaha, Pajak & Gaji (tipe_akun_id = 2)
      const utang = coaList.filter((c) => c.tipe_akun_id === 2 && searchMatch(c));
      // 3. Perolehan Aset Tetap & Peralatan (1.201.xx, 1.105.xx, 1.106.xx)
      const aset = coaList.filter(
        (c) =>
          (c.kode_akun.startsWith("1.201") ||
            c.kode_akun.startsWith("1.105") ||
            c.kode_akun.startsWith("1.106")) &&
          searchMatch(c)
      );
      // 4. Ekuitas, Dividen & Beban Finansial (id = 28 Prive/Dividen, 8.2xx Beban Bunga)
      const dividen = coaList.filter(
        (c) =>
          (c.id === 28 || c.kode_akun.startsWith("8.2")) &&
          searchMatch(c)
      );

      return [
        { label: "🏢 Beban Operasional & Logistik DC", accounts: beban },
        { label: "📋 Pelunasan Utang Usaha, Pajak & Gaji", accounts: utang },
        { label: "📦 Perolehan Aset Tetap, Sewa & Pajak Dimuka", accounts: aset },
        { label: "💰 Ekuitas, Dividen & Beban Finansial", accounts: dividen },
      ].filter((g) => g.accounts.length > 0);
    }
  }, [coaList, coaSearch, modalType]);

  if (permissionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-on-surface-variant">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
        <span className="text-xs">Memeriksa hak akses kas pusat...</span>
      </div>
    );
  }

  if (!can_read) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface text-on-surface rounded-2xl border border-outline-variant/40 max-w-lg mx-auto my-12 text-center">
        <AlertTriangle className="w-14 h-14 text-error mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Anda tidak memiliki izin untuk mengakses halaman Kas Pusat & Bank. Modul ini dikhususkan untuk Manajemen Eksekutif & Keuangan Holding.
        </p>
        <a
          href="/kas/transaksi"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition"
        >
          <span>Kembali ke Kas Toko Cabang</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-2 sm:p-4 md:p-6 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/90 border-rose-500/40 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-outline-variant/40 pb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Kas Pusat & Transaksi Bank
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manajemen arus kas DC Pusat, rekening bank holding, pembayaran supplier, pajak, dan persetujuan pengeluaran &gt; Rp 10 Juta.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-surface hover:bg-surface-container-high border border-outline-variant/40 rounded-xl text-on-surface-variant hover:text-on-surface transition shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>

          {can_create && (
            <>
              <button
                onClick={() => openForm("MASUK")}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-sm"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Kas / Bank Masuk</span>
              </button>

              <button
                onClick={() => openForm("KELUAR")}
                className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-sm"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Kas / Bank Keluar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Interactive Metric Filter Cards (Click-to-Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Semua Rekening / Total Saldo */}
        <button
          type="button"
          onClick={() => handleCardClick("ALL")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            activeFilterCard === "ALL"
              ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-sm"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk melihat semua mutasi"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                activeFilterCard === "ALL"
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-on-surface">Total Kas & Bank Pusat</span>
              <strong className="text-base font-bold text-primary block mt-0.5 font-mono">
                {formatCurrency(metrics.totalSaldoKasBank)}
              </strong>
              <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-medium mt-0.5">
                <span className="text-emerald-700 dark:text-emerald-300">Bank: {formatCurrency(metrics.saldoBank)}</span>
                <span>•</span>
                <span className="text-blue-700 dark:text-blue-300">DC: {formatCurrency(metrics.saldoKasDc)}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Card 2: Total Kas Masuk */}
        <button
          type="button"
          onClick={() => handleCardClick("MASUK")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            activeFilterCard === "MASUK"
              ? "bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/40 shadow-sm"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter transaksi Masuk"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                activeFilterCard === "MASUK"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              )}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-on-surface">Total Masuk (Bulan Ini)</span>
              <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                {formatCurrency(metrics.totalMasuk)}
              </strong>
              <span className="text-[10px] text-on-surface-variant">Modal, grosir DC & penerimaan</span>
            </div>
          </div>
        </button>

        {/* Card 3: Total Kas Keluar */}
        <button
          type="button"
          onClick={() => handleCardClick("KELUAR")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            activeFilterCard === "KELUAR"
              ? "bg-rose-500/15 border-rose-500 ring-1 ring-rose-500/40 shadow-sm"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter transaksi Keluar"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                activeFilterCard === "KELUAR"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}
            >
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-on-surface">Total Keluar (Bulan Ini)</span>
              <strong className="text-base font-bold text-rose-600 dark:text-rose-400 block mt-0.5 font-mono">
                {formatCurrency(metrics.totalKeluar)}
              </strong>
              <span className="text-[10px] text-on-surface-variant">Supplier, operasional & pajak</span>
            </div>
          </div>
        </button>

        {/* Card 4: Menunggu Persetujuan */}
        <button
          type="button"
          onClick={() => handleCardClick("PENDING")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            activeFilterCard === "PENDING"
              ? "bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50 shadow-sm"
              : metrics.pendingCount > 0
              ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter transaksi yang butuh approval"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                activeFilterCard === "PENDING"
                  ? "bg-amber-600 text-white border-amber-600"
                  : metrics.pendingCount > 0
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : "bg-surface-container text-on-surface-variant border-outline-variant/30"
              )}
            >
              <ShieldCheck className={cn("w-5 h-5", metrics.pendingCount > 0 && "animate-pulse")} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Approval (&gt; 10Jt)</span>
                {metrics.pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                    {metrics.pendingCount}
                  </span>
                )}
              </div>
              <strong className="text-base font-bold text-amber-700 dark:text-amber-400 block mt-0.5 font-mono">
                {formatCurrency(metrics.totalPending)}
              </strong>
              <span className="text-[10px] text-on-surface-variant">Perlu persetujuan pimpinan</span>
            </div>
          </div>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-surface-container/60 p-4 border border-outline-variant/40 rounded-2xl space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari no transaksi, keterangan, COA, pencatat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Tipe Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterTipe}
              onChange={(e) => {
                setFilterTipe(e.target.value);
                setActiveFilterCard(e.target.value as any || "ALL");
              }}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="MASUK">Kas/Bank Masuk</option>
              <option value="KELUAR">Kas/Bank Keluar</option>
              <option value="TRANSFER">Transfer Kas</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                if (e.target.value === "PENDING") setActiveFilterCard("PENDING");
                else if (!e.target.value) setActiveFilterCard("ALL");
              }}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="APPROVED">Disetujui (Approved)</option>
              <option value="PENDING">Menunggu Approval</option>
            </select>
          </div>

          {/* Rekening Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterRekening}
              onChange={(e) => setFilterRekening(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Semua Rekening Kas/Bank</option>
              {rekenings.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama} ({r.jenis})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 font-semibold text-on-surface">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Periode:</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: "today", label: "Hari Ini" },
                { id: "week", label: "Minggu Ini" },
                { id: "month", label: "Bulan Ini" },
                { id: "year", label: "Tahun Ini" },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id)}
                className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:ml-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-0.5 text-xs focus:outline-none"
            />
            <span className="text-on-surface-variant/60 text-xs">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2 py-0.5 text-xs focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const d = new Date();
              setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]);
              setEndDate(new Date().toISOString().split("T")[0]);
              setFilterTipe("");
              setFilterStatus("");
              setFilterRekening("");
              setActiveFilterCard("ALL");
              setSearch("");
            }}
            className="ml-auto text-xs text-primary hover:underline font-semibold"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-surface border border-outline-variant/40 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  No Transaksi
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  Rekening Kas/Bank
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  Tipe & Kategori
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  Akun Lawan COA
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">
                  Nominal
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  Dicatat Oleh
                </th>
                <th className="px-4 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Memuat data mutasi kas & bank pusat...</span>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                    <p className="font-semibold text-on-surface">Tidak ada mutasi yang cocok pada periode ini.</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Gunakan tombol Kas/Bank Masuk atau Kas/Bank Keluar untuk membukukan transaksi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => {
                  const isMasuk = tx.tipe === "MASUK";
                  const isPending = tx.status === "PENDING";
                  return (
                    <tr
                      key={tx.id}
                      className={cn(
                        "hover:bg-surface-container-high/20 transition-colors",
                        isPending && "bg-amber-500/5 font-medium"
                      )}
                    >
                      {/* No Transaksi */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                            {tx.nomor_transaksi}
                          </span>
                        </div>
                        {tx.keterangan && (
                          <p className="text-xs text-on-surface-variant truncate max-w-[200px] mt-0.5" title={tx.keterangan}>
                            {tx.keterangan}
                          </p>
                        )}
                      </td>

                      {/* Tanggal */}
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-on-surface-variant">
                        {formatDate(tx.tanggal)}
                      </td>

                      {/* Rekening */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {tx.jenis_rekening === "BANK" ? (
                            <Landmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          <span className="font-semibold text-on-surface text-xs">
                            {tx.nama_rekening}
                          </span>
                        </div>
                        <span className="block text-[11px] text-on-surface-variant font-mono">
                          {tx.kode_rekening}
                        </span>
                      </td>

                      {/* Tipe & Kategori */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                              isMasuk
                                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25"
                                : tx.tipe === "KELUAR"
                                ? "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/25"
                                : "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/25"
                            )}
                          >
                            {tx.tipe}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {tx.kategori || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Akun Lawan COA */}
                      <td className="px-4 py-2.5">
                        {tx.nama_akun_lawan ? (
                          <div className="text-xs">
                            <span className="font-mono text-primary font-semibold">
                              {tx.kode_akun_lawan}
                            </span>
                            <span className="text-on-surface-variant block truncate max-w-[220px]" title={tx.nama_akun_lawan}>
                              {tx.nama_akun_lawan}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">
                            Otomatis ({tx.kategori})
                          </span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="px-4 py-2.5 whitespace-nowrap text-right">
                        <span
                          className={cn(
                            "font-bold text-sm font-mono",
                            isMasuk
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-700 dark:text-rose-400"
                          )}
                        >
                          {isMasuk ? "+" : "-"} {formatCurrency(tx.nominal)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Butuh Approval</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                            <Check className="w-3 h-3" />
                            <span>Disetujui</span>
                          </span>
                        )}
                      </td>

                      {/* Dicatat Oleh */}
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-on-surface-variant">
                        {tx.created_by_nama || "Sistem"}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-2.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewDetailTx(tx)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition border border-outline-variant/30"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && can_update && (
                            <button
                              type="button"
                              onClick={() => setApprovingTx(tx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition hover:scale-102"
                              title="Persetujuan Direktur/Pimpinan"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
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
      </div>

      {/* MODAL FORM KAS MASUK / KELUAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface text-on-surface w-full max-w-xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className={cn(
                "p-4 px-5 flex items-center justify-between border-b",
                modalType === "MASUK"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-xl text-white shadow-2xs",
                    modalType === "MASUK" ? "bg-emerald-600" : "bg-rose-600"
                  )}
                >
                  {modalType === "MASUK" ? (
                    <ArrowDownCircle className="w-5 h-5" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">
                    {modalType === "MASUK" ? "Kas / Bank Masuk Pusat" : "Kas / Bank Keluar Pusat"}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {modalType === "MASUK"
                      ? "Pencatatan setoran modal investor, grosir DC, atau penambahan saldo rekening holding"
                      : "Pencatatan pembayaran supplier, setoran pajak, dividen, dan operasional holding"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-error/15 border border-error/25 text-error text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Rekening Selector */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Rekening Kas / Bank Pusat <span className="text-error">*</span>
                </label>
                <select
                  value={formRekening}
                  onChange={(e) => setFormRekening(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="" disabled>-- Pilih Rekening Kas / Bank --</option>
                  {rekenings.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nama} ({r.jenis}) — Saldo: {formatCurrency(r.saldo)}
                    </option>
                  ))}
                </select>

                {selectedRekeningObj && (
                  <div className="flex items-center justify-between text-xs mt-1.5 px-3 py-1.5 bg-surface-container rounded-xl text-on-surface-variant">
                    <span>Saldo Tersedia:</span>
                    <span className="font-bold text-on-surface font-mono">
                      {formatCurrency(selectedRekeningObj.saldo)}
                    </span>
                  </div>
                )}
              </div>

              {/* Nominal & Tanggal Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Nominal Transaksi (Rp) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={formNominal}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setFormNominal(val ? parseInt(val).toLocaleString("id-ID") : "");
                      }}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Tanggal Transaksi <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* High Nominal Approval Callout Banner */}
              {modalType === "KELUAR" && parsedFormNominal > APPROVAL_THRESHOLD && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold block">Persetujuan Pimpinan Diperlukan</span>
                    <span>
                      Nominal transaksi melebihi Rp 10.000.000. Status transaksi akan diset sebagai{" "}
                      <strong>PENDING</strong> dan saldo belum terpotong hingga disetujui oleh Direktur / Super Admin.
                    </span>
                  </div>
                </div>
              )}

              {/* Kategori Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Kategori Pengeluaran / Penerimaan <span className="text-error">*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => handleKategoriChange(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {(modalType === "KELUAR" ? KATEGORI_KELUAR_PUSAT : KATEGORI_MASUK_PUSAT).map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Akun Lawan COA Searchable Select with OPTGROUPS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Akun Lawan COA (Sesuai {modalType === "MASUK" ? "Kas Masuk" : "Kas Keluar"}) <span className="text-error">*</span>
                  </label>
                  <span className="text-[10px] text-primary font-semibold">
                    {modalType === "MASUK" ? "Sisi Kredit Jurnal" : "Sisi Debit Jurnal"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder={`Ketik untuk filter akun COA ${modalType === "MASUK" ? "masuk" : "keluar"}...`}
                    value={coaSearch}
                    onChange={(e) => setCoaSearch(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/60 text-on-surface rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={formCoa}
                    onChange={(e) => setFormCoa(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                  >
                    <option value="" disabled>-- Pilih Akun Lawan COA --</option>
                    {groupedCoaOptions.map((group, idx) => (
                      <optgroup
                        key={idx}
                        label={group.label}
                        className="font-bold text-primary font-sans bg-surface-container py-1"
                      >
                        {group.accounts.map((coa) => (
                          <option
                            key={coa.id}
                            value={coa.id}
                            className="font-mono text-on-surface bg-surface py-1"
                          >
                            {coa.kode_akun} - {coa.nama_akun}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Double-Entry Journal Preview Card */}
              {selectedCoaObj && (
                <div className="p-3 bg-surface-container/70 border border-outline-variant/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-on-surface-variant font-semibold">
                    <span className="flex items-center gap-1.5 text-primary">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Pratinjau Jurnal Akuntansi (Double-Entry Otomatis)</span>
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-mono font-bold">
                      Seimbang (Balance)
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {modalType === "MASUK" ? (
                      <>
                        {/* Line 1: Debit Kas/Bank */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                              DEBIT
                            </span>
                            <span className="font-medium text-on-surface">
                              {selectedRekeningObj ? selectedRekeningObj.nama : "Rekening Kas/Bank"}
                              <span className="text-[11px] text-on-surface-variant ml-1 font-mono">
                                ({selectedRekeningObj?.kode || "KAS"})
                              </span>
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(parsedFormNominal)}
                          </span>
                        </div>

                        {/* Line 2: Kredit Akun Lawan */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface-container-high/60 rounded-lg border border-outline-variant/30 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                              KREDIT
                            </span>
                            <span className="font-medium text-on-surface">
                              {selectedCoaObj.nama_akun}
                              <span className="text-[11px] text-primary ml-1 font-mono">
                                ({selectedCoaObj.kode_akun})
                              </span>
                            </span>
                          </div>
                          <span className="font-mono font-bold text-on-surface">
                            {formatCurrency(parsedFormNominal)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Line 1: Debit Akun Lawan (Beban / Utang / Aset) */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                              DEBIT
                            </span>
                            <span className="font-medium text-on-surface">
                              {selectedCoaObj.nama_akun}
                              <span className="text-[11px] text-primary ml-1 font-mono">
                                ({selectedCoaObj.kode_akun})
                              </span>
                            </span>
                          </div>
                          <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                            {formatCurrency(parsedFormNominal)}
                          </span>
                        </div>

                        {/* Line 2: Kredit Kas/Bank */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-surface-container-high/60 rounded-lg border border-outline-variant/30 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                              KREDIT
                            </span>
                            <span className="font-medium text-on-surface">
                              {selectedRekeningObj ? selectedRekeningObj.nama : "Rekening Kas/Bank"}
                              <span className="text-[11px] text-on-surface-variant ml-1 font-mono">
                                ({selectedRekeningObj?.kode || "KAS"})
                              </span>
                            </span>
                          </div>
                          <span className="font-mono font-bold text-on-surface">
                            {formatCurrency(parsedFormNominal)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[10px] text-on-surface-variant/80 italic pt-0.5">
                    *Ayat jurnal di atas otomatis dibukukan ke Buku Besar saat transaksi disimpan
                    {modalType === "KELUAR" && parsedFormNominal > APPROVAL_THRESHOLD
                      ? " (setelah disetujui pimpinan)."
                      : "."}
                  </p>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Keterangan / Uraian Transaksi
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pembayaran PO-2026-0812 PT Sumber Berkah, Pajak PPN Masa Oktober, dll."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Link / URL Bukti */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  No. Bukti Transfer / Dokumen Pendukung
                </label>
                <input
                  type="text"
                  placeholder="Nomor referensi bank / no bilyet giro / kwitansi"
                  value={formBukti}
                  onChange={(e) => setFormBukti(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition",
                    modalType === "MASUK"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? "Menyimpan..." : "Simpan & Bukukan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL TRANSAKSI */}
      {viewDetailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface text-on-surface w-full max-w-lg rounded-2xl border border-outline-variant shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Detail Transaksi Kas Pusat</h3>
                  <span className="text-xs text-primary font-mono font-semibold">
                    {viewDetailTx.nomor_transaksi}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailTx(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tanggal Transaksi:</span>
                <span className="font-semibold text-on-surface">{formatDate(viewDetailTx.tanggal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Rekening:</span>
                <span className="font-semibold text-on-surface">{viewDetailTx.nama_rekening} ({viewDetailTx.kode_rekening})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tipe & Kategori:</span>
                <span className="font-semibold text-on-surface">{viewDetailTx.tipe} — {viewDetailTx.kategori}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Akun Lawan COA:</span>
                <span className="font-mono text-primary font-semibold">
                  {viewDetailTx.kode_akun_lawan ? `${viewDetailTx.kode_akun_lawan} - ${viewDetailTx.nama_akun_lawan}` : `Standar (${viewDetailTx.kategori})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Status:</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full font-bold uppercase text-[10px]",
                  viewDetailTx.status === "APPROVED"
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                )}>
                  {viewDetailTx.status}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant font-semibold">Nominal:</span>
                <span className="font-bold text-base font-mono text-primary">
                  {formatCurrency(viewDetailTx.nominal)}
                </span>
              </div>
              {viewDetailTx.bukti && (
                <div className="flex justify-between border-t border-outline-variant/40 pt-2">
                  <span className="text-on-surface-variant">No. Bukti / Referensi:</span>
                  <span className="font-mono text-on-surface">{viewDetailTx.bukti}</span>
                </div>
              )}
              {viewDetailTx.keterangan && (
                <div className="border-t border-outline-variant/40 pt-2">
                  <span className="text-on-surface-variant block mb-1">Keterangan:</span>
                  <p className="text-on-surface bg-surface p-2 rounded-lg border border-outline-variant/30 text-xs">
                    {viewDetailTx.keterangan}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewDetailTx(null)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APPROVAL PUSAT */}
      {approvingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface text-on-surface w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">
                  Persetujuan Transaksi Kas Keluar
                </h3>
                <p className="text-xs text-on-surface-variant">Otoritas Pimpinan / Manajemen Pusat</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">No. Transaksi:</span>
                <span className="font-mono font-bold text-primary">{approvingTx.nomor_transaksi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tanggal:</span>
                <span className="text-on-surface font-semibold">{formatDate(approvingTx.tanggal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Rekening Kas/Bank:</span>
                <span className="font-semibold text-on-surface">{approvingTx.nama_rekening}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Kategori:</span>
                <span className="font-semibold text-on-surface">{approvingTx.kategori}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Akun Lawan COA:</span>
                <span className="font-semibold text-primary">{approvingTx.nama_akun_lawan || approvingTx.kategori}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/40 pt-2">
                <span className="text-on-surface-variant font-bold">Nominal Pengeluaran:</span>
                <span className="font-bold text-base font-mono text-rose-700 dark:text-rose-400">
                  {formatCurrency(approvingTx.nominal)}
                </span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              Dengan menyetujui, saldo rekening kas/bank akan <strong>terpotong secara otomatis</strong> dan ayat jurnal double-entry akan diterbitkan ke dalam pembukuan keuangan holding.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApprovingTx(null)}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Setujui Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
