// import * as IntentLauncher from "expo-intent-launcher";
import { Linking } from "react-native";

export class ShareHandler {
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
    // This will depend on how the data is passed
    if (typeof intentData === "string" && intentData.includes("http")) {
      const urlMatch = intentData.match(/(https?:\/\/[^\s]+)/);
      return urlMatch ? urlMatch[1] : null;
    }
    return null;
  }

  static async saveLink(url: string) {
    // Your existing logic to save the link
    // This should integrate with your WatermelonDB setup
    console.log("Saving link:", url);

    // Show success message
    // You can use your existing notification system
    return { success: true, message: "Saved to Folio!" };
  }
}
