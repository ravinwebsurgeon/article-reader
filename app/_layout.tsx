import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as ThemeProviderNative,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import "react-native-reanimated";
import { useAppSelector } from "@/redux/hook";
import { ReduxProvider } from "@/provider/ReduxProvider";
import { selectActiveTheme } from "@/redux/utils";
import { ThemeProvider } from "@/theme";
import { DatabaseProvider, useDatabase } from "@/database/provider/DatabaseProvider";
import { NetworkProvider } from "@/provider/NetworkProvider";
import "@/i18n"; // Import i18n configuration
import { Text } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Font configuration for the application.
 * Defines all custom fonts used throughout the app.
 */
const FONTS = {
  // Inter static fonts
  "Inter-Regular": require("../assets/fonts/Inter/Inter_18pt-Regular.ttf"),
  "Inter-Italic": require("../assets/fonts/Inter/Inter_18pt-Italic.ttf"),
  "Inter-Medium": require("../assets/fonts/Inter/Inter_18pt-Medium.ttf"),
  "Inter-MediumItalic": require("../assets/fonts/Inter/Inter_18pt-MediumItalic.ttf"),
  "Inter-SemiBold": require("../assets/fonts/Inter/Inter_18pt-SemiBold.ttf"),
  "Inter-SemiBoldItalic": require("../assets/fonts/Inter/Inter_18pt-SemiBoldItalic.ttf"),
  "Inter-Bold": require("../assets/fonts/Inter/Inter_18pt-Bold.ttf"),
  "Inter-BoldItalic": require("../assets/fonts/Inter/Inter_18pt-BoldItalic.ttf"),

  // Literata static fonts
  "Literata-Regular": require("../assets/fonts/Literata/Literata-Regular.ttf"),
  "Literata-Italic": require("../assets/fonts/Literata/Literata-Italic.ttf"),
  "Literata-SemiBold": require("../assets/fonts/Literata/Literata-SemiBold.ttf"),
  "Literata-SemiBoldItalic": require("../assets/fonts/Literata/Literata-SemiBoldItalic.ttf"),
  "Literata-Bold": require("../assets/fonts/Literata/Literata-Bold.ttf"),
  "Literata-BoldItalic": require("../assets/fonts/Literata/Literata-BoldItalic.ttf"),
  "Literata-ExtraBold": require("../assets/fonts/Literata/Literata_60pt-ExtraBold.ttf"),
  "Literata-ExtraBoldItalic": require("../assets/fonts/Literata/Literata-ExtraBoldItalic.ttf"),
};

/**
 * Navigation stack configuration.
 * Defines the app's navigation structure and screen options.
 * Each screen can have:
 * - name: The route name
 * - redirect: Function to determine if the screen should redirect
 * - options: Additional screen options (e.g., presentation mode)
 */
const STACK_CONFIG = {
  screenOptions: { headerShown: false },
  screens: [
    { name: "index", redirect: (isAuthenticated: boolean) => isAuthenticated },
    { name: "(auth)", redirect: (isAuthenticated: boolean) => isAuthenticated },
    { name: "(tabs)", redirect: (isAuthenticated: boolean) => !isAuthenticated },
    { name: "reader/[id]" },
    { name: "+not-found", options: { presentation: "modal" as const } },
    {
      name: "edit-tags",
      options: {
        presentation: "modal" as const,
      },
    },
  ],
};

/**
 * AppContent component
 * Handles the initialization of core app features:
 * - Font loading
 * - Database initialization
 * - Splash screen management
 *
 * The splash screen remains visible until both fonts are loaded
 * and the database is initialized.
 */
function AppContent() {
  const { isReady: isDatabaseReady } = useDatabase();
  const [fontsLoaded] = useFonts(FONTS);

  useEffect(() => {
    console.log("fontsLoaded", fontsLoaded);
    if (fontsLoaded && isDatabaseReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isDatabaseReady]);

  if (!fontsLoaded || !isDatabaseReady) {
    return null;
  }

  return <RootLayoutNav />;
}

/**
 * RootLayoutNav component
 * Handles the app's navigation and theme setup.
 * Features:
 * - Theme management (light/dark mode)
 * - Authentication-based routing
 * - Stack navigation setup
 * - Status bar configuration
 */
function RootLayoutNav() {
  const activeTheme = useAppSelector(selectActiveTheme);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Memoize theme value to prevent unnecessary re-renders
  const themeValue = useMemo(
    () => (activeTheme === "dark" ? DarkTheme : DefaultTheme),
    [activeTheme],
  );

  return (
    <ThemeProviderNative value={themeValue}>
      <ThemeProvider>
        <Stack {...STACK_CONFIG}>
          {STACK_CONFIG.screens.map((screen) => (
            <Stack.Screen
              key={screen.name}
              name={screen.name}
              redirect={screen.redirect?.(isAuthenticated)}
              options={screen.options}
            />
          ))}
        </Stack>
        <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </ThemeProviderNative>
  );
}

/**
 * RootLayout component
 * The main entry point for the app's component tree.
 * Sets up the core providers:
 * - ReduxProvider: Global state management
 * - DatabaseProvider: Local database and sync
 * - NetworkProvider: Network connectivity monitoring
 */
export default function RootLayout() {
  return (
    <ReduxProvider>
      <DatabaseProvider>
        <NetworkProvider>          
          <AppContent />
        </NetworkProvider>
      </DatabaseProvider>
    </ReduxProvider>
  );
}
