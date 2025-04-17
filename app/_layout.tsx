// src/App.tsx - at the very top before other imports
import '../config/reactotron'; 
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
import { useAppSelector } from "@/redux/hook";
import { ReduxProvider } from "@/provider/ReduxProvider";
import { selectActiveTheme } from "@/redux/utils";
import { setupFlipper } from "@/config/flipper";
import { useInitializeAuthQuery } from "@/redux/services/authApi";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // This will check if the user has a valid token on app start
  const [loaded] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsMedium: require("../assets/fonts/Poppins-Medium.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
  });

  
  // Initialize Flipper
  if (__DEV__) {
    setupFlipper();
  }

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
  const { isLoading, data } = useInitializeAuthQuery();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  // const isAuthenticated = true;

  return (
    <ThemeProvider value={activeTheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Initial route based on authentication status */}
        <Stack.Screen name="index" redirect={isAuthenticated} />

        {/* Auth group */}
        <Stack.Screen name="(auth)" redirect={isAuthenticated} />

        {/* Main app group (protected routes) */}
        <Stack.Screen name="(tabs)" redirect={!isAuthenticated} />

        {/* Error screens */}
        <Stack.Screen name="+not-found" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
