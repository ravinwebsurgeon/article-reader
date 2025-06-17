import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { storage, TokenStorage } from "@/utils/storage";
import { sendExtensionAuthToken, sendExtensionLogout } from "@/utils/extension";

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

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  // State
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
  setToken: (token: string, user: User) => void;
}

// API base URL
const API_URL = "https://api.savewithfolio.com/v4";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          console.log("Login attempt to:", `${API_URL}/sessions`);
          const response = await fetch(`${API_URL}/sessions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: credentials }),
          });

          console.log("Login response status:", response.status);
          console.log("Login response headers:", response.headers);

          if (!response.ok) {
            const errorText = await response.text();
            console.log("Login error response:", errorText);
            throw new Error(`Login failed: ${response.status}`);
          }

          const data = await response.json();

          // Store token in both places
          TokenStorage.set(data.token);
          sendExtensionAuthToken(data.token);

          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
          throw error;
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: credentials }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Registration failed");
          }

          const data = await response.json();

          // Store token in both places
          TokenStorage.set(data.token);
          sendExtensionAuthToken(data.token);

          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Registration failed",
          });
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();

        try {
          // Call logout endpoint if we have a token
          if (token) {
            await fetch(`${API_URL}/sessions`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          }
        } catch (error) {
          console.warn("Logout API call failed, but continuing with local logout:", error);
        }

        // Always clear local state regardless of API success
        TokenStorage.delete();
        storage.clearAll();
        sendExtensionLogout();

        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      deleteAccount: async () => {
        const { token } = get();

        if (!token) {
          throw new Error("No auth token available");
        }

        try {
          const response = await fetch(`${API_URL}/users/current`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Account deletion failed");
          }

          // After successful deletion, logout
          await get().logout();
        } catch (error) {
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setToken: (token, user) => {
        TokenStorage.set(token);
        sendExtensionAuthToken(token);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
