import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mmkvJSONStateStorage } from "./mmkvStateStorage";

interface FirstRunState {
  // State
  completedFirstSync: boolean | undefined;
  showPocketImport: boolean | undefined;
  isLoaded: boolean;

  // Actions
  setCompletedFirstSync: (value: boolean) => void;
  setShowPocketImport: (value: boolean) => void;
  clearShowPocketImport: () => void;
  markAsLoaded: () => void;
}

export const useFirstRunStore = create<FirstRunState>()(
  persist(
    (set) => ({
      // Initial state - undefined means not loaded yet
      completedFirstSync: undefined,
      showPocketImport: undefined,
      isLoaded: false,

      // Actions
      setCompletedFirstSync: (value) => {
        set({ completedFirstSync: value });
      },

      setShowPocketImport: (value) => {
        set({ showPocketImport: value });
      },

      clearShowPocketImport: () => {
        set({ showPocketImport: false });
      },

      markAsLoaded: () => {
        set({ isLoaded: true });
      },
    }),
    {
      name: "first-run-store",
      storage: mmkvJSONStateStorage,
      partialize: (state) => ({
        completedFirstSync: state.completedFirstSync,
        showPocketImport: state.showPocketImport,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Mark as loaded after hydration
            state.isLoaded = true;

            // Set defaults if values are undefined (first time ever)
            if (state.completedFirstSync === undefined) {
              state.completedFirstSync = false;
            }
            if (state.showPocketImport === undefined) {
              state.showPocketImport = false;
            }
          }
        };
      },
    },
  ),
);
