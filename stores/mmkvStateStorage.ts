import { StateStorage, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

// MMKV instance for Zustand stores
const storage = new MMKV({
  id: "folio-shared",
});

// MMKV storage adapter for Zustand StateStorage interface
const mmkvStateStorage: StateStorage = {
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

// Ready-to-use JSON storage for Zustand persist middleware
export const mmkvJSONStateStorage = createJSONStorage(() => mmkvStateStorage);
