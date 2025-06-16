import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveAuthTokenForSharing = async (token: string): Promise<boolean> => {
  try {
    console.log(
      "💾 Saving auth token for sharing:",
      token ? `${token.substring(0, 10)}...` : "empty",
    );

    // Save to AsyncStorage - ShareActivity will read from the same location
    await AsyncStorage.setItem("authToken", token);

    // Also try saving to a SharedPreferences-style location that Android can read
    try {
      await AsyncStorage.setItem("@folio:authToken", token);
    } catch (e) {
      console.warn("Failed to save backup token:", e);
    }

    console.log("✅ Auth token saved successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to save auth token for sharing:", error);
    return false;
  }
};

export const clearAuthTokenForSharing = async (): Promise<boolean> => {
  try {
    console.log("🗑️ Clearing auth token for sharing");

    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("@folio:authToken");

    console.log("✅ Auth token cleared successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to clear auth token for sharing:", error);
    return false;
  }
};

export const getAuthTokenForSharing = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    console.log("🔍 Retrieved auth token:", token ? `${token.substring(0, 10)}...` : "null");
    return token;
  } catch (error) {
    console.error("❌ Failed to get auth token for sharing:", error);
    return null;
  }
};

export const checkAuthTokenStatus = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const backupToken = await AsyncStorage.getItem("@folio:authToken");

    console.log("🔍 === AUTH TOKEN DEBUG ===");
    console.log("Main token:", token ? `${token.substring(0, 10)}...` : "null");
    console.log("Backup token:", backupToken ? `${backupToken.substring(0, 10)}...` : "null");
    console.log("========================");
  } catch (error) {
    console.error("❌ Failed to check auth token status:", error);
  }
};
