"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppSettings {
  app_name: string;
  company_name: string;
}

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    app_name: "ERP Al-Mubarok",
    company_name: "Yayasan Al-Mubarok",
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/auth/app-settings");
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSettings({
            app_name: result.data.app_name || "ERP Al-Mubarok",
            company_name: result.data.company_name || "Yayasan Al-Mubarok",
          });
        }
      }
    } catch (e) {
      console.error("Gagal mengambil pengaturan aplikasi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update browser tab title dynamically when app_name changes
  useEffect(() => {
    if (settings.app_name) {
      document.title = settings.app_name;
    }
  }, [settings.app_name]);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
};
