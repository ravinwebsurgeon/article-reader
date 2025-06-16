import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText, ThemeView } from "@/components";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme";
import NoUIFound from "@/components/shared/emptyState/NoUIFound";

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.default }]}>
      <ThemeView style={styles.container} padded="lg">
        <ThemeText variant="h2" style={styles.header}>
          {t("home.discover")}
        </ThemeText>
        <NoUIFound filter="discover" />
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
});
