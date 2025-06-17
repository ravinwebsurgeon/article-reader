import { StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import { useSync } from "@/database/provider/SyncProvider";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { database } = useDatabase();
  const { syncEngine } = useSync();
  const { deleteAccount } = useAuthStore();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      t("settings.deleteAccount") || "Delete Account",
      t("settings.deleteAccountConfirmMessage") ||
        "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("settings.deleteAccount") || "Delete Account",
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ],
    );
  };

  const performDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);

    try {
      // 1. Stop watching for database changes FIRST
      syncEngine.stopWatching();

      // 2. Wait a moment for subscriptions to fully stop
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 3. Reset the WatermelonDB database
      if (database) {
        await database.write(async () => {
          await database.unsafeResetDatabase();
        });
      }

      // 4. Delete account (this will also logout)
      await deleteAccount();

      // 5. Navigate back to auth flow
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Delete account error:", error);
      Alert.alert(
        t("common.error") || "Error",
        t("settings.deleteAccountError") ||
          "An error occurred while deleting your account. Please try again.",
        [{ text: t("common.ok") || "OK" }],
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeView style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary.main} />
          </Pressable>
          <ThemeText variant="body1" style={[styles.headerTitle, { fontWeight: "600" }]}>
            {t("settings.account") || "Account"}
          </ThemeText>
          <ThemeView style={styles.headerSpacer} />
        </ThemeView>

        <ThemeView
          style={[
            styles.section,
            styles.dangerSection,
            { backgroundColor: theme.colors.background.paper },
          ]}
          rounded="md"
        >
          <Pressable
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            <ThemeView style={styles.settingContent}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.error.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.error.main }]}>
                {t("settings.deleteAccount") || "Delete Account"}
              </ThemeText>
            </ThemeView>
          </Pressable>
        </ThemeView>
      </ThemeView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {},
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    overflow: "hidden",
    marginBottom: 16,
  },
  dangerSection: {
    marginTop: 32,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
});
