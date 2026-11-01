"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { ManageWidgetsDrawer } from "./ManageWidgetsDrawer";
import {
  WIDGET_CATALOG,
  getDefaultPresetForRole,
  type WidgetConfig,
} from "@/lib/dashboard-presets";

// Import all 11 Widgets
import { KpiStatsWidget } from "./widgets/KpiStatsWidget";
import { QuickActionsWidget } from "./widgets/QuickActionsWidget";
import { SalesCashFlowChartWidget } from "./widgets/SalesCashFlowChartWidget";
import { BranchLeaderboardWidget } from "./widgets/BranchLeaderboardWidget";
import { ActionableCriticalStockWidget } from "./widgets/ActionableCriticalStockWidget";
import { FefoBatchExpiredWidget } from "./widgets/FefoBatchExpiredWidget";
import { ActiveCashierShiftsWidget } from "./widgets/ActiveCashierShiftsWidget";
import { CashLiquidityWidget } from "./widgets/CashLiquidityWidget";
import { DcShipmentTrackingWidget } from "./widgets/DcShipmentTrackingWidget";
import { SupplierPayableWidget } from "./widgets/SupplierPayableWidget";
import { HrdAttendanceWidget } from "./widgets/HrdAttendanceWidget";

interface CabangOption {
  id_cabang: number;
  nama_cabang: string;
}

interface ModularDashboardClientProps {
  user: {
    id: number;
    nama_user: string;
    jabatan?: string;
    id_cabang: number | null;
  };
}

export function ModularDashboardClient({ user }: ModularDashboardClientProps) {
  const isSuperOrOwner =
    !user.id_cabang ||
    user.jabatan?.toLowerCase().includes("owner") ||
    user.jabatan?.toLowerCase().includes("direktur") ||
    user.jabatan?.toLowerCase().includes("super admin");

  const [cabangList, setCabangList] = useState<CabangOption[]>([]);
  const [selectedCabang, setSelectedCabang] = useState<string>(
    user.id_cabang ? String(user.id_cabang) : "all"
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Inisialisasi susunan widget (Database -> LocalStorage -> Role Preset Bawaan)
  useEffect(() => {
    async function loadPreferences() {
      const defaultRolePreset = getDefaultPresetForRole(user.jabatan);

      try {
        const res = await fetch("/api/dashboard/preferences");
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data?.layout_config?.length > 0) {
            setWidgetConfig(resData.data.layout_config);
            return;
          }
        }
      } catch (err) {
        console.warn("Gagal memuat preferensi dari DB, mencoba local storage:", err);
      }

      // Fallback local storage
      try {
        const local = localStorage.getItem(`erp_dash_pref_${user.id}`);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWidgetConfig(parsed);
            return;
          }
        }
      } catch {
        // Abaikan
      }

      // Default preset bawaan jabatan
      setWidgetConfig(defaultRolePreset.widgets);
    }

    loadPreferences();
  }, [user.id, user.jabatan]);

  // 2. Fetch list cabang
  useEffect(() => {
    async function fetchCabang() {
      try {
        const res = await fetch("/api/cabang");
        if (res.ok) {
          const data = await res.json();
          setCabangList(Array.isArray(data) ? data : data?.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat daftar cabang:", err);
      }
    }
    fetchCabang();
  }, []);

  // 3. Fetch data statistik agregasi
  const fetchStats = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      setErrorMsg("");

      try {
        const res = await fetch(
          `/api/dashboard/stats?id_cabang=${selectedCabang}&period=${selectedPeriod}`
        );
        const resData = await res.json();

        if (res.ok && resData.success) {
          setStats(resData.data);
          const timeStr = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setLastUpdated(timeStr);
        } else {
          setErrorMsg(resData.error || "Gagal memuat data dashboard");
        }
      } catch (err: any) {
        setErrorMsg("Koneksi terputus ke server API");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedCabang, selectedPeriod]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 4. Simpan preferensi widget
  const handleSaveConfig = async (newConfig: WidgetConfig[], presetName?: string) => {
    setWidgetConfig(newConfig);

    // Simpan ke local storage
    try {
      localStorage.setItem(`erp_dash_pref_${user.id}`, JSON.stringify(newConfig));
    } catch {
      // Abaikan
    }

    // Simpan ke backend database
    try {
      await fetch("/api/dashboard/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout_config: newConfig,
          last_preset: presetName || "CUSTOM",
        }),
      });
    } catch (err) {
      console.error("Gagal menyimpan preferensi ke DB:", err);
    }
  };

  // 5. Reset ke preset bawaan peran
  const handleResetDefault = async () => {
    const defaultRolePreset = getDefaultPresetForRole(user.jabatan);
    setWidgetConfig(defaultRolePreset.widgets);

    try {
      localStorage.removeItem(`erp_dash_pref_${user.id}`);
      await fetch("/api/dashboard/preferences/reset", { method: "POST" });
    } catch (err) {
      console.error("Gagal reset preferensi di DB:", err);
    }
  };

  // Map metadata katalog
  const metaMap = new Map(WIDGET_CATALOG.map((m) => [m.id, m]));

  // Urutkan widget aktif
  const activeWidgets = widgetConfig
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)
    .map((w) => ({
      ...w,
      meta: metaMap.get(w.id),
    }))
    .filter((item) => {
      if (!item.meta) return false;
      // Jika widget butuh admin tapi user bukan admin/owner/keuangan, sembunyikan widget finansial sensitif
      if (item.meta.requiresAdmin && !isSuperOrOwner) return false;
      return true;
    });

  return (
    <div className="space-y-6 text-on-background pb-12">
      {/* Global Header & Control Bar */}
      <DashboardHeader
        userName={user.nama_user}
        userRole={user.jabatan}
        cabangList={cabangList}
        selectedCabang={selectedCabang}
        onCabangChange={setSelectedCabang}
        isBranchLocked={!isSuperOrOwner}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onRefresh={() => fetchStats(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onOpenManageWidgets={() => setIsDrawerOpen(true)}
      />

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            onClick={() => fetchStats(true)}
            className="font-bold underline text-xs ml-4"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats ? (
        <div className="grid grid-cols-12 gap-5 animate-pulse">
          <div className="col-span-12 h-32 bg-surface-container rounded-2xl" />
          <div className="col-span-12 xl:col-span-8 h-80 bg-surface-container rounded-2xl" />
          <div className="col-span-12 xl:col-span-4 h-80 bg-surface-container rounded-2xl" />
          <div className="col-span-12 xl:col-span-6 h-64 bg-surface-container rounded-2xl" />
          <div className="col-span-12 xl:col-span-6 h-64 bg-surface-container rounded-2xl" />
        </div>
      ) : stats ? (
        /* Modular Widget Grid */
        <div className="grid grid-cols-12 gap-5">
          {activeWidgets.map((item) => {
            const id = item.id;
            const colSpan = item.meta?.defaultColSpan || "col-span-12";

            return (
              <div key={id} className={colSpan}>
                {id === "kpi_stats" && <KpiStatsWidget data={stats.kpi} />}
                {id === "quick_actions" && <QuickActionsWidget />}
                {id === "sales_cashflow_chart" && (
                  <SalesCashFlowChartWidget data={stats.salesTrend || []} />
                )}
                {id === "branch_leaderboard" && (
                  <BranchLeaderboardWidget data={stats.cabangLeaderboard || []} />
                )}
                {id === "actionable_critical_stock" && (
                  <ActionableCriticalStockWidget data={stats.stokKritis || []} />
                )}
                {id === "fefo_batch_expired" && (
                  <FefoBatchExpiredWidget data={stats.batchExpired || []} />
                )}
                {id === "active_cashier_shifts" && (
                  <ActiveCashierShiftsWidget data={stats.kasirShiftAktif || []} />
                )}
                {id === "cash_accounts_liquidity" && (
                  <CashLiquidityWidget data={stats.rekeningList || []} />
                )}
                {id === "dc_shipment_tracking" && (
                  <DcShipmentTrackingWidget data={stats.suratJalanList || []} />
                )}
                {id === "supplier_payable_due" && (
                  <SupplierPayableWidget data={stats.kpi} />
                )}
                {id === "hrd_attendance_summary" && (
                  <HrdAttendanceWidget data={stats.hrdStats} />
                )}
              </div>
            );
          })}

          {activeWidgets.length === 0 && (
            <div className="col-span-12 text-center py-16 bg-surface border border-outline-variant/30 rounded-2xl">
              <p className="text-on-surface font-semibold mb-2">
                Tidak ada widget aktif di dashboard Anda saat ini.
              </p>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
              >
                Buka Pengaturan Widget
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Drawer / Modal Kelola Widget */}
      <ManageWidgetsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentConfig={widgetConfig}
        userRole={user.jabatan}
        onSaveConfig={handleSaveConfig}
        onResetDefault={handleResetDefault}
      />
    </div>
  );
}

