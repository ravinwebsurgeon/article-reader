import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NativeModules } from "react-native";
import { sendExtensionAuthToken, sendExtensionLogout } from "@/utils/extension";
import { mmkvJSONStateStorage } from "./mmkvStateStorage";

const { TokenManager } = NativeModules;

// Helper functions for token management with native bridge
const setTokenInNative = (token: string) => {
  if (TokenManager) {
    TokenManager.saveToken(token);
  } else {
    console.warn("⚠️ TokenManager not available - extension won't have token access");
  }
};

const deleteTokenFromNative = () => {
  if (TokenManager) {
    TokenManager.removeToken();
  }
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

          // Store token in native modules and notify extension
          setTokenInNative(data.token);
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

          // Store token in native modules and notify extension
          setTokenInNative(data.token);
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
        deleteTokenFromNative();
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
        setTokenInNative(token);
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
      storage: mmkvJSONStateStorage,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
