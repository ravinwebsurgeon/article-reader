import { useEffect, useContext, useRef } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { useTheme } from "@/theme";
import { SyncContext } from "@/database/provider/SyncProvider";
import { useAuthStore } from "@/stores/authStore";

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const syncContext = useContext(SyncContext);
  const { deleteAccount } = useAuthStore();
  const hasStarted = useRef(false);

  console.log("DeleteAccountScreen rendered");

  useEffect(() => {
    // Prevent running multiple times
    if (hasStarted.current) {
      console.log("Delete account already started, skipping");
      return;
    }

    const performDelete = async () => {
      hasStarted.current = true;

      try {
        console.log("Starting delete account process");

        // Auth store handles everything: API call, sync stopping, storage clearing, database reset
        await deleteAccount(syncContext?.syncEngine);

        console.log("Delete account complete - navigating to signup");
        // Navigate to signup
        router.replace("/(auth)/signup");
      } catch (error) {
        console.error("Delete account error:", error);
        // On error, go back to login
        router.replace("/(auth)/login");
      }
    };

    performDelete();
  }, [deleteAccount, router, syncContext]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      <ThemeView style={{ flex: 1, justifyContent: "center", alignItems: "center" }} padded="lg">
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <ThemeText style={{ marginTop: 16, textAlign: "center" }}>
          {t("settings.deletingAccount")}
        </ThemeText>
      </ThemeView>
    </SafeAreaView>
  );
}
