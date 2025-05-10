import { api } from "./api";
import {
  User,
  UserCredentials,
  UserRegistration,
  RefreshTokenResponse,
  RefreshTokenRequest,
} from "../../types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncEngine } from "@/database/sync/SyncEngine";

// Auth API endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Register a new user
    register: builder.mutation<{ token: string; user: User }, { user: UserRegistration }>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await AsyncStorage.setItem("auth_token", data.token);
        } catch {
          // Handle error if needed
        }
      },
    }),

    // Login
    login: builder.mutation<{ token: string; user: User }, { user: UserCredentials }>({
      query: (data) => ({
        url: "/sessions",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log("is it coming here successful", data);
          await AsyncStorage.setItem("auth_token", data.token);
          const isFirstSync = await AsyncStorage.getItem("already_synced");
          if (!isFirstSync) {
            await syncEngine.sync(true);
            await AsyncStorage.setItem("already_synced", "true");
          } else {
            await syncEngine.sync();
          }
        } catch {
          // Handle error if needed
        }
      },
    }),

    // Logout
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/sessions",
        method: "DELETE",
      }),
      // Clear tokens on logout
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          await AsyncStorage.removeItem("auth_token");
        } catch {
          // Force remove token even if API call fails
          await AsyncStorage.removeItem("auth_token");
        }
      },
    }),

    // Refresh token
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: "/auth/refresh",
        method: "POST",
        body: data,
      }),
      // Automatically store new token on success
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await AsyncStorage.setItem("auth_token", data.token);
        } catch {
          // Handle error if needed
        }
      },
    }),

    // Initialize auth - This is a special endpoint that doesn't call the API
    // but is used to check if the user has a valid token
    initializeAuth: builder.query<any | null, void>({
      queryFn: async () => {
        try {
          const token = await AsyncStorage.getItem("auth_token");

          if (!token) {
            return { data: null };
          }

          // If we have a token, try to get the current user
          const response = await fetch("https://api.pckt.dev/v4/users/current", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Token is invalid, clear it
            await AsyncStorage.removeItem("auth_token");
            return { data: null };
          }

          const data = await response.json();
          return { data: { user: data.user, token } };
        } catch {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Failed to initialize auth",
            },
          };
        }
      },
      // Keep result for 5 minutes, then re-fetch
      keepUnusedDataFor: 300,
    }),
  }),
});

// Export hooks
export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useInitializeAuthQuery,
} = authApi;
