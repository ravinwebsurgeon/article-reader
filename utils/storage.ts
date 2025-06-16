import { MMKV } from "react-native-mmkv";
import { NativeModules } from "react-native";

const { TokenManager } = NativeModules;

/**
 * MMKV Storage - Fast, synchronous storage with App Group support
 */
export const storage = new MMKV({
  id: "folio-shared",
  // iOS App Groups are configured via Info.plist, not here
});

/**
 * Token management with native bridge for extensions
 */
export const TokenStorage = {
  set: (token: string): void => {
    // Store in MMKV for main app
    storage.set("auth_token", token);

    // Store via native modules for extensions
    if (TokenManager) {
      TokenManager.saveToken(token);
    } else {
      console.warn("⚠️ TokenManager not available - extension won't have token access");
    }
  },

  get: (): string | undefined => {
    return storage.getString("auth_token");
  },

  delete: (): void => {
    // Clear from MMKV
    storage.delete("auth_token");

    // Clear from native modules
    if (TokenManager) {
      TokenManager.removeToken();
    }
  },
};

/**
 * AsyncStorage-compatible interface for Redux Persist
 */
export const reduxStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  getItem: async (key: string): Promise<string | null> => {
    return storage.getString(key) ?? null;
  },
  removeItem: async (key: string): Promise<void> => {
    storage.delete(key);
  },
};
