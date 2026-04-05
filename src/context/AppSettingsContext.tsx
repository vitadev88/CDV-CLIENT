"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

export interface AppSettings {
  showFeatured: boolean;
  showFeaturedPackages: boolean;
  logoUrl: string | null;
  siteTitle: string;
  siteDescription: string;
  maintenanceMode: boolean;
}

interface AppSettingsContextValue extends AppSettings {
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

const defaults: AppSettings = {
  showFeatured: true,
  showFeaturedPackages: true,
  logoUrl: null,
  siteTitle: "CongDongViet - Cộng đồng Việt Nam tại Đài Loan",
  siteDescription: "",
  maintenanceMode: false,
};

const AppSettingsContext = createContext<AppSettingsContextValue>({
  ...defaults,
  update: async () => {},
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  useEffect(() => {
    api.get<{ data: AppSettings }>("/settings")
      .then((res) => setSettings({ ...defaults, ...res.data.data }))
      .catch(() => {});
  }, []);

  const update = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await api.put("/settings", next);
  };

  return (
    <AppSettingsContext.Provider value={{ ...settings, update }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
