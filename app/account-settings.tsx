import { StyleSheet, Pressable, TouchableOpacity } from "react-native";
import crossPlatformAlert from "@/utils/crossPlatformAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const handleDeleteAccount = () => {
    console.log("Delete account button pressed - showing confirmation dialog");
    crossPlatformAlert(
      t("settings.deleteAccount") || "Delete Account",
      t("settings.deleteAccountConfirmMessage") ||
        "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel",
          onPress: () => console.log("Delete account cancelled"),
        },
        {
          text: t("settings.deleteAccount") || "Delete Account",
          style: "destructive",
          onPress: () => {
            console.log("Delete account confirmed - navigating to delete page");
            router.replace("/delete-account");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back-outline" size={24} color={theme.colors.primary.main} />
          </TouchableOpacity>
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
  dangerSection: {},
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
