import { StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import { useLogoutMutation } from "@/redux/services/authApi";
import { useState } from "react";
import { syncEngine } from "@/database/sync/SyncEngine";
import { storage } from "@/utils/storage";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { database } = useDatabase();
  const [logout] = useLogoutMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Show confirmation alert
    Alert.alert(
      t("settings.logout") || "Logout",
      t("settings.logoutConfirmMessage") ||
        "Are you sure you want to logout? This will clear all your local data.",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("common.logout") || "Logout",
          style: "destructive",
          onPress: performLogout,
        },
      ],
    );
  };

  const performLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // 1. Stop watching for database changes
      syncEngine.stopWatchForChanges();

      // 2. Call logout API (this will also clear the auth token via authApi)
      await logout().unwrap();

      // 3. Reset the WatermelonDB database
      if (database) {
        await database.write(async () => {
          await database.unsafeResetDatabase();
        });
      }

      // 4. Clear all storage data
      storage.clearAll();

      // 5. Reset sync engine state
      syncEngine.setToken(null);

      // The app will automatically redirect to auth screen due to Redux state change
      // from the logout mutation, but we can also manually navigate if needed
      router.replace("/auth-start");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(
        t("common.error") || "Error",
        t("settings.logoutError") || "An error occurred while logging out. Please try again.",
        [{ text: t("common.ok") || "OK" }],
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeText variant="h2" style={styles.header}>
          {t("settings.title")}
        </ThemeText>

        <ThemeView
          style={[styles.section, { backgroundColor: theme.colors.background.paper }]}
          rounded="md"
        >
          <Pressable style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="person-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.account")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.notifications")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="moon-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.appearance")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            onPress={() => router.push("/import-pocket")}
          >
            <ThemeView style={styles.settingContent}>
              <Ionicons name="download-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.importFromPocket")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>
        </ThemeView>

        <ThemeView
          style={[
            styles.section,
            styles.secondSection,
            { backgroundColor: theme.colors.background.paper },
          ]}
          rounded="md"
        >
          <Pressable style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.help")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
            <ThemeView style={styles.settingContent}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={theme.colors.primary.main}
              />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.about")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable
            style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <ThemeView style={styles.settingContent}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("settings.logout")}
              </ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
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
    marginBottom: 24,
  },
  section: {
    overflow: "hidden",
  },
  secondSection: {
    marginTop: 16,
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
