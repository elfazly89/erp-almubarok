"use client";

import { useState } from "react";
import {
  X,
  Check,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  WIDGET_CATALOG,
  ROLE_PRESETS,
  type WidgetConfig,
  type WidgetMeta,
} from "@/lib/dashboard-presets";

interface ManageWidgetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: WidgetConfig[];
  userRole?: string;
  onSaveConfig: (newConfig: WidgetConfig[], presetName?: string) => Promise<void>;
  onResetDefault: () => Promise<void>;
}

export function ManageWidgetsDrawer({
  isOpen,
  onClose,
  currentConfig,
  userRole,
  onSaveConfig,
  onResetDefault,
}: ManageWidgetsDrawerProps) {
  const [localConfig, setLocalConfig] = useState<WidgetConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("CUSTOM");

  // Sync state when drawer is opened
  useState(() => {
    setLocalConfig([...currentConfig]);
  });

  if (!isOpen) return null;

  // Map metadata
  const catalogMap = new Map<string, WidgetMeta>(
    WIDGET_CATALOG.map((m) => [m.id, m])
  );

  // Group config with its metadata
  const mergedList = localConfig
    .map((cfg) => ({
      ...cfg,
      meta: catalogMap.get(cfg.id),
    }))
    .filter((item) => item.meta !== undefined);

  const toggleVisible = (id: string) => {
    setLocalConfig((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setLocalConfig((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next.map((w, idx) => ({ ...w, order: idx + 1 }));
    });
  };

  const moveDown = (index: number) => {
    if (index === localConfig.length - 1) return;
    setLocalConfig((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next.map((w, idx) => ({ ...w, order: idx + 1 }));
    });
  };

  const applyRolePreset = (key: string) => {
    const preset = ROLE_PRESETS[key];
    if (preset) {
      setLocalConfig([...preset.widgets]);
      setSelectedPreset(key);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(localConfig, selectedPreset);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset susunan dashboard kembali ke setelan bawaan peran Anda?")) {
      setIsSaving(true);
      try {
        await onResetDefault();
        onClose();
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface border-l border-outline-variant/30 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-on-surface">Kelola Widget Dashboard</h2>
              <p className="text-xs text-on-surface-variant">Sesuaikan widget dan urutan tampilan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-semibold text-on-surface">Gunakan Template Preset Cepat:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ROLE_PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyRolePreset(key)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-container text-on-surface font-medium text-left truncate transition-colors"
              >
                {p.name.replace("Preset ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {mergedList.map((item, index) => {
            const meta = item.meta!;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  item.visible
                    ? "bg-surface border-outline-variant/40 shadow-xs"
                    : "bg-surface-container-low/50 border-outline-variant/20 opacity-60"
                }`}
              >
                {/* Toggle checkbox */}
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => toggleVisible(item.id)}
                  className="mt-1 w-4 h-4 rounded text-primary border-outline focus:ring-primary cursor-pointer"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-on-surface truncate">
                      {meta.title}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
                      {meta.category}
                    </span>
                    {meta.requiresAdmin && (
                      <span
                        title="Metrik finansial sensitif"
                        className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium shrink-0 flex items-center gap-0.5"
                      >
                        <ShieldAlert className="w-2.5 h-2.5" /> Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant/80 mt-0.5 line-clamp-2">
                    {meta.description}
                  </p>
                </div>

                {/* Reorder controls */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    title="Geser Ke Atas"
                    className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === mergedList.length - 1}
                    onClick={() => moveDown(index)}
                    title="Geser Ke Bawah"
                    className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 border border-error/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary-container shadow-xs transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Tampilan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

