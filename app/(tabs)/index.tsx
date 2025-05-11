import { StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeText variant="h2" style={styles.header}>
          {t("home.explore")}
        </ThemeText>

        <ThemeView
          style={[styles.section, { backgroundColor: theme.colors.background.paper }]}
          rounded="md"
        >
          <Pressable style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}>
            <ThemeView style={styles.settingContent}>
              <Ionicons name="compass-outline" size={24} color={theme.colors.primary.main} />
              <ThemeText style={[styles.settingText, { color: theme.colors.text.primary }]}>
                {t("home.discover")}
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
