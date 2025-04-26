import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';

// Hook to access the entire theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
};

// Hook to check if dark mode is active
export const useDarkMode = () => {
  const theme = useTheme();
  return theme.mode === 'dark';
};

// Hook to get text color based on theme
export const useTextColor = (
  variant: 'primary' | 'secondary' | 'disabled' | 'hint' = 'primary'
) => {
  const theme = useTheme();
  return theme.colors.text[variant];
};

// Hook to get background color based on theme
export const useBackgroundColor = (variant: 'default' | 'paper' | 'elevated' = 'default') => {
  const theme = useTheme();
  return theme.colors.background[variant];
};

// Convenience hook for getting colors
export const useColors = () => {
  const theme = useTheme();
  return theme.colors;
};

// Convenience hook for getting typography
export const useTypography = () => {
  const theme = useTheme();
  return theme.typography;
};

// Convenience hook for getting spacing
export const useSpacing = () => {
  const theme = useTheme();
  return theme.spacing;
};

// Convenience hook for getting shadows
export const useShadows = () => {
  const theme = useTheme();
  return theme.shadows;
};

// Standalone hook to get current active theme mode without using context
// Useful for components that just need to know the theme but don't need other theme properties
export const useActiveThemeMode = (): 'light' | 'dark' => {
  return useAppSelector(selectActiveTheme);
};
