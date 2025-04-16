import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAppSelector } from "@/redux/hook";
import { ReduxProvider } from "@/provider/ReduxProvider";
import { selectActiveTheme } from "@/redux/utils";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsMedium: require("../assets/fonts/Poppins-Medium.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ReduxProvider>
      <RootLayoutNav />
    </ReduxProvider>
  );
}

function RootLayoutNav() {
  // Get the active theme from Redux
  const activeTheme = useAppSelector(selectActiveTheme);
  // const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isAuthenticated = false;

  return (
    <ThemeProvider value={activeTheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Initial route based on authentication status */}
        <Stack.Screen name="index" redirect={isAuthenticated} />

        {/* Auth group */}
        <Stack.Screen name="(auth)" redirect={isAuthenticated} />

        {/* Main app group (protected routes) */}
        <Stack.Screen name="(tabs)" redirect={!isAuthenticated} />

        {/* Blog detail screens */}
        <Stack.Screen name="blog" redirect={!isAuthenticated} />

        {/* Error screens */}
        <Stack.Screen name="+not-found" options={{ presentation: "modal" }} />
        {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="+not-found" /> */}
      </Stack>
      <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
