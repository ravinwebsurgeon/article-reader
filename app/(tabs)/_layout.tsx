import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme } from "@/theme";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          theme.mode === "dark" ? theme.colors.white : theme.colors.primary.main,
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          android: {
            paddingVertical: 20,
          },
          default: {
            paddingVertical: 20,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("navigation.tabs.saves"),
          tabBarIcon: ({ color }) => <SvgIcon name="saves" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t("navigation.tabs.discover"),
          tabBarIcon: ({ color }) => <SvgIcon name="discover" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("navigation.tabs.settings"),
          tabBarIcon: ({ color }) => <SvgIcon name="settings" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="connect-extension"
        options={{
          href: null, // This hides it from the tab bar
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
