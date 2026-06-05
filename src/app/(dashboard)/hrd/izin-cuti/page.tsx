"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface IzinCuti {
  id: number;
  user_id: number;
  jenis: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string | null;
  status: string;
  tanggal_pengajuan: string | null;
  catatan_approval: string | null;
  nama_user: string | null;
}

const JENIS_LABELS: Record<string, string> = {
  izin: "Izin",
  cuti: "Cuti",
  sakit: "Sakit",
  lainnya: "Lainnya",
};

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export default function IzinCutiPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [data, setData] = useState<IzinCuti[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [approveModal, setApproveModal] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [catatanApproval, setCatatanApproval] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hrd/izin-cuti?status=${activeTab}`);
    const json = await res.json();
    setData(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!approveModal) return;
    await fetch(`/api/hrd/izin-cuti/${approveModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: approveModal.action,
        catatan_approval: catatanApproval,
      }),
    });
    setApproveModal(null);
    setCatatanApproval("");
    fetchData();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-background flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Izin & Cuti
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{total} pengajuan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface p-2.5 rounded-xl transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4 text-primary" />
          </button>
          {can_create && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ajukan
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl w-fit border border-outline-variant/45 shadow-inner">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.value
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex-1 min-h-0 overflow-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant/60 font-medium">Tidak ada pengajuan</div>
        ) : data.map((item) => (
          <div key={item.id} className="bg-surface border border-outline-variant/35 rounded-2xl p-5 hover:border-outline-variant/60 shadow-sm transition-all duration-150">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-on-surface text-base">{item.nama_user}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusColor(item.status)}`}>
                    {item.status === "pending" ? "Menunggu" : item.status === "approved" ? "Disetujui" : "Ditolak"}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-surface-container-high text-on-surface border border-outline-variant/40">
                    {JENIS_LABELS[item.jenis] || item.jenis}
                  </span>
                </div>
                <p className="text-on-surface-variant text-sm font-medium">
                  {formatDate(item.tanggal_mulai)} — {formatDate(item.tanggal_selesai)}
                </p>
                {item.keterangan && (
                  <p className="text-on-surface-variant/75 text-sm italic font-serif bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20 inline-block">&ldquo;{item.keterangan}&rdquo;</p>
                )}
                {item.catatan_approval && (
                  <p className="text-on-surface-variant/80 text-xs font-medium block">
                    <span className="text-primary font-bold">Catatan Approval:</span> {item.catatan_approval}
                  </p>
                )}
              </div>

              {item.status === "pending" && (
                <div className="flex gap-2">
                  {can_update && (
                    <button
                      onClick={() => setApproveModal({ id: item.id, action: "approve" })}
                      className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Setujui
                    </button>
                  )}
                  {can_update && (
                    <button
                      onClick={() => setApproveModal({ id: item.id, action: "reject" })}
                      className="flex items-center gap-1.5 bg-error/10 hover:bg-error/20 border border-error/20 text-error px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Approval Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">
                {approveModal.action === "approve" ? "✅ Setujui Pengajuan" : "❌ Tolak Pengajuan"}
              </h2>
              <button onClick={() => setApproveModal(null)} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors cursor-pointer">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Catatan (opsional)</label>
                <textarea
                  value={catatanApproval}
                  onChange={(e) => setCatatanApproval(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 resize-none"
                  placeholder="Catatan untuk abdi..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setApproveModal(null)} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
                <button
                  onClick={handleApprove}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${approveModal.action === "approve" ? "bg-primary hover:bg-primary/95 shadow-primary/10" : "bg-error hover:bg-error/90 shadow-error/10"} cursor-pointer`}
                >
                  {approveModal.action === "approve" ? "Setujui" : "Tolak"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showModal && <PengajuanModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData(); }} />}
    </div>
  );
}

function PengajuanModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [users, setUsers] = useState<{ id: number; nama_user: string }[]>([]);
  const [form, setForm] = useState({ user_id: "", jenis: "izin", tanggal_mulai: "", tanggal_selesai: "", keterangan: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/hrd/users?limit=200").then(r => r.json()).then(d => setUsers(d.data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/hrd/izin-cuti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, user_id: parseInt(form.user_id) }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-semibold text-on-surface">Ajukan Izin / Cuti</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors cursor-pointer">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Abdi</label>
            <select value={form.user_id} onChange={(e) => setForm(f => ({ ...f, user_id: e.target.value }))} required
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer">
              <option value="">— Pilih Abdi —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.nama_user}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Jenis</label>
            <select value={form.jenis} onChange={(e) => setForm(f => ({ ...f, jenis: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer">
              {Object.entries(JENIS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {[
            { label: "Tanggal Mulai", key: "tanggal_mulai" },
            { label: "Tanggal Selesai", key: "tanggal_selesai" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">{label}</label>
              <input type="date" value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} required
                className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Keterangan</label>
            <textarea value={form.keterangan} onChange={(e) => setForm(f => ({ ...f, keterangan: e.target.value }))} rows={3} placeholder="Alasan pengajuan..."
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 cursor-pointer">
              {saving ? "Menyimpan..." : "Ajukan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
