"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  FileText,
  AlertTriangle
} from "lucide-react";
import * as XLSX from "xlsx";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Supplier {
  id_supplier: number;
  nama_supplier: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  bank?: string;
  no_rek_bank?: string;
  hari_kunjungan?: string;
  periode_kunjungan?: string;
  status_pajak?: string;
  npwp?: string;
  keterangan_1?: string;
  keterangan_2?: string;
}

export default function SupplierPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const [filterPajak, setFilterPajak] = useState("");
  const [filterHari, setFilterHari] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");
  
  // Form fields
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [email, setEmail] = useState("");
  const [bank, setBank] = useState("");
  const [noRek, setNoRek] = useState("");
  const [hariKunjungan, setHariKunjungan] = useState("");
  const [periodeKunjungan, setPeriodeKunjungan] = useState("");
  const [statusPajak, setStatusPajak] = useState("PKP");
  const [npwp, setNpwp] = useState("");
  const [ket1, setKet1] = useState("");
  const [ket2, setKet2] = useState("");

  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<string>("nama_supplier");
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

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDelimiter, setExportDelimiter] = useState(","); // "," or ";"
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx"); // "xlsx" or "csv"
  const [exportFields, setExportFields] = useState({
    nama_supplier: true,
    alamat: true,
    telepon: true,
    email: true,
    bank: true,
    no_rek_bank: true,
    hari_kunjungan: true,
    periode_kunjungan: true,
    status_pajak: true,
    npwp: true,
    keterangan_1: true,
    keterangan_2: true,
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
      nama_supplier: "nama_supplier",
      namasupplier: "nama_supplier",
      nama: "nama_supplier",
      alamat: "alamat",
      telepon: "telepon",
      telp: "telepon",
      no_telp: "telepon",
      wa: "telepon",
      email: "email",
      bank: "bank",
      no_rek_bank: "no_rek_bank",
      norekbank: "no_rek_bank",
      no_rek: "no_rek_bank",
      norek: "no_rek_bank",
      rekening: "no_rek_bank",
      hari_kunjungan: "hari_kunjungan",
      harikunjungan: "hari_kunjungan",
      hari: "hari_kunjungan",
      periode_kunjungan: "periode_kunjungan",
      periode: "periode_kunjungan",
      periodekunjungan: "periode_kunjungan",
      status_pajak: "status_pajak",
      statuspajak: "status_pajak",
      pajak: "status_pajak",
      npwp: "npwp",
      keterangan_1: "keterangan_1",
      keterangan1: "keterangan_1",
      ket1: "keterangan_1",
      keterangan_2: "keterangan_2",
      keterangan2: "keterangan_2",
      ket2: "keterangan_2",
    };

    return headers.map((h) => {
      const cleanH = h.toLowerCase().trim().replace(/[\s_-]/g, "");
      return fieldMapping[cleanH] || null;
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Nama Supplier",
      "Alamat",
      "Telepon",
      "Email",
      "Bank Partner",
      "No Rekening",
      "Hari Kunjungan",
      "Periode Kunjungan",
      "Status Pajak",
      "NPWP",
      "Keterangan 1",
      "Keterangan 2",
    ];
    const examples = [
      [
        "PT. Berkah Jaya",
        "Jl. Raya No. 12, Jakarta",
        "08123456789",
        "berkah@mail.com",
        "BCA",
        "1234567890",
        "Senin",
        "Mingguan",
        "PKP",
        "12.345.678.9-012.000",
        "Penyedia Beras",
        "Pengiriman Pagi",
      ],
      [
        "CV. Sumber Makmur",
        "Jl. Industri No. 5, Surabaya",
        "08987654321",
        "sumber@mail.com",
        "Mandiri",
        "0987654321",
        "Rabu",
        "Bulanan",
        "NON-PKP",
        "",
        "Penyedia Minyak",
        "Tempo 30 Hari",
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
    link.setAttribute("download", "template_import_supplier.csv");
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
        if (!rowData.nama_supplier) {
          rowErrors.push("Nama Supplier wajib diisi.");
        }

        if (rowData.status_pajak) {
          const cleanPajak = rowData.status_pajak.toUpperCase();
          if (cleanPajak.includes("NON") || cleanPajak.includes("TIDAK")) {
            rowData.status_pajak = "NON-PKP";
          } else {
            rowData.status_pajak = "PKP";
          }
        } else {
          rowData.status_pajak = "PKP";
        }

        if (rowData.hari_kunjungan) {
          const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
          const matchedDay = days.find((d) => d.toLowerCase() === rowData.hari_kunjungan.toLowerCase());
          if (matchedDay) {
            rowData.hari_kunjungan = matchedDay;
          } else {
            rowErrors.push(`Hari kunjungan '${rowData.hari_kunjungan}' tidak valid.`);
          }
        }

        if (rowData.periode_kunjungan) {
          const periods = ["Mingguan", "Setengah Bulanan", "Bulanan"];
          const matchedPeriod = periods.find((p) => p.toLowerCase() === rowData.periode_kunjungan.toLowerCase());
          if (matchedPeriod) {
            rowData.periode_kunjungan = matchedPeriod;
          } else {
            rowErrors.push(`Periode kunjungan '${rowData.periode_kunjungan}' tidak valid.`);
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
      const response = await fetch("/api/supplier/import", {
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
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportSubmit = () => {
    if (list.length === 0) {
      alert("Tidak ada data supplier untuk diekspor.");
      return;
    }

    const selectedHeaders: string[] = [];
    const fieldKeys: string[] = [];

    const fieldLabels: { [key: string]: string } = {
      nama_supplier: "Nama Supplier",
      alamat: "Alamat",
      telepon: "Telepon",
      email: "Email",
      bank: "Bank Partner",
      no_rek_bank: "No Rekening",
      hari_kunjungan: "Hari Kunjungan",
      periode_kunjungan: "Periode Kunjungan",
      status_pajak: "Status Pajak",
      npwp: "NPWP",
      keterangan_1: "Keterangan 1",
      keterangan_2: "Keterangan 2",
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
        ...list.map((item) => fieldKeys.map((key) => item[key as keyof Supplier] ?? "")),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Supplier");

      // Beautify column widths based on longest cell content
      const colWidths = fieldKeys.map((_, colIdx) => {
        let maxLen = selectedHeaders[colIdx].length;
        list.forEach((item) => {
          const val = String(item[fieldKeys[colIdx] as keyof Supplier] ?? "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 4, 40) }; // cap at 40
      });
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, `daftar_supplier_${today}.xlsx`);
    } else {
      // CSV Format Generation
      const separator = exportDelimiter;
      const rows = list.map((item) => {
        return fieldKeys
          .map((key) => {
            const value = item[key as keyof Supplier] ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(separator);
      });

      const csvContent = "\uFEFF" + [selectedHeaders.join(separator), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `daftar_supplier_${today}.csv`);
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

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/supplier");
    setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (supplier?: Supplier) => {
    setEdit(supplier || null);
    setNama(supplier?.nama_supplier || "");
    setAlamat(supplier?.alamat || "");
    setTelepon(supplier?.telepon || "");
    setEmail(supplier?.email || "");
    setBank(supplier?.bank || "");
    setNoRek(supplier?.no_rek_bank || "");
    setHariKunjungan(supplier?.hari_kunjungan || "");
    setPeriodeKunjungan(supplier?.periode_kunjungan || "");
    setStatusPajak(supplier?.status_pajak || "PKP");
    setNpwp(supplier?.npwp || "");
    setKet1(supplier?.keterangan_1 || "");
    setKet2(supplier?.keterangan_2 || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nama.trim()) return;
    setSaving(true);
    const payload = {
      nama_supplier: nama,
      alamat,
      telepon,
      email,
      bank,
      no_rek_bank: noRek,
      hari_kunjungan: hariKunjungan,
      periode_kunjungan: periodeKunjungan,
      status_pajak: statusPajak,
      npwp,
      keterangan_1: ket1,
      keterangan_2: ket2,
    };

    if (edit) {
      await fetch(`/api/supplier/${edit.id_supplier}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    setLoading(true);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus supplier ini?")) return;
    await fetch(`/api/supplier/${id}`, { method: "DELETE" });
    setLoading(true);
    fetchData();
  };

  const filteredList = list.filter((item) => {
    const s = search.toLowerCase();
    const matchSearch =
      item.nama_supplier.toLowerCase().includes(s) ||
      (item.alamat && item.alamat.toLowerCase().includes(s)) ||
      (item.telepon && item.telepon.includes(s)) ||
      (item.email && item.email.toLowerCase().includes(s));

    const matchPajak = filterPajak === "" || item.status_pajak === filterPajak;
    const matchHari = filterHari === "" || item.hari_kunjungan === filterHari;
    const matchPeriode = filterPeriode === "" || item.periode_kunjungan === filterPeriode;

    return matchSearch && matchPajak && matchHari && matchPeriode;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    let aVal: any = a[sortField as keyof Supplier] ?? "";
    let bVal: any = b[sortField as keyof Supplier] ?? "";

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
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Daftar Supplier
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {can_create && (
            <button
              onClick={openImportWizard}
              className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4 text-primary" /> Import
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/60 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" /> Export
          </button>
          {can_create && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Supplier
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between bg-surface-container/40 px-4 py-3 border border-outline-variant/30 rounded-xl shrink-0">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, alamat, telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter Status Pajak */}
            <select
              value={filterPajak}
              onChange={(e) => setFilterPajak(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">Semua Pajak</option>
              <option value="PKP">PKP</option>
              <option value="NON-PKP">NON-PKP</option>
            </select>

            {/* Filter Hari Kunjungan */}
            <select
              value={filterHari}
              onChange={(e) => setFilterHari(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">Semua Hari Kunjungan</option>
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
              <option value="Minggu">Minggu</option>
            </select>

            {/* Filter Periode Kunjungan */}
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">Semua Periode</option>
              <option value="Mingguan">Mingguan</option>
              <option value="Setengah Bulanan">Setengah Bulanan</option>
              <option value="Bulanan">Bulanan</option>
            </select>

            {/* Reset Filters button if any filters active */}
            {(filterPajak || filterHari || filterPeriode) && (
              <button
                onClick={() => {
                  setFilterPajak("");
                  setFilterHari("");
                  setFilterPeriode("");
                }}
                className="text-primary hover:text-primary-container text-xs font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-primary/5 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
        <span className="text-on-surface-variant text-xs font-semibold shrink-0">
          Menampilkan {sortedList.length} dari {list.length} Supplier
        </span>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low select-none">
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-12">#</th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("nama_supplier")}
                  >
                    <div className="flex items-center gap-1.5">
                      Nama Supplier {renderSortIndicator("nama_supplier")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("telepon")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kontak {renderSortIndicator("telepon")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("alamat")}
                  >
                    <div className="flex items-center gap-1.5">
                      Alamat {renderSortIndicator("alamat")}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-container-high/40"
                    onClick={() => handleSort("hari_kunjungan")}
                  >
                    <div className="flex items-center gap-1.5">
                      Kunjungan {renderSortIndicator("hari_kunjungan")}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Belum ada supplier yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  sortedList.map((s, idx) => (
                    <tr key={s.id_supplier} className="hover:bg-surface-container-high/20 transition-colors">
                      <td className="px-5 py-4 text-on-surface-variant text-sm font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface font-semibold block">{s.nama_supplier}</span>
                        <span className="text-on-surface-variant text-xs">{s.status_pajak} {s.npwp ? `| NPWP: ${s.npwp}` : ""}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-on-surface text-sm block font-semibold">{s.telepon || "-"}</span>
                        <span className="text-on-surface-variant text-xs">{s.email || "-"}</span>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant text-sm">{s.alamat || "-"}</td>
                      <td className="px-5 py-4 text-on-surface text-sm font-medium">
                        {s.hari_kunjungan ? `${s.hari_kunjungan} (${s.periode_kunjungan})` : "-"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {can_update && (
                            <button onClick={() => openModal(s)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {can_delete && (
                            <button onClick={() => handleDelete(s.id_supplier)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">{edit ? "Edit Supplier" : "Tambah Supplier Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nama Supplier</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nama perusahaan supplier"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Alamat</label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 h-20"
                  placeholder="Alamat kantor / gudang"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Telepon</label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="No. Telepon / WA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="email@supplier.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Bank Partner</label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Contoh: BCA, Mandiri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">No. Rekening</label>
                <input
                  type="text"
                  value={noRek}
                  onChange={(e) => setNoRek(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nomor Rekening Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Hari Kunjungan Sales</label>
                <select
                  value={hariKunjungan}
                  onChange={(e) => setHariKunjungan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="" className="bg-surface text-on-surface-variant">-- Pilih Hari --</option>
                  <option value="Senin" className="bg-surface text-on-surface">Senin</option>
                  <option value="Selasa" className="bg-surface text-on-surface">Selasa</option>
                  <option value="Rabu" className="bg-surface text-on-surface">Rabu</option>
                  <option value="Kamis" className="bg-surface text-on-surface">Kamis</option>
                  <option value="Jumat" className="bg-surface text-on-surface">Jumat</option>
                  <option value="Sabtu" className="bg-surface text-on-surface">Sabtu</option>
                  <option value="Minggu" className="bg-surface text-on-surface">Minggu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Periode Kunjungan</label>
                <select
                  value={periodeKunjungan}
                  onChange={(e) => setPeriodeKunjungan(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="" className="bg-surface text-on-surface-variant">-- Pilih Periode --</option>
                  <option value="Mingguan" className="bg-surface text-on-surface">Mingguan</option>
                  <option value="Setengah Bulanan" className="bg-surface text-on-surface">Setengah Bulanan</option>
                  <option value="Bulanan" className="bg-surface text-on-surface">Bulanan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Status Pajak</label>
                <select
                  value={statusPajak}
                  onChange={(e) => setStatusPajak(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="PKP" className="bg-surface text-on-surface">PKP</option>
                  <option value="NON-PKP" className="bg-surface text-on-surface">NON-PKP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">NPWP</label>
                <input
                  type="text"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nomor Pokok Wajib Pajak"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Keterangan 1</label>
                <input
                  type="text"
                  value={ket1}
                  onChange={(e) => setKet1(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Catatan tambahan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Keterangan 2</label>
                <input
                  type="text"
                  value={ket2}
                  onChange={(e) => setKet2(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Catatan tambahan lain"
                />
              </div>
              <div className="col-span-2 flex gap-3 mt-4 border-t border-outline-variant/40 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {saving ? "Menyimpan..." : "Simpan Supplier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================== MODAL IMPORT ================================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base">Import Supplier Massal</h2>
                  <p className="text-xs text-on-surface-variant">Tambahkan banyak data supplier sekaligus via CSV</p>
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
                      Pastikan file CSV memiliki kolom <code className="bg-primary/10 text-primary px-1 py-0.5 rounded font-mono font-semibold">Nama Supplier</code> (wajib diisi).
                      Kolom lain opsional dan otomatis dipetakan ke field sistem. Gunakan format template untuk menghindari kesalahan struktur.
                    </div>
                  </div>

                  {/* Template Card */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/40 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-success/10 text-success rounded-xl">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Template CSV Supplier</h4>
                        <p className="text-xs text-on-surface-variant">Gunakan file excel/csv standar ini untuk mengisi data</p>
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
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-44">Nama Supplier</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-32">Telepon</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-40">Alamat</th>
                            <th className="px-4 py-2.5 font-semibold text-on-surface-variant w-28">Hari</th>
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
                                  <span className={`font-semibold ${rowErr && !row.nama_supplier ? "text-error border-b border-dashed border-error/55" : "text-on-surface"}`}>
                                    {row.nama_supplier || "[Kosong]"}
                                  </span>
                                  {rowErr && !row.nama_supplier && (
                                    <span className="block text-[10px] text-error mt-0.5">Nama wajib diisi!</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-on-surface-variant font-mono">{row.telepon || "-"}</td>
                                <td className="px-4 py-2.5 text-on-surface-variant truncate max-w-xs">{row.alamat || "-"}</td>
                                <td className="px-4 py-2.5 text-on-surface-variant">
                                  {row.hari_kunjungan ? (
                                    <span className={rowErr?.errors.some(e => e.includes("Hari kunjungan")) ? "text-error border-b border-dashed border-error/55" : ""}>
                                      {row.hari_kunjungan}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                  {rowErr?.errors.some(e => e.includes("Hari kunjungan")) && (
                                    <span className="block text-[10px] text-error mt-0.5">Hari tidak valid</span>
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
                      Berhasil mengimpor <strong className="text-success">{parsedData.length} data supplier</strong> baru ke dalam pangkalan data sistem.
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
                    className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
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
                  className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-md cursor-pointer"
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
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-base">Ekspor Data Supplier</h2>
                  <p className="text-xs text-on-surface-variant">Unduh data supplier aktif dalam format Excel atau CSV</p>
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
                  <p className="text-lg font-bold text-on-surface mt-0.5">{list.length} Supplier</p>
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
                        nama_supplier: !allSelected,
                        alamat: !allSelected,
                        telepon: !allSelected,
                        email: !allSelected,
                        bank: !allSelected,
                        no_rek_bank: !allSelected,
                        hari_kunjungan: !allSelected,
                        periode_kunjungan: !allSelected,
                        status_pajak: !allSelected,
                        npwp: !allSelected,
                        keterangan_1: !allSelected,
                        keterangan_2: !allSelected,
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
                      nama_supplier: "Nama",
                      alamat: "Alamat",
                      telepon: "Telepon",
                      email: "Email",
                      bank: "Bank",
                      no_rek_bank: "No Rekening",
                      hari_kunjungan: "Hari Kunjungan",
                      periode_kunjungan: "Periode Kunjungan",
                      status_pajak: "Status Pajak",
                      npwp: "NPWP",
                      keterangan_1: "Keterangan 1",
                      keterangan_2: "Keterangan 2",
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
                className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
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
