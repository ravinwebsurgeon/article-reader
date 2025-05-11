import React from "react";
import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { ThemeText } from "@/components/primitives/ThemeText";
import { ThemeView } from "@/components/primitives/ThemeView";
import { useTranslation } from "react-i18next";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <ThemeView style={styles.container}>
        <ThemeText variant="h2">{t("notFound.message")}</ThemeText>
        <Link href="/" style={styles.link}>
          <ThemeText variant="overline">{t("notFound.goHome")}</ThemeText>
        </Link>
      </ThemeView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
