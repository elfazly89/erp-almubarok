"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, Eye, RefreshCw,
  ChevronLeft, ChevronRight, Phone, Briefcase, Building2,
  Camera, Upload, Key, ChevronUp, ChevronDown, User, FileText, MapPin, ShieldCheck, Calendar,
  Download, CheckCircle2, AlertCircle, FileSpreadsheet, X, AlertTriangle
} from "lucide-react";
import { getStatusColor, formatDate } from "@/lib/utils";
import { compressAndCropToPassport } from "@/lib/image";
import * as XLSX from "xlsx";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface User {
  id: number;
  kode_user: string;
  nama_user: string;
  status: string;
  no_hp: string;
  id_jabatan?: number | null;
  id_cabang?: number | null;
  jabatan: string | null;
  nama_cabang: string | null;
  tanggal_masuk: string | null;
  foto: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  no_ktp?: string | null;
  pendidikan_terakhir?: string | null;
  riwayat_lembaga?: string | null;
  riwayat_pekerjaan?: string | null;
}

const STATUS_OPTIONS = ["Abdi Tetap", "Kontrak", "Training", "Non-Aktif"];

export default function UsersPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedJabatan, setSelectedJabatan] = useState("");
  const [selectedCabang, setSelectedCabang] = useState("");
  const [selectedTahunMasuk, setSelectedTahunMasuk] = useState("");
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [jabatanList, setJabatanList] = useState<{ id_jabatan: number; jabatan: string }[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sortField, setSortField] = useState("nama_user");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState(1); // 1: Choose, 2: Preview, 3: Success
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cabangList, setCabangList] = useState<{ id_cabang: number; nama_cabang: string }[]>([]);

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDelimiter, setExportDelimiter] = useState(","); // "," or ";"
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx"); // "xlsx" or "csv"
  const [exportFields, setExportFields] = useState({
    kode_user: true,
    nama_user: true,
    no_hp: true,
    status: true,
    tanggal_masuk: true,
    tempat_lahir: true,
    tanggal_lahir: true,
    no_ktp: true,
    pendidikan_terakhir: true,
    riwayat_lembaga: true,
    riwayat_pekerjaan: true,
    jabatan: true,
    nama_cabang: true,
  });

  const parseCSV = (text: string, delimiter: string = ",") => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push("");
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const mapHeaders = (headers: string[]) => {
    const fieldMapping: { [key: string]: string } = {
      kode_user: "kode_user",
      kodeuser: "kode_user",
      kode: "kode_user",
      nama_user: "nama_user",
      namauser: "nama_user",
      nama: "nama_user",
      namalengkap: "nama_user",
      no_hp: "no_hp",
      nohp: "no_hp",
      hp: "no_hp",
      telepon: "no_hp",
      status: "status",
      tanggal_masuk: "tanggal_masuk",
      tanggalmasuk: "tanggal_masuk",
      tempat_lahir: "tempat_lahir",
      tempatlahir: "tempat_lahir",
      tanggal_lahir: "tanggal_lahir",
      tanggallahir: "tanggal_lahir",
      no_ktp: "no_ktp",
      noktp: "no_ktp",
      nik: "no_ktp",
      pendidikan_terakhir: "pendidikan_terakhir",
      pendidikanterakhir: "pendidikan_terakhir",
      pendidikan: "pendidikan_terakhir",
      riwayat_lembaga: "riwayat_lembaga",
      riwayatlembaga: "riwayat_lembaga",
      pondok: "riwayat_lembaga",
      riwayat_pekerjaan: "riwayat_pekerjaan",
      riwayatpekerjaan: "riwayat_pekerjaan",
      jabatan: "jabatan",
      nama_cabang: "nama_cabang",
      namacabang: "nama_cabang",
      cabang: "nama_cabang",
      unit: "nama_cabang",
      unitkerja: "nama_cabang",
      password: "password"
    };

    return headers.map((h) => {
      const cleanH = h.toLowerCase().trim().replace(/[\s._-]/g, "");
      return fieldMapping[cleanH] || null;
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Kode User",
      "Nama Lengkap",
      "No HP",
      "Status",
      "Tanggal Masuk",
      "Tempat Lahir",
      "Tanggal Lahir",
      "No KTP",
      "Pendidikan Terakhir",
      "Riwayat Lembaga",
      "Riwayat Pekerjaan",
      "Jabatan",
      "Cabang",
      "Password",
    ];
    const examples = [
      [
        "USR001",
        "Ahmad Fauzi",
        "08123456789",
        "Abdi Tetap",
        "2025-01-15",
        "Gresik",
        "1995-08-20",
        "3525012345678901",
        "S1 PAI",
        "Pondok Pesantren Al-Mubarok",
        "Staf TU MA",
        "Staf Admin",
        "Pusat",
        "pass123",
      ],
      [
        "USR002",
        "Siti Aisyah",
        "08987654321",
        "Kontrak",
        "2026-03-01",
        "Surabaya",
        "1998-11-12",
        "3578012345678902",
        "SMA",
        "Pondok Pesantren Lirboyo",
        "Guru Madin",
        "Guru",
        "Cabang A",
        "pass456",
      ],
    ];

    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...examples.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_import_abdi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Harap unggah file dengan format .csv");
      return;
    }
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Auto-detect delimiter
      const firstLine = text.split("\n")[0] || "";
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ";" : ",";

      const parsedLines = parseCSV(text, delimiter);
      if (parsedLines.length <= 1) {
        alert("File CSV kosong atau tidak memiliki baris data.");
        setImportFile(null);
        return;
      }

      const rawHeaders = parsedLines[0];
      const mappedFields = mapHeaders(rawHeaders);

      const rows = parsedLines.slice(1);
      const data: any[] = [];
      const errors: { row: number; errors: string[] }[] = [];

      rows.forEach((row, index) => {
        if (row.length === 1 && row[0] === "") return;

        const rowData: any = {};
        mappedFields.forEach((field, i) => {
          if (field) {
            rowData[field] = row[i]?.trim() || "";
          }
        });

        const rowErrors: string[] = [];
        if (!rowData.kode_user) {
          rowErrors.push("Kode User wajib diisi.");
        }
        if (!rowData.nama_user) {
          rowErrors.push("Nama Lengkap wajib diisi.");
        }
        if (!rowData.no_hp) {
          rowErrors.push("No HP wajib diisi.");
        }

        // Normalize status
        if (rowData.status) {
          const matchedStatus = STATUS_OPTIONS.find((s) => s.toLowerCase() === rowData.status.toLowerCase());
          if (matchedStatus) {
            rowData.status = matchedStatus;
          } else {
            rowErrors.push(`Status '${rowData.status}' tidak valid. Harus salah satu dari: ${STATUS_OPTIONS.join(", ")}`);
          }
        } else {
          rowData.status = "Kontrak";
        }

        // Map Jabatan name to id_jabatan
        if (rowData.jabatan) {
          const matchedJ = jabatanList.find((j) => j.jabatan.toLowerCase() === rowData.jabatan.toLowerCase());
          if (matchedJ) {
            rowData.id_jabatan = matchedJ.id_jabatan;
          } else {
            rowErrors.push(`Jabatan '${rowData.jabatan}' tidak ditemukan di sistem.`);
          }
        }

        // Map Cabang name to id_cabang
        if (rowData.nama_cabang) {
          const matchedC = cabangList.find((c) => c.nama_cabang.toLowerCase() === rowData.nama_cabang.toLowerCase());
          if (matchedC) {
            rowData.id_cabang = matchedC.id_cabang;
          } else {
            rowErrors.push(`Cabang/Unit '${rowData.nama_cabang}' tidak ditemukan di sistem.`);
          }
        }

        data.push({
          ...rowData,
          rowNum: index + 2,
        });

        if (rowErrors.length > 0) {
          errors.push({
            row: index + 2,
            errors: rowErrors,
          });
        }
      });

      setParsedData(data);
      setValidationErrors(errors);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0 || validationErrors.length > 0) return;
    setImporting(true);
    try {
      const response = await fetch("/api/hrd/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Terjadi kesalahan saat mengimpor.");
      }

      setImportStep(3);
      fetchUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportSubmit = () => {
    if (users.length === 0) {
      alert("Tidak ada data abdi untuk diekspor.");
      return;
    }

    const separator = exportDelimiter;
    const selectedHeaders: string[] = [];
    const fieldKeys: string[] = [];

    const fieldLabels: { [key: string]: string } = {
      kode_user: "Kode User",
      nama_user: "Nama Lengkap",
      no_hp: "No HP",
      status: "Status",
      tanggal_masuk: "Tanggal Masuk",
      tempat_lahir: "Tempat Lahir",
      tanggal_lahir: "Tanggal Lahir",
      no_ktp: "No KTP",
      pendidikan_terakhir: "Pendidikan Terakhir",
      riwayat_lembaga: "Riwayat Lembaga",
      riwayat_pekerjaan: "Riwayat Pekerjaan",
      jabatan: "Jabatan",
      nama_cabang: "Cabang",
    };

    Object.entries(exportFields).forEach(([key, val]) => {
      if (val) {
        selectedHeaders.push(fieldLabels[key] || key);
        fieldKeys.push(key);
      }
    });

    if (fieldKeys.length === 0) {
      alert("Pilih setidaknya satu kolom untuk diekspor.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (exportFormat === "xlsx") {
      // Real Excel Spreadsheet Generation using SheetJS
      const sheetData = [
        selectedHeaders,
        ...users.map((item) => fieldKeys.map((key) => item[key as keyof User] ?? "")),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Abdi");

      // Beautify column widths
      const colWidths = fieldKeys.map((_, colIdx) => {
        let maxLen = selectedHeaders[colIdx].length;
        users.forEach((item) => {
          const val = String(item[fieldKeys[colIdx] as keyof User] ?? "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 40) };
      });
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, `daftar_abdi_${today}.xlsx`);
    } else {
      // CSV Format
      const rows = users.map((item) => {
        return fieldKeys
          .map((key) => {
            const value = item[key as keyof User] ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(separator);
      });

      const csvContent = "\uFEFF" + [selectedHeaders.join(separator), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `daftar_abdi_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setShowExportModal(false);
  };

  const openImportWizard = () => {
    setImportFile(null);
    setImportStep(1);
    setParsedData([]);
    setValidationErrors([]);
    setShowImportModal(true);
  };

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: "999999",
      search,
      status,
      id_jabatan: selectedJabatan,
      id_cabang: selectedCabang,
      tahun_masuk: selectedTahunMasuk,
      sortBy: sortField,
      sortOrder: sortOrder,
    });
    const res = await fetch(`/api/hrd/users?${params}`);
    const data = await res.json();
    setUsers(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, status, selectedJabatan, selectedCabang, selectedTahunMasuk, sortField, sortOrder]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    fetch("/api/hrd/jabatan").then(r => r.json()).then(setJabatanList);
    fetch("/api/cabang").then(r => r.json()).then(res => setCabangList(res.data || res));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowImportModal(false);
        setShowExportModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus user ini?")) return;
    setDeleting(id);
    await fetch(`/api/hrd/users/${id}`, { method: "DELETE" });
    setDeleting(null);
    fetchUsers();
  };

  const [resettingPassword, setResettingPassword] = useState<number | null>(null);

  const handleResetPassword = async (user: User) => {
    const newPassword = prompt(`Masukkan password baru untuk abdi "${user.nama_user}":`);
    if (newPassword === null) return; // cancelled
    if (newPassword.trim().length < 6) {
      alert("Password minimal harus 6 karakter!");
      return;
    }

    setResettingPassword(user.id);
    try {
      const res = await fetch(`/api/hrd/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mereset password");
      }

      alert(`Password untuk ${user.nama_user} berhasil diperbarui!`);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setResettingPassword(null);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Daftar Abdi
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{total} total abdi terdaftar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {can_create && (
            <button
              onClick={openImportWizard}
              className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4 text-primary" /> Import
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" /> Export
          </button>
          {can_create && (
            <button
              id="btn-tambah-user"
              onClick={() => { setEditUser(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Tambah Abdi
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Cari nama, kode user, no HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/80"
          />
        </div>
        <select
          value={selectedJabatan}
          onChange={(e) => setSelectedJabatan(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
        >
          <option value="">Semua Jabatan</option>
          {jabatanList.map((j) => (
            <option key={j.id_jabatan} value={j.id_jabatan}>{j.jabatan}</option>
          ))}
        </select>
        <select
          value={selectedCabang}
          onChange={(e) => setSelectedCabang(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
        >
          <option value="">Semua Cabang</option>
          {cabangList.map((c) => (
            <option key={c.id_cabang} value={c.id_cabang}>{c.nama_cabang}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={selectedTahunMasuk}
          onChange={(e) => setSelectedTahunMasuk(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
        >
          <option value="">Semua Tahun Masuk</option>
          {Array.from({ length: new Date().getFullYear() - 2015 + 2 }, (_, i) => String(2015 + i)).reverse().map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button
          onClick={fetchUsers}
          className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          title="Segarkan data"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span className="sm:hidden">Segarkan</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat data...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/60">
            <Users className="w-12 h-12 mb-3 opacity-30 text-primary" />
            <p>Tidak ada data ditemukan</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low select-none">
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-16">Foto</th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_user")}
                  >
                    <div className="flex items-center gap-1.5">
                      Abdi {renderSortIndicator("nama_user")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("jabatan")}
                  >
                    <div className="flex items-center gap-1.5">
                      Jabatan {renderSortIndicator("jabatan")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_cabang")}
                  >
                    <div className="flex items-center gap-1.5">
                      Cabang {renderSortIndicator("nama_cabang")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status {renderSortIndicator("status")}
                    </div>
                  </th>
                  <th
                    className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("tanggal_masuk")}
                  >
                    <div className="flex items-center gap-1.5">
                      Masuk {renderSortIndicator("tanggal_masuk")}
                    </div>
                  </th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-3 w-16">
                      <div className="w-10 h-13 rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center relative shadow-sm">
                        {user.foto ? (
                          <img src={user.foto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-primary font-bold text-[10px] uppercase">
                            {user.nama_user.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div>
                        <p className="text-on-surface text-sm font-semibold">{user.nama_user}</p>
                        <p className="text-on-surface-variant/70 text-xs mt-0.5">{user.kode_user} · {user.no_hp}</p>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 hidden md:table-cell">
                      <span className="text-on-surface/85 text-sm font-medium">{user.jabatan ?? "—"}</span>
                    </td>
                    <td className="px-5 py-2.5 hidden lg:table-cell">
                      <span className="text-on-surface/85 text-sm font-medium">{user.nama_cabang ?? "—"}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 hidden sm:table-cell">
                      <span className="text-on-surface-variant text-sm font-medium">{formatDate(user.tanggal_masuk)}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setViewUser(user); setShowViewModal(true); }}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer"
                          title="Detail Profil"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {can_update && (
                          <>
                            <button
                              onClick={() => { setEditUser(user); setShowModal(true); }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/15 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              disabled={resettingPassword === user.id}
                              className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/15 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {can_delete && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleting === user.id}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editUser}
          jabatanList={jabatanList}
          cabangList={cabangList}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchUsers(); }}
        />
      )}

      {showViewModal && viewUser && (
        <UserDetailModal
          user={viewUser}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* ================================== MODAL IMPORT ================================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 text-on-background">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base">Import Data Abdi Massal</h2>
                  <p className="text-xs text-on-surface-variant">Tambahkan banyak data abdi sekaligus via CSV</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)} 
                className="text-on-surface-variant hover:text-on-surface p-1 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-6 py-4 bg-surface-container-low/40 border-b border-outline-variant/20 flex justify-center items-center gap-8 select-none">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${importStep >= 1 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>1</span>
                <span className={`text-xs font-medium ${importStep === 1 ? "text-primary font-bold" : "text-on-surface-variant"}`}>Pilih File</span>
              </div>
              <div className="w-12 h-0.5 bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${importStep >= 2 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>2</span>
                <span className={`text-xs font-medium ${importStep === 2 ? "text-primary font-bold" : "text-on-surface-variant"}`}>Validasi & Preview</span>
              </div>
              <div className="w-12 h-0.5 bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${importStep >= 3 ? "bg-success text-white" : "bg-surface-container-high text-on-surface-variant"}`}>3</span>
                <span className={`text-xs font-medium ${importStep === 3 ? "text-success font-bold" : "text-on-surface-variant"}`}>Selesai</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              
              {/* Step 1: Upload */}
              {importStep === 1 && (
                <div className="space-y-6">
                  {/* Info Row */}
                  <div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-on-surface-variant leading-relaxed">
                      <strong className="text-on-surface block mb-1">Panduan Pengisian CSV:</strong>
                      Pastikan file CSV memiliki kolom <code className="bg-primary/10 text-primary px-1 py-0.5 rounded font-mono font-semibold">Kode User</code>, <code className="bg-primary/10 text-primary px-1 py-0.5 rounded font-mono font-semibold">Nama Lengkap</code>, dan <code className="bg-primary/10 text-primary px-1 py-0.5 rounded font-mono font-semibold">No HP</code> (wajib diisi).
                      Kolom lain opsional. Gunakan nama Jabatan dan Cabang yang sesuai dengan sistem agar terpetakan secara otomatis.
                    </div>
                  </div>

                  {/* Template Card */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/40 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-success/10 text-success rounded-xl">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Template CSV Abdi</h4>
                        <p className="text-xs text-on-surface-variant">Gunakan file excel/csv standar ini untuk mengisi data abdi</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 bg-success/10 hover:bg-success/20 text-success px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Unduh Template
                    </button>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                      dragActive
                        ? "border-primary bg-primary/5 shadow-inner scale-[0.99]"
                        : "border-outline-variant hover:border-primary hover:bg-surface-container-low/40"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv"
                      className="hidden"
                    />
                    <div className="p-4 bg-surface-container-high rounded-full text-on-surface-variant">
                      <Upload className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-on-surface">Pilih File CSV Anda</p>
                      <p className="text-xs text-on-surface-variant mt-1">Tarik & lepas file Anda ke sini, atau klik untuk merambah folder</p>
                    </div>
                    <span className="text-[10px] bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded-full text-on-surface-variant font-mono">Format yang didukung: .csv</span>
                  </div>
                </div>
              )}

              {/* Step 2: Preview & Validation */}
              {importStep === 2 && (
                <div className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">Total Baris</span>
                      <p className="text-xl font-bold text-on-surface mt-1">{parsedData.length}</p>
                    </div>
                    <div className="p-3 bg-success/5 border border-success/20 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-semibold text-success tracking-wider">Siap di-import</span>
                      <p className="text-xl font-bold text-success mt-1">{parsedData.length - validationErrors.length}</p>
                    </div>
                    <div className="p-3 bg-error/5 border border-error/20 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-semibold text-error tracking-wider">Error Terdeteksi</span>
                      <p className="text-xl font-bold text-error mt-1">{validationErrors.length}</p>
                    </div>
                  </div>

                  {/* Warning banner if there are errors */}
                  {validationErrors.length > 0 && (
                    <div className="flex gap-3 p-3 bg-error/5 border border-error/20 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      <div className="text-xs text-error leading-relaxed">
                        Terdeteksi {validationErrors.length} baris dengan kesalahan. Perbaiki file CSV Anda terlebih dahulu. Tombol import akan dinonaktifkan sampai semua baris valid.
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                    <div className="overflow-x-auto max-h-[30vh]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-container-low border-b border-outline-variant/40 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-16">Baris</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-28">Status</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-28">Kode User</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-44">Nama Abdi</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-32">No HP</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-28">Jabatan</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-28">Cabang</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {parsedData.map((row, idx) => {
                            const rowErr = validationErrors.find(e => e.row === row.rowNum);
                            return (
                              <tr key={idx} className={`hover:bg-surface-container-high/20 transition-colors ${rowErr ? "bg-error/5" : ""}`}>
                                <td className="px-4 py-2.5 font-mono text-on-surface-variant">#{row.rowNum}</td>
                                <td className="px-4 py-2.5">
                                  {rowErr ? (
                                    <span className="inline-flex items-center gap-1 bg-error/10 text-error text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                      <AlertCircle className="w-3 h-3" /> Error
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                      <CheckCircle2 className="w-3 h-3" /> Valid
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`font-mono font-semibold ${rowErr?.errors.some(e => e.includes("Kode User")) ? "text-error border-b border-dashed border-error/55" : "text-on-surface"}`}>
                                    {row.kode_user || "[Kosong]"}
                                  </span>
                                  {rowErr?.errors.some(e => e.includes("Kode User")) && (
                                    <span className="block text-[10px] text-error mt-0.5">Kode wajib diisi</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`font-semibold ${rowErr?.errors.some(e => e.includes("Nama Lengkap")) ? "text-error border-b border-dashed border-error/55" : "text-on-surface"}`}>
                                    {row.nama_user || "[Kosong]"}
                                  </span>
                                  {rowErr?.errors.some(e => e.includes("Nama Lengkap")) && (
                                    <span className="block text-[10px] text-error mt-0.5">Nama wajib diisi</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-on-surface-variant font-mono">{row.no_hp || "-"}</td>
                                <td className="px-4 py-2.5 text-on-surface-variant">
                                  {row.jabatan ? (
                                    <span className={rowErr?.errors.some(e => e.includes("Jabatan")) ? "text-error border-b border-dashed border-error/55" : ""}>
                                      {row.jabatan}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                  {rowErr?.errors.some(e => e.includes("Jabatan")) && (
                                    <span className="block text-[10px] text-error mt-0.5">Jabatan tidak valid</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-on-surface-variant">
                                  {row.nama_cabang ? (
                                    <span className={rowErr?.errors.some(e => e.includes("Cabang")) ? "text-error border-b border-dashed border-error/55" : ""}>
                                      {row.nama_cabang}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                  {rowErr?.errors.some(e => e.includes("Cabang")) && (
                                    <span className="block text-[10px] text-error mt-0.5">Cabang tidak valid</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {importStep === 3 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-success animate-bounce shadow-lg shadow-success/10">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-on-surface">Proses Import Selesai!</h3>
                    <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
                      Berhasil mengimpor <strong className="text-success">{parsedData.length} data abdi</strong> baru ke dalam sistem. Password default abdi yang di-import adalah <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-semibold">123456</code> (kecuali ditentukan lain dalam file).
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end gap-3 bg-surface-container-high/20">
              {importStep === 1 && (
                <>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="bg-surface hover:bg-surface-container-high text-on-surface px-5 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </>
              )}

              {importStep === 2 && (
                <>
                  <button
                    onClick={() => setImportStep(1)}
                    className="bg-surface hover:bg-surface-container-high text-on-surface px-5 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/50 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={importing || validationErrors.length > 0}
                    className="bg-primary hover:bg-primary/95 disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mengimpor...
                      </>
                    ) : (
                      <>
                        Mulai Import ({parsedData.length - validationErrors.length} Baris)
                      </>
                    )}
                  </button>
                </>
              )}

              {importStep === 3 && (
                <button
                  onClick={() => setShowImportModal(false)}
                  className="bg-primary hover:bg-primary/95 text-on-primary px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-md shadow-primary/20 cursor-pointer"
                >
                  Selesai
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================================== MODAL EXPORT ================================== */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 text-on-background">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base">Ekspor Data Abdi</h2>
                  <p className="text-xs text-on-surface-variant">Unduh data abdi aktif dalam format Excel atau CSV</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="text-on-surface-variant hover:text-on-surface p-1 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              
              {/* Statistic */}
              <div className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant font-medium">Jumlah data yang diekspor</span>
                  <p className="text-lg font-bold text-on-surface mt-0.5">{users.length} Abdi</p>
                </div>
                <div className="p-2.5 bg-primary/5 rounded-xl border border-primary/15 text-primary">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-on-surface-variant tracking-wider mb-2">Pilih Format File</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("xlsx")}
                    className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      exportFormat === "xlsx"
                        ? "border-primary bg-primary/5 shadow-sm text-primary font-semibold"
                        : "border-outline-variant/60 hover:bg-surface-container-low/40 text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-success" />
                      <span className="text-xs font-bold">Excel (.xlsx)</span>
                    </div>
                    <span className={`text-[10px] text-left leading-normal ${exportFormat === "xlsx" ? "text-primary/80" : "text-on-surface-variant"}`}>Spreadsheet Excel modern & auto-width</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      exportFormat === "csv"
                        ? "border-primary bg-primary/5 shadow-sm text-primary font-semibold"
                        : "border-outline-variant/60 hover:bg-surface-container-low/40 text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold">CSV (.csv)</span>
                    </div>
                    <span className={`text-[10px] text-left leading-normal ${exportFormat === "csv" ? "text-primary/80" : "text-on-surface-variant"}`}>Dokumen teks terpisah tanda baca</span>
                  </button>
                </div>
              </div>

              {/* Separator / Delimiter Selector (Show only if CSV selected) */}
              {exportFormat === "csv" && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant tracking-wider mb-2">Pilih Separator File CSV</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExportDelimiter(",")}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        exportDelimiter === ","
                          ? "border-primary bg-primary/5 shadow-sm text-primary"
                          : "border-outline-variant/60 hover:bg-surface-container-low/40 text-on-surface"
                      }`}
                    >
                      <span className="text-xs font-bold">Koma ( , )</span>
                      <span className={`text-[10px] ${exportDelimiter === "," ? "text-primary/80" : "text-on-surface-variant"}`}>Format standar internasional</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportDelimiter(";")}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        exportDelimiter === ";"
                          ? "border-primary bg-primary/5 shadow-sm text-primary"
                          : "border-outline-variant/60 hover:bg-surface-container-low/40 text-on-surface"
                      }`}
                    >
                      <span className="text-xs font-bold">Titik Koma ( ; )</span>
                      <span className={`text-[10px] ${exportDelimiter === ";" ? "text-primary/80" : "text-on-surface-variant"}`}>Kompatibel Excel regional ID</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Columns Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant tracking-wider">Pilih Kolom Data</label>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = Object.values(exportFields).every(v => v);
                      setExportFields({
                        kode_user: !allSelected,
                        nama_user: !allSelected,
                        no_hp: !allSelected,
                        status: !allSelected,
                        tanggal_masuk: !allSelected,
                        tempat_lahir: !allSelected,
                        tanggal_lahir: !allSelected,
                        no_ktp: !allSelected,
                        pendidikan_terakhir: !allSelected,
                        riwayat_lembaga: !allSelected,
                        riwayat_pekerjaan: !allSelected,
                        jabatan: !allSelected,
                        nama_cabang: !allSelected,
                      });
                    }}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    {Object.values(exportFields).every(v => v) ? "Batal Pilih Semua" : "Pilih Semua"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface-container-low/50 p-4 border border-outline-variant/30 rounded-2xl">
                  {Object.entries(exportFields).map(([key, val]) => {
                    const labelMapping: { [key: string]: string } = {
                      kode_user: "Kode",
                      nama_user: "Nama",
                      no_hp: "No HP",
                      status: "Status",
                      tanggal_masuk: "Masuk",
                      tempat_lahir: "Tempat Lahir",
                      tanggal_lahir: "Tanggal Lahir",
                      no_ktp: "No KTP",
                      pendidikan_terakhir: "Pendidikan",
                      riwayat_lembaga: "Riwayat Lembaga",
                      riwayat_pekerjaan: "Riwayat Kerja",
                      jabatan: "Jabatan",
                      nama_cabang: "Cabang",
                    };
                    return (
                      <label key={key} className="flex items-center gap-2 text-xs text-on-surface font-medium cursor-pointer p-1 rounded-lg hover:bg-surface-container-high/40 select-none">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => setExportFields(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="accent-primary w-3.5 h-3.5 rounded border-outline-variant focus:ring-primary"
                        />
                        {labelMapping[key] || key}
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end gap-3 bg-surface-container-high/20">
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-surface hover:bg-surface-container-high text-on-surface px-5 py-2.5 rounded-xl text-xs font-semibold border border-outline-variant/50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExportSubmit}
                className="bg-primary hover:bg-primary/95 text-on-primary px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Ekspor Sekarang
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function UserModal({
  user,
  jabatanList,
  cabangList,
  onClose,
  onSaved,
}: {
  user: User | null;
  jabatanList: { id_jabatan: number; jabatan: string }[];
  cabangList: { id_cabang: number; nama_cabang: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    kode_user: user?.kode_user ?? "",
    nama_user: user?.nama_user ?? "",
    no_hp: user?.no_hp ?? "",
    status: user?.status ?? "Kontrak",
    id_jabatan: user?.id_jabatan ?? "",
    id_cabang: user?.id_cabang ?? "",
    tempat_lahir: user?.tempat_lahir ?? "",
    tanggal_lahir: user?.tanggal_lahir ?? "",
    no_ktp: user?.no_ktp ?? "",
    pendidikan_terakhir: user?.pendidikan_terakhir ?? "",
    riwayat_lembaga: user?.riwayat_lembaga ?? "",
    riwayat_pekerjaan: user?.riwayat_pekerjaan ?? "",
    password: "",
    tanggal_masuk: user?.tanggal_masuk ?? "",
    foto: user?.foto ?? (null as string | null),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const croppedBase64 = await compressAndCropToPassport(file);
      setForm((f) => ({ ...f, foto: croppedBase64 }));
    } catch (err: any) {
      setError(err.message || "Gagal memproses foto");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        id_jabatan: form.id_jabatan ? Number(form.id_jabatan) : null,
        id_cabang: form.id_cabang ? Number(form.id_cabang) : null,
        tempat_lahir: form.tempat_lahir || null,
        tanggal_lahir: form.tanggal_lahir || null,
        no_ktp: form.no_ktp || null,
        pendidikan_terakhir: form.pendidikan_terakhir || null,
        riwayat_lembaga: form.riwayat_lembaga || null,
        riwayat_pekerjaan: form.riwayat_pekerjaan || null,
        tanggal_masuk: form.tanggal_masuk || null,
      };
      if (isEdit && !payload.password) delete (payload as any).password;

      const res = await fetch(
        isEdit ? `/api/hrd/users/${user.id}` : "/api/hrd/users",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan"); return; }
      onSaved();
    } catch { setError("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface z-10">
          <h2 className="font-semibold text-on-surface">{isEdit ? "Edit Abdi" : "Tambah Abdi Baru"}</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-2xl leading-none transition-colors cursor-pointer">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-on-background">
          {error && (
            <div className="bg-error/15 border border-error/25 text-error px-4 py-3 rounded-xl font-medium">{error}</div>
          )}

          {/* Photo Upload Zone */}
          <div className="flex flex-col items-center justify-center pb-4 border-b border-outline-variant/20 mb-2">
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">Foto Profil (Paspor 3:4)</label>
            <div className="relative group w-24 h-32 rounded-xl overflow-hidden border border-dashed border-outline-variant hover:border-primary/60 bg-surface-container-low flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm">
              {form.foto ? (
                <>
                  <img src={form.foto} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-semibold">Ganti</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center text-on-surface-variant/60">
                  <Camera className="w-6 h-6 mb-1 text-primary/70" />
                  <span className="text-[9px] font-medium">Unggah Foto</span>
                  <span className="text-[7px] text-on-surface-variant/40 mt-0.5">Crop & kompres</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {form.foto && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, foto: null }))}
                className="mt-2 text-[9px] text-error hover:underline font-semibold cursor-pointer"
              >
                Hapus Foto
              </button>
            )}
          </div>

          {/* Section 1: Informasi Keanggotaan & Akun */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant/20 pb-1">
              Informasi Keanggotaan & Akun
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Kode User <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={form.kode_user}
                  onChange={(e) => setForm((f) => ({ ...f, kode_user: e.target.value }))}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nama Lengkap <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={form.nama_user}
                  onChange={(e) => setForm((f) => ({ ...f, nama_user: e.target.value }))}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">No. HP <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={form.no_hp}
                  onChange={(e) => setForm((f) => ({ ...f, no_hp: e.target.value }))}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Masuk</label>
                <input
                  type="date"
                  value={form.tanggal_masuk}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_masuk: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  {isEdit ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!isEdit}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Jabatan</label>
                <select
                  value={form.id_jabatan}
                  onChange={(e) => setForm((f) => ({ ...f, id_jabatan: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  <option value="">— Pilih Jabatan —</option>
                  {jabatanList.map((j) => <option key={j.id_jabatan} value={j.id_jabatan}>{j.jabatan}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Cabang/Unit Kerja</label>
                <select
                  value={form.id_cabang}
                  onChange={(e) => setForm((f) => ({ ...f, id_cabang: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80 cursor-pointer"
                >
                  <option value="">— Pilih Cabang —</option>
                  {cabangList.map((c) => <option key={c.id_cabang} value={c.id_cabang}>{c.nama_cabang}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Data Pribadi */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant/20 pb-1">
              Data Pribadi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">No. KTP</label>
                <input
                  type="text"
                  value={form.no_ktp}
                  onChange={(e) => setForm((f) => ({ ...f, no_ktp: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Pendidikan Terakhir</label>
                <input
                  type="text"
                  value={form.pendidikan_terakhir}
                  onChange={(e) => setForm((f) => ({ ...f, pendidikan_terakhir: e.target.value }))}
                  placeholder="Contoh: S1 PAI, SMA, dll."
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  value={form.tempat_lahir}
                  onChange={(e) => setForm((f) => ({ ...f, tempat_lahir: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_lahir: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Riwayat Khidmat & Pekerjaan */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant/20 pb-1">
              Riwayat Pendidikan Lembaga & Pekerjaan
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Riwayat Pendidikan Lembaga / Pondok Pesantren</label>
                <textarea
                  value={form.riwayat_lembaga}
                  onChange={(e) => setForm((f) => ({ ...f, riwayat_lembaga: e.target.value }))}
                  rows={2}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80 resize-y"
                  placeholder="Detail riwayat pendidikan atau pondok pesantren..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Riwayat Pekerjaan Sebelumnya</label>
                <textarea
                  value={form.riwayat_pekerjaan}
                  onChange={(e) => setForm((f) => ({ ...f, riwayat_pekerjaan: e.target.value }))}
                  rows={2}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary/80 resize-y"
                  placeholder="Detail riwayat pekerjaan sebelumnya..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 cursor-pointer">
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Abdi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/hrd/users/${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengambil data detail");
        setDetail(data);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [user.id]);

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in zoom-in-95 duration-150 relative text-on-background">
        {/* Banner Gradient Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent -z-10" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-outline-variant/10">
          <h2 className="font-semibold text-on-surface flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Detail Profil Abdi
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl leading-none transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Memuat profil lengkap...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-error/15 border border-error/25 text-error px-4 py-3 rounded-xl font-medium text-sm">
              {error}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top Profile Card Header Section */}
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center pb-6 border-b border-outline-variant/20">
              {/* Photo Preview Card */}
              <div className="w-28 h-36 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center relative shadow-sm shrink-0">
                {detail?.foto ? (
                  <img src={detail.foto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-primary font-bold text-xl uppercase">
                    {detail?.nama_user.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-2.5 flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-on-surface">{detail?.nama_user}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(detail?.status || "")}`}>
                      {detail?.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">{detail?.kode_user}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Briefcase className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>Jabatan: <span className="font-semibold text-on-surface">{user.jabatan ?? "Staf"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Building2 className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>Unit Kerja: <span className="font-semibold text-on-surface">{user.nama_cabang ?? "Pusat"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>Mulai Khidmat: <span className="font-semibold text-on-surface">{formatDateLabel(detail?.tanggal_masuk || null)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Phone className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>No. HP/WA: <span className="font-semibold text-on-surface font-mono">{detail?.no_hp}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: Data Pribadi & Kontak */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface border-b border-outline-variant/20 pb-1.5 uppercase tracking-wider text-[10px] text-primary">Data Pribadi & Kontak</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">No. KTP</label>
                    <div className="flex items-center gap-2 mt-1 text-on-surface font-mono bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                      <FileText className="w-4 h-4 text-on-surface-variant/60" />
                      <span>{detail?.no_ktp || "—"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Tempat & Tanggal Lahir</label>
                    <div className="flex items-center gap-2 mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                      <MapPin className="w-4 h-4 text-on-surface-variant/60 shrink-0" />
                      <span>
                        {detail?.tempat_lahir ? `${detail.tempat_lahir}, ` : ""}
                        {detail?.tanggal_lahir ? formatDateLabel(detail.tanggal_lahir) : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Pendidikan Terakhir</label>
                    <div className="flex items-center gap-2 mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
                      <ShieldCheck className="w-4 h-4 text-on-surface-variant/60" />
                      <span>{detail?.pendidikan_terakhir || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Riwayat */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface border-b border-outline-variant/20 pb-1.5 uppercase tracking-wider text-[10px] text-primary">Riwayat Khidmat & Pekerjaan</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Riwayat Pendidikan Lembaga</label>
                    <div className="mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20 min-h-[50px] whitespace-pre-line">
                      {detail?.riwayat_lembaga || "—"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant/80 uppercase">Riwayat Pekerjaan</label>
                    <div className="mt-1 text-on-surface bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20 min-h-[50px] whitespace-pre-line">
                      {detail?.riwayat_pekerjaan || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end pt-4 border-t border-outline-variant/20 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-primary hover:bg-primary/95 text-on-primary px-6 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-primary/10"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
