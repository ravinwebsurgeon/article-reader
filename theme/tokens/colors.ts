
export type ColorScheme = 'light' | 'dark';

export type ColorPalette = {
  // Brand colors
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  // Feedback colors
  success: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  info: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  warning: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  error: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  // Neutral colors
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    hint: string;
  };
  // Background colors
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  // Special colors
  favorite: string;
  divider: string;
  backdrop: string;
  white: string;
  black: string;
  transparent: string;
};

// Define base colors - shared between themes
const baseColors = {
  primary: {
    main: '#ef3e55',
    light: 'rgba(239, 62, 85, 0.2)',
    dark: '#d32f2f',
    contrast: '#ffffff',
  },
  secondary: {
    main: '#f34f4f',
    light: 'rgba(243, 79, 79, 0.2)',
    dark: '#c43c3c',
    contrast: '#ffffff',
  },
  success: {
    main: '#b5e48b',
    light: 'rgba(181, 228, 139, 0.2)',
    dark: '#91c665',
    contrast: '#000000',
  },
  info: {
    main: '#4f86f4',
    light: 'rgba(79, 134, 244, 0.2)',
    dark: '#3a63b8',
    contrast: '#ffffff',
  },
  warning: {
    main: '#f5a524',
    light: 'rgba(245, 165, 36, 0.2)',
    dark: '#c4831c',
    contrast: '#000000',
  },
  error: {
    main: '#ef3e55',
    light: 'rgba(239, 62, 85, 0.2)',
    dark: '#c32c41',
    contrast: '#ffffff',
  },
  favorite: '#f8e61b',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Light theme color palette
export const lightColors: ColorPalette = {
  ...baseColors,
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  text: {
    primary: '#2C2F4A',
    secondary: '#5C768D',
    disabled: '#9E9E9E',
    hint: '#7F7F9C',
  },
  background: {
    default: '#f8f9fa',
    paper: '#ffffff',
    elevated: '#ffffff',
  },
  divider: '#E0E0E0',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme color palette
export const darkColors: ColorPalette = {
  ...baseColors,
  gray: {
    50: '#18191A',
    100: '#242526',
    200: '#3A3B3C',
    300: '#4E4F50',
    400: '#6A6B6C',
    500: '#8A8B8C',
    600: '#AAABAC',
    700: '#CCCDCE',
    800: '#EEEFF0',
    900: '#F5F6F7',
  },
  text: {
    primary: '#ECEDEE',
    secondary: '#B0B3B8',
    disabled: '#6C7178',
    hint: '#8A8D91',
  },
  background: {
    default: '#151718',
    paper: '#242526',
    elevated: '#2D2E2F',
  },
  divider: '#3A3B3C',
  backdrop: 'rgba(0, 0, 0, 0.7)',
};

const tintColorLight = '#ef3e55';
const tintColorDark = '#fff';

export const COLORS = {
  ...baseColors,
  // Core brand colors from new palette
  accent: "#f5a524", // Buttercup - accent color
  
  // Background colors
  darkBackground: '#1E1E1E',

  // Legacy colors kept for compatibility
  tasksConBorder: "#EAE9E9",
  text: "#333333",

  // New requested colors
  lightGray: "#E8E8E8", // Light gray for subtle backgrounds
  lightBorder: "#DDDDDD", // Light border color
  darkGray: "#555555", // Dark gray for text and icons
  darkBorder: "#999999", // Dark border color

  
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
