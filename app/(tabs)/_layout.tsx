import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { SvgIcon } from '@/components/SvgIcon';
import { scaler } from '@/utils';
import { COLORS, useTheme } from '@/theme';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      initialRouteName="saves"
      screenOptions={{
        tabBarActiveTintColor: COLORS[theme.mode ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
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
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            // <IconSymbol size={28} name="house.fill" color={color} />
            <SvgIcon name="discover" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="saves"
        options={{
          title: 'Saves',
          tabBarIcon: ({ color }) => <SvgIcon name="saves" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <SvgIcon name="settings" color={color} size={24} />,
        }}
      />
    </Tabs>
    // <BottomNavigation {...bottomNavigationExample} />
  );
}
