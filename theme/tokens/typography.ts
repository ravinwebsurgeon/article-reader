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

export const getInterVariableStyle = (weight: number = 400, italic: boolean = false): TextStyle => {
  return {
    fontFamily: italic ? fontFamily.inter.variableItalic : fontFamily.inter.variable,
    ...(Platform.OS === "ios"
      ? {
          fontWeight: weight.toString() as TextStyle["fontWeight"],
        }
      : {
          fontVariationSettings: `'wght' ${weight}`,
        }),
    ...(italic && Platform.OS === "android" ? { fontStyle: "italic" } : {}),
  };
};

// Helper for Literata variable font with optical size parameter
export const getLiterataVariableStyle = (
  weight: number = 400,
  opticalSize: number = 16, // optical size parameter, typically matches font size
  italic: boolean = false,
): TextStyle => {
  return {
    fontFamily: italic ? fontFamily.literata.variableItalic : fontFamily.literata.variable,
    ...(Platform.OS === "ios"
      ? {
          fontWeight: weight.toString() as TextStyle["fontWeight"],
        }
      : {
          fontVariationSettings: `'wght' ${weight}, 'opsz' ${opticalSize}`,
        }),
    ...(italic && Platform.OS === "android" ? { fontStyle: "italic" } : {}),
  };
};

// Create text style using variable font
export const createTextStyle = (
  size: number,
  lineHeight: number,
  weight: number = 400,
  letterSpacing: number = 0,
  italic: boolean = false,
  fontSet: "inter" | "literata" = "inter",
): TextStyle => {
  const style: TextStyle = {
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
  weight: number = 400,
  letterSpacing: number = 0,
  italic: boolean = false,
): TextStyle => {
  return createTextStyle(size, lineHeight, weight, letterSpacing, italic, "literata");
};

export const typography = {
  // Headings
  h1: createTextStyle(32, 40, 700),
  h2: createTextStyle(30, 36, 700),
  h3: createTextStyle(24, 32, 700),
  h4: createTextStyle(22, 28, 600),
  h5: createTextStyle(20, 26, 600),
  h6: createTextStyle(18, 24, 600),
  h7: createTextStyle(16, 24, 600),
  h8: createTextStyle(18, 26, 600),

  // Body text
  body1: createTextStyle(16, 24, 400),
  body2: createTextStyle(14, 20, 400),
  body1Bold: createTextStyle(16, 24, 700),
  body2Bold: createTextStyle(14, 20, 700),

  // Other text styles
  subtitle1: createTextStyle(16, 24, 500),
  subtitle2: createTextStyle(14, 20, 500),
  caption: createTextStyle(12, 16, 400),
  caption2: createTextStyle(12, 14, 500),
  overline: createTextStyle(10, 14, 500, 1.5),
  tagStyle: createTextStyle(13, 24, 600),

  // meta
  meta: createTextStyle(16, 18, 400),
  meta2: createTextStyle(10, 14, 400),

  //guide
  guide: createTextStyle(11, 14, 500),

  // Button text
  button: createTextStyle(14, 20, 600),
  button_small: createTextStyle(12, 18, 600),
  button_medium: createTextStyle(14, 20, 600),
  button_large: createTextStyle(16, 24, 600),

  // Reader specific styles with Literata
  reader: {
    body: createLiterataStyle(18, 28, 400),
    bodyItalic: createLiterataStyle(18, 28, 400, 0, true),
    heading1: createLiterataStyle(24, 32, 700),
    heading2: createLiterataStyle(22, 30, 700),
    heading3: createLiterataStyle(20, 28, 600),
    caption: createLiterataStyle(14, 20, 400, 0, true),
    quote: createLiterataStyle(18, 28, 400, 0, true),
  },
};
