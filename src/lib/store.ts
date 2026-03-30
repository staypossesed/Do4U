import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n";

interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "ru",
      setLocale: (locale) => set({ locale }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "claw-app-store",
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

// TODO: Add listing creation wizard state store
// TODO: Add chat state store
// TODO: Add notification state store
