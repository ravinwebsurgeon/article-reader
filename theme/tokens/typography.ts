import { Platform, TextStyle } from "react-native";

// Font family definitions
export const fontFamily = {
  inter: {
    variable: "InterVariable",
    variableItalic: "InterVariable-Italic",
  },
  literata: {
    variable: "Literata-VariableFont_opsz,wght",
    variableItalic: "Literata-Italic-VariableFont_opsz,wght",
  },
};

// Font weight type for better type safety
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// Extended TextStyle to include font variation settings
interface ExtendedTextStyle extends TextStyle {
  fontVariationSettings?: string;
}

// Shared utility for handling font weights across platforms
const getFontWeightStyle = (weight: FontWeight): Partial<ExtendedTextStyle> => {
  if (Platform.OS === "ios") {
    return { fontWeight: weight };
  }
  return { fontVariationSettings: `'wght' ${weight}` };
};

export const getInterVariableStyle = (
  weight: FontWeight = 400,
  italic: boolean = false,
): ExtendedTextStyle => {
  let computedFontFamily = italic ? fontFamily.inter.variableItalic : fontFamily.inter.variable;
  // Experiment for iOS: Use a more generic family name for variable fonts
  // as iOS might select weights better with this approach.
  if (Platform.OS === "ios") {
    computedFontFamily = italic ? "InterVariable-Italic" : "Inter"; // Assuming "InterVariable-Italic" is the specific name for the italic variant if needed, or it could be "Inter-Italic"
  }

  return {
    fontFamily: computedFontFamily,
    ...getFontWeightStyle(weight),
    ...(italic && Platform.OS === "android" ? { fontStyle: "italic" as const } : {}),
  };
};

// Helper for Literata variable font with optical size parameter
export const getLiterataVariableStyle = (
  weight: FontWeight = 400,
  opticalSize: number = 16,
  italic: boolean = false,
): ExtendedTextStyle => {
  const baseStyle: ExtendedTextStyle = {
    fontFamily: italic ? fontFamily.literata.variableItalic : fontFamily.literata.variable,
    ...(italic && Platform.OS === "android" ? { fontStyle: "italic" as const } : {}),
  };

  if (Platform.OS === "ios") {
    return {
      ...baseStyle,
      fontWeight: weight,
    };
  }

  return {
    ...baseStyle,
    fontVariationSettings: `'wght' ${weight}, 'opsz' ${opticalSize}`,
  };
};

// Create text style using variable font
export const createTextStyle = (
  size: number,
  lineHeight: number,
  weight: FontWeight = 400,
  letterSpacing: number = 0,
  italic: boolean = false,
  fontSet: "inter" | "literata" = "inter",
): ExtendedTextStyle => {
  const style: ExtendedTextStyle = {
    fontSize: size,
    lineHeight: lineHeight,
    letterSpacing: letterSpacing,
    includeFontPadding: false, // For consistency between iOS and Android
  };

  // Add variable font styling
  if (fontSet === "inter") {
    Object.assign(style, getInterVariableStyle(weight, italic));
  } else {
    Object.assign(style, getLiterataVariableStyle(weight, size, italic));
  }

  return style;
};

// Convenience function for Literata text style
export const createLiterataStyle = (
  size: number,
  lineHeight: number,
  weight: FontWeight = 400,
  letterSpacing: number = 0,
  italic: boolean = false,
): ExtendedTextStyle => {
  return createTextStyle(size, lineHeight, weight, letterSpacing, italic, "literata");
};

export const typography = {
  // Headings
  h1: createTextStyle(32, 40, 700 as FontWeight),
  h2: createTextStyle(30, 36, 700 as FontWeight),
  h3: createTextStyle(24, 32, 700 as FontWeight),
  h4: createTextStyle(22, 28, 600 as FontWeight),
  h5: createTextStyle(20, 26, 600 as FontWeight),
  h6: createTextStyle(18, 24, 600 as FontWeight),
  h7: createTextStyle(16, 24, 700 as FontWeight),
  h8: createTextStyle(18, 26, 600 as FontWeight),

  // Body text
  body1: createTextStyle(16, 24, 400 as FontWeight),
  body2: createTextStyle(14, 20, 400 as FontWeight),
  body1Bold: createTextStyle(16, 24, 700 as FontWeight),
  body2Bold: createTextStyle(14, 20, 700 as FontWeight),

  // Other text styles
  subtitle1: createTextStyle(16, 24, 500 as FontWeight),
  subtitle2: createTextStyle(14, 20, 500 as FontWeight),
  caption: createTextStyle(12, 16, 400 as FontWeight),
  caption2: createTextStyle(12, 14, 500 as FontWeight),
  overline: createTextStyle(10, 14, 500 as FontWeight, 1.5),
  tagStyle: createTextStyle(13, 24, 600 as FontWeight),

  // meta
  meta: createTextStyle(16, 18, 400 as FontWeight),
  meta2: createTextStyle(10, 14, 400 as FontWeight),

  //guide
  guide: createTextStyle(11, 14, 500 as FontWeight),

  // Button text
  button: createTextStyle(14, 20, 600 as FontWeight),
  button_small: createTextStyle(12, 18, 600 as FontWeight),
  button_medium: createTextStyle(14, 20, 600 as FontWeight),
  button_large: createTextStyle(16, 24, 600 as FontWeight),

  // Reader specific styles with Literata
  reader: {
    body: createLiterataStyle(18, 28, 400 as FontWeight),
    bodyItalic: createLiterataStyle(18, 28, 400 as FontWeight, 0, true),
    heading1: createLiterataStyle(24, 32, 700 as FontWeight),
    heading2: createLiterataStyle(22, 30, 700 as FontWeight),
    heading3: createLiterataStyle(20, 28, 600 as FontWeight),
    caption: createLiterataStyle(14, 20, 400 as FontWeight, 0, true),
    quote: createLiterataStyle(18, 28, 400 as FontWeight, 0, true),
  },
};
