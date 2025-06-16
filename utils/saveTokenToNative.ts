import * as FileSystem from "expo-file-system";

export async function saveTokenToNativeFile(token: string) {
  try {
    const fileUri = FileSystem.documentDirectory + "folio_share_token.txt";
    await FileSystem.writeAsStringAsync(fileUri, token);
    console.log("✅ Token saved to native file at:", fileUri);
  } catch (error) {
    console.error("❌ Failed to save token to file:", error);
  }
}
