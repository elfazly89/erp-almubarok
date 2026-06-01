"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Wallet, 
  Users, 
  RefreshCw, 
  Briefcase, 
  Plus, 
  Edit2, 
  Printer, 
  DollarSign, 
  CheckCircle, 
  Calendar, 
  FileText, 
  X, 
  Info,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Logo from "@/components/layout/Logo";

interface UserBisyaroh {
  id: number;
  kode_user: string;
  nama_user: string;
  jabatan: string | null;
  id_cabang: number | null;
  nama_cabang: string | null;
  outstanding_loan: number;
  payroll_status: "Draft" | "Lunas";
  gaji_pokok: number;
  gaji_per_jam: number;
  lembur_per_jam: number;
  hari_kerja: number;
  total_jam_kerja: number;
  total_jam_lembur: number;
  gaji_kehadiran: number;
  gaji_lembur: number;
  tunjangan: number;
  potongan: number;
  total_diterima: number;
  tanggal_bayar: string | null;
  catatan: string | null;
  bisyaroh_id: number | null;
}

interface JabatanGaji {
  id_jabatan: number;
  jabatan: string;
  gaji_pokok: number | null;
  gaji_per_jam: number | null;
  lembur_per_jam: number | null;
  id_gaji: number | null;
}

interface COA {
  id: number;
  kode_akun: string;
  nama_akun: string;
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" }
];

export default function BisyarohPage() {
  const [activeTab, setActiveTab] = useState<"bulanan" | "config">("bulanan");
  
  // Date states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [payrollData, setPayrollData] = useState<UserBisyaroh[]>([]);
  const [jabatanData, setJabatanData] = useState<JabatanGaji[]>([]);
  const [coaList, setCoaList] = useState<COA[]>([]);
  
  // Loading states
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  // Modals states
  const [processModalUser, setProcessModalUser] = useState<UserBisyaroh | null>(null);
  const [viewSlipUser, setViewSlipUser] = useState<UserBisyaroh | null>(null);
  const [editConfig, setEditConfig] = useState<JabatanGaji | null>(null);

  // Form states for processing payroll
  const [formGajiPokok, setFormGajiPokok] = useState(0);
  const [formGajiKehadiran, setFormGajiKehadiran] = useState(0);
  const [formGajiLembur, setFormGajiLembur] = useState(0);
  const [formTunjangan, setFormTunjangan] = useState(0);
  const [formPotongan, setFormPotongan] = useState(0);
  const [formCatatan, setFormCatatan] = useState("");
  const [formRekeningId, setFormRekeningId] = useState<number>(1); // Default Kas Toko
  const [formPotongHutang, setFormPotongHutang] = useState(0);
  const [savingPayroll, setSavingPayroll] = useState(false);

  // Form states for editing role salaries
  const [configGajiPokok, setConfigGajiPokok] = useState(0);
  const [configGajiPerJam, setConfigGajiPerJam] = useState(0);
  const [configLemburPerJam, setConfigLemburPerJam] = useState(0);
  const [savingConfig, setSavingConfig] = useState(false);

  // Fetch COA (rekening bank / kas)
  useEffect(() => {
    fetch("/api/akuntansi/daftar-akun")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter for Kas & Bank (typically start with code 1.1)
          const filtered = data.filter((a: COA) => a.kode_akun.startsWith("1."));
          setCoaList(filtered);
          if (filtered.length > 0) {
            setFormRekeningId(filtered[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback if API fails
        const fallback = [
          { id: 1, kode_akun: "1.101.01", nama_akun: "Kas Toko" },
          { id: 2, kode_akun: "1.101.02", nama_akun: "Kas Kecil" },
          { id: 3, kode_akun: "1.102.01", nama_akun: "Bank Mandiri" },
          { id: 4, kode_akun: "1.102.02", nama_akun: "Bank BCA" },
        ];
        setCoaList(fallback);
      });
  }, []);

  // Fetch Payroll list
  const fetchPayroll = useCallback(async () => {
    setLoadingPayroll(true);
    try {
      const res = await fetch(`/api/hrd/bisyaroh?bulan=${selectedMonth}&tahun=${selectedYear}`);
      const data = await res.json();
      setPayrollData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayroll(false);
    }
  }, [selectedMonth, selectedYear]);

  // Fetch Job Salary Configs
  const fetchConfigs = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/hrd/gaji-jabatan");
      const data = await res.json();
      setJabatanData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "bulanan") {
      fetchPayroll();
    } else {
      fetchConfigs();
    }
  }, [activeTab, fetchPayroll, fetchConfigs]);

  // Handle open process modal
  const openProcessModal = (user: UserBisyaroh) => {
    setProcessModalUser(user);
    setFormGajiPokok(user.gaji_pokok);
    setFormGajiKehadiran(user.gaji_kehadiran);
    setFormGajiLembur(user.gaji_lembur);
    setFormTunjangan(user.tunjangan || 0);
    setFormPotongan(user.potongan || 0);
    setFormPotongHutang(0);
    setFormCatatan(user.catatan || `Bisyaroh Abdi Periode ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`);
  };

  // Auto calculate total in modal
  const calculateTotalBisyaroh = () => {
    return formGajiPokok + formGajiKehadiran + formGajiLembur + formTunjangan - formPotongan;
  };

  // Handle save payroll slip
  const handleSavePayroll = async () => {
    if (!processModalUser) return;
    setSavingPayroll(true);
    try {
      const payload = {
        user_id: processModalUser.id,
        nama_user: processModalUser.nama_user,
        id_cabang: processModalUser.id_cabang,
        bulan: selectedMonth,
        tahun: selectedYear,
        gaji_pokok: formGajiPokok,
        gaji_per_jam: processModalUser.gaji_per_jam,
        lembur_per_jam: processModalUser.lembur_per_jam,
        hari_kerja: processModalUser.hari_kerja,
        total_jam_kerja: processModalUser.total_jam_kerja,
        total_jam_lembur: processModalUser.total_jam_lembur,
        gaji_kehadiran: formGajiKehadiran,
        gaji_lembur: formGajiLembur,
        tunjangan: formTunjangan,
        potongan: formPotongan,
        total_diterima: calculateTotalBisyaroh(),
        catatan: formCatatan,
        rekening_id: formRekeningId,
        potong_hutang_nominal: formPotongHutang,
      };

      const res = await fetch("/api/hrd/bisyaroh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProcessModalUser(null);
        fetchPayroll();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memproses penggajian");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSavingPayroll(false);
    }
  };

  // Handle open config edit
  const openConfigEdit = (cfg: JabatanGaji) => {
    setEditConfig(cfg);
    setConfigGajiPokok(cfg.gaji_pokok || 0);
    setConfigGajiPerJam(cfg.gaji_per_jam || 0);
    setConfigLemburPerJam(cfg.lembur_per_jam || 0);
  };

  // Handle save config
  const handleSaveConfig = async () => {
    if (!editConfig) return;
    setSavingConfig(true);
    try {
      const res = await fetch("/api/hrd/gaji-jabatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_jabatan: editConfig.id_jabatan,
          gaji_pokok: configGajiPokok,
          gaji_per_jam: configGajiPerJam,
          lembur_per_jam: configLemburPerJam
        })
      });

      if (res.ok) {
        setEditConfig(null);
        fetchConfigs();
      } else {
        alert("Gagal menyimpan konfigurasi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtering users
  const filteredUsers = payrollData.filter((user) =>
    user.nama_user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.jabatan && user.jabatan.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculations for stats
  const totalEmployees = payrollData.length;
  const processedCount = payrollData.filter(p => p.payroll_status === "Lunas").length;
  const draftCount = totalEmployees - processedCount;
  const totalPayout = payrollData
    .filter(p => p.payroll_status === "Lunas")
    .reduce((acc, curr) => acc + curr.total_diterima, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] space-y-3 overflow-hidden">
      {/* Dynamic print-only styling */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" /> Bisyaroh (Penggajian)
          </h1>
          <p className="text-on-background/70 text-sm mt-1">
            Manajemen dan proses slip gaji abdi pondok pesantren
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("bulanan")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "bulanan"
                ? "bg-surface text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Bisyaroh Bulanan
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "config"
                ? "bg-surface text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Konfigurasi Gaji Jabatan
          </button>
        </div>
      </div>

      {activeTab === "bulanan" ? (
        <>
          {/* Filters & Control Panel */}
          <div className="bg-surface border border-outline-variant/30 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between no-print">
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <div className="flex gap-2 items-center">
                <Calendar className="w-4 h-4 text-primary" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-surface-container border border-outline-variant/40 text-on-surface px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-surface-container border border-outline-variant/40 text-on-surface px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 3 + i).map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>

              <button
                onClick={fetchPayroll}
                className="p-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/35 text-on-surface rounded-xl transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 text-primary ${loadingPayroll ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari abdi atau jabatan..."
                className="w-full bg-surface-container-low border border-outline-variant/45 text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80"
              />
            </div>
          </div>

          {/* Payroll Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="bg-surface border border-outline-variant/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-on-surface-variant/70 text-xs font-semibold uppercase">Total Abdi</p>
                <h3 className="text-xl font-bold text-on-surface mt-0.5">{totalEmployees} orang</h3>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-on-surface-variant/70 text-xs font-semibold uppercase">Sudah Diproses</p>
                <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{processedCount} orang</h3>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-on-surface-variant/70 text-xs font-semibold uppercase">Belum Diproses</p>
                <h3 className="text-xl font-bold text-amber-600 mt-0.5">{draftCount} orang</h3>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-on-surface-variant/70 text-xs font-semibold uppercase">Total Pengeluaran Gaji</p>
                <h3 className="text-xl font-bold text-purple-600 mt-0.5">{formatCurrency(totalPayout)}</h3>
              </div>
            </div>
          </div>

          {/* Main Payroll List */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm no-print">
            {loadingPayroll ? (
              <div className="flex items-center justify-center py-20 text-on-surface-variant">
                <RefreshCw className="w-7 h-7 animate-spin mr-3 text-primary" /> Memproses data gaji...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/70 gap-2">
                <AlertCircle className="w-10 h-10 text-on-surface-variant/40" />
                <p className="text-sm font-semibold">Tidak ada data abdi ditemukan</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/35 bg-surface-container-low">
                      <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Abdi</th>
                      <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Jabatan & Cabang</th>
                      <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Kehadiran</th>
                      <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Lembur</th>
                      <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Total Gaji</th>
                      <th className="text-center px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredUsers.map((user) => {
                      const isConfigEmpty = user.gaji_pokok === 0 && user.gaji_per_jam === 0;

                      return (
                        <tr key={user.id} className="hover:bg-surface-container-high/30 transition-colors">
                          {/* Profile */}
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/10 to-primary/20 text-primary border border-primary/15 flex items-center justify-center text-sm font-bold shadow-sm">
                                {user.nama_user.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-on-surface text-sm font-bold block">{user.nama_user}</span>
                                <span className="text-on-surface-variant/60 text-xs block mt-0.5">ID: {user.kode_user}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role & Branch */}
                          <td className="px-5 py-2.5">
                            <span className="text-on-surface text-sm font-semibold block">{user.jabatan ?? "—"}</span>
                            <span className="text-on-surface-variant/70 text-xs block mt-0.5">{user.nama_cabang ?? "—"}</span>
                          </td>

                          {/* Attendance */}
                          <td className="px-5 py-2.5">
                            <span className="text-on-surface text-sm font-semibold block">{user.hari_kerja} Hari</span>
                            <span className="text-on-surface-variant/60 text-xs block mt-0.5">({user.total_jam_kerja} Jam)</span>
                          </td>

                          {/* Overtime */}
                          <td className="px-5 py-2.5">
                            {user.total_jam_lembur > 0 ? (
                              <>
                                <span className="text-primary text-sm font-semibold block">{user.total_jam_lembur} Jam</span>
                                <span className="text-on-surface-variant/60 text-xs block mt-0.5">@{formatCurrency(user.lembur_per_jam)}/j</span>
                              </>
                            ) : (
                              <span className="text-on-surface-variant/40 text-xs italic">—</span>
                            )}
                          </td>

                          {/* Total Pay */}
                          <td className="px-5 py-2.5 text-right">
                            <span className="text-on-surface text-sm font-bold block">
                              {formatCurrency(user.total_diterima)}
                            </span>
                            {isConfigEmpty && (
                              <span className="text-amber-600 text-[10px] font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                Konfigurasi Kosong
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-2.5 text-center">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              user.payroll_status === "Lunas"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {user.payroll_status}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="px-5 py-2.5 text-right">
                            {user.payroll_status === "Lunas" ? (
                              <button
                                onClick={() => setViewSlipUser(user)}
                                className="flex items-center gap-1.5 text-primary hover:text-primary/80 hover:bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm float-right"
                              >
                                <Printer className="w-3.5 h-3.5" /> Detail Slip
                              </button>
                            ) : (
                              <button
                                onClick={() => openProcessModal(user)}
                                className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-on-primary px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-primary/10 float-right"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Proses Gaji
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Configuration Tab */
        <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm no-print">
          {loadingConfig ? (
            <div className="flex items-center justify-center py-20 text-on-surface-variant">
              <RefreshCw className="w-7 h-7 animate-spin mr-3 text-primary" /> Memuat data konfigurasi...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low">
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Jabatan</th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Gaji Pokok</th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Gaji Per Jam (Kehadiran)</th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Gaji Lembur per Jam</th>
                  <th className="text-right px-5 py-2.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {jabatanData.map((j, idx) => (
                  <tr key={j.id_jabatan} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-2.5 text-on-surface-variant/70 text-sm">{idx + 1}</td>
                    <td className="px-5 py-2.5 font-bold text-on-surface text-sm">{j.jabatan}</td>
                    <td className="px-5 py-2.5 text-right text-on-surface font-semibold text-sm">
                      {formatCurrency(j.gaji_pokok || 0)}
                    </td>
                    <td className="px-5 py-2.5 text-right text-on-surface font-semibold text-sm">
                      {formatCurrency(j.gaji_per_jam || 0)}
                    </td>
                    <td className="px-5 py-2.5 text-right text-on-surface font-semibold text-sm">
                      {formatCurrency(j.lembur_per_jam || 0)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => openConfigEdit(j)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                        title="Atur Skema Gaji"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PROCESS PAYROLL MODAL */}
      {processModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div>
                <h2 className="font-bold text-on-surface text-lg">Proses Bisyaroh Abdi</h2>
                <p className="text-on-surface-variant/60 text-xs mt-0.5">
                  Periode {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>
              <button 
                onClick={() => setProcessModalUser(null)} 
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Profile card summary */}
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-on-surface text-sm">{processModalUser.nama_user}</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">{processModalUser.jabatan} — {processModalUser.nama_cabang}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-on-surface block">Kehadiran: {processModalUser.hari_kerja} Hari</span>
                  <span className="text-on-surface-variant block mt-0.5">Total Jam: {processModalUser.total_jam_kerja} jam</span>
                </div>
              </div>

              {/* Loan information */}
              {processModalUser.outstanding_loan > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Abdi Memiliki Hutang Aktif:</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700">{formatCurrency(processModalUser.outstanding_loan)}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-on-surface font-semibold flex-shrink-0">Potong Gaji:</label>
                    <input
                      type="number"
                      value={formPotongHutang || ""}
                      onChange={(e) => {
                        const val = Math.min(processModalUser.outstanding_loan, Math.max(0, parseInt(e.target.value) || 0));
                        setFormPotongHutang(val);
                        // Also automatically update deduction
                        setFormPotongan(val);
                      }}
                      className="bg-surface border border-outline-variant/40 text-on-surface rounded-lg px-2.5 py-1 text-xs w-full focus:outline-none focus:border-primary/80"
                      placeholder="Masukkan jumlah potongan"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const amount = Math.min(processModalUser.outstanding_loan, calculateTotalBisyaroh() - 10000); // Leave at least 10k
                        const val = Math.max(0, amount);
                        setFormPotongHutang(val);
                        setFormPotongan(val);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-on-primary text-[10px] px-2.5 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer"
                    >
                      Potong Max
                    </button>
                  </div>
                </div>
              )}

              {/* Form Inputs */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Gaji Pokok</label>
                  <input
                    type="number"
                    value={formGajiPokok || ""}
                    onChange={(e) => setFormGajiPokok(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80"
                  />
                  <p className="text-[10px] text-on-surface-variant/60 mt-1">Skema Flat Jabatan</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Gaji Kehadiran (Per Jam)</label>
                  <input
                    type="number"
                    value={formGajiKehadiran || ""}
                    onChange={(e) => setFormGajiKehadiran(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80"
                  />
                  <p className="text-[10px] text-on-surface-variant/60 mt-1">
                    Config: {formatCurrency(processModalUser.gaji_per_jam)}/j ({processModalUser.total_jam_kerja} jam)
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Uang Lembur</label>
                  <input
                    type="number"
                    value={formGajiLembur || ""}
                    onChange={(e) => setFormGajiLembur(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80"
                  />
                  <p className="text-[10px] text-on-surface-variant/60 mt-1">
                    Config: {formatCurrency(processModalUser.lembur_per_jam)}/j ({processModalUser.total_jam_lembur} jam)
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Tunjangan / Bonus</label>
                  <input
                    type="number"
                    value={formTunjangan || ""}
                    onChange={(e) => setFormTunjangan(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80"
                    placeholder="Bonus tunjangan"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Potongan Lain-Lain</label>
                  <input
                    type="number"
                    value={formPotongan || ""}
                    onChange={(e) => setFormPotongan(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80"
                    placeholder="Potongan kasbon / absensi dsb"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Sumber Dana Pembayaran (Kas/Bank)</label>
                  <select
                    value={formRekeningId}
                    onChange={(e) => setFormRekeningId(parseInt(e.target.value))}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80 font-semibold cursor-pointer"
                  >
                    {coaList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.kode_akun} — {c.nama_akun}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Catatan Slip</label>
                  <input
                    type="text"
                    value={formCatatan}
                    onChange={(e) => setFormCatatan(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-primary/5 rounded-xl border border-primary/10 p-5 mt-2 flex justify-between items-center">
                <span className="font-bold text-on-surface text-sm">Total Gaji Bersih:</span>
                <span className="text-xl font-extrabold text-primary">{formatCurrency(calculateTotalBisyaroh())}</span>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-low text-xs">
              <button 
                onClick={() => setProcessModalUser(null)} 
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-3 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSavePayroll} 
                disabled={savingPayroll}
                className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-3 rounded-xl font-bold shadow-lg shadow-primary/15 transition-all cursor-pointer"
              >
                {savingPayroll ? "Menyimpan & Menjurnal..." : "Bayar & Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SLIP / PRINT MODAL */}
      {viewSlipUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden my-8">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low no-print">
              <h2 className="font-bold text-on-surface text-lg">Slip Bisyaroh Abdi</h2>
              <button 
                onClick={() => setViewSlipUser(null)} 
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip content area */}
            <div id="print-area" className="p-8 space-y-6 bg-surface text-on-surface">
              {/* Header Slip */}
              <div className="flex justify-between items-start border-b-2 border-outline-variant/50 pb-4">
                <div className="flex gap-4 items-center">
                  <Logo size="sm" className="w-14 h-14 border-0 shadow-none bg-transparent" />
                  <div>
                    <h2 className="text-xl font-extrabold text-primary uppercase tracking-wide">PERUSAHAAN AL-MUBAROK</h2>
                    <p className="text-xs text-on-surface-variant/80 mt-1 font-semibold">Pondok Pesantren Al-Mubarok Sukowono Jember</p>
                    <p className="text-[10px] text-on-surface-variant/60">Jl. Kyai Haji Achmad Shiddiq No. 12, Sukowono</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-base font-bold text-on-surface uppercase tracking-wider">SLIP BISYAROH (GAJI)</h3>
                  <p className="text-xs text-on-surface-variant/80 mt-1">Periode: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-0.5">Tanggal Bayar: {viewSlipUser.tanggal_bayar ? new Date(viewSlipUser.tanggal_bayar).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</p>
                </div>
              </div>

              {/* Employee Summary info */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-outline-variant/20 pb-4">
                <div className="space-y-1">
                  <p><span className="text-on-surface-variant/60 font-medium inline-block w-24">Nama Abdi</span>: <strong className="text-on-surface font-semibold">{viewSlipUser.nama_user}</strong></p>
                  <p><span className="text-on-surface-variant/60 font-medium inline-block w-24">ID Abdi</span>: <span className="font-semibold">{viewSlipUser.kode_user}</span></p>
                </div>
                <div className="space-y-1 text-right md:text-left">
                  <p><span className="text-on-surface-variant/60 font-medium inline-block w-24">Jabatan</span>: <span className="font-semibold">{viewSlipUser.jabatan}</span></p>
                  <p><span className="text-on-surface-variant/60 font-medium inline-block w-24">Cabang</span>: <span className="font-semibold">{viewSlipUser.nama_cabang}</span></p>
                </div>
              </div>

              {/* Slip details grid */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                {/* Earnings Column */}
                <div className="space-y-3">
                  <h4 className="font-bold text-primary border-b border-outline-variant/20 pb-1 uppercase tracking-wider text-[10px]">Penerimaan / Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant/80">Gaji Pokok</span>
                      <span className="font-semibold">{formatCurrency(viewSlipUser.gaji_pokok)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-on-surface-variant/80 block">Gaji Kehadiran</span>
                        <span className="text-[10px] text-on-surface-variant/50 block">({viewSlipUser.total_jam_kerja} jam x {formatCurrency(viewSlipUser.gaji_per_jam)}/j)</span>
                      </div>
                      <span className="font-semibold self-end">{formatCurrency(viewSlipUser.gaji_kehadiran)}</span>
                    </div>
                    {viewSlipUser.gaji_lembur > 0 && (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-on-surface-variant/80 block">Uang Lembur</span>
                          <span className="text-[10px] text-on-surface-variant/50 block">({viewSlipUser.total_jam_lembur} jam x {formatCurrency(viewSlipUser.lembur_per_jam)}/j)</span>
                        </div>
                        <span className="font-semibold self-end">{formatCurrency(viewSlipUser.gaji_lembur)}</span>
                      </div>
                    )}
                    {viewSlipUser.tunjangan > 0 && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant/80">Tunjangan / Bonus</span>
                        <span className="font-semibold">{formatCurrency(viewSlipUser.tunjangan)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="space-y-3">
                  <h4 className="font-bold text-error border-b border-outline-variant/20 pb-1 uppercase tracking-wider text-[10px]">Potongan / Deductions</h4>
                  <div className="space-y-2">
                    {viewSlipUser.potongan > 0 ? (
                      <div className="flex justify-between">
                        <div>
                          <span className="text-on-surface-variant/80 block">Potongan Gaji</span>
                          <span className="text-[10px] text-on-surface-variant/50 block">Potongan kasbon / pinjaman</span>
                        </div>
                        <span className="font-semibold text-error self-end">-{formatCurrency(viewSlipUser.potongan)}</span>
                      </div>
                    ) : (
                      <p className="text-on-surface-variant/40 italic py-2 text-center">Tidak ada potongan</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="border-t-2 border-dashed border-outline-variant/60 pt-4 mt-6 grid grid-cols-2 gap-6 text-xs">
                <div>
                  <p className="font-bold text-on-surface-variant">Catatan Pembayaran:</p>
                  <p className="text-[11px] text-on-surface-variant/70 italic mt-1 bg-surface-container/35 p-2 rounded-lg border border-outline-variant/25">
                    {viewSlipUser.catatan || "—"}
                  </p>
                </div>
                <div className="flex flex-col justify-end items-end gap-1.5">
                  <div className="flex justify-between w-full border-b border-outline-variant/20 pb-1.5">
                    <span className="text-on-surface-variant/70">Total Penerimaan Kotor:</span>
                    <span className="font-semibold">{formatCurrency(viewSlipUser.gaji_pokok + viewSlipUser.gaji_kehadiran + viewSlipUser.gaji_lembur + viewSlipUser.tunjangan)}</span>
                  </div>
                  <div className="flex justify-between w-full border-b border-outline-variant/20 pb-1.5">
                    <span className="text-on-surface-variant/70">Total Potongan:</span>
                    <span className="font-semibold text-error">-{formatCurrency(viewSlipUser.potongan)}</span>
                  </div>
                  <div className="flex justify-between w-full pt-1">
                    <span className="font-bold text-on-surface text-sm">Gaji Bersih Diterima:</span>
                    <span className="text-lg font-extrabold text-primary">{formatCurrency(viewSlipUser.total_diterima)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <p className="text-on-surface-variant/70">Dibuat Oleh,</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-on-surface-variant/50 pt-1 inline-block px-6">Bendahara</p>
                </div>
                <div></div>
                <div>
                  <p className="text-on-surface-variant/70">Diterima Oleh,</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-on-surface-variant/50 pt-1 inline-block px-6">{viewSlipUser.nama_user}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-low text-xs no-print">
              <button 
                onClick={() => setViewSlipUser(null)} 
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-3 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={handlePrint} 
                className="flex-1 bg-primary hover:bg-primary/95 text-on-primary py-3 rounded-xl font-bold shadow-lg shadow-primary/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Slip Gaji
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONFIG MODAL */}
      {editConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div>
                <h2 className="font-bold text-on-surface">Skema Gaji Jabatan</h2>
                <p className="text-on-surface-variant/60 text-xs mt-0.5">{editConfig.jabatan}</p>
              </div>
              <button 
                onClick={() => setEditConfig(null)} 
                className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Gaji Pokok (Flat Bulanan)</label>
                <input
                  type="number"
                  value={configGajiPokok || ""}
                  onChange={(e) => setConfigGajiPokok(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80 font-semibold"
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Gaji Kehadiran Per Jam (Aktif Kerja)</label>
                <input
                  type="number"
                  value={configGajiPerJam || ""}
                  onChange={(e) => setConfigGajiPerJam(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80 font-semibold"
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Gaji Lembur Per Jam</label>
                <input
                  type="number"
                  value={configLemburPerJam || ""}
                  onChange={(e) => setConfigLemburPerJam(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/80 font-semibold"
                  placeholder="Rp 0"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 bg-surface-container-low text-xs">
              <button 
                onClick={() => setEditConfig(null)} 
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveConfig} 
                disabled={savingConfig}
                className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl font-bold shadow-md shadow-primary/10 cursor-pointer"
              >
                {savingConfig ? "Menyimpan..." : "Simpan Skema"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
