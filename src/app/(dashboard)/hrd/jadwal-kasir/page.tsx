"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Zap
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Cabang {
  id_cabang: number;
  nama_cabang: string;
  kode_cabang: string;
}

interface User {
  id: number;
  nama_user: string;
  kode_user: string;
  id_jabatan: number;
}

interface Shift {
  id: number;
  nama_shift: string;
  jam_masuk: string;
  jam_pulang: string;
}

interface Jadwal {
  id: number;
  id_cabang: number;
  nama_cabang: string;
  kode_cabang: string;
  id_kasir: number;
  nama_kasir: string;
  kode_kasir: string;
  id_shift: number;
  nama_shift: string;
  jam_masuk: string;
  jam_pulang: string;
  tanggal: string;
  catatan: string | null;
  aktif: boolean;
}

const DAYS_OF_WEEK = [
  { label: "Ahad", value: 0 },
  { label: "Senin", value: 1 },
  { label: "Selasa", value: 2 },
  { label: "Rabu", value: 3 },
  { label: "Kamis", value: 4 },
  { label: "Jumat", value: 5 },
  { label: "Sabtu", value: 6 }
];

export default function JadwalKasirPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();

  // State Data
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [cabangs, setCabangs] = useState<Cabang[]>([]);
  const [kasirs, setKasirs] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCabang, setSelectedCabang] = useState<string>("");
  const [selectedKasir, setSelectedKasir] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar");
  const [searchQuery, setSearchQuery] = useState("");

  // Date States (Calendar Month)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);

  // Form Add State
  const [formCabang, setFormCabang] = useState("");
  const [formKasir, setFormKasir] = useState("");
  const [formShift, setFormShift] = useState("");
  const [formMode, setFormMode] = useState<"single" | "batch">("single");
  const [formTanggal, setFormTanggal] = useState("");
  const [formTanggalMulai, setFormTanggalMulai] = useState("");
  const [formTanggalSelesai, setFormTanggalSelesai] = useState("");
  const [formHariSelected, setFormHariSelected] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [formCatatan, setFormCatatan] = useState("");

  // Form Edit State
  const [editCabang, setEditCabang] = useState("");
  const [editKasir, setEditKasir] = useState("");
  const [editShift, setEditShift] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [editCatatan, setEditCatatan] = useState("");
  const [editAktif, setEditAktif] = useState(true);

  // Form Copy State
  const [copyFromMonth, setCopyFromMonth] = useState("");
  const [copyToMonth, setCopyToMonth] = useState("");

  // Auto Generate State
  const [showAutoGenModal, setShowAutoGenModal] = useState(false);
  const [autoGenBulan, setAutoGenBulan] = useState("");
  const [autoGenCabang, setAutoGenCabang] = useState("");
  const [autoGenShiftPagi, setAutoGenShiftPagi] = useState("");
  const [autoGenShiftSore, setAutoGenShiftSore] = useState("");
  const [autoGenOverwrite, setAutoGenOverwrite] = useState(true);
  // Per-kasir configuration: id_kasir → shift_awal ("pagi"|"sore")
  interface KasirAutoConfig { id_kasir: string; shift_awal: "pagi" | "sore"; selected: boolean; nama: string; kode: string; }
  const [autoGenKasirs, setAutoGenKasirs] = useState<KasirAutoConfig[]>([]);
  const [autoGenResult, setAutoGenResult] = useState<null | { insertedCount: number; skippedCount: number; totalKasir: number; daysInMonth: number }>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jadwalIdToDelete, setJadwalIdToDelete] = useState<number | null>(null);

  // Feedback State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Fetch Master Data
  const fetchMasters = useCallback(async () => {
    try {
      const [cabangRes, userRes, shiftRes] = await Promise.all([
        fetch("/api/cabang"),
        fetch("/api/hrd/users?id_jabatan=7&limit=200"),
        fetch("/api/hrd/jam-kerja")
      ]);

      if (cabangRes.ok) {
        const cData = await cabangRes.json();
        setCabangs(cData);
      }
      if (userRes.ok) {
        const uData = await userRes.json();
        setKasirs(uData.data || []);
      }
      if (shiftRes.ok) {
        const sData = await shiftRes.json();
        setShifts(sData);
      }
    } catch (err) {
      console.error("Error loading master data:", err);
      showToast("Gagal memuat beberapa data master pendukung", "error");
    }
  }, [showToast]);

  // Fetch Schedule Data for selected month
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentYear;
      const month = String(currentMonth + 1).padStart(2, "0");
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, currentMonth + 1, 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

      let url = `/api/hrd/kasir-jadwal?startDate=${startDate}&endDate=${endDate}`;
      if (selectedCabang) url += `&id_cabang=${selectedCabang}`;
      if (selectedKasir) url += `&id_kasir=${selectedKasir}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setJadwals(data.data);
        } else {
          showToast(data.error || "Gagal mengambil jadwal", "error");
        }
      }
    } catch (err) {
      showToast("Gagal menyambung ke server", "error");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, selectedCabang, selectedKasir, showToast]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Date helper calculations for Calendar Month Grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Batch dates generator
  const getDatesInRange = (startStr: string, endStr: string, selectedDays: number[]) => {
    const dates: string[] = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (current <= final) {
      const dayOfWeek = current.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const d = String(current.getDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${d}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // CRUD Handlers
  const handleSaveAdd = async () => {
    if (!formCabang || !formKasir || !formShift) {
      showToast("Mohon isi Cabang, Kasir, dan Shift", "error");
      return;
    }

    setSaving(true);
    try {
      let payload = [];

      if (formMode === "single") {
        if (!formTanggal) {
          showToast("Pilih tanggal jadwal", "error");
          setSaving(false);
          return;
        }
        payload.push({
          id_cabang: formCabang,
          id_kasir: formKasir,
          id_shift: formShift,
          tanggal: formTanggal,
          catatan: formCatatan,
        });
      } else {
        if (!formTanggalMulai || !formTanggalSelesai) {
          showToast("Pilih tanggal mulai & selesai", "error");
          setSaving(false);
          return;
        }
        if (formHariSelected.length === 0) {
          showToast("Pilih minimal satu hari dalam seminggu", "error");
          setSaving(false);
          return;
        }

        const dates = getDatesInRange(formTanggalMulai, formTanggalSelesai, formHariSelected);
        if (dates.length === 0) {
          showToast("Tidak ada tanggal yang cocok di range tersebut dengan hari yang dipilih", "error");
          setSaving(false);
          return;
        }

        payload = dates.map(date => ({
          id_cabang: formCabang,
          id_kasir: formKasir,
          id_shift: formShift,
          tanggal: date,
          catatan: formCatatan,
        }));
      }

      const res = await fetch("/api/hrd/kasir-jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast(`Berhasil menyimpan ${payload.length} jadwal kasir!`, "success");
        setShowAddModal(false);
        setFormTanggal("");
        setFormTanggalMulai("");
        setFormTanggalSelesai("");
        setFormCatatan("");
        setFormMode("single");
        setFormHariSelected([1, 2, 3, 4, 5]);
        fetchSchedules();
      } else {
        showToast(resJson.error || "Gagal menyimpan jadwal", "error");
      }
    } catch (e) {
      showToast("Error saat menghubungi server", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (item: Jadwal) => {
    setSelectedJadwal(item);
    setEditCabang(String(item.id_cabang));
    setEditKasir(String(item.id_kasir));
    setEditShift(String(item.id_shift));
    setEditTanggal(item.tanggal);
    setEditCatatan(item.catatan || "");
    setEditAktif(item.aktif);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedJadwal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hrd/kasir-jadwal/${selectedJadwal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cabang: editCabang,
          id_kasir: editKasir,
          id_shift: editShift,
          tanggal: editTanggal,
          catatan: editCatatan,
          aktif: editAktif
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast("Jadwal kasir berhasil diperbarui!", "success");
        setShowEditModal(false);
        fetchSchedules();
      } else {
        showToast(resJson.error || "Gagal memperbarui jadwal", "error");
      }
    } catch (e) {
      showToast("Error saat menghubungi server", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setJadwalIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (jadwalIdToDelete === null) return;
    try {
      const res = await fetch(`/api/hrd/kasir-jadwal/${jadwalIdToDelete}`, { method: "DELETE" });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast("Jadwal kasir berhasil dihapus", "success");
        fetchSchedules();
      } else {
        showToast(resJson.error || "Gagal menghapus jadwal", "error");
      }
    } catch (e) {
      showToast("Error saat menghubungi server", "error");
    } finally {
      setShowDeleteConfirm(false);
      setJadwalIdToDelete(null);
    }
  };

  const handleCopySchedule = async () => {
    if (!copyFromMonth || !copyToMonth) {
      showToast("Mohon pilih bulan asal dan tujuan", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hrd/kasir-jadwal/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromMonth: copyFromMonth,
          toMonth: copyToMonth
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Salin jadwal sukses! ${data.copiedCount} berhasil disalin, ${data.skippedCount} dilewati (konflik: ${data.conflictsCount})`, "success");
        setShowCopyModal(false);
        fetchSchedules();
      } else {
        showToast(data.error || "Gagal menyalin jadwal", "error");
      }
    } catch (e) {
      showToast("Error saat menyalin jadwal", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAutoGen = () => {
    const ym = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    setAutoGenBulan(ym);
    if (cabangs.length > 0) setAutoGenCabang(String(cabangs[0].id_cabang));

    // Auto-detect pagi/sore shifts from master
    const pagiShift = shifts.find(s => s.nama_shift.toLowerCase().includes("pagi"));
    const soreShift = shifts.find(s =>
      s.nama_shift.toLowerCase().includes("sore") ||
      s.nama_shift.toLowerCase().includes("siang")
    );
    if (pagiShift) setAutoGenShiftPagi(String(pagiShift.id));
    if (soreShift) setAutoGenShiftSore(String(soreShift.id));
    if (!pagiShift && shifts.length >= 1) setAutoGenShiftPagi(String(shifts[0].id));
    if (!soreShift && shifts.length >= 2) setAutoGenShiftSore(String(shifts[1].id));

    // Initialize kasir config: all selected, alternating start
    const configs = kasirs.map((k, i) => ({
      id_kasir: String(k.id),
      shift_awal: (i % 2 === 0 ? "pagi" : "sore") as "pagi" | "sore",
      selected: true,
      nama: k.nama_user,
      kode: k.kode_user,
    }));
    setAutoGenKasirs(configs);
    setAutoGenOverwrite(true);
    setAutoGenResult(null);
    setShowAutoGenModal(true);
  };

  const handleAutoGenerate = async () => {
    const selectedKasirs = autoGenKasirs.filter(k => k.selected);
    if (!autoGenBulan || !autoGenCabang || !autoGenShiftPagi || !autoGenShiftSore) {
      showToast("Lengkapi bulan, cabang, dan kedua shift", "error");
      return;
    }
    if (selectedKasirs.length === 0) {
      showToast("Pilih minimal satu kasir", "error");
      return;
    }
    setSaving(true);
    setAutoGenResult(null);
    try {
      const res = await fetch("/api/hrd/kasir-jadwal/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulan: autoGenBulan,
          id_cabang: autoGenCabang,
          id_shift_pagi: autoGenShiftPagi,
          id_shift_sore: autoGenShiftSore,
          overwrite: autoGenOverwrite,
          kasirs: selectedKasirs.map(k => ({ id_kasir: k.id_kasir, shift_awal: k.shift_awal })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAutoGenResult({ insertedCount: data.insertedCount, skippedCount: data.skippedCount, totalKasir: data.totalKasir, daysInMonth: data.daysInMonth });
        showToast(`Jadwal otomatis berhasil dibuat: ${data.insertedCount} entri untuk ${data.totalKasir} kasir`, "success");
        fetchSchedules();
      } else {
        showToast(data.error || "Gagal membuat jadwal otomatis", "error");
      }
    } catch (e) {
      showToast("Error menghubungi server", "error");
    } finally {
      setSaving(false);
    }
  };

  // Grid Cell Day render generator
  const renderCalendarCells = () => {
    const cells = [];
    const year = currentYear;
    const month = currentMonth;

    // Previous Month's Filler Days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;

      cells.push(
        <div key={`prev-${day}`} className="min-h-[110px] bg-surface-container-low/30 border border-outline-variant/10 p-2 text-on-surface-variant/40 select-none">
          <span className="text-xs font-semibold">{day}</span>
        </div>
      );
    }

    // Current Month's Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const daySchedules = jadwals.filter(j => j.tanggal === dateString);
      const isDayToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

      cells.push(
        <div
          key={`day-${day}`}
          className={`min-h-[115px] border border-outline-variant/20 p-2 transition-all flex flex-col group relative ${
            isDayToday ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-surface hover:bg-surface-container-lowest"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
              isDayToday ? "bg-primary text-on-primary font-extrabold" : "text-on-surface"
            }`}>
              {day}
            </span>
            {can_create && (
              <button
                onClick={() => {
                  setFormTanggal(dateString);
                  setFormMode("single");
                  if (cabangs.length > 0) setFormCabang(String(cabangs[0].id_cabang));
                  if (kasirs.length > 0) setFormKasir(String(kasirs[0].id));
                  if (shifts.length > 0) setFormShift(String(shifts[0].id));
                  setFormCatatan("");
                  setShowAddModal(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-primary hover:bg-primary/10 rounded transition-all cursor-pointer"
                title="Tambah jadwal hari ini"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
            {daySchedules.map((jadwal) => {
              const shiftStyle = jadwal.nama_shift.toLowerCase().includes("pagi")
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20"
                : jadwal.nama_shift.toLowerCase().includes("siang") || jadwal.nama_shift.toLowerCase().includes("sore")
                ? "bg-amber-500/10 text-amber-600 border-amber-500/25 hover:bg-amber-500/20"
                : "bg-indigo-500/10 text-indigo-600 border-indigo-500/25 hover:bg-indigo-500/20";

              return (
                <div
                  key={jadwal.id}
                  onClick={() => can_update && handleOpenEdit(jadwal)}
                  className={`text-[10px] px-1.5 py-1 rounded border leading-tight flex items-center justify-between cursor-pointer transition-colors font-medium truncate ${shiftStyle} ${
                    !jadwal.aktif ? "opacity-50 line-through" : ""
                  }`}
                  title={`${jadwal.nama_kasir} (${jadwal.nama_shift}) - Cabang: ${jadwal.nama_cabang}`}
                >
                  <span className="truncate flex-1 pr-1 font-semibold">{jadwal.nama_kasir}</span>
                  <span className="text-[8px] opacity-75 font-mono px-1 bg-surface/50 rounded">{jadwal.kode_cabang}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Next Month's Filler Days
    const totalCells = cells.length;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;

    for (let day = 1; day <= remainingCells; day++) {
      cells.push(
        <div key={`next-${day}`} className="min-h-[110px] bg-surface-container-low/30 border border-outline-variant/10 p-2 text-on-surface-variant/40 select-none">
          <span className="text-xs font-semibold">{day}</span>
        </div>
      );
    }

    return cells;
  };

  const filteredListJadwal = jadwals.filter((j) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      j.nama_kasir.toLowerCase().includes(query) ||
      j.kode_kasir.toLowerCase().includes(query) ||
      j.nama_shift.toLowerCase().includes(query) ||
      j.nama_cabang.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === "success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-error/10 text-error border-error/20"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-error" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-background flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" /> Jadwal Shift Kasir
          </h1>
          <p className="text-on-background/70 text-sm mt-1">Perencanaan dan penugasan kasir bulanan per cabang</p>
        </div>

        <div className="flex items-center gap-2">
          {can_create && (
            <>
              <button
                onClick={() => {
                  setCopyFromMonth(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`);
                  const targetM = currentMonth === 11 ? 1 : currentMonth + 2;
                  const targetY = currentMonth === 11 ? currentYear + 1 : currentYear;
                  setCopyToMonth(`${targetY}-${String(targetM).padStart(2, "0")}`);
                  setShowCopyModal(true);
                }}
                className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Salin Jadwal
              </button>

              <button
                onClick={handleOpenAutoGen}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-on-secondary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Auto Generate
              </button>

              <button
                onClick={() => {
                  if (cabangs.length > 0) setFormCabang(String(cabangs[0].id_cabang));
                  if (kasirs.length > 0) setFormKasir(String(kasirs[0].id));
                  if (shifts.length > 0) setFormShift(String(shifts[0].id));
                  setFormTanggal("");
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buat Jadwal
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-outline-variant/40 hover:bg-surface-container-high rounded-xl text-on-surface cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-on-surface min-w-[150px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-outline-variant/40 hover:bg-surface-container-high rounded-xl text-on-surface cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 border border-outline-variant/45 rounded-xl px-3 py-2 bg-surface-container-low">
              <Building2 className="w-4 h-4 text-on-surface-variant/70" />
              <select
                value={selectedCabang}
                onChange={(e) => setSelectedCabang(e.target.value)}
                className="bg-transparent text-xs text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="">Semua Cabang</option>
                {cabangs.map((c) => (
                  <option key={c.id_cabang} value={c.id_cabang}>
                    {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 border border-outline-variant/45 rounded-xl px-3 py-2 bg-surface-container-low">
              <Users className="w-4 h-4 text-on-surface-variant/70" />
              <select
                value={selectedKasir}
                onChange={(e) => setSelectedKasir(e.target.value)}
                className="bg-transparent text-xs text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="">Semua Kasir</option>
                {kasirs.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_user}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-surface-container-high p-0.5 rounded-xl flex border border-outline-variant/30">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "calendar" ? "bg-surface text-primary shadow" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Kalender
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "list" ? "bg-surface text-primary shadow" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" /> Daftar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant bg-surface border border-outline-variant/20 rounded-2xl shadow-sm">
          <RefreshCw className="w-7 h-7 animate-spin mr-3 text-primary" /> Memuat Jadwal Kasir...
        </div>
      ) : activeTab === "calendar" ? (
        <div className="bg-surface border border-outline-variant/35 rounded-2xl overflow-hidden shadow-md">
          <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-low text-center py-3 font-semibold text-xs text-on-surface-variant">
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div className="text-secondary/90">Sabtu</div>
            <div className="text-error/85">Ahad</div>
          </div>

          <div className="grid grid-cols-7 bg-outline-variant/10 gap-[1px]">
            {renderCalendarCells()}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/25 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Cari kasir, shift atau cabang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/80"
              />
            </div>
            <div className="text-xs text-on-surface-variant font-medium">
              Menampilkan {filteredListJadwal.length} baris jadwal
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Cabang</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Shift</th>
                  <th className="p-4">Catatan</th>
                  <th className="p-4">Status</th>
                  {can_update && <th className="p-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface/90">
                {filteredListJadwal.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant/70 font-semibold">
                      Belum ada jadwal yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredListJadwal.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 font-mono font-bold">{item.tanggal}</td>
                      <td className="p-4">{item.nama_cabang}</td>
                      <td className="p-4 font-semibold">{item.nama_kasir}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-surface-container-high font-semibold">
                          {item.nama_shift} ({item.jam_masuk?.slice(0, 5) ?? "--:--"} - {item.jam_pulang?.slice(0, 5) ?? "--:--"})
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{item.catatan || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.aktif
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                            : "bg-error/10 text-error border-error/25"
                        }`}>
                          {item.aktif ? "Aktif" : "Non-Aktif"}
                        </span>
                      </td>
                      {can_update && (
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {can_delete && (
                              <button
                                onClick={() => handleDeleteClick(item.id)}
                                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-bold text-base text-on-surface flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Buat Jadwal Kasir Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Cabang Penugasan</label>
                  <select
                    value={formCabang}
                    onChange={(e) => setFormCabang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
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
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nama Kasir</label>
                  <select
                    value={formKasir}
                    onChange={(e) => setFormKasir(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                  >
                    <option value="">Pilih Kasir</option>
                    {kasirs.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_user} ({k.kode_user})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Pilih Shift Kerja</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  <option value="">Pilih Shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_shift} ({s.jam_masuk?.slice(0, 5) ?? "--:--"} - {s.jam_pulang?.slice(0, 5) ?? "--:--"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Model Penjadwalan</label>
                <div className="flex bg-surface-container-high p-0.5 rounded-xl border border-outline-variant/30 w-max">
                  <button
                    type="button"
                    onClick={() => setFormMode("single")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formMode === "single" ? "bg-surface text-primary shadow" : "text-on-surface-variant"
                    }`}
                  >
                    Satu Hari Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode("batch")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formMode === "batch" ? "bg-surface text-primary shadow" : "text-on-surface-variant"
                    }`}
                  >
                    Berulang Bulanan (Batch)
                  </button>
                </div>
              </div>

              {formMode === "single" ? (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Tugas</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-4 border border-outline-variant/20 p-4 rounded-2xl bg-surface-container-lowest">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={formTanggalMulai}
                        onChange={(e) => setFormTanggalMulai(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={formTanggalSelesai}
                        onChange={(e) => setFormTanggalSelesai(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Hari Aktif</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = formHariSelected.includes(day.value);
                        return (
                          <button
                            type="button"
                            key={day.value}
                            onClick={() => {
                              if (isSelected) {
                                setFormHariSelected(formHariSelected.filter(d => d !== day.value));
                              } else {
                                setFormHariSelected([...formHariSelected, day.value]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/10 text-primary border-primary/30 font-bold"
                                : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Keterangan opsional..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdd}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedJadwal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-bold text-base text-on-surface">Edit Detail Jadwal</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Cabang Penugasan</label>
                <select
                  value={editCabang}
                  onChange={(e) => setEditCabang(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  {cabangs.map((c) => (
                    <option key={c.id_cabang} value={c.id_cabang}>
                      {c.nama_cabang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Kasir</label>
                <select
                  value={editKasir}
                  onChange={(e) => setEditKasir(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  {kasirs.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_user}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Shift</label>
                <select
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_shift}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal</label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Catatan</label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="editAktif"
                  checked={editAktif}
                  onChange={(e) => setEditAktif(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <label htmlFor="editAktif" className="text-xs font-semibold text-on-surface cursor-pointer select-none">
                  Jadwal Aktif / Berlaku
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-bold text-base text-on-surface flex items-center gap-2">
                <Copy className="w-5 h-5 text-primary" /> Salin Jadwal Bulanan
              </h2>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-on-surface-variant leading-relaxed">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[11px]">
                    Fitur ini akan menduplikasi semua penugasan kasir yang aktif dari <strong>Bulan Asal</strong> ke tanggal yang sama di <strong>Bulan Tujuan</strong>. Data konflik (jika kasir sudah memiliki jadwal aktif di tanggal tujuan) akan dilewati secara otomatis.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Bulan Asal (Sumber)</label>
                  <input
                    type="month"
                    value={copyFromMonth}
                    onChange={(e) => setCopyFromMonth(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Bulan Tujuan (Hasil Salin)</label>
                  <input
                    type="month"
                    value={copyToMonth}
                    onChange={(e) => setCopyToMonth(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCopySchedule}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {saving ? "Menyalin..." : "Mulai Salin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AUTO GENERATE MODAL ==================== */}
      {showAutoGenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-base text-on-surface flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary" /> Auto Generate Jadwal Rotasi Pagi/Sore
              </h2>
              <button onClick={() => setShowAutoGenModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl cursor-pointer">&times;</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">

              {/* Info Banner */}
              <div className="bg-secondary/5 p-3 rounded-xl border border-secondary/15 flex gap-2">
                <Info className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Sistem akan membuat jadwal rotasi <strong>Pagi → Sore → Pagi → Sore...</strong> secara otomatis untuk setiap kasir selama satu bulan penuh. Setiap kasir dapat dikonfigurasi shift awalnya secara terpisah.
                </p>
              </div>

              {/* Bulan & Cabang */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface-variant mb-1">Bulan Target</label>
                  <input
                    type="month"
                    value={autoGenBulan}
                    onChange={e => setAutoGenBulan(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 focus:outline-none focus:border-primary/80 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface-variant mb-1">Cabang</label>
                  <select
                    value={autoGenCabang}
                    onChange={e => setAutoGenCabang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3 py-2 focus:outline-none focus:border-primary/80 cursor-pointer"
                  >
                    <option value="">Pilih Cabang</option>
                    {cabangs.map(c => (
                      <option key={c.id_cabang} value={c.id_cabang}>{c.nama_cabang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shift Pagi & Sore */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface-variant mb-1">Shift PAGI (dari Master)</label>
                  <select
                    value={autoGenShiftPagi}
                    onChange={e => setAutoGenShiftPagi(e.target.value)}
                    className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="">Pilih Shift Pagi</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0, 5) ?? "--:--"}-{s.jam_pulang?.slice(0, 5) ?? "--:--"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-on-surface-variant mb-1">Shift SORE (dari Master)</label>
                  <select
                    value={autoGenShiftSore}
                    onChange={e => setAutoGenShiftSore(e.target.value)}
                    className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="">Pilih Shift Sore</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk?.slice(0, 5) ?? "--:--"}-{s.jam_pulang?.slice(0, 5) ?? "--:--"})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Overwrite Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/25 bg-surface-container-lowest">
                <input
                  type="checkbox"
                  id="autoGenOverwrite"
                  checked={autoGenOverwrite}
                  onChange={e => setAutoGenOverwrite(e.target.checked)}
                  className="w-4 h-4 accent-error cursor-pointer"
                />
                <label htmlFor="autoGenOverwrite" className="cursor-pointer select-none">
                  <span className="font-bold text-on-surface">Timpa (Overwrite) jadwal yang sudah ada</span>
                  <span className="block text-on-surface-variant text-[10px] mt-0.5">Jika aktif, jadwal lama kasir di bulan & cabang yang sama akan dihapus terlebih dahulu.</span>
                </label>
              </div>

              {/* Kasir Config Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-on-surface">Daftar Kasir & Shift Awal (Tanggal 1)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoGenKasirs(prev => prev.map(k => ({ ...k, selected: true })))}
                      className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary font-semibold cursor-pointer"
                    >Pilih Semua</button>
                    <button
                      type="button"
                      onClick={() => setAutoGenKasirs(prev => prev.map(k => ({ ...k, selected: false })))}
                      className="text-[10px] px-2 py-1 rounded bg-surface-container-high text-on-surface-variant font-semibold cursor-pointer"
                    >Batal Semua</button>
                  </div>
                </div>

                <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/25">
                        <th className="p-3 text-center w-10">✓</th>
                        <th className="p-3 text-left">Nama Kasir</th>
                        <th className="p-3 text-center">Shift Awal (Tgl 1)</th>
                        <th className="p-3 text-center">Shift Awal (Tgl 2)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {autoGenKasirs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-on-surface-variant/60">Belum ada kasir dimuat</td>
                        </tr>
                      ) : autoGenKasirs.map((k, idx) => (
                        <tr key={k.id_kasir} className={`transition-colors ${k.selected ? "bg-surface" : "bg-surface-container-low/40 opacity-60"}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={k.selected}
                              onChange={e => setAutoGenKasirs(prev => prev.map((item, i) => i === idx ? { ...item, selected: e.target.checked } : item))}
                              className="w-4 h-4 accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-on-surface">{k.nama}</span>
                            <span className="ml-2 text-[10px] text-on-surface-variant font-mono">{k.kode}</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAutoGenKasirs(prev => prev.map((item, i) => i === idx ? { ...item, shift_awal: "pagi" } : item))}
                                className={`px-3 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                  k.shift_awal === "pagi"
                                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                                    : "bg-surface-container-high text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60"
                                }`}
                              >☀ Pagi</button>
                              <button
                                type="button"
                                onClick={() => setAutoGenKasirs(prev => prev.map((item, i) => i === idx ? { ...item, shift_awal: "sore" } : item))}
                                className={`px-3 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                  k.shift_awal === "sore"
                                    ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                                    : "bg-surface-container-high text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60"
                                }`}
                              >🌙 Sore</button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              k.shift_awal === "pagi"
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-emerald-500/10 text-emerald-700"
                            }`}>
                              {k.shift_awal === "pagi" ? "🌙 Sore" : "☀ Pagi"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Result Preview after generate */}
              {autoGenResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 space-y-1 text-[11px]">
                  <p className="font-bold text-emerald-700">✅ Generate Selesai!</p>
                  <p className="text-on-surface-variant">Total kasir: <strong>{autoGenResult.totalKasir}</strong> | Hari dalam bulan: <strong>{autoGenResult.daysInMonth}</strong></p>
                  <p className="text-on-surface-variant">Jadwal dibuat: <strong className="text-emerald-700">{autoGenResult.insertedCount}</strong> | Dilewati (konflik): <strong>{autoGenResult.skippedCount}</strong></p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAutoGenModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={saving}
                  className="flex-1 bg-secondary hover:bg-secondary/90 disabled:opacity-60 text-on-secondary py-2.5 rounded-xl font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {saving ? "Generating..." : `Generate Jadwal ${autoGenKasirs.filter(k => k.selected).length} Kasir`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">Hapus Jadwal?</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setJadwalIdToDelete(null);
                  }}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-error hover:bg-error/90 text-on-error py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
