import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Appearance } from "react-native";
import { mmkvJSONStateStorage } from "./mmkvStateStorage";

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
      storage: mmkvJSONStateStorage,
    },
  ),
);
