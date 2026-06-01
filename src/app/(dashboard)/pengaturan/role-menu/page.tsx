"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  CheckSquare,
  Square,
  Lock,
} from "lucide-react";

interface SubMenu {
  id: number;
  nama: string;
  link: string;
}

interface MainMenu {
  id: number;
  nama: string;
  link: string;
  icon: string | null;
  sub_menus: SubMenu[];
}

interface Jabatan {
  id_jabatan: number;
  jabatan: string;
}

export default function RoleMenuPage() {
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
  const [menus, setMenus] = useState<MainMenu[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedJabatanId, setSelectedJabatanId] = useState<string>("");
  const [selectedJabatanName, setSelectedJabatanName] = useState<string>("");

  // Active role IDs
  const [activeMainIds, setActiveMainIds] = useState<number[]>([]);
  const [activeSubIds, setActiveSubIds] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch master data on load (including auto-seeding menus if database is empty!)
  const fetchMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pengaturan/role-menu");
      if (res.ok) {
        const data = await res.json();
        setJabatanList(data.jabatan || []);
        setMenus(data.menus || []);
      }
    } catch (e) {
      console.error("Gagal mengambil master data role menu", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Fetch currently active role permission IDs when jabatan is selected
  const fetchActivePermissions = useCallback(async (id: string) => {
    if (!id) {
      setActiveMainIds([]);
      setActiveSubIds([]);
      setHasChanges(false);
      return;
    }

    try {
      const res = await fetch(`/api/pengaturan/role-menu/${id}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setActiveMainIds(result.data.main || []);
          setActiveSubIds(result.data.sub || []);
          setHasChanges(false);
        }
      }
    } catch (e) {
      console.error("Gagal mengambil detail hak akses", e);
    }
  }, []);

  const handleJabatanChange = (id: string) => {
    setSelectedJabatanId(id);
    const selected = jabatanList.find((j) => j.id_jabatan.toString() === id);
    setSelectedJabatanName(selected ? selected.jabatan : "");
    fetchActivePermissions(id);
    setMessage(null);
  };

  const isParentChecked = (id: number) => activeMainIds.includes(id);
  const isChildChecked = (id: number) => activeSubIds.includes(id);

  // Handle main menu checking
  const handleParentChange = (id: number, checked: boolean) => {
    setHasChanges(true);
    if (checked) {
      if (!activeMainIds.includes(id)) {
        setActiveMainIds([...activeMainIds, id]);
      }
    } else {
      // Uncheck parent
      setActiveMainIds(activeMainIds.filter((pId) => pId !== id));

      // Cascade: Uncheck all submenus inside this main menu
      const main = menus.find((m) => m.id === id);
      if (main && main.sub_menus.length > 0) {
        const subIdsToFilter = main.sub_menus.map((s) => s.id);
        setActiveSubIds(activeSubIds.filter((sId) => !subIdsToFilter.includes(sId)));
      }
    }
  };

  // Handle submenu checking
  const handleChildChange = (parentId: number, childId: number, checked: boolean) => {
    setHasChanges(true);
    if (checked) {
      // Auto-check parent if a child is checked
      if (!activeMainIds.includes(parentId)) {
        setActiveMainIds([...activeMainIds, parentId]);
      }
      if (!activeSubIds.includes(childId)) {
        setActiveSubIds([...activeSubIds, childId]);
      }
    } else {
      // Uncheck child
      setActiveSubIds(activeSubIds.filter((cId) => cId !== childId));
    }
  };

  // Quick Action: Check/Uncheck all menus
  const handleToggleAll = (check: boolean) => {
    setHasChanges(true);
    if (check) {
      const allMainIds = menus.map((m) => m.id);
      const allSubIds = menus.flatMap((m) => m.sub_menus.map((s) => s.id));
      setActiveMainIds(allMainIds);
      setActiveSubIds(allSubIds);
    } else {
      setActiveMainIds([]);
      setActiveSubIds([]);
    }
  };

  // Save changes to backend database
  const handleSave = async () => {
    if (!selectedJabatanId) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pengaturan/role-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_jabatan: selectedJabatanId,
          main_menu: activeMainIds,
          sub_menu: activeSubIds,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: result.message, type: "success" });
        setHasChanges(false);
      } else {
        throw new Error(result.message || "Gagal menyimpan perubahan");
      }
    } catch (e: any) {
      setMessage({ text: e.message || "Terjadi kesalahan koneksi", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-on-background">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" /> Hak Akses Pengguna
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Atur menu utama dan submenu yang dapat dibuka oleh setiap jabatan
          </p>
        </div>
        <a
          href="/dashboard"
          className="flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full md:w-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </a>
      </div>

      {/* Box Pemilihan Jabatan */}
      <div className="bg-surface border border-outline-variant/40 p-6 rounded-2xl shadow-xl space-y-4">
        <div>
          <label htmlFor="id_jabatan" className="block text-sm font-semibold text-on-surface-variant mb-2">
            Pilih Jabatan untuk Dikonfigurasi
          </label>
          {loading ? (
            <div className="flex items-center text-xs text-on-surface-variant py-2">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Memuat jabatan...
            </div>
          ) : (
            <select
              id="id_jabatan"
              value={selectedJabatanId}
              onChange={(e) => handleJabatanChange(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="" className="bg-surface-container text-on-surface-variant">-- Pilih Jabatan --</option>
              {jabatanList.map((j) => (
                <option key={j.id_jabatan} value={j.id_jabatan} className="bg-surface-container text-on-surface">
                  {j.jabatan}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Form Hak Akses (hanya tampil jika jabatan dipilih) */}
      {selectedJabatanId ? (
        <div className="space-y-6">
          {message && (
            <div className={`px-4 py-3 rounded-xl text-xs font-semibold border ${
              message.type === "success"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-error/10 border-error/20 text-error"
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-lg font-bold text-on-surface">
              Hak Akses Jabatan: <span className="text-primary">{selectedJabatanName}</span>
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-primary">
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" /> Pilih Semua
              </button>
              <span className="text-outline-variant/60">|</span>
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-4 h-4" /> Hapus Semua
              </button>
            </div>
          </div>

          {/* Menus Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {menus.map((main) => {
              const checked = isParentChecked(main.id);
              return (
                <div
                  key={main.id}
                  className={`border rounded-2xl p-5 transition-all duration-150 relative ${
                    checked
                      ? "bg-primary/5 border-primary/45 shadow-lg shadow-primary/5"
                      : "bg-surface border-outline-variant/30 hover:border-outline-variant/60"
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id={`main-${main.id}`}
                      checked={checked}
                      onChange={(e) => handleParentChange(main.id, e.target.checked)}
                      className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/40 mt-0.5 cursor-pointer shrink-0"
                    />
                    <div className="ml-3 flex-1 space-y-3">
                      <label
                        htmlFor={`main-${main.id}`}
                        className={`block text-base font-bold cursor-pointer select-none ${
                          checked ? "text-primary font-extrabold" : "text-on-surface"
                        }`}
                      >
                        {main.nama}
                      </label>

                      {main.sub_menus.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-outline-variant/20">
                          {main.sub_menus.map((sub) => {
                            const subChecked = isChildChecked(sub.id);
                            return (
                              <div key={sub.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`sub-${sub.id}`}
                                  checked={subChecked}
                                  onChange={(e) => handleChildChange(main.id, sub.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 cursor-pointer shrink-0"
                                />
                                <label
                                  htmlFor={`sub-${sub.id}`}
                                  className={`ml-2.5 block text-xs font-semibold cursor-pointer select-none ${
                                    subChecked ? "text-on-surface font-bold" : "text-on-surface-variant/80"
                                  }`}
                                >
                                  {sub.nama}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t border-outline-variant/30 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary disabled:bg-surface-container-highest disabled:text-on-surface-variant/40 px-10 py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Menyimpan...
                </>
              ) : (
                "Simpan Perubahan Hak Akses"
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Placeholder saat belum ada jabatan dipilih */
        <div className="text-center py-20 bg-surface border border-outline-variant/40 rounded-2xl shadow-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface">Konfigurasi Hak Akses</h3>
            <p className="text-on-surface-variant text-xs mt-1 max-w-xs mx-auto">
              Silakan pilih salah satu jabatan di atas terlebih dahulu untuk mulai mengonfigurasi hak akses menu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
