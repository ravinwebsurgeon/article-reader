import { api } from "./api";
import {
  User,
  UserCredentials,
  UserRegistration,
  RefreshTokenResponse,
  RefreshTokenRequest,
} from "../../types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendExtensionLogout } from "@/utils/extension";
import { Platform, NativeModules } from "react-native";
import { clearAuthTokenForSharing, saveAuthTokenForSharing } from "@/utils/ShareTokenManager";
import { saveTokenToNativeFile } from "@/utils/saveTokenToNative";
import { saveToken } from "@/utils/saveTokenIos";

const storeTokenForNativeExtensions = async (token: string) => {
  try {
    console.log("Storing token for native extensions:", token.substring(0, 10) + "...");

    // Store in multiple locations to ensure compatibility
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("folio_auth_token", token); // Additional key for safety

    if (Platform.OS === "ios") {
      // For iOS, we need to store in App Group UserDefaults
      if (NativeModules.SharedStorage) {
        await NativeModules.SharedStorage.setItem("auth_token", token);
        await NativeModules.SharedStorage.setItem("folio_auth_token", token);
        console.log("✅ Token stored in iOS shared storage");
      } else {
        console.warn("⚠️ SharedStorage module not available for iOS");
      }
    }

    // For Android, also try to store in a location that matches SharedPreferences access pattern
    // if (Platform.OS === 'android') {
    //   // AsyncStorage on Android typically maps to SharedPreferences with "ReactNative" name
    //   // Let's also store it in the exact format the Android code expects
    //   try {
    //     const currentState = await AsyncStorage.getItem("persist:root");
    //     if (currentState) {
    //       const parsed = JSON.parse(currentState);
    //       if (parsed.auth) {
    //         let authState = parsed.auth;
    //         if (typeof authState === 'string') {
    //           authState = JSON.parse(authState.replace(/\\"/g, '"'));
    //         }
    //         authState.token = token;
    //         parsed.auth = JSON.stringify(authState).replace(/"/g, '\\"');
    //         await AsyncStorage.setItem("persist:root", JSON.stringify(parsed));
    //         console.log("✅ Token updated in Redux persist store");
    //       }
    //     }
    //   } catch (e) {
    //     console.warn("Could not update Redux persist store:", e);
    //   }
    // }

    console.log("✅ Token storage completed");
  } catch (error) {
    console.error("❌ Error storing token for native extensions:", error);
  }
};

const removeTokenFromNativeExtensions = async () => {
  try {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("folio_auth_token");

    if (Platform.OS === "ios") {
      if (NativeModules.SharedStorage) {
        await NativeModules.SharedStorage.removeItem("auth_token");
        await NativeModules.SharedStorage.removeItem("folio_auth_token");
      }

      console.log("✅ Token removed from native extensions");
    }
  } catch (error) {
    console.error("❌ Error removing token from native extensions:", error);
  }
};

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
          // await AsyncStorage.setItem("auth_token", data.token);
          await storeTokenForNativeExtensions(data.token);
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
          await saveAuthTokenForSharing(data.token);
          await saveTokenToNativeFile(data.token);
          saveToken(data.token);
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
      // Clear all data on logout
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          await removeTokenFromNativeExtensions();
          await AsyncStorage.clear();
          await clearAuthTokenForSharing();
          // Notify extension about logout
          sendExtensionLogout();
        } catch {
          // Force remove token even if API call fails
          await removeTokenFromNativeExtensions();
          await AsyncStorage.clear();
          sendExtensionLogout();
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
          // await AsyncStorage.setItem("auth_token", data.token);
          await storeTokenForNativeExtensions(data.token);
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
          const response = await fetch("https://api.savewithfolio.com/v4/users/current", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Token is invalid, clear it
            await removeTokenFromNativeExtensions();
            // await AsyncStorage.removeItem("auth_token");
            return { data: null };
          }

          const data = await response.json();
          await storeTokenForNativeExtensions(token);
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
