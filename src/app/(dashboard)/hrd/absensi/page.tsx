"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  UserCheck, Plus, RefreshCw, Camera, MapPin, Clock,
  ChevronLeft, ChevronRight, QrCode, Loader2, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
import jsQR from "jsqr";
import { getStatusColor, formatDate } from "@/lib/utils";
import { useMenuPermissions } from "@/components/providers/PermissionProvider";

interface AbsensiRow {
  id: number;
  user_id: number;
  tanggal: string;
  jam: string;
  jenis: string;
  shift: string | null;
  latitude: string | null;
  longitude: string | null;
  status_lokasi: string;
  catatan: string | null;
  nama_user: string | null;
  kode_user: string | null;
}

const JENIS_LABELS: Record<string, string> = {
  masuk: "Masuk",
  pulang: "Pulang",
  istirahat_keluar: "Istirahat Keluar",
  istirahat_masuk: "Istirahat Masuk",
  lembur_mulai: "Lembur Mulai",
  lembur_selesai: "Lembur Selesai",
};

const JENIS_COLORS: Record<string, string> = {
  masuk: "bg-primary/15 text-primary border-primary/20",
  pulang: "bg-secondary/15 text-secondary border-secondary/20",
  istirahat_keluar: "bg-tertiary/15 text-tertiary border-tertiary/20",
  istirahat_masuk: "bg-tertiary/15 text-tertiary border-tertiary/20",
  lembur_mulai: "bg-error/15 text-error border-error/20",
  lembur_selesai: "bg-error/15 text-error border-error/20",
};

export default function AbsensiPage() {
  const { can_create, can_read, can_update, can_delete, loading: permissionsLoading } = useMenuPermissions();
  const [data, setData] = useState<AbsensiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [total, setTotal] = useState(0);
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hrd/absensi?tanggal=${tanggal}`);
    const json = await res.json();
    setData(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [tanggal]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
            <UserCheck className="w-6 h-6 text-primary" />
            Data Absensi
          </h1>
          <p className="text-on-background/70 text-sm mt-1">{total} catatan absensi</p>
        </div>
        <div className="flex gap-2">
          {can_create && (
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-on-secondary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-secondary/15 cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> Scan QR
            </button>
          )}
          {can_create && (
            <button
              onClick={() => setShowAbsenModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Input Manual
            </button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80"
        />
        <button onClick={fetchData} className="flex items-center gap-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" /> Memuat...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/60">
            <UserCheck className="w-12 h-12 mb-3 opacity-30 text-primary" />
            <p>Belum ada absensi untuk tanggal ini</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/35 bg-surface-container-low">
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Abdi</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Jam</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Jenis</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Lokasi</th>
                  <th className="text-left px-5 py-2.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-5 py-2.5">
                      <p className="text-on-surface text-sm font-semibold">{row.nama_user}</p>
                      <p className="text-on-surface-variant/70 text-xs mt-0.5">{row.kode_user}</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-on-surface font-mono text-sm">{row.jam.slice(0, 5)}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${JENIS_COLORS[row.jenis] || "bg-surface-container border-outline-variant/40 text-on-surface"}`}>
                        {JENIS_LABELS[row.jenis] || row.jenis}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 hidden md:table-cell">
                      {row.latitude && row.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {parseFloat(row.latitude).toFixed(4)}, {parseFloat(row.longitude).toFixed(4)}
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs border ${getStatusColor(row.status_lokasi)}`}>
                            {row.status_lokasi}
                          </span>
                        </a>
                      ) : (
                        <span className="text-on-surface-variant/55 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 hidden lg:table-cell">
                      <span className="text-on-surface-variant text-sm">{row.catatan || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Absensi Modal */}
      {showAbsenModal && (
        <AbsenManualModal
          onClose={() => setShowAbsenModal(false)}
          onSaved={() => { setShowAbsenModal(false); fetchData(); }}
        />
      )}

      {/* QR Scanner Modal */}
      {showQR && (
        <QRScannerModal
          onClose={() => setShowQR(false)}
          onSaved={() => { setShowQR(false); fetchData(); }}
        />
      )}
    </div>
  );
}

// ─── MANUAL INPUT MODAL ──────────────────────────────────────────────────────
function AbsenManualModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    user_id: "",
    jenis: "masuk",
    catatan: "",
  });
  const [users, setUsers] = useState<{ id: number; nama_user: string }[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/hrd/users?limit=200").then(r => r.json()).then(d => setUsers(d.data || []));
  }, []);

  const getLocation = () => {
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLoc(false);
      },
      () => { setLoadingLoc(false); alert("Tidak dapat mengakses lokasi"); },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id) { setError("Pilih abdi"); return; }
    setLoading(true);
    const res = await fetch("/api/hrd/absensi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        user_id: parseInt(form.user_id),
        latitude: location?.lat,
        longitude: location?.lng,
        status_lokasi: location ? "valid" : "invalid",
      }),
    });
    if (res.ok) { onSaved(); } else { setError("Gagal menyimpan"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-semibold text-on-surface">Input Absensi Manual</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors leading-none cursor-pointer">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && <div className="bg-error/15 border border-error/25 text-error px-4 py-3 rounded-xl font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Abdi</label>
            <select
              value={form.user_id}
              onChange={(e) => setForm(f => ({ ...f, user_id: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
              required
            >
              <option value="">— Pilih Abdi —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.nama_user}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Jenis Absensi</label>
            <select
              value={form.jenis}
              onChange={(e) => setForm(f => ({ ...f, jenis: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 cursor-pointer"
            >
              {Object.entries(JENIS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* GPS */}
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Lokasi GPS</label>
            <button
              type="button"
              onClick={getLocation}
              disabled={loadingLoc}
              className="flex items-center gap-2 w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loadingLoc ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <MapPin className="w-4 h-4 text-primary" />}
              {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Dapatkan Lokasi"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1.5">Catatan</label>
            <input
              type="text"
              value={form.catatan}
              onChange={(e) => setForm(f => ({ ...f, catatan: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
              placeholder="Opsional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/95 disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 cursor-pointer">
              {loading ? "Menyimpan..." : "Simpan Absensi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── QR SCANNER MODAL ────────────────────────────────────────────────────────
function QRScannerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<string | null>(null);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  function stopCamera() {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setScanning(false);
  }

  async function handleAbsenFromQR(kode_user: string) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch("/api/hrd/absensi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: kode_user, // Will be resolved server side if needed
            jenis: "masuk",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            status_lokasi: "valid",
            catatan: `QR Scan: ${kode_user}`,
          }),
        });
        if (res.ok) {
          setResult("success");
          setMessage(`Absensi berhasil untuk: ${kode_user}`);
        } else {
          setResult("error");
          setMessage("Gagal menyimpan absensi");
        }
      },
      async () => {
        const res = await fetch("/api/hrd/absensi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: 0,
            jenis: "masuk",
            catatan: `QR Scan: ${kode_user}`,
            status_lokasi: "invalid",
          }),
        });
        setResult(res.ok ? "success" : "error");
        setMessage(res.ok ? `Absensi berhasil: ${kode_user}` : "Gagal menyimpan");
      }
    );
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      stopCamera();
      setScannedUser(code.data);
      handleAbsenFromQR(code.data);
    } else {
      animRef.current = requestAnimationFrame(tick);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Video playback was interrupted or prevented:", err);
        });
        setScanning(true);
        requestAnimationFrame(tick);
      }
    } catch {
      setMessage("Tidak dapat mengakses kamera");
      setResult("error");
    }
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-outline-variant/35 rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-semibold text-on-surface flex items-center gap-2">
            <QrCode className="w-5 h-5 text-secondary" /> Scan QR Absensi
          </h2>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-on-surface-variant hover:text-on-surface text-2xl transition-colors leading-none cursor-pointer">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-xl opacity-80 relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl -translate-x-px -translate-y-px" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl translate-x-px -translate-y-px" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl -translate-x-px translate-y-px" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl translate-x-px translate-y-px" />
                  </div>
                </div>
                {scanning && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-primary text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Mendeteksi QR Code...
                  </div>
                )}
              </div>
              <p className="text-on-surface-variant text-sm text-center font-medium">Arahkan kamera ke QR Code abdi</p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              {result === "success" ? (
                <CheckCircle2 className="w-16 h-16 text-primary" />
              ) : (
                <XCircle className="w-16 h-16 text-error" />
              )}
              <p className={`text-center font-semibold ${result === "success" ? "text-primary" : "text-error"}`}>
                {message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setResult(null); setScannedUser(null); startCamera(); }}
                  className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Scan Lagi
                </button>
                <button
                  onClick={() => { stopCamera(); onSaved(); }}
                  className="bg-primary hover:bg-primary/95 text-on-primary px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
