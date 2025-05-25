import React, { useEffect, useState } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { ThemeText, ThemeView } from "@/components";
import { SvgIcon } from "@/components/SvgIcon";
import { useTranslation } from "react-i18next";
import { sendExtensionAuthToken } from "@/utils/extension";
import AsyncStorage from "@react-native-async-storage/async-storage";

function ConnectExtension() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        if (storedToken) {
          sendExtensionAuthToken(storedToken);
        }
      } catch {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const dynamicStyles: {
    container: ViewStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
        <ThemeView style={styles.content}>
          <ThemeText>Loading...</ThemeText>
        </ThemeView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <ThemeView style={styles.content}>
        <ThemeView style={styles.logoContainer}>
          <SvgIcon name="pocket-pink" size={48} color={theme.colors.primary.main} />
        </ThemeView>
        <ThemeText variant="h2" style={styles.title}>
          {t("auth.connectExtension.title")}
        </ThemeText>
        <ThemeText style={styles.message}>{t("auth.connectExtension.message")}</ThemeText>
      </ThemeView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
});

export default ConnectExtension;
