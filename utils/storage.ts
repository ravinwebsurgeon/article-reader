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
    console.log("💾 Storing auth token:", token.substring(0, 10) + "...");
    console.log("🔍 TokenManager available:", !!TokenManager);

    // Store in MMKV for main app
    storage.set("auth_token", token);

    // Store via native modules for extensions
    if (TokenManager) {
      console.log("📱 Calling TokenManager.saveToken...");
      TokenManager.saveToken(token);
    } else {
      console.warn("⚠️ TokenManager not available - extension won't have token access");
    }

    console.log("✅ Token stored in MMKV and native storage");
  },

  get: (): string | undefined => {
    return storage.getString("auth_token");
  },

  delete: (): void => {
    console.log("🗑️ Clearing auth token");

    // Clear from MMKV
    storage.delete("auth_token");

    // Clear from native modules
    if (TokenManager) {
      TokenManager.removeToken();
    }

    console.log("✅ Token cleared from all storages");
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
