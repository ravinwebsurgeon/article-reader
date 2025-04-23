import { Tabs } from "expo-router";
import React from "react";
import { Platform, SafeAreaView } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SvgIcon } from "@/components/SvgIcon";
import { scaler } from "@/utils";
import { COLORS } from "@/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          android: {
            paddingVertical: scaler(20),

          },
          default: {
            paddingVertical: scaler(20),
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            // <IconSymbol size={28} name="house.fill" color={color} />
            <SvgIcon name="discover" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Saves",
          tabBarIcon: ({ color }) => (
            <SvgIcon name="saves" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <SvgIcon name="settings" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
    // <BottomNavigation {...bottomNavigationExample} />
  );
}
