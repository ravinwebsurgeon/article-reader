import { StyleSheet, Pressable, SafeAreaView } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeText variant="h2" style={styles.header}>
          {t("settings.title")}
        </ThemeText>

        <ThemeView style={styles.section} rounded="md">
          <Pressable style={styles.settingItem}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="person-outline" size={24} color="#007AFF" />
              <ThemeText style={styles.settingText}>{t("settings.account")}</ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </Pressable>

          <Pressable style={styles.settingItem}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
              <ThemeText style={styles.settingText}>{t("settings.notifications")}</ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </Pressable>

          <Pressable style={styles.settingItem}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="moon-outline" size={24} color="#007AFF" />
              <ThemeText style={styles.settingText}>{t("settings.appearance")}</ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </Pressable>
        </ThemeView>

        <ThemeView style={styles.section} rounded="md">
          <Pressable style={styles.settingItem}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
              <ThemeText style={styles.settingText}>{t("settings.help")}</ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </Pressable>

          <Pressable style={styles.settingItem}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
              <ThemeText style={styles.settingText}>{t("settings.about")}</ThemeText>
            </ThemeView>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
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
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: "#007AFF",
  },
});
