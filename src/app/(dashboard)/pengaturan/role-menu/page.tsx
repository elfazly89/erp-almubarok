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

  // CRUD permission states mapped by menu/submenu ID
  const [mainPermissions, setMainPermissions] = useState<Record<number, RolePermission>>({});
  const [subPermissions, setSubPermissions] = useState<Record<number, RolePermission>>({});

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  interface RolePermission {
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
  }

  // Fetch master data on load
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

  // Fetch currently active role permission details when jabatan is selected
  const fetchActivePermissions = useCallback(async (id: string) => {
    if (!id) {
      setMainPermissions({});
      setSubPermissions({});
      setHasChanges(false);
      return;
    }

    try {
      const res = await fetch(`/api/pengaturan/role-menu/${id}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const mainPerms: Record<number, RolePermission> = {};
          const subPerms: Record<number, RolePermission> = {};

          if (Array.isArray(result.data.main)) {
            result.data.main.forEach((m: any) => {
              mainPerms[m.id_menu_main] = {
                can_create: !!m.can_create,
                can_read: !!m.can_read,
                can_update: !!m.can_update,
                can_delete: !!m.can_delete,
              };
            });
          }

          if (Array.isArray(result.data.sub)) {
            result.data.sub.forEach((s: any) => {
              subPerms[s.id_menu_sub] = {
                can_create: !!s.can_create,
                can_read: !!s.can_read,
                can_update: !!s.can_update,
                can_delete: !!s.can_delete,
              };
            });
          }

          setMainPermissions(mainPerms);
          setSubPermissions(subPerms);
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

  // Helper to fetch permission object for specific ID
  const getMenuPerm = (id: number, type: "main" | "sub"): RolePermission => {
    const defaults = { can_create: false, can_read: false, can_update: false, can_delete: false };
    const dict = type === "main" ? mainPermissions : subPermissions;
    return dict[id] || defaults;
  };

  // Set individual permission value
  const setMenuPermVal = (
    id: number,
    type: "main" | "sub",
    key: "can_create" | "can_read" | "can_update" | "can_delete",
    val: boolean
  ) => {
    setHasChanges(true);

    if (type === "main") {
      setMainPermissions((prev) => {
        const current = prev[id] || { can_create: false, can_read: false, can_update: false, can_delete: false };
        const next = { ...current, [key]: val };

        // If disabling read, disable all other actions
        if (key === "can_read" && !val) {
          next.can_create = false;
          next.can_update = false;
          next.can_delete = false;
        }
        // If enabling create/update/delete, force enable read
        if ((key === "can_create" || key === "can_update" || key === "can_delete") && val) {
          next.can_read = true;
        }

        return { ...prev, [id]: next };
      });

      // Cascade: If turning off main read, turn off all child submenus
      if (key === "can_read" && !val) {
        const main = menus.find((m) => m.id === id);
        if (main && main.sub_menus.length > 0) {
          setSubPermissions((prev) => {
            const next = { ...prev };
            main.sub_menus.forEach((s) => {
              next[s.id] = { can_create: false, can_read: false, can_update: false, can_delete: false };
            });
            return next;
          });
        }
      }
    } else {
      // Submenu
      setSubPermissions((prev) => {
        const current = prev[id] || { can_create: false, can_read: false, can_update: false, can_delete: false };
        const next = { ...current, [key]: val };

        if (key === "can_read" && !val) {
          next.can_create = false;
          next.can_update = false;
          next.can_delete = false;
        }
        if ((key === "can_create" || key === "can_update" || key === "can_delete") && val) {
          next.can_read = true;
        }

        return { ...prev, [id]: next };
      });

      // Cascade: If enabling child permission, force enable parent can_read
      if (val) {
        const parentId = menus.find((m) => m.sub_menus.some((s) => s.id === id))?.id;
        if (parentId) {
          setMainPermissions((prev) => {
            const current = prev[parentId] || { can_create: false, can_read: false, can_update: false, can_delete: false };
            return { ...prev, [parentId]: { ...current, can_read: true } };
          });
        }
      }
    }
  };

  // Quick Action: Check/Uncheck all menus
  const handleToggleAll = (check: boolean) => {
    setHasChanges(true);
    if (check) {
      const newMain: Record<number, RolePermission> = {};
      menus.forEach((m) => {
        newMain[m.id] = { can_create: true, can_read: true, can_update: true, can_delete: true };
      });
      const newSub: Record<number, RolePermission> = {};
      menus.flatMap((m) => m.sub_menus).forEach((s) => {
        newSub[s.id] = { can_create: true, can_read: true, can_update: true, can_delete: true };
      });
      setMainPermissions(newMain);
      setSubPermissions(newSub);
    } else {
      setMainPermissions({});
      setSubPermissions({});
    }
  };

  // Save changes to backend database
  const handleSave = async () => {
    if (!selectedJabatanId) return;

    setSaving(true);
    setMessage(null);

    // Convert dictionaries to list of CRUD objects
    const main_menu = Object.keys(mainPermissions).map((idStr) => {
      const id = parseInt(idStr);
      return {
        id,
        ...mainPermissions[id],
      };
    });

    const sub_menu = Object.keys(subPermissions).map((idStr) => {
      const id = parseInt(idStr);
      return {
        id,
        ...subPermissions[id],
      };
    });

    try {
      const res = await fetch("/api/pengaturan/role-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_jabatan: selectedJabatanId,
          main_menu,
          sub_menu,
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

  const renderCheckboxes = (id: number, type: "main" | "sub") => {
    const perm = getMenuPerm(id, type);
    const keys: Array<"can_read" | "can_create" | "can_update" | "can_delete"> = [
      "can_read",
      "can_create",
      "can_update",
      "can_delete",
    ];
    const colors = {
      can_read: "bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/20 dark:bg-[#38bdf8]/15 dark:text-[#38bdf8]",
      can_create: "bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20 dark:bg-[#4ade80]/15 dark:text-[#4ade80]",
      can_update: "bg-[#ca8a04]/10 text-[#ca8a04] border-[#ca8a04]/20 dark:bg-[#facc15]/15 dark:text-[#facc15]",
      can_delete: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20 dark:bg-[#f87171]/15 dark:text-[#f87171]",
    };
    const shortLabels = {
      can_read: "R",
      can_create: "C",
      can_update: "U",
      can_delete: "D",
    };

    return (
      <div className="flex items-center gap-1 bg-surface-container-high/30 p-1 rounded-lg border border-outline-variant/20 shrink-0">
        {keys.map((key) => {
          const active = perm[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setMenuPermVal(id, type, key, !active)}
              className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-bold transition-all cursor-pointer ${
                active
                  ? `${colors[key]} shadow-sm scale-105`
                  : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant/40 hover:bg-surface-container-high hover:text-on-surface-variant"
              }`}
              title={key === "can_read" ? "Read" : key === "can_create" ? "Create" : key === "can_update" ? "Update" : "Delete"}
            >
              {shortLabels[key]}
            </button>
          );
        })}
      </div>
    );
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
              const checked = getMenuPerm(main.id, "main").can_read;
              return (
                <div
                  key={main.id}
                  className={`border rounded-2xl p-5 transition-all duration-150 relative ${
                    checked
                      ? "bg-primary/5 border-primary/45 shadow-lg shadow-primary/5"
                      : "bg-surface border-outline-variant/30 hover:border-outline-variant/60"
                  }`}
                >
                  <div className="flex flex-col h-full space-y-4">
                    {/* Main Menu Row */}
                    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`main-${main.id}`}
                          checked={checked}
                          onChange={(e) => setMenuPermVal(main.id, "main", "can_read", e.target.checked)}
                          className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/40 cursor-pointer shrink-0"
                        />
                        <label
                          htmlFor={`main-${main.id}`}
                          className={`ml-2.5 block text-base font-bold cursor-pointer select-none ${
                            checked ? "text-primary font-extrabold" : "text-on-surface"
                          }`}
                        >
                          {main.nama}
                        </label>
                      </div>
                      {renderCheckboxes(main.id, "main")}
                    </div>

                    {/* Sub Menus List */}
                    {main.sub_menus.length > 0 && (
                      <div className="space-y-3 pt-1 flex-1">
                        {main.sub_menus.map((sub) => {
                          const subChecked = getMenuPerm(sub.id, "sub").can_read;
                          return (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between py-1.5 border-b border-dashed border-outline-variant/10 gap-3"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`sub-${sub.id}`}
                                  checked={subChecked}
                                  onChange={(e) => setMenuPermVal(sub.id, "sub", "can_read", e.target.checked)}
                                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/40 cursor-pointer shrink-0"
                                />
                                <label
                                  htmlFor={`sub-${sub.id}`}
                                  className={`ml-2 block text-xs font-semibold cursor-pointer select-none ${
                                    subChecked ? "text-on-surface font-bold" : "text-on-surface-variant/80"
                                  }`}
                                >
                                  {sub.nama}
                                </label>
                              </div>
                              {renderCheckboxes(sub.id, "sub")}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
