import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class ShareHandler {
  private static readonly API_BASE_URL = "https://api.savewithfolio.com/v4";

  static async handleInitialShare() {
    try {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        return this.extractUrlFromIntent(initialURL);
      }
      return null;
    } catch (error) {
      console.log("Error getting initial URL:", error);
      return null;
    }
  }

  static extractUrlFromIntent(intentData: string) {
    // Extract URL from intent data
    if (typeof intentData === "string" && intentData.includes("http")) {
      const urlMatch = intentData.match(/(https?:\/\/[^\s]+)/);
      return urlMatch ? urlMatch[1] : null;
    }
    return null;
  }

  static async saveLink(url: string) {
    Alert.alert("does the code coming here for save link??");
    try {
      const authToken = await AsyncStorage.getItem("auth_token");

      if (!authToken) {
        return {
          success: false,
          message: "Please login to Folio first 2",
        };
      }

      const response = await fetch(`${this.API_BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: {
            url: url,
            archived: false,
            favorite: false,
          },
        }),
      });

      if (response.ok) {
        // Store the token in shared storage for native extensions
        await this.storeTokenForNativeExtensions(authToken);

        return {
          success: true,
          message: "✅ Saved to Folio!",
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: "Authentication failed. Please login again.",
        };
      } else {
        return {
          success: false,
          message: "Failed to save. Please try again.",
        };
      }
    } catch (error) {
      console.error("Error saving link:", error);
      return {
        success: false,
        message: "Error saving to Folio",
      };
    }
  }

  private static async storeTokenForNativeExtensions(token: string) {
    try {
      if (Platform.OS === "ios") {
        // For iOS, we need to use shared UserDefaults
        // This would require a native module or storing in a shared keychain
        // For now, we'll just log this requirement
        console.log("iOS: Token should be stored in shared UserDefaults for Share Extension");
      } else if (Platform.OS === "android") {
        // For Android, store in SharedPreferences that the native service can access
        await AsyncStorage.setItem("auth_token", token);
      }
    } catch (error) {
      console.error("Error storing token for native extensions:", error);
    }
  }

  static async getCurrentAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("auth_token");
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  // Method to test the API connection
  static async testConnection(): Promise<boolean> {
    try {
      const token = await this.getCurrentAuthToken();
      if (!token) return false;

      const response = await fetch(`${this.API_BASE_URL}/users/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Error testing connection:", error);
      return false;
    }
  }
}
