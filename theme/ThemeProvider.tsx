import React, { createContext, useEffect, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useAppSelector, useAppDispatch } from "@/redux/hook";
import { setSystemPrefersDark } from "@/redux/slices/themeSlice";
import { selectThemeMode, selectSystemPrefersDark } from "@/redux/utils";
import { Theme, createTheme } from "./theme";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: "light" | "dark" | "system") => void;
}

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: createTheme("light"),
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const deviceColorScheme = useColorScheme();
  const themePreference = useAppSelector(selectThemeMode);
  const systemPrefersDark = useAppSelector(selectSystemPrefersDark);

  // Determine which theme mode to use
  const resolvedMode = useMemo(() => {
    if (themePreference === "system") {
      return systemPrefersDark ? "dark" : "light";
    }
    return themePreference;
  }, [themePreference, systemPrefersDark]);

  // Create theme object based on resolved mode
  const theme = useMemo(() => {
    return createTheme(resolvedMode);
  }, [resolvedMode]);

  // Update system preference when device theme changes
  useEffect(() => {
    if (deviceColorScheme) {
      dispatch(setSystemPrefersDark(deviceColorScheme === "dark"));
    }
  }, [deviceColorScheme, dispatch]);

  // Toggle between light and dark mode
  const toggleTheme = useCallback(() => {
    const newMode = resolvedMode === "light" ? "dark" : "light";
    dispatch({ type: "theme/setThemeMode", payload: newMode });
  }, [resolvedMode, dispatch]);

  // Set specific theme mode
  const setMode = useCallback(
    (mode: "light" | "dark" | "system") => {
      dispatch({ type: "theme/setThemeMode", payload: mode });
    },
    [dispatch],
  );

  // Context value
  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      setThemeMode: setMode,
    }),
    [theme, toggleTheme, setMode],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
