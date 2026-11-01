"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Calendar,
  Users,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Info,
  Copy,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ListFilter,
  Zap,
  Sliders,
  Repeat,
  Check,
  X,
  Printer,
  CalendarDays,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Cabang {
  id_cabang: number;
  nama_cabang: string;
  kode_cabang: string;
}

interface Jabatan {
  id_jabatan: number;
  jabatan: string;
}

interface User {
  id: number;
  nama_user: string;
  kode_user: string;
  id_jabatan: number;
  id_cabang: number;
  jabatan?: string;
  nama_cabang?: string;
  foto?: string | null;
}

interface Shift {
  id: number;
  nama_shift: string;
  jam_masuk: string;
  jam_pulang: string;
  keterangan?: string | null;
}

interface Jadwal {
  id: number;
  user_id: number;
  nama_user: string;
  kode_user: string;
  foto?: string | null;
  id_cabang: number;
  nama_cabang: string;
  kode_cabang: string;
  id_jabatan: number;
  jabatan: string;
  id_shift: number | null;
  nama_shift: string | null;
  jam_masuk: string | null;
  jam_pulang: string | null;
  tanggal: string;
  status_hari: "KERJA" | "LIBUR_ROSTER" | "CUTI" | "HARI_LIBUR_NASIONAL";
  catatan: string | null;
  aktif: boolean;
}

interface JabatanConfig {
  id: number | null;
  id_jabatan: number;
  jabatan: string;
  tipe_kerja: "NON_SHIFT" | "SHIFT_ROTASI";
  default_id_shift: number | null;
  default_nama_shift: string | null;
  hari_kerja_aktif: string;
  keterangan: string | null;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
}

interface SwapRequest {
  id: number;
  id_jadwal_pengaju: number;
  user_pengaju: number;
  nama_pengaju: string;
  kode_pengaju: string;
  shift_pengaju: string;
  id_jadwal_pengganti: number;
  user_pengganti: number;
  nama_pengganti: string;
  kode_pengganti: string;
  shift_pengganti: string;
  tanggal_tukar: string;
  alasan: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewed_by: number | null;
  reviewed_at: string | null;
  catatan_reviewer: string | null;
  created_at: string;
}

const NAMA_HARI_SINGKAT = ["Ahd", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function JadwalKaryawanPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"matrix" | "config" | "swap">("matrix");

  // Core Data States
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [cabangs, setCabangs] = useState<Cabang[]>([]);
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<JabatanConfig[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [selectedJabatan, setSelectedJabatan] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Date States
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Toast / Feedback State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Quick Popover State on Cell Click
  const [quickCellPopover, setQuickCellPopover] = useState<{
    user: User;
    tanggal: string;
    currentJadwal: Jadwal | null;
    x: number;
    y: number;
  } | null>(null);

  // Modals
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<JabatanConfig | null>(null);

  // Form States
  const [autoGenForm, setAutoGenForm] = useState({
    bulan: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    id_cabang: "",
    id_jabatan: "",
    selectedShiftIds: [] as number[],
    pola: "ROTASI_HARIAN" as "ROTASI_HARIAN" | "ROTASI_MINGGUAN",
    autoDayOff: true,
    overwrite: false,
    submitting: false,
  });

  const [copyForm, setCopyForm] = useState({
    fromMonth: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    toMonth: `${today.getFullYear()}-${String(today.getMonth() + 2).padStart(2, "0")}`,
    id_cabang: "",
    id_jabatan: "",
    submitting: false,
  });

  const [addForm, setAddForm] = useState({
    user_id: "",
    id_cabang: "",
    id_jabatan: "",
    id_shift: "",
    tanggal: today.toISOString().split("T")[0],
    status_hari: "KERJA" as "KERJA" | "LIBUR_ROSTER",
    catatan: "",
    submitting: false,
  });

  const [editConfigForm, setEditConfigForm] = useState({
    tipe_kerja: "NON_SHIFT" as "NON_SHIFT" | "SHIFT_ROTASI",
    default_id_shift: "",
    hari_kerja_aktif: "1,2,3,4,5,6",
    keterangan: "",
    submitting: false,
  });

  const [swapForm, setSwapForm] = useState({
    user_pengaju: "",
    id_jadwal_pengaju: "",
    user_pengganti: "",
    id_jadwal_pengganti: "",
    tanggal_tukar: today.toISOString().split("T")[0],
    alasan: "",
    submitting: false,
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper: Month string YYYY-MM
  const monthString = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  }, [currentYear, currentMonth]);

  // Compute Days of Month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: { dateStr: string; dayNum: number; dayOfWeek: number; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      days.push({
        dateStr,
        dayNum: d,
        dayOfWeek,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentYear, currentMonth]);

  // 1. Fetch Initial Master Data
  const fetchMasterData = useCallback(async () => {
    try {
      const [cabRes, jabRes, shiftRes, usersRes] = await Promise.all([
        fetch("/api/cabang"),
        fetch("/api/master/jabatan"),
        fetch("/api/hrd/jam-kerja"),
        fetch("/api/hrd/users?limit=300"),
      ]);

      if (cabRes.ok) {
        const d = await cabRes.json();
        setCabangs(Array.isArray(d) ? d : d.data || []);
      }
      if (jabRes.ok) {
        const d = await jabRes.json();
        setJabatans(Array.isArray(d) ? d : d.data || []);
      }
      if (shiftRes.ok) {
        const d = await shiftRes.json();
        setShifts(Array.isArray(d) ? d : d.data || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.data || []);
      }
    } catch (e: any) {
      console.error("Gagal mengambil data master:", e);
    }
  }, []);

  // 2. Fetch Roster Jadwal
  const fetchJadwals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("bulan", monthString);
      if (selectedCabang) params.append("id_cabang", selectedCabang);
      if (selectedJabatan) params.append("id_jabatan", selectedJabatan);

      const res = await fetch(`/api/hrd/jadwal-karyawan?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setJadwals(json.data || []);
        }
      }
    } catch (e: any) {
      showToast("Gagal memuat jadwal karyawan: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [monthString, selectedCabang, selectedJabatan]);

  // 3. Fetch Jabatan Configs
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/hrd/jabatan-shift-config");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setConfigs(json.data || []);
        }
      }
    } catch (e: any) {
      console.error("Gagal memuat konfigurasi shift jabatan:", e);
    }
  }, []);

  // 4. Fetch Shift Swap Requests
  const fetchSwaps = useCallback(async () => {
    try {
      const res = await fetch(`/api/hrd/tukar-shift?bulan=${monthString}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSwapRequests(json.data || []);
        }
      }
    } catch (e: any) {
      console.error("Gagal memuat tukar shift:", e);
    }
  }, [monthString]);

  useEffect(() => {
    fetchMasterData();
    fetchConfigs();
  }, [fetchMasterData, fetchConfigs]);

  useEffect(() => {
    if (activeTab === "matrix") {
      fetchJadwals();
    } else if (activeTab === "config") {
      fetchConfigs();
    } else if (activeTab === "swap") {
      fetchSwaps();
    }
  }, [activeTab, fetchJadwals, fetchConfigs, fetchSwaps]);

  // Map Jadwals by key: `${user_id}_${tanggal}`
  const jadwalMap = useMemo(() => {
    const map = new Map<string, Jadwal>();
    for (const j of jadwals) {
      map.set(`${j.user_id}_${j.tanggal}`, j);
    }
    return map;
  }, [jadwals]);

  // Map Jabatan Config by id_jabatan
  const configMap = useMemo(() => {
    const map = new Map<number, JabatanConfig>();
    for (const c of configs) {
      map.set(c.id_jabatan, c);
    }
    return map;
  }, [configs]);

  // Filtered Users for the Matrix
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedCabang && String(u.id_cabang) !== selectedCabang) return false;
      if (selectedJabatan && String(u.id_jabatan) !== selectedJabatan) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = u.nama_user?.toLowerCase().includes(q);
        const matchKode = u.kode_user?.toLowerCase().includes(q);
        if (!matchName && !matchKode) return false;
      }
      return true;
    });
  }, [users, selectedCabang, selectedJabatan, searchQuery]);

  // Handle Quick Change Shift from Popover
  const handleQuickShiftChange = async (shiftId: number | null, statusHari: "KERJA" | "LIBUR_ROSTER" | "DELETE") => {
    if (!quickCellPopover) return;
    const { user, tanggal, currentJadwal } = quickCellPopover;
    setQuickCellPopover(null);

    try {
      if (statusHari === "DELETE") {
        if (currentJadwal) {
          const res = await fetch(`/api/hrd/jadwal-karyawan/${currentJadwal.id}`, { method: "DELETE" });
          const json = await res.json();
          if (res.ok && json.success) {
            setJadwals((prev) => prev.filter((j) => j.id !== currentJadwal.id));
            showToast("Jadwal dinonaktifkan", "info");
          }
        }
        return;
      }

      if (currentJadwal) {
        // Update
        const res = await fetch(`/api/hrd/jadwal-karyawan/${currentJadwal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_shift: shiftId,
            status_hari: statusHari,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          fetchJadwals();
          showToast("Shift berhasil diubah", "success");
        } else {
          showToast(json.error || "Gagal mengubah shift", "error");
        }
      } else {
        // Insert new
        const res = await fetch("/api/hrd/jadwal-karyawan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            id_cabang: user.id_cabang || 2,
            id_jabatan: user.id_jabatan,
            id_shift: shiftId,
            tanggal,
            status_hari: statusHari,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          fetchJadwals();
          showToast("Jadwal berhasil ditambahkan", "success");
        } else {
          showToast(json.error || "Gagal menyimpan jadwal", "error");
        }
      }
    } catch (e: any) {
      showToast("Error update jadwal: " + e.message, "error");
    }
  };

  // Submit Auto-Generate
  const handleRunAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoGenForm.id_cabang || autoGenForm.selectedShiftIds.length === 0) {
      showToast("Pilih cabang dan minimal 1 shift rotasi", "error");
      return;
    }

    const candidateUsers = users.filter((u) => {
      if (String(u.id_cabang) !== autoGenForm.id_cabang) return false;
      if (autoGenForm.id_jabatan && String(u.id_jabatan) !== autoGenForm.id_jabatan) return false;
      return true;
    });

    if (candidateUsers.length === 0) {
      showToast("Tidak ada karyawan yang sesuai filter cabang/jabatan", "error");
      return;
    }

    setAutoGenForm((p) => ({ ...p, submitting: true }));
    try {
      const userConfigs = candidateUsers.map((u, idx) => ({
        user_id: u.id,
        id_jabatan: u.id_jabatan,
        shift_awal_index: idx % autoGenForm.selectedShiftIds.length,
        hari_libur_mingguan: autoGenForm.autoDayOff ? idx % 7 : undefined,
      }));

      const res = await fetch("/api/hrd/jadwal-karyawan/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulan: autoGenForm.bulan,
          id_cabang: autoGenForm.id_cabang,
          id_jabatan: autoGenForm.id_jabatan || undefined,
          shift_ids: autoGenForm.selectedShiftIds,
          users: userConfigs,
          pola: autoGenForm.pola,
          overwrite: autoGenForm.overwrite,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || "Roster shift berhasil di-generate!", "success");
        setShowAutoModal(false);
        fetchJadwals();
      } else {
        showToast(json.error || "Gagal generate roster", "error");
      }
    } catch (e: any) {
      showToast("Error: " + e.message, "error");
    } finally {
      setAutoGenForm((p) => ({ ...p, submitting: false }));
    }
  };

  // Submit Copy Schedule
  const handleRunCopySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCopyForm((p) => ({ ...p, submitting: true }));
    try {
      const res = await fetch("/api/hrd/jadwal-karyawan/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromMonth: copyForm.fromMonth,
          toMonth: copyForm.toMonth,
          id_cabang: copyForm.id_cabang || undefined,
          id_jabatan: copyForm.id_jabatan || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || "Jadwal berhasil disalin!", "success");
        setShowCopyModal(false);
        fetchJadwals();
      } else {
        showToast(json.error || "Gagal menyalin jadwal", "error");
      }
    } catch (e: any) {
      showToast("Error copy: " + e.message, "error");
    } finally {
      setCopyForm((p) => ({ ...p, submitting: false }));
    }
  };

  // Submit Add Schedule Manual
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.user_id || !addForm.tanggal) {
      showToast("Pilih karyawan dan tanggal", "error");
      return;
    }

    setAddForm((p) => ({ ...p, submitting: true }));
    try {
      const selectedUser = users.find((u) => String(u.id) === addForm.user_id);
      const res = await fetch("/api/hrd/jadwal-karyawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: addForm.user_id,
          id_cabang: addForm.id_cabang || selectedUser?.id_cabang || 2,
          id_jabatan: addForm.id_jabatan || selectedUser?.id_jabatan || 7,
          id_shift: addForm.id_shift ? parseInt(addForm.id_shift) : null,
          tanggal: addForm.tanggal,
          status_hari: addForm.status_hari,
          catatan: addForm.catatan,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Jadwal berhasil ditambahkan!", "success");
        setShowAddModal(false);
        fetchJadwals();
      } else {
        showToast(json.error || "Gagal menambah jadwal", "error");
      }
    } catch (e: any) {
      showToast("Error: " + e.message, "error");
    } finally {
      setAddForm((p) => ({ ...p, submitting: false }));
    }
  };

  // Submit Edit Jabatan Config
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;

    setEditConfigForm((p) => ({ ...p, submitting: true }));
    try {
      const res = await fetch(`/api/hrd/jabatan-shift-config/${selectedConfig.id_jabatan}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe_kerja: editConfigForm.tipe_kerja,
          default_id_shift: editConfigForm.default_id_shift ? parseInt(editConfigForm.default_id_shift) : null,
          hari_kerja_aktif: editConfigForm.hari_kerja_aktif,
          keterangan: editConfigForm.keterangan,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Template shift untuk ${selectedConfig.jabatan} berhasil diperbarui!`, "success");
        setShowConfigModal(false);
        fetchConfigs();
      } else {
        showToast(json.error || "Gagal memperbarui konfigurasi", "error");
      }
    } catch (e: any) {
      showToast("Error: " + e.message, "error");
    } finally {
      setEditConfigForm((p) => ({ ...p, submitting: false }));
    }
  };

  // Review Swap Request (HRD Approve / Reject)
  const handleReviewSwap = async (id: number, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch(`/api/hrd/tukar-shift/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || `Permohonan berhasil di-${action.toLowerCase()}!`, "success");
        fetchSwaps();
        fetchJadwals();
      } else {
        showToast(json.error || "Gagal memproses permohonan", "error");
      }
    } catch (e: any) {
      showToast("Error: " + e.message, "error");
    }
  };

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200"
              : "bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-800 dark:text-blue-200"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Jadwal Shift Karyawan Global
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Penyusunan Roster Shift Terpusat Berdasarkan Jabatan & Cabang
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "matrix" && (
            <>
              <button
                onClick={() => setShowAutoModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition"
              >
                <Zap className="w-4 h-4" />
                <span>Auto-Generate Roster</span>
              </button>

              <button
                onClick={() => setShowCopyModal(true)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Roster Bulan Lalu</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-sm font-medium flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Input Manual</span>
              </button>

              <button
                onClick={() => window.print()}
                title="Cetak Roster"
                className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Printer className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (activeTab === "matrix") fetchJadwals();
              if (activeTab === "config") fetchConfigs();
              if (activeTab === "swap") fetchSwaps();
            }}
            title="Muat Ulang"
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "matrix"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Matrix Roster Bulanan</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-normal">
            {filteredUsers.length} Karyawan
          </span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "config"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Template Shift per Jabatan</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-normal">
            {configs.length} Jabatan
          </span>
        </button>

        <button
          onClick={() => setActiveTab("swap")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "swap"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Permohonan Tukar Shift</span>
          {swapRequests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
              {swapRequests.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MATRIX ROSTER GRID                                                  */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Controls Bar: Month Nav + Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Month Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-sm rounded-lg border border-emerald-200 dark:border-emerald-800/60 min-w-[150px] text-center">
                {NAMA_BULAN[currentMonth]} {currentYear}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Cabang Filter */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCabang}
                  onChange={(e) => setSelectedCabang(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Semua Cabang</option>
                  {cabangs.map((c) => (
                    <option key={c.id_cabang} value={c.id_cabang}>
                      {c.nama_cabang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jabatan Filter */}
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedJabatan}
                  onChange={(e) => setSelectedJabatan(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Semua Jabatan</option>
                  {jabatans.map((j) => (
                    <option key={j.id_jabatan} value={j.id_jabatan}>
                      {j.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-36 md:w-48"
                />
              </div>
            </div>

            {/* Shift Legend */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Pagi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Siang/Sore
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Malam
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-400 inline-block"></span> Libur (OFF)
              </span>
            </div>
          </div>

          {/* Spreadsheet Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full text-left border-collapse text-xs">
                {/* Header */}
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-20 backdrop-blur">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {/* Fixed Employee Column */}
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Karyawan / Jabatan
                    </th>

                    {/* Day Columns */}
                    {daysInMonth.map((day) => {
                      const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
                      return (
                        <th
                          key={day.dateStr}
                          className={`p-1.5 text-center min-w-[38px] border-l border-slate-200 dark:border-slate-800 ${
                            day.isToday
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold"
                              : isWeekend
                              ? "bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="text-[10px] uppercase font-medium">
                            {NAMA_HARI_SINGKAT[day.dayOfWeek]}
                          </div>
                          <div className="text-xs">{day.dayNum}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={daysInMonth.length + 1} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Memuat matrix roster shift...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth.length + 1} className="p-8 text-center text-slate-400">
                        Tidak ada karyawan yang sesuai filter
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const cfg = configMap.get(u.id_jabatan);
                      const isNonShift = cfg?.tipe_kerja === "NON_SHIFT";

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* Sticky Employee Name & Jabatan */}
                          <td className="p-2.5 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {u.nama_user ? u.nama_user.substring(0, 2) : "EM"}
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                                  {u.nama_user}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                  <span>{u.jabatan || "Karyawan"}</span>
                                  {isNonShift && (
                                    <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono">
                                      REG
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Date Cells */}
                          {daysInMonth.map((day) => {
                            const key = `${u.id}_${day.dateStr}`;
                            const jadwal = jadwalMap.get(key);
                            const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;

                            // Tentukan status tampilan shift
                            let badgeText = "-";
                            let badgeClass = "text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800";
                            let tooltipText = "Kosong (Klik untuk isi shift)";

                            if (jadwal) {
                              if (jadwal.status_hari === "LIBUR_ROSTER") {
                                badgeText = "OFF";
                                badgeClass = "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold";
                                tooltipText = "Libur Roster (Day-Off)";
                              } else if (jadwal.id_shift) {
                                const sName = (jadwal.nama_shift || "").toLowerCase();
                                if (sName.includes("pagi") || sName.includes("shift1") || sName.includes("shift 1")) {
                                  badgeText = "P";
                                  badgeClass = "bg-emerald-500 text-white font-bold shadow-xs";
                                } else if (sName.includes("siang") || sName.includes("sore") || sName.includes("shift2") || sName.includes("shift 2")) {
                                  badgeText = "S";
                                  badgeClass = "bg-amber-500 text-white font-bold shadow-xs";
                                } else if (sName.includes("malam") || sName.includes("shift3") || sName.includes("shift 3")) {
                                  badgeText = "M";
                                  badgeClass = "bg-blue-600 text-white font-bold shadow-xs";
                                } else {
                                  badgeText = jadwal.nama_shift ? jadwal.nama_shift.substring(0, 2).toUpperCase() : "SH";
                                  badgeClass = "bg-indigo-500 text-white font-bold shadow-xs";
                                }
                                tooltipText = `${jadwal.nama_shift} (${jadwal.jam_masuk || ""} - ${jadwal.jam_pulang || ""})`;
                              }
                            } else if (isNonShift) {
                              // Non-shift template default (misal Senin-Sabtu default reguler, Ahad libur)
                              if (day.dayOfWeek === 0) {
                                badgeText = "OFF";
                                badgeClass = "text-slate-400 dark:text-slate-600 opacity-60";
                                tooltipText = "Libur Mingguan Default";
                              } else {
                                badgeText = "REG";
                                badgeClass = "border border-dashed border-emerald-400/80 text-emerald-600 dark:text-emerald-400 font-semibold";
                                tooltipText = `Reguler Kantor Default (${cfg?.default_nama_shift || "Jam Normal"})`;
                              }
                            }

                            return (
                              <td
                                key={day.dateStr}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setQuickCellPopover({
                                    user: u,
                                    tanggal: day.dateStr,
                                    currentJadwal: jadwal || null,
                                    x: rect.left,
                                    y: rect.bottom + 4,
                                  });
                                }}
                                title={tooltipText}
                                className={`p-1 text-center cursor-pointer border-l border-slate-100 dark:border-slate-800/80 transition select-none ${
                                  day.isToday ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center text-[10px] transition transform hover:scale-110 ${badgeClass}`}
                                >
                                  {badgeText}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popover Quick Shift Picker */}
      {quickCellPopover && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-2 w-48 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: `${quickCellPopover.y}px`, left: `${Math.min(quickCellPopover.x, window.innerWidth - 200)}px` }}
        >
          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
            {quickCellPopover.user.nama_user} ({quickCellPopover.tanggal})
          </div>

          <div className="space-y-1">
            {shifts.map((s) => (
              <button
                key={s.id}
                onClick={() => handleQuickShiftChange(s.id, "KERJA")}
                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300"
              >
                <span>{s.nama_shift}</span>
                <span className="text-[10px] text-slate-400">{s.jam_masuk?.substring(0, 5)}</span>
              </button>
            ))}

            <button
              onClick={() => handleQuickShiftChange(null, "LIBUR_ROSTER")}
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium"
            >
              Set Libur Roster (OFF)
            </button>

            {quickCellPopover.currentJadwal && (
              <button
                onClick={() => handleQuickShiftChange(null, "DELETE")}
                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium"
              >
                Hapus Jadwal
              </button>
            )}
          </div>

          <button
            onClick={() => setQuickCellPopover(null)}
            className="mt-2 w-full text-center text-[10px] text-slate-400 hover:text-slate-600"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONFIGURASI SHIFT PER JABATAN                                       */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Default Pola Kerja per Jabatan
              </h2>
              <p className="text-xs text-slate-500">
                Tentukan apakah suatu jabatan bekerja dengan jam kerja tetap (Non-Shift) atau membutuhkan Roster Bergilir (Shift-Rotasi).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map((c) => {
              const isRotasi = c.tipe_kerja === "SHIFT_ROTASI";
              return (
                <div
                  key={c.id_jabatan}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {c.jabatan}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isRotasi
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {isRotasi ? "SHIFT ROTASI" : "NON-SHIFT (REGULER)"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Shift Default: </span>
                        {c.default_nama_shift ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {c.default_nama_shift} ({c.jam_masuk?.substring(0, 5)} - {c.jam_pulang?.substring(0, 5)})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Disesuaikan di Roster</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Hari Kerja: </span>
                        <span>{c.hari_kerja_aktif ? `Hari aktif: ${c.hari_kerja_aktif}` : "Senin - Sabtu"}</span>
                      </div>
                      {c.keterangan && <div className="text-[11px] text-slate-400 italic">{c.keterangan}</div>}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedConfig(c);
                      setEditConfigForm({
                        tipe_kerja: c.tipe_kerja,
                        default_id_shift: c.default_id_shift ? String(c.default_id_shift) : "",
                        hari_kerja_aktif: c.hari_kerja_aktif || "1,2,3,4,5,6",
                        keterangan: c.keterangan || "",
                        submitting: false,
                      });
                      setShowConfigModal(true);
                    }}
                    className="w-full py-1.5 px-3 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-center"
                  >
                    Ubah Konfigurasi
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKFLOW PERMOHONAN TUKAR SHIFT                                     */}
      {/* ========================================================================= */}
      {activeTab === "swap" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Permohonan Tukar Shift (Shift Swap)
              </h2>
              <p className="text-xs text-slate-500">
                Persetujuan terpusat oleh HRD Pusat. Begitu disetujui, jadwal kedua karyawan otomatis saling bertukar di Roster.
              </p>
            </div>
            <button
              onClick={() => setShowSwapModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Tukar Shift</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Karyawan Pengaju</th>
                  <th className="p-3">Karyawan Pengganti</th>
                  <th className="p-3">Alasan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi HRD Pusat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {swapRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada permohonan tukar shift pada bulan ini
                    </td>
                  </tr>
                ) : (
                  swapRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        {req.tanggal_tukar}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.nama_pengaju}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Shift: {req.shift_pengaju}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.nama_pengganti}
                        </div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400">
                          Shift: {req.shift_pengganti}
                        </div>
                      </td>
                      <td className="p-3 max-w-[200px] truncate text-slate-600 dark:text-slate-300">
                        {req.alasan}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {req.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewSwap(req.id, "APPROVE")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => handleReviewSwap(req.id, "REJECT")}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sudah diproses</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTO-GENERATE ROSTER BULANAN                                        */}
      {/* ========================================================================= */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Generator Roster Shift Bulanan</h3>
              </div>
              <button onClick={() => setShowAutoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunAutoGenerate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bulan Target (YYYY-MM)</label>
                <input
                  type="month"
                  required
                  value={autoGenForm.bulan}
                  onChange={(e) => setAutoGenForm((p) => ({ ...p, bulan: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Cabang Target</label>
                  <select
                    required
                    value={autoGenForm.id_cabang}
                    onChange={(e) => setAutoGenForm((p) => ({ ...p, id_cabang: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Pilih Cabang</option>
                    {cabangs.map((c) => (
                      <option key={c.id_cabang} value={c.id_cabang}>
                        {c.nama_cabang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Filter Jabatan (Opsional)</label>
                  <select
                    value={autoGenForm.id_jabatan}
                    onChange={(e) => setAutoGenForm((p) => ({ ...p, id_jabatan: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Semua Jabatan Ber-shift</option>
                    {jabatans.map((j) => (
                      <option key={j.id_jabatan} value={j.id_jabatan}>
                        {j.jabatan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Pilih Shift yang Dirotasikan
                </label>
                <div className="grid grid-cols-2 gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  {shifts.map((s) => {
                    const isChecked = autoGenForm.selectedShiftIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAutoGenForm((p) => ({ ...p, selectedShiftIds: [...p.selectedShiftIds, s.id] }));
                            } else {
                              setAutoGenForm((p) => ({
                                ...p,
                                selectedShiftIds: p.selectedShiftIds.filter((id) => id !== s.id),
                              }));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {s.nama_shift} ({s.jam_masuk?.substring(0, 5)} - {s.jam_pulang?.substring(0, 5)})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pola Rotasi</label>
                  <select
                    value={autoGenForm.pola}
                    onChange={(e) => setAutoGenForm((p) => ({ ...p, pola: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ROTASI_HARIAN">Harian Bergantian</option>
                    <option value="ROTASI_MINGGUAN">Mingguan Bergantian</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={autoGenForm.autoDayOff}
                      onChange={(e) => setAutoGenForm((p) => ({ ...p, autoDayOff: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Jatah Day-Off Bergilir (1 hari libur/minggu)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenForm.overwrite}
                    onChange={(e) => setAutoGenForm((p) => ({ ...p, overwrite: e.target.checked }))}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">
                    Timpa (Overwrite) jadwal yang sudah ada pada bulan tersebut
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAutoModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={autoGenForm.submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {autoGenForm.submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>Generate Roster Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SALIN JADWAL (COPY SCHEDULE)                                       */}
      {/* ========================================================================= */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Salin Roster Antar Bulan</h3>
              </div>
              <button onClick={() => setShowCopyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunCopySchedule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bulan Asal</label>
                  <input
                    type="month"
                    required
                    value={copyForm.fromMonth}
                    onChange={(e) => setCopyForm((p) => ({ ...p, fromMonth: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bulan Tujuan</label>
                  <input
                    type="month"
                    required
                    value={copyForm.toMonth}
                    onChange={(e) => setCopyForm((p) => ({ ...p, toMonth: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Filter Cabang (Opsional)</label>
                <select
                  value={copyForm.id_cabang}
                  onChange={(e) => setCopyForm((p) => ({ ...p, id_cabang: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Semua Cabang</option>
                  {cabangs.map((c) => (
                    <option key={c.id_cabang} value={c.id_cabang}>
                      {c.nama_cabang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={copyForm.submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {copyForm.submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UBAH KONFIGURASI JABATAN                                           */}
      {/* ========================================================================= */}
      {showConfigModal && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Konfigurasi Shift: {selectedConfig.jabatan}
                </h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tipe Jam Kerja</label>
                <select
                  value={editConfigForm.tipe_kerja}
                  onChange={(e) => setEditConfigForm((p) => ({ ...p, tipe_kerja: e.target.value as any }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="NON_SHIFT">NON-SHIFT (Jam Kerja Tetap Otomatis)</option>
                  <option value="SHIFT_ROTASI">SHIFT-ROTASI (Dikelola di Roster Kalender)</option>
                </select>
              </div>

              {editConfigForm.tipe_kerja === "NON_SHIFT" && (
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shift Jam Kerja Tetap</label>
                  <select
                    value={editConfigForm.default_id_shift}
                    onChange={(e) => setEditConfigForm((p) => ({ ...p, default_id_shift: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Pilih Shift Default</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_shift} ({s.jam_masuk?.substring(0, 5)} - {s.jam_pulang?.substring(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hari Kerja Aktif</label>
                <input
                  type="text"
                  placeholder="Contoh: 1,2,3,4,5,6 (1=Senin s/d 6=Sabtu)"
                  value={editConfigForm.hari_kerja_aktif}
                  onChange={(e) => setEditConfigForm((p) => ({ ...p, hari_kerja_aktif: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={editConfigForm.keterangan}
                  onChange={(e) => setEditConfigForm((p) => ({ ...p, keterangan: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editConfigForm.submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {editConfigForm.submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT JADWAL MANUAL                                                */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Tambah Jadwal Manual</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pilih Karyawan</label>
                <select
                  required
                  value={addForm.user_id}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const u = users.find((usr) => String(usr.id) === uId);
                    setAddForm((p) => ({
                      ...p,
                      user_id: uId,
                      id_cabang: u?.id_cabang ? String(u.id_cabang) : p.id_cabang,
                      id_jabatan: u?.id_jabatan ? String(u.id_jabatan) : p.id_jabatan,
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_user} ({u.jabatan || "Karyawan"}) - {u.nama_cabang || "Cabang"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={addForm.tanggal}
                    onChange={(e) => setAddForm((p) => ({ ...p, tanggal: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status Hari</label>
                  <select
                    value={addForm.status_hari}
                    onChange={(e) => setAddForm((p) => ({ ...p, status_hari: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="KERJA">Hari Kerja</option>
                    <option value="LIBUR_ROSTER">Libur Roster (Day-Off)</option>
                  </select>
                </div>
              </div>

              {addForm.status_hari === "KERJA" && (
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shift Kerja</label>
                  <select
                    required={addForm.status_hari === "KERJA"}
                    value={addForm.id_shift}
                    onChange={(e) => setAddForm((p) => ({ ...p, id_shift: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Pilih Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_shift} ({s.jam_masuk?.substring(0, 5)} - {s.jam_pulang?.substring(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Catatan Khusus</label>
                <input
                  type="text"
                  placeholder="Misal: Penugasan kasir utama toko"
                  value={addForm.catatan}
                  onChange={(e) => setAddForm((p) => ({ ...p, catatan: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addForm.submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {addForm.submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUKAN TUKAR SHIFT                                                 */}
      {/* ========================================================================= */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Form Pengajuan Tukar Shift</h3>
              </div>
              <button onClick={() => setShowSwapModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSwapForm((p) => ({ ...p, submitting: true }));
                try {
                  const res = await fetch("/api/hrd/tukar-shift", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(swapForm),
                  });
                  const json = await res.json();
                  if (res.ok && json.success) {
                    showToast(json.message || "Permohonan tukar shift berhasil diajukan!", "success");
                    setShowSwapModal(false);
                    fetchSwaps();
                  } else {
                    showToast(json.error || "Gagal mengajukan permohonan", "error");
                  }
                } catch (err: any) {
                  showToast("Error: " + err.message, "error");
                } finally {
                  setSwapForm((p) => ({ ...p, submitting: false }));
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tanggal Tukar Shift</label>
                <input
                  type="date"
                  required
                  value={swapForm.tanggal_tukar}
                  onChange={(e) => setSwapForm((p) => ({ ...p, tanggal_tukar: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Karyawan Pengaju (Yang Berhalangan)</label>
                <select
                  required
                  value={swapForm.user_pengaju}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const j = jadwals.find((jdw) => String(jdw.user_id) === uId && jdw.tanggal === swapForm.tanggal_tukar);
                    setSwapForm((p) => ({
                      ...p,
                      user_pengaju: uId,
                      id_jadwal_pengaju: j ? String(j.id) : "",
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Pilih Karyawan Pengaju</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_user} ({u.jabatan || "Karyawan"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Karyawan Pengganti</label>
                <select
                  required
                  value={swapForm.user_pengganti}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const j = jadwals.find((jdw) => String(jdw.user_id) === uId && jdw.tanggal === swapForm.tanggal_tukar);
                    setSwapForm((p) => ({
                      ...p,
                      user_pengganti: uId,
                      id_jadwal_pengganti: j ? String(j.id) : "",
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Pilih Karyawan Pengganti</option>
                  {users
                    .filter((u) => String(u.id) !== swapForm.user_pengaju)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama_user} ({u.jabatan || "Karyawan"})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Alasan Pertukaran Shift</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Keperluan keluarga mendesak / tugas pesantren luar kota"
                  value={swapForm.alasan}
                  onChange={(e) => setSwapForm((p) => ({ ...p, alasan: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={swapForm.submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {swapForm.submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                  <span>Kirim Permohonan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
