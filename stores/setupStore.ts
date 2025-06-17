import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mmkvJSONStateStorage } from "./mmkvStateStorage";

interface SetupState {
  // State
  hasCompletedFirstSync: boolean;
  shouldShowPocketImport: boolean;

  // Actions
  markFirstSyncCompleted: () => void;
  setShouldShowPocketImport: (show: boolean) => void;
  completePocketImport: () => void;
}

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      // Initial state
      hasCompletedFirstSync: false,
      shouldShowPocketImport: false,

      // Actions
      markFirstSyncCompleted: () => set({ hasCompletedFirstSync: true }),

      setShouldShowPocketImport: (show) => set({ shouldShowPocketImport: show }),

      completePocketImport: () => set({ shouldShowPocketImport: false }),
    }),
    {
      name: "setup-store",
      storage: mmkvJSONStateStorage,
    },
  ),
);
