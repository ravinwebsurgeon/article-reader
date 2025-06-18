import { persist } from "zustand/middleware";
import { sendExtensionAuthToken, sendExtensionLogout } from "@/utils/extension";
import { mmkvJSONStateStorage, clearEverything, setTokenInNative, create } from "./stateStorage";
import database from "@/database";

interface User {
  id: string;
  email: string;
  name?: string;
}

type State = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type Actions = {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; password: string }) => Promise<void>;
  logout: (syncEngine?: any) => Promise<void>;
  deleteAccount: (syncEngine?: any) => Promise<void>;
  clearError: () => void;
  setToken: (token: string, user: User) => void;
  reset: () => void;
};

const initialState: State = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// API base URL
const API_URL = "https://api.savewithfolio.com/v4";

// Private cleanup function for logout and delete account
const performCompleteCleanup = async (syncEngine?: any) => {
  // 1. Stop sync engine if provided
  try {
    if (syncEngine && typeof syncEngine.stopWatching === "function") {
      syncEngine.stopWatching();
      // Wait for subscriptions to clean up
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.warn("Could not stop sync engine:", error);
  }

  // 2. Reset database to first-run state BEFORE clearing storage
  try {
    if (database) {
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
    }
  } catch (error) {
    console.error("Failed to reset database:", error);
  }

  // 3. Clear all storage and state AFTER database reset
  clearEverything();
};

export const useAuthStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      logout: async (syncEngine?: any) => {
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
        sendExtensionLogout();

        // Perform complete cleanup including database reset
        await performCompleteCleanup(syncEngine);
      },

      deleteAccount: async (syncEngine?: any) => {
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

          // After successful deletion, perform complete cleanup
          sendExtensionLogout();
          await performCompleteCleanup(syncEngine);
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

      reset: () => set(initialState),
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
