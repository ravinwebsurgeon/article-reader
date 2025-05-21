/**
 * Pocket App Theme System
 *
 * This file exports the complete theme system for the Pocket app,
 * including tokens, provider, hooks, and types.
 *
 * This theme system follows SOLID principles:
 * - Single Responsibility: Each module handles one aspect of theming
 * - Open/Closed: Theme can be extended without modifying core
 * - Liskov Substitution: Theme components can be substituted without breaking
 * - Interface Segregation: Clean interfaces between theme modules
 * - Dependency Inversion: UI depends on abstraction, not concrete implementations
 *
 * It also follows DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles:
 * - Centralized theme tokens prevent duplication of color/spacing values
 * - Abstracted components handle theme application automatically
 * - Simple, predictable API for theme consumption
 */

// Export theme creation and types
export { createTheme, lightTheme, darkTheme } from "./theme";
export type { Theme, ThemeMode } from "./theme";

// Export theme provider
export { ThemeProvider, ThemeContext } from "./ThemeProvider";

// Export theme hooks
export {
  useTheme,
  useDarkMode,
  useTextColor,
  useBackgroundColor,
  useColors,
  useTypography,
  useSpacing,
  useShadows,
  useActiveThemeMode,
  useThemeColor,
} from "./hooks";
export type { UseThemeColorProps } from "./hooks";

// Export theme tokens for direct access if needed
export * from "./tokens";

/**
 * Usage Guide
 *
 * 1. Wrap your app with ThemeProvider:
 *
 * ```tsx
 * import { ThemeProvider } from '@/theme';
 *
 * export default function App() {
 *   return (
 *     <ThemeProvider>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 *
 * 2. Use themed components in your UI:
 *
 * ```tsx
 * import { ThemeView, ThemeText, ThemeButton } from '@/components/core';
 *
 * function MyScreen() {
 *   return (
 *     <ThemeView padded>
 *       <ThemeText variant="h1">Hello World</ThemeText>
 *       <ThemeButton title="Press Me" onPress={() => {}} />
 *     </ThemeView>
 *   );
 * }
 * ```
 *
 * 3. Access theme values with hooks:
 *
 * ```tsx
 * import { useTheme, useColors } from '@/theme';
 *
 * function MyComponent() {
 *   const theme = useTheme();
 *   const colors = useColors();
 *
 *   return (
 *     <ThemeView style={{ borderColor: colors.primary.main }}>
 *       <ThemeText style={{ fontSize: theme.typography.h2.fontSize }}>
 *         Custom Styled
 *       </ThemeText>
 *     </ThemeView>
 *   );
 * }
 * ```
 */
