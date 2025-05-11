import { StyleSheet, Pressable, SafeAreaView } from "react-native";
import { ThemeText, ThemeView } from "@/components";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeText variant="h2" style={styles.header}>
          {t("home.explore")}
        </ThemeText>

        <ThemeView style={styles.section} rounded="md">
          <Pressable style={styles.settingItem}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="compass-outline" size={24} color="#007AFF" />
              <ThemeText style={styles.settingText}>{t("home.discover")}</ThemeText>
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
  },
});
