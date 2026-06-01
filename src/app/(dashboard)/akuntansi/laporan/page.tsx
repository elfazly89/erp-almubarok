"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calendar,
  Search,
  RefreshCw,
  BookOpen,
  DollarSign,
  TrendingUp,
  Scale,
  Printer,
  ChevronRight,
  TrendingDown,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Account {
  id: number;
  kode_akun: string;
  nama_akun: string;
  posisi_saldo_normal: "DEBIT" | "KREDIT" | null;
}

interface LedgerTx {
  id: number;
  tanggal_transaksi: string;
  no_referensi_bukti: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  nama_cabang: string;
}

interface TrialBalanceItem {
  id: number;
  kode_akun: string;
  nama_akun: string;
  tipe: string;
  posisi_saldo_normal: "DEBIT" | "KREDIT";
  debit: number;
  kredit: number;
}

interface ProfitLossItem {
  id: number;
  kode_akun: string;
  nama_akun: string;
  total: number;
}

interface ProfitLossData {
  revenues: ProfitLossItem[];
  expenses: ProfitLossItem[];
  trend: { month: string; pendapatan: number; beban: number }[];
}

interface BalanceSheetItem {
  id: number;
  kode_akun: string;
  nama_akun: string;
  total: number;
}

interface BalanceSheetData {
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equities: BalanceSheetItem[];
  retained_earnings: number;
}

export default function LaporanAkuntansiPage() {
  const [activeTab, setActiveTab] = useState<"ledger" | "trial-balance" | "profit-loss" | "balance-sheet">("ledger");

  // Date Filters (default to current month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Master Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAkunId, setSelectedAkunId] = useState<string>("");

  // Ledger States
  const [ledgerData, setLedgerData] = useState<{ account: Account; saldo_awal: number; transactions: LedgerTx[] } | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Trial Balance States
  const [trialData, setTrialData] = useState<TrialBalanceItem[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);

  // P&L States
  const [plData, setPlData] = useState<ProfitLossData | null>(null);
  const [plLoading, setPlLoading] = useState(false);

  // Balance Sheet States
  const [bsData, setBsData] = useState<BalanceSheetData | null>(null);
  const [bsLoading, setBsLoading] = useState(false);

  // Fetch CoA accounts list for Ledger dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/akuntansi/daftar-akun");
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
          if (data.length > 0) {
            setSelectedAkunId(data[0].id.toString());
          }
        }
      } catch (e) {
        console.error("Gagal memuat akun CoA", e);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch Data Buku Besar
  const fetchLedger = useCallback(async () => {
    if (!selectedAkunId) return;
    setLedgerLoading(true);
    try {
      const url = `/api/akuntansi/laporan?type=ledger&akunId=${selectedAkunId}&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        setLedgerData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  }, [selectedAkunId, startDate, endDate]);

  // Fetch Neraca Saldo
  const fetchTrialBalance = useCallback(async () => {
    setTrialLoading(true);
    try {
      const url = `/api/akuntansi/laporan?type=trial-balance&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        setTrialData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrialLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch Laba Rugi
  const fetchProfitLoss = useCallback(async () => {
    setPlLoading(true);
    try {
      const url = `/api/akuntansi/laporan?type=profit-loss&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        setPlData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPlLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch Neraca
  const fetchBalanceSheet = useCallback(async () => {
    setBsLoading(true);
    try {
      const url = `/api/akuntansi/laporan?type=balance-sheet&endDate=${endDate}`;
      const res = await fetch(url);
      if (res.ok) {
        setBsData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBsLoading(false);
    }
  }, [endDate]);

  // Load active tab data
  useEffect(() => {
    if (activeTab === "ledger") fetchLedger();
    else if (activeTab === "trial-balance") fetchTrialBalance();
    else if (activeTab === "profit-loss") fetchProfitLoss();
    else if (activeTab === "balance-sheet") fetchBalanceSheet();
  }, [activeTab, fetchLedger, fetchTrialBalance, fetchProfitLoss, fetchBalanceSheet]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  // Hitung kumulatif saldo berjalan Buku Besar
  const getRunningBalanceList = () => {
    if (!ledgerData) return [];
    let current = ledgerData.saldo_awal;
    const isDebit = ledgerData.account.posisi_saldo_normal === "DEBIT";

    return ledgerData.transactions.map((tx) => {
      if (isDebit) {
        current += tx.debit - tx.kredit;
      } else {
        current += tx.kredit - tx.debit;
      }
      return { ...tx, saldoBerjalan: current };
    });
  };

  const runningTransactions = getRunningBalanceList();

  // P&L Math
  const totalRevenue = plData?.revenues.reduce((sum, item) => sum + item.total, 0) || 0;
  const totalExpense = plData?.expenses.reduce((sum, item) => sum + item.total, 0) || 0;
  const netProfit = totalRevenue - totalExpense;

  // Balance Sheet Math
  const totalAsset = bsData?.assets.reduce((sum, item) => sum + item.total, 0) || 0;
  const totalLiability = bsData?.liabilities.reduce((sum, item) => sum + item.total, 0) || 0;
  const totalEquity = (bsData?.equities.reduce((sum, item) => sum + item.total, 0) || 0) + (bsData?.retained_earnings || 0);

  return (
    <div className="space-y-6 text-on-background print:space-y-4 print:text-black">
      {/* Title & Print Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Scale className="w-7 h-7 text-primary" /> Laporan & Buku Besar Keuangan
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Pantau dan analisis kesehatan arus kas, profit, dan neraca perusahaan
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 text-primary" /> Cetak Laporan Resmi
        </button>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center border-b-2 border-double border-gray-400 pb-3 mb-6">
        <h1 className="text-2xl font-extrabold tracking-wider text-black">ERP AL-MUBAROK</h1>
        <p className="text-sm font-bold text-gray-700">Pondok Pesantren Al-Mubarok</p>
        <p className="text-xs text-gray-500">Laporan Keuangan Resmi & Akuntansi Terpadu</p>
        <div className="text-[10px] text-gray-500 mt-2">
          Rentang Laporan: {new Date(startDate).toLocaleDateString("id-ID")} s/d {new Date(endDate).toLocaleDateString("id-ID")}
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-surface-container/60 p-4 border border-outline-variant/40 rounded-2xl flex flex-wrap items-center gap-4 print:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface-variant">Periode Laporan:</span>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-on-surface-variant/60 text-xs">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {activeTab === "ledger" && (
          <div className="flex items-center gap-2 flex-1 md:justify-end">
            <span className="text-xs font-semibold text-on-surface-variant">Pilih Akun:</span>
            <select
              value={selectedAkunId}
              onChange={(e) => setSelectedAkunId(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs max-w-xs focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.kode_akun} — {acc.nama_akun}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* REPORT DESK MULTI-TAB CONTROLLERS */}
      <div className="flex border-b border-outline-variant/30 print:hidden overflow-x-auto gap-2">
        {(
          [
            { id: "ledger", label: "Buku Besar", icon: <BookOpen className="w-4 h-4" /> },
            { id: "trial-balance", label: "Neraca Saldo", icon: <Scale className="w-4 h-4" /> },
            { id: "profit-loss", label: "Laba Rugi", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "balance-sheet", label: "Neraca Keuangan", icon: <Scale className="w-4 h-4" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold transition-all duration-150 shrink-0 ${
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT SPACE */}
      <div className="bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-xl p-6 print:border-0 print:shadow-none print:p-0">
        
        {/* 1. TAB BUKU BESAR */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 print:pb-2">
              <div>
                <h2 className="text-lg font-bold text-on-surface print:text-black">Buku Besar Pembantu</h2>
                <span className="text-xs text-on-surface-variant print:text-gray-500 font-mono">
                  {ledgerData?.account.kode_akun} — {ledgerData?.account.nama_akun} ({ledgerData?.account.posisi_saldo_normal})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-on-surface-variant uppercase block font-semibold">Saldo Awal</span>
                <span className="text-base font-bold text-primary font-mono print:text-black">
                  {formatRupiah(ledgerData?.saldo_awal || 0)}
                </span>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Mengolah jurnal buku besar...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/40 print:bg-gray-100">
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black w-28">Tanggal</th>
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black w-36">Referensi</th>
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black">Keterangan</th>
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black w-24">Cabang</th>
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider text-right print:text-black w-32">Debit (Rp)</th>
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider text-right print:text-black w-32">Kredit (Rp)</th>
                      <th className="px-4 py-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider text-right print:text-black w-36">Saldo Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    <tr className="bg-primary/5 hover:bg-primary/10 transition-colors font-semibold print:bg-gray-50">
                      <td className="px-4 py-3 text-on-surface-variant print:text-gray-600 font-mono">—</td>
                      <td className="px-4 py-3 text-primary font-mono">Saldo Awal</td>
                      <td className="px-4 py-3 text-on-surface-variant">Saldo akumulatif sebelum periode ini</td>
                      <td className="px-4 py-3 text-on-surface-variant">—</td>
                      <td className="px-4 py-3 text-right font-mono text-on-surface-variant">—</td>
                      <td className="px-4 py-3 text-right font-mono text-on-surface-variant">—</td>
                      <td className="px-4 py-3 text-right font-mono text-primary font-bold print:text-black">
                        {formatRupiah(ledgerData?.saldo_awal || 0)}
                      </td>
                    </tr>
                    {runningTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant text-xs">
                          Tidak ada aktivitas jurnal selama rentang tanggal ini.
                        </td>
                      </tr>
                    ) : (
                      runningTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-surface-container-high/15 transition-colors print:hover:bg-transparent">
                          <td className="px-4 py-3 text-on-surface-variant print:text-gray-600">
                            {new Date(tx.tanggal_transaksi).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-primary font-mono font-medium print:text-black">{tx.no_referensi_bukti}</span>
                          </td>
                          <td className="px-4 py-3 text-on-surface print:text-black max-w-xs truncate" title={tx.deskripsi}>
                            {tx.deskripsi}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-[11px] print:text-gray-600">
                            {tx.nama_cabang || "Pusat"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-on-surface print:text-black">
                            {tx.debit > 0 ? formatRupiah(tx.debit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-on-surface print:text-black">
                            {tx.kredit > 0 ? formatRupiah(tx.kredit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-primary font-bold print:text-black">
                            {formatRupiah(tx.saldoBerjalan)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. TAB NERACA SALDO */}
        {activeTab === "trial-balance" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 print:pb-2">
              <div>
                <h2 className="text-lg font-bold text-on-surface print:text-black">Neraca Saldo (Trial Balance)</h2>
                <span className="text-xs text-on-surface-variant print:text-gray-500">
                  Daftar akumulasi debit dan kredit per akun buku besar
                </span>
              </div>
            </div>

            {trialLoading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Menyusun neraca saldo...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/40 print:bg-gray-100">
                      <th className="px-5 py-3.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black w-40">Kode Akun</th>
                      <th className="px-5 py-3.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black">Nama Akun Buku Besar</th>
                      <th className="px-5 py-3.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider print:text-black w-36">Tipe Akun</th>
                      <th className="px-5 py-3.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider text-right print:text-black w-48">Total Debit (Rp)</th>
                      <th className="px-5 py-3.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider text-right print:text-black w-48">Total Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {trialData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-xs">
                          Tidak ada aktivitas akun pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      trialData.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-high/15 transition-colors print:hover:bg-transparent">
                          <td className="px-5 py-3.5">
                            <span className="text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 print:text-black print:bg-transparent print:border-0 print:p-0">
                              {item.kode_akun}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-on-surface font-semibold print:text-black">{item.nama_akun}</td>
                          <td className="px-5 py-3.5 text-on-surface-variant print:text-gray-600">{item.tipe}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold text-on-surface print:text-black">
                            {item.debit > 0 ? formatRupiah(item.debit) : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold text-on-surface print:text-black">
                            {item.kredit > 0 ? formatRupiah(item.kredit) : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-container-low font-bold border-t-2 border-outline-variant/40 print:bg-gray-150">
                      <td colSpan={3} className="px-5 py-4 text-on-surface-variant text-right uppercase tracking-wider">Total Neraca Saldo</td>
                      <td className="px-5 py-4 text-right font-mono text-primary text-[14px] font-extrabold print:text-black">
                        {formatRupiah(trialData.reduce((sum, item) => sum + item.debit, 0))}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-primary text-[14px] font-extrabold print:text-black">
                        {formatRupiah(trialData.reduce((sum, item) => sum + item.kredit, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. TAB LABA RUGI */}
        {activeTab === "profit-loss" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 print:pb-2">
              <div>
                <h2 className="text-lg font-bold text-on-surface print:text-black">Laporan Laba Rugi (Profit & Loss Statement)</h2>
                <span className="text-xs text-on-surface-variant print:text-gray-500">
                  Rangkuman seluruh pendapatan dan pengeluaran beban operasional
                </span>
              </div>
            </div>

            {plLoading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memproses laba rugi bulanan...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Cards Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                  <div className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Pendapatan</span>
                      <strong className="text-lg font-bold block text-primary font-mono mt-1 print:text-black">
                        {formatRupiah(totalRevenue)}
                      </strong>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Pengeluaran Beban</span>
                      <strong className="text-lg font-bold block text-error font-mono mt-1 print:text-black">
                        {formatRupiah(totalExpense)}
                      </strong>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>

                  <div className={`border p-5 rounded-2xl flex items-center justify-between ${
                    netProfit >= 0
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : "bg-error/5 border-error/20 text-error"
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Laba Bersih Bersih</span>
                      <strong className="text-lg font-bold block font-mono mt-1 print:text-black">
                        {formatRupiah(netProfit)}
                      </strong>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      netProfit >= 0 ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                    }`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Trend Charts Section (Recharts) */}
                {plData?.trend && plData.trend.length > 0 && (
                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl print:hidden">
                    <h3 className="text-sm font-semibold text-on-surface mb-4">Tren Perbandingan Bulanan</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={plData.trend}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tickFormatter={(v) => `Rp ${v/1000}k`} tick={{ fontSize: 10 }} />
                          <ChartTooltip formatter={(v) => formatRupiah(v as number)} />
                          <Legend />
                          <Bar dataKey="pendapatan" fill="var(--color-primary, #6200EE)" name="Pendapatan" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="beban" fill="var(--color-error, #B00020)" name="Beban" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Detailed Table Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
                  {/* Revenue Segment */}
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                    <div className="bg-surface-container-low border-b border-outline-variant/30 px-4 py-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold text-on-surface print:text-black">Akun Pendapatan</h4>
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-outline-variant/20">
                        {plData?.revenues.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-container-high/10">
                            <td className="px-4 py-3">
                              <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] mr-2 print:text-black print:bg-transparent print:border-0 print:p-0">{item.kode_akun}</span>
                              <span className="text-on-surface print:text-black">{item.nama_akun}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-on-surface print:text-black">{formatRupiah(item.total)}</td>
                          </tr>
                        ))}
                        {plData?.revenues.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-8 text-center text-on-surface-variant">Belum ada catatan pendapatan</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-container-low font-bold border-t border-outline-variant/30">
                          <td className="px-4 py-3 text-on-surface">Total Pendapatan</td>
                          <td className="px-4 py-3 text-right font-mono text-primary print:text-black">{formatRupiah(totalRevenue)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Expense Segment */}
                  <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                    <div className="bg-surface-container-low border-b border-outline-variant/30 px-4 py-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-error" />
                      <h4 className="text-xs font-bold text-on-surface print:text-black">Akun Pengeluaran Beban</h4>
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-outline-variant/20">
                        {plData?.expenses.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-container-high/10">
                            <td className="px-4 py-3">
                              <span className="font-mono text-error bg-error/10 px-1.5 py-0.5 rounded border border-error/20 text-[10px] mr-2 print:text-black print:bg-transparent print:border-0 print:p-0">{item.kode_akun}</span>
                              <span className="text-on-surface print:text-black">{item.nama_akun}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-on-surface print:text-black">{formatRupiah(item.total)}</td>
                          </tr>
                        ))}
                        {plData?.expenses.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-8 text-center text-on-surface-variant">Belum ada catatan beban</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-container-low font-bold border-t border-outline-variant/30">
                          <td className="px-4 py-3 text-on-surface">Total Pengeluaran Beban</td>
                          <td className="px-4 py-3 text-right font-mono text-error print:text-black">{formatRupiah(totalExpense)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB NERACA */}
        {activeTab === "balance-sheet" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 print:pb-2">
              <div>
                <h2 className="text-lg font-bold text-on-surface print:text-black">Neraca Keuangan (Balance Sheet)</h2>
                <span className="text-xs text-on-surface-variant print:text-gray-500">
                  Laporan posisi keuangan yang mencakup Aset, Kewajiban, dan Ekuitas Modal
                </span>
              </div>
            </div>

            {bsLoading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Mengkonsolidasikan neraca...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Balance Equation Status bar */}
                <div className="flex items-center gap-4 bg-surface-container/40 p-4 border border-outline-variant/20 rounded-2xl print:hidden">
                  <div className="flex-1 text-center border-r border-outline-variant/30">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold">Total Aset</span>
                    <strong className="text-base font-extrabold block text-primary font-mono mt-0.5">{formatRupiah(totalAsset)}</strong>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold">Total Kewajiban & Ekuitas</span>
                    <strong className="text-base font-extrabold block text-primary font-mono mt-0.5">{formatRupiah(totalLiability + totalEquity)}</strong>
                  </div>
                  <div className="flex-none bg-primary/10 border border-primary/20 text-primary text-xs px-4 py-2.5 rounded-xl font-bold font-mono">
                    Balanced (Seimbang)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                  {/* Left Column: ASSETS */}
                  <div className="space-y-4">
                    <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                      <div className="bg-surface-container-low border-b border-outline-variant/30 px-4 py-3 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-on-surface print:text-black">1. ASET (ASSETS)</h4>
                      </div>
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-outline-variant/20">
                          {bsData?.assets.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-container-high/10">
                              <td className="px-4 py-3">
                                <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] mr-2 print:text-black print:bg-transparent print:border-0 print:p-0">{item.kode_akun}</span>
                                <span className="text-on-surface print:text-black">{item.nama_akun}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-on-surface print:text-black">{formatRupiah(item.total)}</td>
                            </tr>
                          ))}
                          {bsData?.assets.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-on-surface-variant">Tidak ada aset terdaftar</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-surface-container-low font-bold border-t border-outline-variant/30">
                            <td className="px-4 py-3 text-on-surface">TOTAL ASET</td>
                            <td className="px-4 py-3 text-right font-mono text-primary print:text-black">{formatRupiah(totalAsset)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: LIABILITIES & EQUITIES */}
                  <div className="space-y-4">
                    {/* LIABILITIES */}
                    <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                      <div className="bg-surface-container-low border-b border-outline-variant/30 px-4 py-3 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-on-surface print:text-black">2. KEWAJIBAN (LIABILITIES)</h4>
                      </div>
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-outline-variant/20">
                          {bsData?.liabilities.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-container-high/10">
                              <td className="px-4 py-3">
                                <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] mr-2 print:text-black print:bg-transparent print:border-0 print:p-0">{item.kode_akun}</span>
                                <span className="text-on-surface print:text-black">{item.nama_akun}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-on-surface print:text-black">{formatRupiah(item.total)}</td>
                            </tr>
                          ))}
                          {bsData?.liabilities.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-on-surface-variant">Tidak ada kewajiban terdaftar</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-surface-container-low font-bold border-t border-outline-variant/30">
                            <td className="px-4 py-3 text-on-surface">TOTAL KEWAJIBAN</td>
                            <td className="px-4 py-3 text-right font-mono text-primary print:text-black">{formatRupiah(totalLiability)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* EQUITIES */}
                    <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface">
                      <div className="bg-surface-container-low border-b border-outline-variant/30 px-4 py-3 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-on-surface print:text-black">3. EKUITAS (EQUITIES)</h4>
                      </div>
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-outline-variant/20">
                          {bsData?.equities.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-container-high/10">
                              <td className="px-4 py-3">
                                <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] mr-2 print:text-black print:bg-transparent print:border-0 print:p-0">{item.kode_akun}</span>
                                <span className="text-on-surface print:text-black">{item.nama_akun}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-on-surface print:text-black">{formatRupiah(item.total)}</td>
                            </tr>
                          ))}
                          {/* Dynamic Period Income row */}
                          <tr className="hover:bg-surface-container-high/10 font-semibold text-primary print:text-black">
                            <td className="px-4 py-3">
                              <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] mr-2 print:text-black print:bg-transparent print:border-0 print:p-0">—</span>
                              <span>Laba Periode Berjalan (Retained Earnings)</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold">{formatRupiah(bsData?.retained_earnings || 0)}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-surface-container-low font-bold border-t border-outline-variant/30">
                            <td className="px-4 py-3 text-on-surface">TOTAL EKUITAS</td>
                            <td className="px-4 py-3 text-right font-mono text-primary print:text-black">{formatRupiah(totalEquity)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Final consolidated table for printing */}
                <div className="hidden print:block border border-gray-400 rounded-xl overflow-hidden mt-6 text-xs">
                  <table className="w-full font-bold">
                    <tbody>
                      <tr className="bg-gray-100 border-b border-gray-400">
                        <td className="px-5 py-3">TOTAL SELURUH ASET</td>
                        <td className="px-5 py-3 text-right font-mono text-[13px]">{formatRupiah(totalAsset)}</td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td className="px-5 py-3">TOTAL KEWAJIBAN & EKUITAS</td>
                        <td className="px-5 py-3 text-right font-mono text-[13px]">{formatRupiah(totalLiability + totalEquity)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* PRINT-ONLY FOOTER SIGNATURES */}
      <div className="hidden print:grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-8 border-t border-gray-300">
        <div>
          <p className="text-gray-500 mb-16">Dibuat & Diverifikasi Oleh,</p>
          <strong className="text-black underline">ACH FAWAID BAQIR</strong>
          <span className="text-gray-500 block text-[10px] mt-0.5">Bendahara / Super User</span>
        </div>
        <div>
          <p className="text-gray-500 mb-16">Diketahui & Disetujui Oleh,</p>
          <strong className="text-black underline">Pengurus PP Al-Mubarok</strong>
          <span className="text-gray-500 block text-[10px] mt-0.5">Pimpinan Lembaga</span>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          header, nav, aside, footer, button, .print\\:hidden {
            display: none !important;
          }
          main, .print\\:space-y-4 {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
