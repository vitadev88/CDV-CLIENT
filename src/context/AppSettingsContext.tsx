"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AppSettings {
  showFeatured: boolean;
  showFeaturedPackages: boolean;
}

interface AppSettingsContextValue extends AppSettings {
  update: (patch: Partial<AppSettings>) => void;
}

const STORAGE_KEY = "cdv_app_settings";

const defaults: AppSettings = {
  showFeatured: true,
  showFeaturedPackages: true,
};

const AppSettingsContext = createContext<AppSettingsContextValue>({
  ...defaults,
  update: () => {},
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...defaults, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const update = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
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
