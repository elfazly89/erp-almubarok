"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ArrowRightLeft,
  DollarSign,
  Layers,
  Calendar,
  FileText,
  Building2,
  User,
  PlusCircle,
  Trash,
  AlertTriangle
} from "lucide-react";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface Cabang {
  id_cabang: number;
  kode_cabang: string;
  nama_cabang: string;
}

interface DaftarAkun {
  id: number;
  kode_akun: string;
  nama_akun: string;
  nama_tipe_akun: string;
  status: string;
}

interface JurnalHeader {
  no_referensi_bukti: string;
  tanggal_transaksi: string;
  deskripsi: string;
  total_debit: number;
}

interface JurnalLineDetail {
  id: number;
  tanggal_transaksi: string;
  no_referensi_bukti: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  akun_id: number;
  kode_akun: string;
  nama_akun: string;
  cabang_id: number;
  nama_cabang: string;
  kode_cabang: string;
  dibuat_oleh_nama: string | null;
}

interface ManualEntryLine {
  akun_id: string;
  cabang_id: string;
  debit: number;
  kredit: number;
}

export default function JurnalPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [list, setList] = useState<JurnalHeader[]>([]);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [accounts, setAccounts] = useState<DaftarAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Transaction modals & dropdowns
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<"detail" | "bayar_beban" | "transfer_kas" | "jurnal_manual" | null>(null);
  
  // Quick forms states
  const [formDate, setFormDate] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formNominal, setFormNominal] = useState(0);
  const [formDebitAkun, setFormDebitAkun] = useState("");
  const [formKreditAkun, setFormKreditAkun] = useState("");
  const [formCabang, setFormCabang] = useState("");

  // Manual multi-line journal states
  const [manualLines, setManualLines] = useState<ManualEntryLine[]>([
    { akun_id: "", cabang_id: "", debit: 0, kredit: 0 },
    { akun_id: "", cabang_id: "", debit: 0, kredit: 0 }
  ]);

  // Detail Modal States
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [detailLines, setDetailLines] = useState<JurnalLineDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const jurnalRes = await fetch("/api/akuntansi/jurnal");
      const branchRes = await fetch("/api/cabang");
      const accRes = await fetch("/api/akuntansi/daftar-akun");

      if (jurnalRes.ok) setList(await jurnalRes.json());
      if (branchRes.ok) setCabangList(await branchRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle open quick modal
  const openQuickModal = (type: "bayar_beban" | "transfer_kas" | "jurnal_manual") => {
    setActionMenuOpen(false);
    setErrorMsg("");
    setSaving(false);
    
    // Default date to today
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
    setFormDesc("");
    setFormNominal(0);
    setFormDebitAkun("");
    setFormKreditAkun("");
    setFormCabang("");
    
    // Generate unique reference
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    
    if (type === "bayar_beban") {
      setFormRef(`EXP-${ts}`);
    } else if (type === "transfer_kas") {
      setFormRef(`TRF-${ts}`);
    } else if (type === "jurnal_manual") {
      setFormRef(`JV-${ts}`);
      setManualLines([
        { akun_id: "", cabang_id: "", debit: 0, kredit: 0 },
        { akun_id: "", cabang_id: "", debit: 0, kredit: 0 }
      ]);
    }
    
    setModalType(type);
  };

  // View journal details
  const viewDetail = async (ref: string) => {
    setSelectedRef(ref);
    setModalType("detail");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/akuntansi/jurnal/${encodeURIComponent(ref)}`);
      if (res.ok) {
        setDetailLines(await res.json());
      } else {
        setDetailLines([]);
      }
    } catch (e) {
      console.error(e);
      setDetailLines([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Save quick templates
  const handleSaveQuick = async () => {
    if (!formDate || !formRef || !formDesc.trim() || formNominal <= 0 || !formCabang) {
      setErrorMsg("Harap isi semua kolom dengan benar. Nominal harus lebih besar dari 0.");
      return;
    }

    if (modalType === "bayar_beban" && (!formDebitAkun || !formKreditAkun)) {
      setErrorMsg("Pilih Akun Kas/Bank dan Akun Beban.");
      return;
    }

    if (modalType === "transfer_kas" && (!formDebitAkun || !formKreditAkun)) {
      setErrorMsg("Pilih Akun Sumber dan Akun Tujuan.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        header: {
          tanggal_transaksi: formDate,
          no_referensi_bukti: formRef,
          deskripsi: formDesc,
        },
        entries: [
          {
            akun_id: formDebitAkun, // Debit side
            cabang_id: formCabang,
            debit: formNominal,
            kredit: 0,
          },
          {
            akun_id: formKreditAkun, // Credit side
            cabang_id: formCabang,
            debit: 0,
            kredit: formNominal,
          },
        ],
      };

      const res = await fetch("/api/akuntansi/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan transaksi");

      setModalType(null);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Gagal menyimpan transaksi");
    } finally {
      setSaving(false);
    }
  };

  // Save manual multi-line journal entry
  const handleSaveManual = async () => {
    if (!formDate || !formRef || !formDesc.trim()) {
      setErrorMsg("Harap isi tanggal, no. referensi, dan deskripsi.");
      return;
    }

    // Lines validation
    for (const line of manualLines) {
      if (!line.akun_id || !line.cabang_id) {
        setErrorMsg("Pilih Akun dan Cabang pada setiap baris.");
        return;
      }
      if (line.debit < 0 || line.kredit < 0) {
        setErrorMsg("Nilai nominal tidak boleh kurang dari nol.");
        return;
      }
      if (line.debit === 0 && line.kredit === 0) {
        setErrorMsg("Setiap baris harus memiliki nilai debit atau kredit.");
        return;
      }
    }

    const totalDebit = manualLines.reduce((sum, l) => sum + l.debit, 0);
    const totalKredit = manualLines.reduce((sum, l) => sum + l.kredit, 0);

    if (totalDebit <= 0) {
      setErrorMsg("Nilai nominal transaksi harus lebih besar dari nol.");
      return;
    }

    if (Math.abs(totalDebit - totalKredit) > 0.001) {
      setErrorMsg(`Jurnal tidak seimbang. Total Debit (${totalDebit.toLocaleString("id-ID")}) != Total Kredit (${totalKredit.toLocaleString("id-ID")}).`);
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        header: {
          tanggal_transaksi: formDate,
          no_referensi_bukti: formRef,
          deskripsi: formDesc,
        },
        entries: manualLines,
      };

      const res = await fetch("/api/akuntansi/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

      setModalType(null);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // Manage manual multi-line lines
  const addManualLine = () => {
    setManualLines([...manualLines, { akun_id: "", cabang_id: "", debit: 0, kredit: 0 }]);
  };

  const removeManualLine = (idx: number) => {
    if (manualLines.length <= 2) return;
    setManualLines(manualLines.filter((_, i) => i !== idx));
  };

  const updateManualLine = (idx: number, field: keyof ManualEntryLine, value: any) => {
    const updated = [...manualLines];
    if (field === "debit" || field === "kredit") {
      updated[idx][field] = parseInt(value) || 0;
    } else {
      updated[idx][field] = value;
    }
    setManualLines(updated);
  };

  const totalManualDebit = manualLines.reduce((sum, l) => sum + l.debit, 0);
  const totalManualKredit = manualLines.reduce((sum, l) => sum + l.kredit, 0);
  const isBalanced = totalManualDebit > 0 && totalManualDebit === totalManualKredit;

  // Filter list
  const filteredList = list.filter((item) => {
    return (
      item.no_referensi_bukti.toLowerCase().includes(search.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
      item.tanggal_transaksi.includes(search)
    );
  });

  // Filter accounts
  const assetAccounts = accounts.filter((a) => a.nama_tipe_akun === "Aset" && a.status === "Aktif");
  const expenseAccounts = accounts.filter((a) => a.nama_tipe_akun === "Beban" && a.status === "Aktif");

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Jurnal Umum (General Ledger)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{list.length} transaksi dibukukan</p>
        </div>

        {/* Dropdown Action Button */}
        <div className="relative">
          {can_create && (
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm shadow-primary-container/20"
            >
              <Plus className="w-4 h-4" /> Transaksi Baru <ChevronDown className="w-4 h-4" />
            </button>
          )}
          
          {actionMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActionMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-outline-variant bg-surface p-2 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => openQuickModal("bayar_beban")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-semibold text-xs leading-none">Bayar Beban</p>
                    <span className="text-[10px] text-on-surface-variant">Quick Expense Template</span>
                  </div>
                </button>
                <button
                  onClick={() => openQuickModal("transfer_kas")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container-high hover:text-on-surface transition-colors border-t border-outline-variant/30"
                >
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-semibold text-xs leading-none">Transfer Kas/Bank</p>
                    <span className="text-[10px] text-on-surface-variant">Quick Transfer Template</span>
                  </div>
                </button>
                <button
                  onClick={() => openQuickModal("jurnal_manual")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container-high hover:text-on-surface transition-colors border-t border-outline-variant/30"
                >
                  <Layers className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="font-semibold text-xs leading-none">Jurnal Manual (Lanjutan)</p>
                    <span className="text-[10px] text-on-surface-variant">Balanced Double-Entry Sheet</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center bg-surface-container/40 px-4 py-2 border border-outline-variant/30 rounded-xl shrink-0">
        <span className="text-on-surface-variant text-sm font-semibold">Daftar Jurnal Terkini</span>
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari referensi atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Memuat riwayat jurnal...
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-36">Tanggal</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider w-48">No. Referensi</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Deskripsi Transaksi</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-right w-44">Nilai Transaksi</th>
                <th className="px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                    Tidak ada transaksi jurnal tercatat.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-high/20 transition-colors">
                    <td className="px-5 py-2.5 text-on-surface-variant text-sm">
                      {new Date(item.tanggal_transaksi).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-primary font-mono text-sm bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {item.no_referensi_bukti}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-on-surface text-sm font-medium max-w-xs truncate" title={item.deskripsi}>
                      {item.deskripsi}
                    </td>
                    <td className="px-5 py-2.5 text-right text-primary font-mono font-bold text-sm">
                      Rp {item.total_debit.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <button
                        onClick={() => viewDetail(item.no_referensi_bukti)}
                        className="text-primary hover:text-primary-container text-xs font-semibold hover:underline"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* QUICK FORM: BAYAR BEBAN & TRANSFER KAS */}
      {(modalType === "bayar_beban" || modalType === "transfer_kas") && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">
                {modalType === "bayar_beban" ? "Catat Pembayaran Beban" : "Transfer Antar Kas/Bank"}
              </h2>
              <button onClick={() => setModalType(null)} className="text-on-surface-variant hover:text-on-surface text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-error/15 border border-error/25 text-error text-xs px-3.5 py-2.5 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">No. Referensi</label>
                  <input
                    type="text"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    readOnly
                  />
                </div>
              </div>

              {modalType === "bayar_beban" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Sumber Dana (Kas/Bank - Kredit)</label>
                    <select
                      value={formKreditAkun}
                      onChange={(e) => setFormKreditAkun(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Rekening Kas/Bank --</option>
                      {assetAccounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-surface-container text-on-surface">{a.kode_akun} - {a.nama_akun}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Beban Yang Dibayar (Debit)</label>
                    <select
                      value={formDebitAkun}
                      onChange={(e) => setFormDebitAkun(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Jenis Pengeluaran Beban --</option>
                      {expenseAccounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-surface-container text-on-surface">{a.kode_akun} - {a.nama_akun}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Kas/Bank Pengirim (Kredit)</label>
                    <select
                      value={formKreditAkun}
                      onChange={(e) => setFormKreditAkun(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Kas/Bank Pengirim --</option>
                      {assetAccounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-surface-container text-on-surface">{a.kode_akun} - {a.nama_akun}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Kas/Bank Penerima (Debit)</label>
                    <select
                      value={formDebitAkun}
                      onChange={(e) => setFormDebitAkun(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Kas/Bank Penerima --</option>
                      {assetAccounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-surface-container text-on-surface">{a.kode_akun} - {a.nama_akun}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={formNominal || ""}
                    onChange={(e) => setFormNominal(parseInt(e.target.value) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Contoh: 150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Cabang</label>
                  <select
                    value={formCabang}
                    onChange={(e) => setFormCabang(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Cabang --</option>
                    {cabangList.map((c) => (
                      <option key={c.id_cabang} value={c.id_cabang} className="bg-surface-container text-on-surface">{c.kode_cabang} - {c.nama_cabang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Deskripsi / Memo</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Contoh: Bayar air Sukosari Mei 2026"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalType(null)}
                  className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveQuick}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {saving ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE FORM: MANUAL DOUBLE-ENTRY SHEET */}
      {modalType === "jurnal_manual" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <h2 className="font-semibold text-on-surface">Buat Jurnal Manual</h2>
              <button onClick={() => setModalType(null)} className="text-on-surface-variant hover:text-on-surface text-lg">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {errorMsg && (
                <div className="bg-error/15 border border-error/25 text-error text-xs px-3.5 py-2.5 rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container/40 p-4 rounded-xl border border-outline-variant/30">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">No. Referensi Bukti</label>
                  <input
                    type="text"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Deskripsi Utama</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Deskripsi global jurnal..."
                  />
                </div>
              </div>

              {/* Dynamic Rows */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-on-surface">Rincian Akun & Kuantitas Transaksi</span>
                  <button
                    onClick={addManualLine}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-container font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                  {manualLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-surface-container-lowest border border-outline-variant/30 p-3.5 rounded-xl items-center">
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-semibold text-on-surface-variant mb-1 md:hidden">Akun Buku Besar</label>
                        <select
                          value={line.akun_id}
                          onChange={(e) => updateManualLine(idx, "akun_id", e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs"
                        >
                          <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Akun --</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id} className="bg-surface-container text-on-surface">{a.kode_akun} - {a.nama_akun}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-semibold text-on-surface-variant mb-1 md:hidden">Cabang</label>
                        <select
                          value={line.cabang_id}
                          onChange={(e) => updateManualLine(idx, "cabang_id", e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs"
                        >
                          <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Cabang --</option>
                          {cabangList.map((c) => (
                            <option key={c.id_cabang} value={c.id_cabang} className="bg-surface-container text-on-surface">{c.kode_cabang} - {c.nama_cabang}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-on-surface-variant mb-1 md:hidden">Debit (Rp)</label>
                        <input
                          type="number"
                          value={line.debit || ""}
                          onChange={(e) => updateManualLine(idx, "debit", e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono"
                          placeholder="Debit"
                          disabled={line.kredit > 0}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-on-surface-variant mb-1 md:hidden">Kredit (Rp)</label>
                        <input
                          type="number"
                          value={line.kredit || ""}
                          onChange={(e) => updateManualLine(idx, "kredit", e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant text-on-surface rounded-lg px-3 py-2 text-xs font-mono"
                          placeholder="Kredit"
                          disabled={line.debit > 0}
                        />
                      </div>

                      <div className="md:col-span-1 text-center">
                        <button
                          onClick={() => removeManualLine(idx)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-40"
                          disabled={manualLines.length <= 2}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Totalizer Panel */}
            <div className="bg-surface-container border-t border-outline-variant/40 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-6 text-sm font-semibold">
                <div>
                  <span className="text-on-surface-variant text-xs block uppercase font-medium">Total Debit</span>
                  <span className="text-on-surface font-mono text-base font-bold">Rp {totalManualDebit.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block uppercase font-medium">Total Kredit</span>
                  <span className="text-on-surface font-mono text-base font-bold">Rp {totalManualKredit.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block uppercase font-medium">Status Keseimbangan</span>
                  {isBalanced ? (
                    <span className="text-primary text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">Balanced / Seimbang</span>
                  ) : (
                    <span className="text-error text-xs px-2 py-0.5 rounded-full bg-error/10 border border-error/20">Unbalanced / Tidak Seimbang</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => setModalType(null)}
                  className="flex-1 md:flex-none bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveManual}
                  disabled={saving || !isBalanced}
                  className="flex-1 md:flex-none bg-primary hover:bg-primary-container text-on-primary px-8 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? "Menyimpan..." : "Simpan Jurnal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS VIEW MODAL */}
      {modalType === "detail" && selectedRef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-high/40">
              <div>
                <h2 className="font-semibold text-on-surface text-base">Rincian Transaksi Jurnal</h2>
                <span className="text-xs text-on-surface-variant font-mono">{selectedRef}</span>
              </div>
              <button onClick={() => setModalType(null)} className="text-on-surface-variant hover:text-on-surface text-lg">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12 text-on-surface-variant">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Mengambil rincian jurnal...
                </div>
              ) : detailLines.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  Tidak ada baris entri detail ditemukan.
                </div>
              ) : (
                <>
                  {/* Meta cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <span className="text-[10px] text-on-surface-variant uppercase block font-semibold">Tanggal Transaksi</span>
                        <span className="text-on-surface text-sm font-semibold">
                          {new Date(detailLines[0].tanggal_transaksi).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <span className="text-[10px] text-on-surface-variant uppercase block font-semibold">Dibuat Oleh</span>
                        <span className="text-on-surface text-sm font-semibold">{detailLines[0].dibuat_oleh_nama || "System / Admin"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] text-on-surface-variant uppercase block font-semibold mb-1">Deskripsi / Memo Transaksi</span>
                    <p className="text-on-surface text-sm leading-relaxed">{detailLines[0].deskripsi}</p>
                  </div>

                  {/* Lines table */}
                  <div className="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/40">
                          <th className="px-4 py-2.5 text-on-surface-variant font-semibold">Bagan Akun</th>
                          <th className="px-4 py-2.5 text-on-surface-variant font-semibold">Cabang</th>
                          <th className="px-4 py-2.5 text-on-surface-variant font-semibold text-right">Debit (Rp)</th>
                          <th className="px-4 py-2.5 text-on-surface-variant font-semibold text-right">Kredit (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {detailLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-high/10">
                            <td className="px-4 py-3">
                              <span className="font-mono text-primary mr-2 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{line.kode_akun}</span>
                              <span className="text-on-surface font-semibold">{line.nama_akun}</span>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">{line.nama_cabang}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-on-surface">
                              {line.debit > 0 ? `Rp ${line.debit.toLocaleString("id-ID")}` : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-on-surface">
                              {line.kredit > 0 ? `Rp ${line.kredit.toLocaleString("id-ID")}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-container-low font-bold border-t border-outline-variant/40">
                          <td colSpan={2} className="px-4 py-3 text-on-surface-variant text-right uppercase">Total Seimbang</td>
                          <td className="px-4 py-3 text-right font-mono text-primary text-[13px] font-bold">
                            Rp {detailLines.reduce((sum, l) => sum + l.debit, 0).toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-primary text-[13px] font-bold">
                            Rp {detailLines.reduce((sum, l) => sum + l.kredit, 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="bg-surface-container-high/40 px-6 py-4 border-t border-outline-variant/40 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

