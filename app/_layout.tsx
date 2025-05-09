import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as ThemeProviderNative,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAppSelector } from '@/redux/hook';
import { ReduxProvider } from '@/provider/ReduxProvider';
import { selectActiveTheme } from '@/redux/utils';
import { ThemeProvider } from '@/theme';
import { DatabaseProvider } from '@/database/provider/DatabaseProvider';
import NetworkProvider from '@/provider/NetworkProvider';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [loaded] = useFonts({
    // Inter variable fonts
    'InterVariable': require('../assets/fonts/InterVariable.ttf'),
    'InterVariable-Italic': require('../assets/fonts/InterVariable-Italic.ttf'),
    
    // Literata variable fonts
    'Literata-VariableFont_opsz,wght': require('../assets/fonts/Literata-VariableFont_opsz,wght.ttf'),
    'Literata-Italic-VariableFont_opsz,wght': require('../assets/fonts/Literata-Italic-VariableFont_opsz,wght.ttf'),
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
      <DatabaseProvider>
        <NetworkProvider>
          <RootLayoutNav />
        </NetworkProvider>
      </DatabaseProvider>
    </ReduxProvider>
  );
}

function RootLayoutNav() {
  // Get the active theme from Redux
  const activeTheme = useAppSelector(selectActiveTheme);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <ThemeProviderNative value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Initial route based on authentication status */}
          <Stack.Screen name="index" redirect={isAuthenticated} />

          {/* Auth group */}
          <Stack.Screen name="(auth)" redirect={isAuthenticated} />

          {/* Main app group (protected routes) */}
          <Stack.Screen name="(tabs)" redirect={!isAuthenticated} />

          {/* Reader route */}
          <Stack.Screen name="reader/[id]" />

          {/* Error screens */}
          <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ThemeProviderNative>
  );
}
