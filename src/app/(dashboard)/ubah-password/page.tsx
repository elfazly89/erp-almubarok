"use client";

import { useState } from "react";
import { Key, Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Semua kolom wajib diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password baru tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password baru minimal harus 6 karakter");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah password");

      setSuccessMsg("Password Anda berhasil diperbarui! Mengalihkan ke dashboard...");
      
      // Clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-on-background py-8">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3">
          <Key className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface">Ubah Password</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data.
        </p>
      </div>

      {/* Notification Banners */}
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

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-surface border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-md">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Password Saat Ini</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant/60" />
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-3 text-on-surface-variant/60 hover:text-on-surface"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Password Baru</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant/60" />
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-3 text-on-surface-variant/60 hover:text-on-surface"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[10px] text-on-surface-variant/70 mt-1 block">Minimal 6 karakter.</span>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Konfirmasi Password Baru</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant/60" />
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface border border-outline-variant text-on-surface rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 text-on-surface-variant/60 hover:text-on-surface"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Mengubah Password...
              </>
            ) : (
              "Ubah Password"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
