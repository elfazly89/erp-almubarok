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

  const getPasswordStrength = (pwd: string) => {
    const defaultChecks = {
      length: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSymbol: false,
    };
    if (!pwd) return { score: 0, text: "", color: "bg-outline-variant/30", checks: defaultChecks };
    
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSymbol: /[@$!%*?&]/.test(pwd),
    };

    if (checks.length) score += 1;
    if (checks.hasUpper) score += 1;
    if (checks.hasLower) score += 1;
    if (checks.hasNumber) score += 1;
    if (checks.hasSymbol) score += 1;

    let text = "Sangat Lemah";
    let color = "bg-error";
    if (score >= 5) {
      text = "Sangat Kuat";
      color = "bg-primary";
    } else if (score >= 4) {
      text = "Kuat";
      color = "bg-secondary";
    } else if (score >= 3) {
      text = "Sedang";
      color = "bg-amber-500";
    } else if (score >= 2) {
      text = "Lemah";
      color = "bg-orange-500";
    }

    return { score, text, color, checks };
  };

  const strength = getPasswordStrength(newPassword);

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

    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!complexityRegex.test(newPassword)) {
      setErrorMsg("Password baru harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol (@$!%*?&).");
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
          
          {/* Strength Indicator Bar */}
          {newPassword && (
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-semibold">
                <span className="text-on-surface-variant/70">Kekuatan Password:</span>
                <span className={`px-2 py-0.5 rounded-full text-on-primary text-[9px] ${strength.color}`}>
                  {strength.text}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-low border border-outline-variant/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${strength.color} transition-all duration-300`} 
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              
              {/* Checklist Kriteria */}
              <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-outline-variant/10 text-[9px] text-on-surface-variant/70">
                <div className="flex items-center gap-1">
                  <span className={strength.checks.length ? "text-primary font-bold" : "text-on-surface-variant/40"}>
                    {strength.checks.length ? "✓" : "○"} Min. 8 karakter
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={(strength.checks.hasUpper && strength.checks.hasLower) ? "text-primary font-bold" : "text-on-surface-variant/40"}>
                    {(strength.checks.hasUpper && strength.checks.hasLower) ? "✓" : "○"} Huruf Besar & Kecil
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={strength.checks.hasNumber ? "text-primary font-bold" : "text-on-surface-variant/40"}>
                    {strength.checks.hasNumber ? "✓" : "○"} Angka (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={strength.checks.hasSymbol ? "text-primary font-bold" : "text-on-surface-variant/40"}>
                    {strength.checks.hasSymbol ? "✓" : "○"} Simbol (@$!%*?&)
                  </span>
                </div>
              </div>
            </div>
          )}
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
