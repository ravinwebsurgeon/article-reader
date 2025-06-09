import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { store, persistor } from "@/redux/store";

import { setSystemPrefersDark } from "@/redux/slices/themeSlice";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

// This component wraps our app with all necessary providers
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  // Update Redux with system theme preference
  React.useEffect(() => {
    if (colorScheme) {
      store.dispatch(setSystemPrefersDark(colorScheme === "dark"));
    }
  }, [colorScheme]);

  // Loading component while Redux is rehydrating
  const renderLoading = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );

  return (
    <Provider store={store}>
      <PersistGate loading={renderLoading()} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>{children}</SafeAreaProvider>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  );
}
