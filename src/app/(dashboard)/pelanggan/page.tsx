"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Award,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  FileText,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Customer {
  id_pelanggan: number;
  kode_pelanggan: string;
  nama_lengkap: string;
  email: string | null;
  telepon: string | null;
  alamat: string | null;
  level_harga: number;
  total_poin: number;
}

export default function PelangganPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | "adjust_poin">("create");
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Form State
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [levelHarga, setLevelHarga] = useState(1);
  const [totalPoin, setTotalPoin] = useState(0);

  // Adjust Poin Form State
  const [jenisTransaksi, setJenisTransaksi] = useState<"DAPAT" | "GUNAKAN">("DAPAT");
  const [jumlahPoin, setJumlahPoin] = useState(0);
  const [keteranganPoin, setKeteranganPoin] = useState("");

  const [saving, setSaving] = useState(false);

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState(1); // 1: Choose, 2: Preview, 3: Success
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; errors: string[] }[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDelimiter, setExportDelimiter] = useState(","); // "," or ";"
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx"); // "xlsx" or "csv"
  const [exportFields, setExportFields] = useState({
    kode_pelanggan: true,
    nama_lengkap: true,
    email: true,
    telepon: true,
    alamat: true,
    level_harga: true,
    total_poin: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pelanggan?q=${search}`);
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error("Gagal memuat data pelanggan", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Import utility functions
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
      kode_pelanggan: "kode_pelanggan",
      kodepelanggan: "kode_pelanggan",
      kode: "kode_pelanggan",
      nama_lengkap: "nama_lengkap",
      namalengkap: "nama_lengkap",
      nama: "nama_lengkap",
      email: "email",
      telepon: "telepon",
      telp: "telepon",
      no_telp: "telepon",
      no_hp: "telepon",
      nohp: "telepon",
      wa: "telepon",
      alamat: "alamat",
      level_harga: "level_harga",
      levelharga: "level_harga",
      level: "level_harga",
      total_poin: "total_poin",
      totalpoin: "total_poin",
      poin: "total_poin",
    };

    return headers.map((h) => {
      const cleanH = h.toLowerCase().trim().replace(/[\s_-]/g, "");
      return fieldMapping[cleanH] || null;
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Kode Pelanggan",
      "Nama Lengkap",
      "Email",
      "Telepon",
      "Alamat",
      "Level Harga (1=Silver, 2=Gold, 3=Platinum)",
      "Total Poin",
    ];
    const examples = [
      [
        "PLG-0001",
        "Ahmad Mujahid",
        "mujahid@gmail.com",
        "081234567890",
        "Jl. Raya Al-Mubarok No. 12, Jember",
        "1",
        "250",
      ],
      [
        "",
        "UD Misfalah Utama",
        "misfalah.utama@misfalah.com",
        "081122334455",
        "Kawasan Industri Sukowono, Jember",
        "2",
        "1500",
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
    link.setAttribute("download", "template_import_pelanggan.csv");
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
        if (!rowData.nama_lengkap) {
          rowErrors.push("Nama Lengkap wajib diisi.");
        }

        if (rowData.level_harga) {
          const lv = parseInt(rowData.level_harga);
          if (isNaN(lv) || lv < 1 || lv > 3) {
            rowErrors.push("Level Harga tidak valid (harus 1, 2, atau 3).");
          }
        }

        if (rowData.total_poin) {
          const pt = parseInt(rowData.total_poin);
          if (isNaN(pt) || pt < 0) {
            rowErrors.push("Total Poin tidak valid (harus angka positif).");
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
      const response = await fetch("/api/pelanggan/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Terjadi kesalahan saat mengimpor.");
      }

      setImportStep(3);
      setLoading(true);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportSubmit = () => {
    if (list.length === 0) {
      alert("Tidak ada data pelanggan untuk diekspor.");
      return;
    }

    const selectedHeaders: string[] = [];
    const fieldKeys: string[] = [];

    const fieldLabels: { [key: string]: string } = {
      kode_pelanggan: "Kode Pelanggan",
      nama_lengkap: "Nama Lengkap",
      email: "Email",
      telepon: "Telepon",
      alamat: "Alamat",
      level_harga: "Level Harga",
      total_poin: "Total Poin",
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
      // Generate Excel
      const sheetData = [
        selectedHeaders,
        ...list.map((item) => fieldKeys.map((key) => {
          if (key === "level_harga") {
            const lv = item[key as keyof Customer];
            return lv === 3 ? "Platinum" : lv === 2 ? "Gold" : "Silver";
          }
          return item[key as keyof Customer] ?? "";
        })),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      Xcustom_export: XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pelanggan");

      // Beautify column widths
      const colWidths = fieldKeys.map((_, colIdx) => {
        let maxLen = selectedHeaders[colIdx].length;
        list.forEach((item) => {
          let val = "";
          if (fieldKeys[colIdx] === "level_harga") {
            const lv = item.level_harga;
            val = lv === 3 ? "Platinum" : lv === 2 ? "Gold" : "Silver";
          } else {
            val = String(item[fieldKeys[colIdx] as keyof Customer] ?? "");
          }
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 40) };
      });
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, `daftar_pelanggan_${today}.xlsx`);
    } else {
      // Generate CSV
      const separator = exportDelimiter;
      const rows = list.map((item) => {
        return fieldKeys
          .map((key) => {
            let value = "";
            if (key === "level_harga") {
              const lv = item.level_harga;
              value = lv === 3 ? "Platinum" : lv === 2 ? "Gold" : "Silver";
            } else {
              value = String(item[key as keyof Customer] ?? "");
            }
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(separator);
      });

      const csvContent = "\uFEFF" + [selectedHeaders.join(separator), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `daftar_pelanggan_${today}.csv`);
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

  // CRUD Actions
  const openCreateModal = () => {
    setModalType("create");
    setSelectedCust(null);
    setNama("");
    setEmail("");
    setTelepon("");
    setAlamat("");
    setLevelHarga(1);
    setTotalPoin(0);
    setShowModal(true);
  };

  const openEditModal = (c: Customer) => {
    setModalType("edit");
    setSelectedCust(c);
    setNama(c.nama_lengkap);
    setEmail(c.email || "");
    setTelepon(c.telepon || "");
    setAlamat(c.alamat || "");
    setLevelHarga(c.level_harga);
    setTotalPoin(c.total_poin);
    setShowModal(true);
  };

  const openAdjustPoinModal = (c: Customer) => {
    setModalType("adjust_poin");
    setSelectedCust(c);
    setJenisTransaksi("DAPAT");
    setJumlahPoin(0);
    setKeteranganPoin("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setSaving(true);

    try {
      if (modalType === "create") {
        const res = await fetch("/api/pelanggan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_lengkap: nama,
            email: email || null,
            telepon: telepon || null,
            alamat: alamat || null,
            level_harga: levelHarga,
            total_poin: totalPoin,
          }),
        });
        if (res.ok) {
          setShowModal(false);
          loadData();
        } else {
          alert("Gagal menambahkan pelanggan");
        }
      } else if (modalType === "edit" && selectedCust) {
        const res = await fetch("/api/pelanggan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_pelanggan: selectedCust.id_pelanggan,
            nama_lengkap: nama,
            email: email || null,
            telepon: telepon || null,
            alamat: alamat || null,
            level_harga: levelHarga,
            total_poin: totalPoin,
          }),
        });
        if (res.ok) {
          setShowModal(false);
          loadData();
        } else {
          alert("Gagal memperbarui pelanggan");
        }
      } else if (modalType === "adjust_poin" && selectedCust) {
        const res = await fetch("/api/pelanggan/poin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_pelanggan: selectedCust.id_pelanggan,
            jenis_transaksi: jenisTransaksi,
            jumlah_poin: jumlahPoin,
            keterangan: keteranganPoin || `Penyesuaian Manual (${jenisTransaksi === "DAPAT" ? "Tambah" : "Kurangi"})`,
          }),
        });
        if (res.ok) {
          setShowModal(false);
          loadData();
        } else {
          const err = await res.json();
          alert("Gagal menyesuaikan poin: " + (err.error || ""));
        }
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) return;
    try {
      const res = await fetch(`/api/pelanggan?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Gagal menghapus pelanggan. Pastikan pelanggan tidak memiliki transaksi terkait.");
      }
    } catch (err) {
      console.error(err);
      alert("Error menghapus pelanggan.");
    }
  };

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm animate-pulse">
            <Award className="w-3.5 h-3.5" /> Platinum
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
            <Award className="w-3.5 h-3.5" /> Gold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-sm">
            <Award className="w-3.5 h-3.5" /> Silver
          </span>
        );
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
    <div className="space-y-6 text-on-background">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" /> Daftar Pelanggan & Poin
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Kelola data pelanggan, level harga khusus, dan pantau saldo poin aktif mereka
          </p>
        </div>
        
        {/* Proportional Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {can_create && (
            <button
              onClick={openImportWizard}
              className="flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.01]"
            >
              <Upload className="w-4 h-4 text-primary" /> Import
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center justify-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 shadow-sm cursor-pointer hover:scale-[1.01]"
          >
            <Download className="w-4 h-4 text-primary" /> Export
          </button>
          {can_create && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Pelanggan
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pelanggan berdasarkan kode, nama lengkap, atau telepon..."
            className="w-full bg-surface border border-outline-variant/30 text-on-surface placeholder-on-surface-variant/60 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>
        <button
          onClick={loadData}
          className="flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-4 py-3 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Segarkan
        </button>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Total Pelanggan</span>
            <strong className="text-xl font-bold font-mono text-on-surface">{list.length} Orang</strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-purple-500/10 rounded-2xl text-purple-400">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Pelanggan VIP (Gold/Platinum)</span>
            <strong className="text-xl font-bold font-mono text-on-surface">
              {list.filter(c => c.level_harga > 1).length} Orang
            </strong>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-500">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Akumulasi Poin Aktif</span>
            <strong className="text-xl font-bold font-mono text-on-surface">
              {list.reduce((sum, c) => sum + (c.total_poin || 0), 0).toLocaleString()} Poin
            </strong>
          </div>
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs">Memuat data pelanggan dari sistem...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant text-sm">
            <Users className="w-16 h-16 mb-4 opacity-20 text-primary animate-pulse" />
            <p className="font-semibold text-on-surface">Tidak ada pelanggan terdaftar</p>
            <p className="text-xs text-on-surface-variant mt-1">Coba sesuaikan pencarian Anda atau tambah pelanggan baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 w-12 text-center">No</th>
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">Kontak & Alamat</th>
                  <th className="px-6 py-4">Level Harga</th>
                  <th className="px-6 py-4 text-right">Saldo Poin</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {list.map((c, idx) => (
                  <tr key={c.id_pelanggan} className="hover:bg-surface-container-high/25 transition-colors">
                    <td className="px-6 py-4 text-center text-on-surface-variant font-mono">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-primary font-mono text-[10px] font-bold bg-primary/10 px-2.5 py-1 rounded border border-primary/25 shadow-sm">
                        {c.kode_pelanggan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface text-sm">{c.nama_lengkap}</div>
                      {c.email && (
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/80 mt-1 font-mono">
                          <Mail className="w-3 h-3 text-primary/75" /> {c.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1 max-w-xs">
                      {c.telepon && (
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-mono">
                          <Phone className="w-3.5 h-3.5 text-primary/75" /> {c.telepon}
                        </div>
                      )}
                      {c.alamat && (
                        <div className="flex items-center gap-1.5 text-on-surface-variant/80 truncate" title={c.alamat}>
                          <MapPin className="w-3.5 h-3.5 text-primary/75" /> {c.alamat}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getLevelBadge(c.level_harga)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-on-surface font-mono">{c.total_poin.toLocaleString()}</div>
                      {can_update && (
                        <button
                          onClick={() => openAdjustPoinModal(c)}
                          className="text-[9px] font-bold text-primary hover:text-primary-container hover:underline mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          Adjust Poin <Plus className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/pelanggan/poin?id_pelanggan=${c.id_pelanggan}`}
                          className="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-150 cursor-pointer"
                          title="Lihat Riwayat Poin"
                        >
                          <Clock className="w-4 h-4" />
                        </Link>
                        {can_update && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-2 hover:bg-primary/10 hover:text-primary text-on-surface-variant rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-150 cursor-pointer"
                            title="Edit Pelanggan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can_delete && (
                          <button
                            onClick={() => handleDelete(c.id_pelanggan)}
                            className="p-2 hover:bg-error/10 hover:text-error text-on-surface-variant rounded-xl border border-outline-variant/10 shadow-sm transition-all duration-150 cursor-pointer"
                            title="Hapus Pelanggan"
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

      {/* POPUP MODAL (CREATE / EDIT / ADJUST POIN) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-surface border border-outline-variant/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-bold text-on-surface text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {modalType === "create" && "Tambah Pelanggan Baru"}
                {modalType === "edit" && `Edit Pelanggan: ${selectedCust?.nama_lengkap}`}
                {modalType === "adjust_poin" && `Penyesuaian Poin: ${selectedCust?.nama_lengkap}`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-2xl font-normal leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalType !== "adjust_poin" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nama Lengkap Pelanggan *</label>
                      <input
                        type="text"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Masukkan nama lengkap..."
                        required
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Nomor Telepon</label>
                      <input
                        type="tel"
                        value={telepon}
                        onChange={(e) => setTelepon(e.target.value)}
                        placeholder="e.g. 08123456789..."
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Alamat Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. email@pelanggan.com..."
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Alamat Lengkap</label>
                    <textarea
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Masukkan alamat pengiriman / tempat tinggal..."
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-20 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Level Harga Khusus</label>
                      <select
                        value={levelHarga}
                        onChange={(e) => setLevelHarga(parseInt(e.target.value))}
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value={1} className="bg-surface">Silver (Standard)</option>
                        <option value={2} className="bg-surface">Gold (Grosir)</option>
                        <option value={3} className="bg-surface">Platinum (Instansi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Saldo Poin Awal</label>
                      <input
                        type="number"
                        value={totalPoin}
                        onChange={(e) => setTotalPoin(Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={modalType === "edit"}
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-surface-container-low shadow-sm"
                      />
                      {modalType === "edit" && (
                        <span className="text-[10px] text-on-surface-variant/80 mt-1 block">
                          Gunakan fitur *Adjust Poin* untuk mengubah saldo
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-2xl flex justify-between items-center mb-3">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Saldo Poin Saat Ini</span>
                      <strong className="text-lg font-bold font-mono text-on-surface block">
                        {selectedCust?.total_poin.toLocaleString()} Poin
                      </strong>
                    </div>
                    {getLevelBadge(selectedCust?.level_harga || 1)}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Jenis Transaksi Poin</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setJenisTransaksi("DAPAT")}
                          className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            jenisTransaksi === "DAPAT"
                              ? "bg-green-500/10 text-green-500 border-green-500/40"
                              : "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                          }`}
                        >
                          <ArrowUpRight className="w-4 h-4" /> TAMBAH (DAPAT)
                        </button>
                        <button
                          type="button"
                          onClick={() => setJenisTransaksi("GUNAKAN")}
                          className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            jenisTransaksi === "GUNAKAN"
                              ? "bg-red-500/10 text-red-500 border-red-500/40"
                              : "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                          }`}
                        >
                          <ArrowDownRight className="w-4 h-4" /> KURANGI (GUNAKAN)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Jumlah Poin</label>
                      <input
                        type="number"
                        value={jumlahPoin || ""}
                        onChange={(e) => setJumlahPoin(Math.max(1, parseInt(e.target.value) || 0))}
                        placeholder="Masukkan nominal poin..."
                        required
                        className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Keterangan Penyesuaian *</label>
                    <input
                      type="text"
                      value={keteranganPoin}
                      onChange={(e) => setKeteranganPoin(e.target.value)}
                      placeholder="e.g. Pembelian produk X, Klaim hadiah Y, Koreksi Admin..."
                      required
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="border-t border-outline-variant/30 pt-4 flex gap-3 justify-end bg-surface-container-high/20 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary-container text-on-primary disabled:opacity-40 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT WIZARD MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-surface border border-outline-variant/50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-bold text-on-surface text-base flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-primary" /> Import Data Pelanggan
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-2xl font-normal leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      importStep >= 1 ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    1
                  </span>
                  <span className="text-[10px] font-bold text-on-surface">Pilih File</span>
                </div>
                <div className="w-12 h-0.5 bg-outline-variant/40 mx-2" />
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      importStep >= 2 ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    2
                  </span>
                  <span className="text-[10px] font-bold text-on-surface">Validasi & Preview</span>
                </div>
                <div className="w-12 h-0.5 bg-outline-variant/40 mx-2" />
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      importStep >= 3 ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    3
                  </span>
                  <span className="text-[10px] font-bold text-on-surface">Sukses</span>
                </div>
              </div>

              {/* Step 1: Choose File */}
              {importStep === 1 && (
                <div className="space-y-4">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-150 cursor-pointer ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container-low"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-on-surface text-sm">
                        Tarik & Lepas file CSV di sini, atau <span className="text-primary underline">Pilih Berkas</span>
                      </p>
                      <p className="text-on-surface-variant/70 text-[10px] mt-1 font-mono">Format yang didukung: .csv (UTF-8)</p>
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-on-surface">Belum memiliki template import?</p>
                      <p className="text-on-surface-variant/75 text-[10px] mt-0.5">Unduh template CSV panduan untuk mengisi data dengan benar</p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" /> Unduh Template
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Validation and Preview */}
              {importStep === 2 && (
                <div className="space-y-4 flex flex-col max-h-[50vh]">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                    <div>
                      <p className="font-semibold text-on-surface">File: <span className="font-mono text-primary">{importFile?.name}</span></p>
                      <p className="text-on-surface-variant/75 text-[10px] mt-0.5">
                        Siap di-import: {parsedData.length} baris, Error: {validationErrors.length} baris
                      </p>
                    </div>
                    <button
                      onClick={() => setImportStep(1)}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Ubah File
                    </button>
                  </div>

                  {validationErrors.length > 0 ? (
                    <div className="bg-error/10 border border-error/20 p-4 rounded-xl space-y-2 flex-shrink-0">
                      <div className="flex items-center gap-2 text-error font-bold">
                        <AlertTriangle className="w-5 h-5" /> Terdeteksi Kesalahan Data!
                      </div>
                      <p className="text-on-surface-variant/90 text-[10px]">
                        Harap perbaiki kesalahan di bawah ini pada file CSV Anda sebelum mengunggah kembali:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-2 font-mono text-[10px] divide-y divide-error/10">
                        {validationErrors.map((err) => (
                          <div key={err.row} className="pt-1 text-error">
                            <strong>Baris {err.row}:</strong>
                            <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
                              {err.errors.map((e, idx) => (
                                <li key={idx}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-on-surface">Validasi Sukses!</p>
                        <p className="text-on-surface-variant/75 text-[10px] mt-0.5">
                          Seluruh data lolos verifikasi sistem dan siap dimasukkan ke database.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden flex-1 overflow-y-auto min-h-32 bg-surface-container-low">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-high/60 border-b border-outline-variant/20 sticky top-0">
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="px-4 py-2.5 w-12 text-center">Row</th>
                          <th className="px-4 py-2.5">Nama Lengkap</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">Telepon</th>
                          <th className="px-4 py-2.5">Level</th>
                          <th className="px-4 py-2.5 text-right">Poin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 text-[10px]">
                        {parsedData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-high/20">
                            <td className="px-4 py-2 text-center text-on-surface-variant font-mono">{row.rowNum}</td>
                            <td className="px-4 py-2 font-bold text-on-surface">{row.nama_lengkap || <span className="text-error font-normal">Kosong</span>}</td>
                            <td className="px-4 py-2 font-mono">{row.email || "-"}</td>
                            <td className="px-4 py-2 font-mono">{row.telepon || "-"}</td>
                            <td className="px-4 py-2">
                              {row.level_harga === "3" ? "Platinum" : row.level_harga === "2" ? "Gold" : "Silver"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-bold text-primary">{row.total_poin || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <div className="p-2.5 text-center text-[9px] text-on-surface-variant border-t border-outline-variant/10 bg-surface-container-low">
                        Menampilkan 10 dari {parsedData.length} baris data pertama...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Success Screen */}
              {importStep === 3 && (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                  <div className="p-4 bg-green-500/10 rounded-full text-green-500 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Import Data Berhasil!</h3>
                    <p className="text-on-surface-variant/80 text-xs mt-1.5">
                      Berhasil mengimpor <strong className="text-primary">{parsedData.length}</strong> data pelanggan baru ke dalam aplikasi modern.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-2 bg-surface-container-high/40">
              {importStep === 1 && (
                <button
                  onClick={() => setShowImportModal(false)}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
              )}
              {importStep === 2 && (
                <>
                  <button
                    onClick={() => setImportStep(1)}
                    className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Unggah Ulang
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={importing || validationErrors.length > 0}
                    className="bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {importing ? "Mengimpor..." : "Mulai Import"}
                  </button>
                </>
              )}
              {importStep === 3 && (
                <button
                  onClick={() => setShowImportModal(false)}
                  className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT CUSTOMIZER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-surface border border-outline-variant/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-bold text-on-surface text-base flex items-center gap-2.5">
                <Download className="w-5 h-5 text-primary" /> Kustomisasi Ekspor Pelanggan
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-2xl font-normal leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {/* Format Pilihan */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">Format File</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExportFormat("xlsx")}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      exportFormat === "xlsx"
                        ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-500" /> EXCEL (.xlsx)
                  </button>
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      exportFormat === "csv"
                        ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                    }`}
                  >
                    <FileText className="w-4 h-4 text-blue-400" /> CSV COMMA SEPARATED (.csv)
                  </button>
                </div>
              </div>

              {/* CSV Custom Delimiter */}
              {exportFormat === "csv" && (
                <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-2xl">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5">
                    Pemisah CSV (Delimiter)
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 font-medium text-on-surface cursor-pointer">
                      <input
                        type="radio"
                        name="delimiter"
                        checked={exportDelimiter === ","}
                        onChange={() => setExportDelimiter(",")}
                        className="text-primary focus:ring-primary w-4 h-4"
                      />
                      Koma ( `,` ) - Default Internasional
                    </label>
                    <label className="flex items-center gap-1.5 font-medium text-on-surface cursor-pointer">
                      <input
                        type="radio"
                        name="delimiter"
                        checked={exportDelimiter === ";"}
                        onChange={() => setExportDelimiter(";")}
                        className="text-primary focus:ring-primary w-4 h-4"
                      />
                      Titik Koma ( `;` ) - Kompatibilitas Excel Indonesia
                    </label>
                  </div>
                </div>
              )}

              {/* Checklist Column Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-on-surface-variant">Kolom untuk Diekspor</label>
                  <button
                    onClick={() => {
                      const allChecked = Object.values(exportFields).every((v) => v);
                      setExportFields({
                        kode_pelanggan: !allChecked,
                        nama_lengkap: !allChecked,
                        email: !allChecked,
                        telepon: !allChecked,
                        alamat: !allChecked,
                        level_harga: !allChecked,
                        total_poin: !allChecked,
                      });
                    }}
                    className="text-primary font-bold text-[10px] hover:underline cursor-pointer"
                  >
                    {Object.values(exportFields).every((v) => v) ? "Hapus Semua" : "Pilih Semua"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                  {Object.keys(exportFields).map((key) => (
                    <label key={key} className="flex items-center gap-2 py-1 text-on-surface font-medium capitalize cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportFields[key as keyof typeof exportFields]}
                        onChange={(e) =>
                          setExportFields({
                            ...exportFields,
                            [key]: e.target.checked,
                          })
                        }
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      {key.replace("_", " ")}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-2 bg-surface-container-high/40">
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExportSubmit}
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Ekspor Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
