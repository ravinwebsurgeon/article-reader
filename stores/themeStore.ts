import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { storage } from "@/utils/storage";
import { Appearance } from "react-native";

// Custom MMKV storage adapter for Zustand following StateStorage interface
const mmkvStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return storage.getString(name) ?? null;
    } catch (error) {
      console.warn(`Failed to get data for key "${name}":`, error);
      storage.delete(name);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      storage.set(name, value);
    } catch (error) {
      console.error(`Failed to store data for key "${name}":`, error);
    }
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  // State
  mode: ThemeMode;
  systemPrefersDark: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSystemPrefersDark: (prefersDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: "system",
      systemPrefersDark: Appearance.getColorScheme() === "dark",

      // Actions
      setThemeMode: (mode) => set({ mode }),

      toggleTheme: () => {
        const { mode } = get();
        if (mode === "light") {
          set({ mode: "dark" });
        } else if (mode === "dark") {
          set({ mode: "light" });
        } else {
          // If system, toggle to opposite of current system preference
          const { systemPrefersDark } = get();
          set({ mode: systemPrefersDark ? "light" : "dark" });
        }
      },

      setSystemPrefersDark: (prefersDark) => set({ systemPrefersDark: prefersDark }),
    }),
    {
      name: "theme-store",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
