import { persist } from "zustand/middleware";
import { mmkvJSONStateStorage, create } from "./stateStorage";

type State = {
  completedFirstSync: boolean | undefined;
  showPocketImport: boolean | undefined;
  isLoaded: boolean;
};

type Actions = {
  setCompletedFirstSync: (value: boolean) => void;
  setShowPocketImport: (value: boolean) => void;
  clearShowPocketImport: () => void;
  markAsLoaded: () => void;
  reset: () => void;
};

const initialState: State = {
  completedFirstSync: false,
  showPocketImport: false,
  isLoaded: true,
};

export const useFirstRunStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,

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

      reset: () => set(initialState),
    }),
    {
      name: "first-run-store",
      storage: mmkvJSONStateStorage,
      partialize: (state) => ({
        completedFirstSync: state.completedFirstSync,
        showPocketImport: state.showPocketImport,
      }),
    },
  ),
);
