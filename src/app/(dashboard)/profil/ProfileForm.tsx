"use client";

import { useState, useRef } from "react";
import { User, Phone, Briefcase, Building, ShieldCheck, Calendar, FileText, Upload, RefreshCw, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { compressAndCropToPassport } from "@/lib/image";

interface UserProfile {
  id: number;
  kode_user: string;
  nama_user: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  no_ktp: string | null;
  pendidikan_terakhir: string | null;
  riwayat_lembaga: string | null;
  riwayat_pekerjaan: string | null;
  status: string | null;
  no_hp: string;
  foto: string | null;
  tanggal_masuk: string | null;
  nama_cabang: string | null;
  jabatan: string | null;
}

interface ProfileFormProps {
  user: UserProfile;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [noHp, setNoHp] = useState(user.no_hp);
  const [foto, setFoto] = useState<string | null>(user.foto);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    try {
      const croppedBase64 = await compressAndCropToPassport(file);
      setFoto(croppedBase64);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses foto");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noHp.trim()) {
      setErrorMsg("Nomor HP wajib diisi");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_hp: noHp,
          foto: foto,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui profil");

      setSuccessMsg("Profil berhasil diperbarui!");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-on-background">
      <div>
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
          <User className="w-7 h-7 text-primary" /> Profil Pengguna
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Informasi detail profil abdi Anda di ERP Al-Mubarok.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Avatar Picture Card */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 flex flex-col items-center text-center shadow-md">
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-4">Foto Profil</span>
            
            {/* Image Preview Container (Passport Style) */}
            <div className="relative group w-32 h-42 rounded-xl overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center mb-4 shadow-sm">
              {foto ? (
                <>
                  <img
                    src={foto}
                    alt={user.nama_user}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay on hover */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-xs"
                  >
                    <Upload className="w-5 h-5 mb-1" />
                    Ganti Foto
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-primary font-bold">
                  <div className="text-2xl mb-1">
                    {user.nama_user.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/60 font-normal tracking-wide uppercase">Foto Paspor</span>
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-container font-semibold hover:underline cursor-pointer"
              >
                Pilih File Foto
              </button>
              
              {foto && (
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  className="text-[10px] text-error hover:underline font-semibold cursor-pointer"
                >
                  Hapus Foto
                </button>
              )}
            </div>
            
            <p className="text-[10px] text-on-surface-variant/70 mt-3">
              Format JPG atau PNG
            </p>
          </div>
        </div>

        {/* Right Column: Profile details form */}
        <div className="md:col-span-8 space-y-6">
          {/* Notification banners */}
          {errorMsg && (
            <div className="bg-error/15 border border-error/25 text-error text-sm px-4 py-3 rounded-xl">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-3 rounded-xl font-semibold">
              {successMsg}
            </div>
          )}

          {/* Form Fields Card */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 space-y-5 shadow-md">
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold block border-b border-outline-variant/20 pb-2">Informasi Abdi</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={user.nama_user}
                  readOnly
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-not-allowed font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Kode Abdi / User ID</label>
                <input
                  type="text"
                  value={user.kode_user}
                  readOnly
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Jabatan Abdi</label>
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed">
                  <Briefcase className="w-4 h-4 text-on-surface-variant/60" />
                  <span>{user.jabatan || "Staf"}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Unit Cabang Kerja</label>
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed">
                  <Building className="w-4 h-4 text-on-surface-variant/60" />
                  <span>{user.nama_cabang || "Pusat"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Status Abdi</label>
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed">
                  <ShieldCheck className="w-4 h-4 text-on-surface-variant/60" />
                  <span>{user.status || "Aktif"}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Mulai Khidmat</label>
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed">
                  <Calendar className="w-4 h-4 text-on-surface-variant/60" />
                  <span>{formatDate(user.tanggal_masuk)}</span>
                </div>
              </div>
            </div>

            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold block border-b border-outline-variant/20 pt-4 pb-2">Data Pribadi & Kontak</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tempat & Tanggal Lahir</label>
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed">
                  <Calendar className="w-4 h-4 text-on-surface-variant/60" />
                  <span>
                    {user.tempat_lahir ? `${user.tempat_lahir}, ` : ""}
                    {user.tanggal_lahir ? formatDate(user.tanggal_lahir) : "—"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">No. KTP</label>
                <input
                  type="text"
                  value={user.no_ktp || "—"}
                  readOnly
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Pendidikan Terakhir</label>
                <input
                  type="text"
                  value={user.pendidikan_terakhir || "—"}
                  readOnly
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nomor Telepon / WhatsApp (Aktif)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant/60" />
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    placeholder="Contoh: 0821xxxxxxx"
                  />
                </div>
              </div>
            </div>

            {user.riwayat_lembaga && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Riwayat Pendidikan Lembaga</label>
                <div className="flex items-start gap-2 bg-surface-container-low border border-outline-variant/30 text-on-surface/70 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed">
                  <FileText className="w-4 h-4 mt-0.5 text-on-surface-variant/60" />
                  <span>{user.riwayat_lembaga}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-outline-variant/20">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
