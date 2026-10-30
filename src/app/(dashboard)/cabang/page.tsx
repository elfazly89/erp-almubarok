"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  X,
  Store,
  Layers,
  Settings,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Eye,
  Printer,
  QrCode,
  CheckCircle2,
  XCircle,
  Handshake,
  Users,
  Coins,
  Percent,
  ShieldCheck,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";
import { formatCurrency, cn } from "@/lib/utils";

interface Cabang {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
  alamat: string;
  telepon: string | null;
  email: string | null;
  admin: number | null;
  nama_admin: string | null;
  latitude: string | null;
  longitude: string | null;
  data_kode: string | null;
  is_dc: boolean;
  jenis_cabang?: "INTERNAL" | "INVESTOR";
  nisbah_pengelola?: string | number | null;
  nisbah_investor?: string | number | null;
  total_modal_investor?: string | number | null;
  jumlah_investor?: number;
}

interface CabangInvestor {
  id_cabang_investor: number;
  id_cabang: number;
  nama_investor: string;
  telepon: string | null;
  email: string | null;
  nilai_investasi: string | number;
  porsi_kepemilikan: string | number;
  nama_bank: string | null;
  no_rekening: string | null;
  atas_nama_rekening: string | null;
  tanggal_bergabung: string | null;
  status: string;
  catatan: string | null;
}

interface DBUser {
  id: number;
  nama_user: string;
  kode_user: string;
}

export default function CabangManagementPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Cabang[]>([]);
  const [userList, setUserList] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [viewCabang, setViewCabang] = useState<Cabang | null>(null);
  const [editItem, setEditItem] = useState<Cabang | null>(null);

  // Form states
  const [formKode, setFormKode] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formTelepon, setFormTelepon] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAdmin, setFormAdmin] = useState("");
  const [formLatitude, setFormLatitude] = useState("");
  const [formLongitude, setFormLongitude] = useState("");
  const [formIsDc, setFormIsDc] = useState(false);
  const [formJenisCabang, setFormJenisCabang] = useState<"INTERNAL" | "INVESTOR">("INTERNAL");
  const [formNisbahPengelola, setFormNisbahPengelola] = useState("40");
  const [formNisbahInvestor, setFormNisbahInvestor] = useState("60");

  // Filter state
  const [filterJenis, setFilterJenis] = useState<"ALL" | "INTERNAL" | "INVESTOR" | "DC">("ALL");

  // Konsorsium Investor Modal States
  const [investorModalCabang, setInvestorModalCabang] = useState<Cabang | null>(null);
  const [investorList, setInvestorList] = useState<CabangInvestor[]>([]);
  const [investorLoading, setInvestorLoading] = useState(false);
  const [showAddInv, setShowAddInv] = useState(false);
  const [invEditId, setInvEditId] = useState<number | null>(null);
  const [invSaving, setInvSaving] = useState(false);
  const [invError, setInvError] = useState("");

  // Form states for investor
  const [formInvNama, setFormInvNama] = useState("");
  const [formInvTelepon, setFormInvTelepon] = useState("");
  const [formInvEmail, setFormInvEmail] = useState("");
  const [formInvNilai, setFormInvNilai] = useState("");
  const [formInvPorsi, setFormInvPorsi] = useState("");
  const [formInvBank, setFormInvBank] = useState("");
  const [formInvRekening, setFormInvRekening] = useState("");
  const [formInvAtasNama, setFormInvAtasNama] = useState("");
  const [formInvStatus, setFormInvStatus] = useState("AKTIF");
  const [formInvCatatan, setFormInvCatatan] = useState("");

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null; nama: string }>({
    show: false,
    id: null,
    nama: "",
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortField, setSortField] = useState<string>("kode_cabang");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleFilterCardClick = (jenis: "ALL" | "INTERNAL" | "INVESTOR" | "DC") => {
    if (filterJenis === jenis) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setFilterJenis(jenis);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const cabRes = await fetch("/api/cabang");
      const userRes = await fetch("/api/hrd/users?limit=100");

      if (cabRes.ok) setList(await cabRes.json());
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserList(userData.data || []);
      }
    } catch (e: any) {
      setErrorMsg("Gagal memuat data cabang dari server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (item?: Cabang) => {
    if (item) {
      setEditItem(item);
      setFormKode(item.kode_cabang);
      setFormNama(item.nama_cabang);
      setFormAlamat(item.alamat);
      setFormTelepon(item.telepon || "");
      setFormEmail(item.email || "");
      setFormAdmin(item.admin ? item.admin.toString() : "");
      setFormLatitude(item.latitude || "");
      setFormLongitude(item.longitude || "");
      setFormIsDc(item.is_dc ?? false);
      setFormJenisCabang(item.jenis_cabang || "INTERNAL");
      setFormNisbahPengelola(item.nisbah_pengelola ? String(item.nisbah_pengelola) : "40");
      setFormNisbahInvestor(item.nisbah_investor ? String(item.nisbah_investor) : "60");
    } else {
      setEditItem(null);
      setFormKode("");
      setFormNama("");
      setFormAlamat("");
      setFormTelepon("");
      setFormEmail("");
      setFormAdmin("");
      setFormLatitude("");
      setFormLongitude("");
      setFormIsDc(false);
      setFormJenisCabang("INTERNAL");
      setFormNisbahPengelola("40");
      setFormNisbahInvestor("60");
    }
    setErrorMsg("");
    setIsModalFullscreen(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formKode.trim() || !formNama.trim() || !formAlamat.trim()) {
      setErrorMsg("Kode, nama cabang, dan alamat wajib diisi");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        kode_cabang: formKode.trim(),
        nama_cabang: formNama.trim(),
        alamat: formAlamat.trim(),
        telepon: formTelepon || null,
        email: formEmail || null,
        admin: formAdmin ? parseInt(formAdmin) : null,
        latitude: formLatitude || null,
        longitude: formLongitude || null,
        is_dc: formIsDc,
        jenis_cabang: formJenisCabang,
        nisbah_pengelola: formJenisCabang === "INVESTOR" ? formNisbahPengelola : "0",
        nisbah_investor: formJenisCabang === "INVESTOR" ? formNisbahInvestor : "0",
      };

      let res;
      if (editItem) {
        res = await fetch(`/api/cabang/${editItem.id_cabang}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/cabang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Gagal menyimpan cabang");

      showToast(`Cabang berhasil ${editItem ? "diperbarui" : "ditambahkan"}.`, "success");
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Terjadi kesalahan koneksi");
    } finally {
      setSaving(false);
    }
  };

  // Investor management functions
  const fetchInvestors = async (cabangId: number) => {
    setInvestorLoading(true);
    try {
      const res = await fetch(`/api/cabang/${cabangId}/investor`);
      if (res.ok) {
        setInvestorList(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInvestorLoading(false);
    }
  };

  const openInvestorModal = (c: Cabang) => {
    setInvestorModalCabang(c);
    setShowAddInv(false);
    setInvEditId(null);
    setInvError("");
    resetInvForm();
    fetchInvestors(c.id_cabang);
  };

  const resetInvForm = () => {
    setFormInvNama("");
    setFormInvTelepon("");
    setFormInvEmail("");
    setFormInvNilai("");
    setFormInvPorsi("");
    setFormInvBank("");
    setFormInvRekening("");
    setFormInvAtasNama("");
    setFormInvStatus("AKTIF");
    setFormInvCatatan("");
  };

  const openEditInvestor = (inv: CabangInvestor) => {
    setInvEditId(inv.id_cabang_investor);
    setFormInvNama(inv.nama_investor);
    setFormInvTelepon(inv.telepon || "");
    setFormInvEmail(inv.email || "");
    setFormInvNilai(String(inv.nilai_investasi || ""));
    setFormInvPorsi(String(inv.porsi_kepemilikan || ""));
    setFormInvBank(inv.nama_bank || "");
    setFormInvRekening(inv.no_rekening || "");
    setFormInvAtasNama(inv.atas_nama_rekening || "");
    setFormInvStatus(inv.status || "AKTIF");
    setFormInvCatatan(inv.catatan || "");
    setShowAddInv(true);
  };

  const handleSaveInvestor = async () => {
    if (!investorModalCabang) return;
    if (!formInvNama.trim()) {
      setInvError("Nama investor wajib diisi");
      return;
    }
    const nilaiInv = parseFloat(formInvNilai) || 0;
    const porsiInv = parseFloat(formInvPorsi) || 0;
    if (nilaiInv <= 0) {
      setInvError("Nilai investasi modal harus lebih dari 0");
      return;
    }

    setInvSaving(true);
    setInvError("");
    try {
      const payload = {
        nama_investor: formInvNama.trim(),
        telepon: formInvTelepon || null,
        email: formInvEmail || null,
        nilai_investasi: nilaiInv,
        porsi_kepemilikan: porsiInv,
        nama_bank: formInvBank || null,
        no_rekening: formInvRekening || null,
        atas_nama_rekening: formInvAtasNama || null,
        status: formInvStatus,
        catatan: formInvCatatan || null,
      };

      let res;
      if (invEditId) {
        res = await fetch(`/api/cabang-investor/${invEditId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/cabang/${investorModalCabang.id_cabang}/investor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan investor");

      showToast(`Investor berhasil ${invEditId ? "diperbarui" : "ditambahkan"}.`, "success");
      setShowAddInv(false);
      setInvEditId(null);
      resetInvForm();
      fetchInvestors(investorModalCabang.id_cabang);
      fetchData();
    } catch (e: any) {
      setInvError(e.message || "Terjadi kesalahan");
    } finally {
      setInvSaving(false);
    }
  };

  const handleDeleteInvestor = async (idInv: number) => {
    if (!confirm("Hapus investor ini dari konsorsium cabang?")) return;
    try {
      const res = await fetch(`/api/cabang-investor/${idInv}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus investor");
      showToast("Investor berhasil dihapus.", "success");
      if (investorModalCabang) {
        fetchInvestors(investorModalCabang.id_cabang);
      }
      fetchData();
    } catch (e: any) {
      showToast(e.message || "Gagal menghapus", "error");
    }
  };

  const handleDelete = (id: number) => {
    const cabangItem = list.find((c) => c.id_cabang === id);
    if (cabangItem) {
      setDeleteConfirm({
        show: true,
        id,
        nama: cabangItem.nama_cabang,
      });
    }
  };

  const confirmDelete = async (id: number) => {
    setDeleteConfirm({ show: false, id: null, nama: "" });
    try {
      const res = await fetch(`/api/cabang/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Gagal menghapus cabang");
      showToast("Cabang berhasil dihapus.", "success");
      fetchData();
    } catch (e: any) {
      showToast(e.message || "Gagal menghapus cabang", "error");
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("print-area-cabang");
    if (!printArea) return;

    const tempContainer = document.createElement("div");
    tempContainer.id = "temp-print-container";

    const clone = printArea.cloneNode(true) as HTMLElement;
    clone.id = "temp-print-content";
    clone.classList.remove("hidden");

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    document.body.classList.add("printing-active");

    window.print();

    document.body.classList.remove("printing-active");
    document.body.removeChild(tempContainer);
  };

  // Filter list
  const filteredList = list.filter((item) => {
    const s = search.toLowerCase();
    const matchSearch =
      item.kode_cabang.toLowerCase().includes(s) ||
      item.nama_cabang.toLowerCase().includes(s) ||
      item.alamat.toLowerCase().includes(s) ||
      (item.data_kode || "").toLowerCase().includes(s);

    if (!matchSearch) return false;

    if (filterJenis === "INTERNAL") return item.jenis_cabang !== "INVESTOR" && !item.is_dc;
    if (filterJenis === "INVESTOR") return item.jenis_cabang === "INVESTOR";
    if (filterJenis === "DC") return item.is_dc;
    return true;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any = a[sortField as keyof Cabang] ?? "";
    let bVal: any = b[sortField as keyof Cabang] ?? "";

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
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden text-on-background">
      <style dangerouslySetInnerHTML={{__html: `
        #temp-print-container {
          display: none;
        }
        @media print {
          @page {
            margin: 0;
          }
          body.printing-active > :not(#temp-print-container) {
            display: none !important;
          }
          body.printing-active {
            background: white !important;
            color: black !important;
          }
          #temp-print-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          #temp-print-content {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Pengaturan Cabang
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {can_create && (
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 shadow-sm shadow-primary-container/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Cabang
            </button>
          )}
        </div>
      </div>

      {/* 4 Kartu Filter & Sortir Interaktif */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {/* Card 1: Semua Cabang */}
        <button
          type="button"
          onClick={() => handleFilterCardClick("ALL")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            filterJenis === "ALL"
              ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter semua cabang. Klik lagi untuk membalik arah sortir (A-Z / Z-A)."
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                filterJenis === "ALL"
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Semua Cabang</span>
                {filterJenis === "ALL" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded font-mono">
                    {sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {sortOrder === "asc" ? "A-Z" : "Z-A"}
                  </span>
                )}
              </div>
              <strong className="text-base font-bold text-primary block mt-0.5 font-mono">
                {list.length} <span className="text-xs font-medium text-on-surface-variant font-sans">Outlet</span>
              </strong>
            </div>
          </div>
        </button>

        {/* Card 2: Cabang Internal */}
        <button
          type="button"
          onClick={() => handleFilterCardClick("INTERNAL")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            filterJenis === "INTERNAL"
              ? "bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter cabang internal. Klik lagi untuk membalik arah sortir (A-Z / Z-A)."
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                filterJenis === "INTERNAL"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              )}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Cabang Internal</span>
                {filterJenis === "INTERNAL" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                    {sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {sortOrder === "asc" ? "A-Z" : "Z-A"}
                  </span>
                )}
              </div>
              <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                {list.filter((c) => c.jenis_cabang !== "INVESTOR" && !c.is_dc).length}{" "}
                <span className="text-xs font-medium text-on-surface-variant font-sans">Outlet</span>
              </strong>
            </div>
          </div>
        </button>

        {/* Card 3: Cabang Investor */}
        <button
          type="button"
          onClick={() => handleFilterCardClick("INVESTOR")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            filterJenis === "INVESTOR"
              ? "bg-amber-500/15 border-amber-500 shadow-sm ring-1 ring-amber-500/40"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter cabang investor. Klik lagi untuk membalik arah sortir (A-Z / Z-A)."
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                filterJenis === "INVESTOR"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              )}
            >
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Cabang Investor</span>
                {filterJenis === "INVESTOR" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                    {sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {sortOrder === "asc" ? "A-Z" : "Z-A"}
                  </span>
                )}
              </div>
              <strong className="text-base font-bold text-amber-600 dark:text-amber-400 block mt-0.5 font-mono">
                {list.filter((c) => c.jenis_cabang === "INVESTOR").length}{" "}
                <span className="text-xs font-medium text-on-surface-variant font-sans">Outlet</span>
              </strong>
            </div>
          </div>
        </button>

        {/* Card 4: Pusat Distribusi (DC) */}
        <button
          type="button"
          onClick={() => handleFilterCardClick("DC")}
          className={cn(
            "p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between shadow-xs",
            filterJenis === "DC"
              ? "bg-secondary/15 border-secondary shadow-sm ring-1 ring-secondary/40"
              : "bg-surface border-outline-variant/40 hover:bg-surface-container-high/40 hover:border-outline-variant"
          )}
          title="Klik untuk memfilter pusat distribusi DC. Klik lagi untuk membalik arah sortir (A-Z / Z-A)."
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                filterJenis === "DC"
                  ? "bg-secondary text-white border-secondary"
                  : "bg-secondary/10 text-secondary border-secondary/20"
              )}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Pusat Distribusi (DC)</span>
                {filterJenis === "DC" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-secondary bg-secondary/20 px-1.5 py-0.5 rounded font-mono">
                    {sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {sortOrder === "asc" ? "A-Z" : "Z-A"}
                  </span>
                )}
              </div>
              <strong className="text-base font-bold text-secondary block mt-0.5 font-mono">
                {list.filter((c) => c.is_dc).length}{" "}
                <span className="text-xs font-medium text-on-surface-variant font-sans">Outlet</span>
              </strong>
            </div>
          </div>
        </button>
      </div>

      {/* Cabang Data Grid / Table */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat daftar cabang...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-36 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("kode_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kode Cabang {renderSortIndicator("kode_cabang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-48 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Cabang {renderSortIndicator("nama_cabang")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("alamat")}
                  >
                    <div className="flex items-center gap-1.5">
                      Alamat Lengkap {renderSortIndicator("alamat")}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-40">
                    Koordinat Absensi
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-40 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("telepon")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kontak Cabang {renderSortIndicator("telepon")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-40 cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_admin")}
                  >
                    <div className="flex items-center gap-1.5">
                      Administrator {renderSortIndicator("nama_admin")}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-on-surface-variant">
                      Tidak ada cabang yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((item) => (
                    <tr key={item.id_cabang} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                          {item.kode_cabang}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        {item.jenis_cabang === "INVESTOR" ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-xs"
                              title={`Cabang Investor (Nisbah: ${item.nisbah_pengelola || 0}% / ${item.nisbah_investor || 0}%)`}
                            >
                              <Handshake className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{item.nama_cabang}</span>
                              {item.is_dc && (
                                <span className="text-[9px] bg-secondary/20 text-secondary border border-secondary/30 px-1 py-0.2 rounded font-bold uppercase shrink-0">
                                  DC
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shadow-xs"
                              title="Cabang Internal (Modal 100% Al-Mubarok)"
                            >
                              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{item.nama_cabang}</span>
                              {item.is_dc && (
                                <span className="text-[9px] bg-secondary/20 text-secondary border border-secondary/30 px-1 py-0.2 rounded font-bold uppercase shrink-0">
                                  DC
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant max-w-xs truncate text-xs" title={item.alamat}>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {item.alamat}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs">
                        {item.latitude && item.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                          >
                            <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                            {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-on-surface-variant/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-on-surface-variant text-xs space-y-1">
                        {item.telepon && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-secondary" />
                            <span>{item.telepon}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-secondary" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {!item.telepon && !item.email && <span className="text-on-surface-variant/40">—</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        {item.nama_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                            <User className="w-3 h-3" />
                            {item.nama_admin}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-xs">— Belum Ditunjuk —</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.jenis_cabang === "INVESTOR" && (
                            <button
                              onClick={() => openInvestorModal(item)}
                              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 rounded-lg transition-colors cursor-pointer"
                              title="Kelola Konsorsium Investor"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewCabang(item)}
                            className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors cursor-pointer"
                            title="Detail cabang"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {can_update && (
                            <button
                              onClick={() => openModal(item)}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                              title="Ubah data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button
                              onClick={() => handleDelete(item.id_cabang)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
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
      </div>

      {/* CRUD INPUT DIALOG MODAL */}
      {showModal && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-200",
            isModalFullscreen ? "bg-background p-0" : "bg-black/50 p-3 sm:p-6"
          )}
        >
          <div
            className={cn(
              "bg-surface border border-outline-variant/60 flex flex-col overflow-hidden shadow-2xl transition-all duration-200",
              isModalFullscreen
                ? "w-screen h-screen rounded-none border-none"
                : "w-full max-w-3xl max-h-[92vh] rounded-2xl"
            )}
          >
            {/* Header (Sticky) */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-on-surface">
                    {editItem ? "Edit Data Cabang" : "Tambah Cabang Baru"}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {editItem ? `Perbarui informasi cabang: ${editItem.nama_cabang}` : "Daftarkan unit outlet atau pusat distribusi baru"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen(!isModalFullscreen)}
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                  title={isModalFullscreen ? "Kecilkan Tampilan" : "Tampilan Layar Penuh"}
                >
                  {isModalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMsg && (
                <div className="bg-error/15 border border-error/25 text-error text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-error" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: IDENTITAS UTAMA */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-outline-variant/30 text-primary">
                  <Store className="w-3.5 h-3.5" /> Identitas & Kode Outlet
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Kode Cabang <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formKode}
                      onChange={(e) => setFormKode(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      placeholder="Contoh: CBG-0001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Nama Cabang <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Nama Outlet / Cabang"
                      required
                    />
                  </div>
                </div>

                {editItem && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Data Kode QR (Absensi - Auto-Generated)
                    </label>
                    <input
                      type="text"
                      value={editItem.data_kode || "—"}
                      disabled
                      className="w-full bg-surface-container border border-outline-variant/60 text-on-surface-variant/80 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed font-mono"
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: LOKASI & KONTAK */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-outline-variant/30 text-primary">
                  <MapPin className="w-3.5 h-3.5" /> Lokasi & Kontak Operasional
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Alamat Lengkap <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formAlamat}
                    onChange={(e) => setFormAlamat(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    placeholder="Alamat Kantor / Outlet Cabang..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nomor Telepon</label>
                    <input
                      type="text"
                      value={formTelepon}
                      onChange={(e) => setFormTelepon(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      placeholder="Contoh: 082312345678"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Alamat Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="cabang@almubarok.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Titik Latitude (Absensi Radius)
                    </label>
                    <input
                      type="text"
                      value={formLatitude}
                      onChange={(e) => setFormLatitude(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      placeholder="Contoh: -8.123456"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Titik Longitude (Absensi Radius)
                    </label>
                    <input
                      type="text"
                      value={formLongitude}
                      onChange={(e) => setFormLongitude(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      placeholder="Contoh: 113.123456"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: KEPEMILIKAN & SKEMA INVESTASI */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-outline-variant/30 text-primary">
                  <Handshake className="w-3.5 h-3.5" /> Model Kepemilikan & Finansial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormJenisCabang("INTERNAL")}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer",
                      formJenisCabang === "INTERNAL"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-sm"
                        : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">Cabang Internal</p>
                      <p className="text-[11px] font-normal opacity-80 mt-0.5">Modal 100% milik Al-Mubarok</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormJenisCabang("INVESTOR")}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer",
                      formJenisCabang === "INVESTOR"
                        ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-sm"
                        : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Handshake className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">Cabang Investor</p>
                      <p className="text-[11px] font-normal opacity-80 mt-0.5">Didanai pihak ketiga / konsorsium</p>
                    </div>
                  </button>
                </div>

                {/* Nisbah Input If Investor */}
                {formJenisCabang === "INVESTOR" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <Percent className="w-4 h-4" />
                      <span>Rasio Nisbah Bagi Hasil Laba Bersih Toko</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1">
                          Nisbah Pengelola (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formNisbahPengelola}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormNisbahPengelola(val);
                              const num = parseFloat(val);
                              if (!isNaN(num) && num <= 100) {
                                setFormNisbahInvestor(String(100 - num));
                              }
                            }}
                            className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono font-bold"
                            placeholder="40"
                          />
                          <span className="absolute right-4 top-2.5 text-sm text-on-surface-variant/60 font-mono font-bold">%</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Bagian hak Al-Mubarok</span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1">
                          Nisbah Konsorsium Investor (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formNisbahInvestor}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormNisbahInvestor(val);
                              const num = parseFloat(val);
                              if (!isNaN(num) && num <= 100) {
                                setFormNisbahPengelola(String(100 - num));
                              }
                            }}
                            className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono font-bold"
                            placeholder="60"
                          />
                          <span className="absolute right-4 top-2.5 text-sm text-on-surface-variant/60 font-mono font-bold">%</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Bagian total hak investor</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: ADMINISTRATOR & STATUS DC */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-outline-variant/30 text-primary">
                  <User className="w-3.5 h-3.5" /> Personel & Konfigurasi Tambahan
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Penanggung Jawab / Administrator Cabang
                  </label>
                  <select
                    value={formAdmin}
                    onChange={(e) => setFormAdmin(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="" className="bg-surface-container text-on-surface-variant">-- Belum Ditunjuk --</option>
                    {userList.map((user) => (
                      <option key={user.id} value={user.id} className="bg-surface-container text-on-surface">
                        {user.nama_user} ({user.kode_user})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 select-none">
                  <input
                    type="checkbox"
                    id="is_dc_checkbox"
                    checked={formIsDc}
                    onChange={(e) => setFormIsDc(e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary/45 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="is_dc_checkbox" className="text-xs font-semibold text-on-surface cursor-pointer">
                    Bertindak sebagai Distribution Center (DC / Gudang Pusat Pasokan)
                  </label>
                </div>
              </div>
            </div>

            {/* Footer (Sticky) */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex items-center justify-end gap-3 bg-surface-container-high/60 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-primary hover:bg-primary-container disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
              >
                {saving ? "Menyimpan..." : editItem ? "Simpan Perubahan" : "Tambah Cabang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW & PRINT QR MODAL */}
      {viewCabang && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div>
                <h2 className="font-bold text-on-surface text-lg">Detail Cabang</h2>
                <p className="text-on-surface-variant/60 text-xs mt-0.5">Informasi lengkap dan QR Code absensi</p>
              </div>
              <button 
                onClick={() => setViewCabang(null)} 
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Printed area wrapper */}
              <div id="print-area-cabang" className="hidden">
                <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-3xl text-center text-slate-800 w-[380px] max-w-full">
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">{viewCabang.nama_cabang}</h2>
                  <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                    {viewCabang.alamat}
                  </p>

                  {/* QR Code visualization */}
                  <div className="my-6 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(viewCabang.data_kode || "")}`}
                      alt={`QR Code ${viewCabang.nama_cabang}`}
                      className="w-48 h-48"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium max-w-xs mt-1 italic">
                    Posisikan kode di dalam area scanner absensi untuk masuk atau pulang.
                  </p>
                </div>
              </div>

              {/* General Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-surface-container/35 p-4 rounded-xl border border-outline-variant/25">
                <div className="space-y-1 col-span-2">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Alamat Lengkap</span>
                  <span className="text-on-surface font-medium block">{viewCabang.alamat}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Telepon</span>
                  <span className="text-on-surface font-medium block">{viewCabang.telepon || "—"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Email</span>
                  <span className="text-on-surface font-medium block truncate" title={viewCabang.email || ""}>{viewCabang.email || "—"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Administrator</span>
                  <span className="text-on-surface font-medium block">{viewCabang.nama_admin || "— Belum Ditunjuk —"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Koordinat Absensi</span>
                  {viewCabang.latitude && viewCabang.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${viewCabang.latitude},${viewCabang.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono font-semibold block"
                    >
                      {parseFloat(viewCabang.latitude).toFixed(4)}, {parseFloat(viewCabang.longitude).toFixed(4)}
                    </a>
                  ) : (
                    <span className="text-on-surface-variant/50 block font-mono">— Belum Diset —</span>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-on-surface-variant/60 font-semibold block uppercase tracking-wider text-[10px]">Data Kode QR (Absensi)</span>
                  <span className="text-on-surface font-medium block font-mono bg-surface-container px-2.5 py-1 rounded border border-outline-variant/20 max-w-max select-all">
                    {viewCabang.data_kode || "—"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-low text-xs no-print">
              <button 
                onClick={() => setViewCabang(null)} 
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-3 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={handlePrint} 
                className="flex-1 bg-primary hover:bg-primary/95 text-on-primary py-3 rounded-xl font-bold shadow-lg shadow-primary/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KONSORSIUM MULTI-INVESTOR MANAGEMENT MODAL */}
      {investorModalCabang && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-on-surface text-base">Konsorsium Investor</h2>
                    <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                      {investorModalCabang.kode_cabang}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    {investorModalCabang.nama_cabang} • Nisbah: <strong className="text-on-surface">{investorModalCabang.nisbah_pengelola || 0}% Pengelola</strong> / <strong className="text-amber-600 dark:text-amber-400">{investorModalCabang.nisbah_investor || 0}% Investor</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInvestorModalCabang(null)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-surface-container-low border border-outline-variant/30 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Total Modal Disetor</span>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatCurrency(investorList.reduce((acc, x) => acc + Number(x.nilai_investasi || 0), 0))}
                  </p>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/30 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Total Porsi Kepemilikan</span>
                  {(() => {
                    const totalPorsi = investorList.reduce((acc, x) => acc + Number(x.porsi_kepemilikan || 0), 0);
                    return (
                      <p className={cn("text-base font-bold mt-0.5", Math.abs(totalPorsi - 100) < 0.01 ? "text-emerald-600" : "text-amber-500")}>
                        {totalPorsi}% {Math.abs(totalPorsi - 100) >= 0.01 && <span className="text-[10px] font-normal text-on-surface-variant">(Target: 100%)</span>}
                      </p>
                    );
                  })()}
                </div>

                <div className="bg-surface-container-low border border-outline-variant/30 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Investor Terdaftar</span>
                  <p className="text-base font-bold text-primary mt-0.5">
                    {investorList.length} Orang / Entitas
                  </p>
                </div>
              </div>

              {/* Action Bar inside Modal */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Daftar Pemodal
                </h3>
                <button
                  onClick={() => {
                    if (showAddInv) {
                      setShowAddInv(false);
                      setInvEditId(null);
                      resetInvForm();
                    } else {
                      setInvEditId(null);
                      resetInvForm();
                      setShowAddInv(true);
                    }
                  }}
                  className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddInv ? "Batal Tambah" : "Tambah Investor"}
                </button>
              </div>

              {/* Collapsible Form Tambah/Edit Investor */}
              {showAddInv && (
                <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <span className="text-xs font-bold text-on-surface">
                      {invEditId ? "Edit Data Pemodal" : "Daftarkan Pemodal Baru"}
                    </span>
                    <button
                      onClick={() => {
                        setShowAddInv(false);
                        setInvEditId(null);
                        resetInvForm();
                      }}
                      className="text-on-surface-variant text-xs hover:text-on-surface cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>

                  {invError && (
                    <div className="bg-error/15 border border-error/30 text-error text-xs px-3 py-2 rounded-lg">
                      {invError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Nama Investor *</label>
                      <input
                        type="text"
                        value={formInvNama}
                        onChange={(e) => setFormInvNama(e.target.value)}
                        placeholder="Contoh: H. Ahmad Subarjo"
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Nomor Telepon/WA</label>
                      <input
                        type="text"
                        value={formInvTelepon}
                        onChange={(e) => setFormInvTelepon(e.target.value)}
                        placeholder="0812..."
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Surel / Email</label>
                      <input
                        type="email"
                        value={formInvEmail}
                        onChange={(e) => setFormInvEmail(e.target.value)}
                        placeholder="investor@domain.com"
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Nilai Investasi Modal (Rp) *</label>
                      <input
                        type="number"
                        min="0"
                        value={formInvNilai}
                        onChange={(e) => setFormInvNilai(e.target.value)}
                        placeholder="Contoh: 100000000"
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Porsi Kepemilikan (%) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formInvPorsi}
                          onChange={(e) => setFormInvPorsi(e.target.value)}
                          placeholder="Contoh: 50"
                          className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold"
                        />
                        <span className="absolute right-3 top-2 text-xs text-on-surface-variant/60">%</span>
                      </div>
                      <span className="text-[9px] text-on-surface-variant/70 mt-0.5 block">Persentase dari total kuota investor cabang</span>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Nama Bank Pencairan</label>
                      <input
                        type="text"
                        value={formInvBank}
                        onChange={(e) => setFormInvBank(e.target.value)}
                        placeholder="BSI / BCA / Mandiri"
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Nomor Rekening</label>
                      <input
                        type="text"
                        value={formInvRekening}
                        onChange={(e) => setFormInvRekening(e.target.value)}
                        placeholder="7123456789"
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Atas Nama Rekening</label>
                      <input
                        type="text"
                        value={formInvAtasNama}
                        onChange={(e) => setFormInvAtasNama(e.target.value)}
                        placeholder="Nama pemilik buku tabungan"
                        className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveInvestor}
                      disabled={invSaving}
                      className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      {invSaving ? "Menyimpan..." : invEditId ? "Perbarui Investor" : "Simpan Investor"}
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Investors */}
              <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                {investorLoading ? (
                  <div className="py-10 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Memuat daftar investor...
                  </div>
                ) : investorList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-on-surface-variant/70">
                    Belum ada pemodal terdaftar untuk cabang ini. Klik tombol <strong>Tambah Investor</strong> di atas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant uppercase font-semibold">
                          <th className="px-4 py-2.5">Investor & Kontak</th>
                          <th className="px-4 py-2.5">Nilai Modal</th>
                          <th className="px-4 py-2.5">Porsi (%)</th>
                          <th className="px-4 py-2.5">Rekening Bank</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {investorList.map((inv) => (
                          <tr key={inv.id_cabang_investor} className="hover:bg-surface-container/30 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-on-surface">
                              <p className="font-bold">{inv.nama_investor}</p>
                              {(inv.telepon || inv.email) && (
                                <p className="text-[10px] text-on-surface-variant mt-0.5">
                                  {inv.telepon} {inv.email ? `• ${inv.email}` : ""}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-amber-700 dark:text-amber-300">
                              {formatCurrency(Number(inv.nilai_investasi || 0))}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-on-surface">
                              {inv.porsi_kepemilikan}%
                            </td>
                            <td className="px-4 py-2.5 text-on-surface-variant text-[11px]">
                              {inv.nama_bank ? (
                                <div>
                                  <p className="font-semibold text-on-surface">{inv.nama_bank} - <span className="font-mono">{inv.no_rekening}</span></p>
                                  <p className="text-[10px] text-on-surface-variant/70">a.n. {inv.atas_nama_rekening || "—"}</p>
                                </div>
                              ) : (
                                <span className="opacity-50">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                inv.status === "AKTIF"
                                  ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                                  : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
                              )}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditInvestor(inv)}
                                  className="p-1 hover:bg-primary/10 text-primary rounded transition-colors cursor-pointer"
                                  title="Edit Investor"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvestor(inv.id_cabang_investor)}
                                  className="p-1 hover:bg-error/10 text-error rounded transition-colors cursor-pointer"
                                  title="Hapus Investor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-outline-variant/30 flex items-center justify-end bg-surface-container-low shrink-0">
              <button
                onClick={() => setInvestorModalCabang(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (UX Polish) */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl animate-in slide-in-from-top-5 duration-200 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500 backdrop-blur-md" 
            : "bg-error/10 border-error/25 text-error backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Custom Delete Confirmation Modal (UX Polish & safe DELETE checks) */}
      {deleteConfirm.show && deleteConfirm.id !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-on-surface text-sm">Hapus Cabang?</h3>
                <p className="text-[11px] text-on-surface-variant">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            
            <p className="text-xs text-on-surface-variant">
              Apakah Anda yakin ingin menghapus cabang <strong className="text-on-surface">{deleteConfirm.nama}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null, nama: "" })}
                className="bg-surface hover:bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.id !== null) {
                    confirmDelete(deleteConfirm.id);
                  }
                }}
                className="bg-error hover:bg-red-600 text-on-error px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
