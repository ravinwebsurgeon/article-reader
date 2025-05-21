import { Platform, TextStyle } from "react-native";

// Font family definitions
export const fontFamily = {
  inter: {
    regular: "Inter-Regular",
    italic: "Inter-Italic",
    medium: "Inter-Medium",
    mediumItalic: "Inter-MediumItalic",
    semiBold: "Inter-SemiBold",
    semiBoldItalic: "Inter-SemiBoldItalic",
    bold: "Inter-Bold",
    boldItalic: "Inter-BoldItalic",
  },
  literata: {
    regular: "Literata-Regular",
    italic: "Literata-Italic",
    semiBold: "Literata-SemiBold",
    semiBoldItalic: "Literata-SemiBoldItalic",
    bold: "Literata-Bold",
    boldItalic: "Literata-BoldItalic",
    extraBold: "Literata-ExtraBold",
    extraBoldItalic: "Literata-ExtraBoldItalic",
  },
};

// Font weight type for better type safety
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// Extended TextStyle (kept for potential future use, though fontVariationSettings is removed)
interface ExtendedTextStyle extends TextStyle {}

export const getInterStyle = (
  weight: FontWeight = 400,
  italic: boolean = false,
): ExtendedTextStyle => {
  let ff: string;
  if (italic) {
    if (weight === 700) ff = fontFamily.inter.boldItalic;
    else if (weight === 600) ff = fontFamily.inter.semiBoldItalic;
    else if (weight === 500) ff = fontFamily.inter.mediumItalic;
    else ff = fontFamily.inter.italic; // Default to regular italic (400)
  } else {
    if (weight === 700) ff = fontFamily.inter.bold;
    else if (weight === 600) ff = fontFamily.inter.semiBold;
    else if (weight === 500) ff = fontFamily.inter.medium;
    else ff = fontFamily.inter.regular; // Default to regular (400)
  }
  return {
    fontFamily: ff,
    fontWeight: weight,
  };
};

// Helper for Literata static font
export const getLiterataStyle = (
  weight: FontWeight = 400,
  italic: boolean = false,
): ExtendedTextStyle => {
  let ff: string;
  if (italic) {
    if (weight === 800) ff = fontFamily.literata.extraBoldItalic;
    else if (weight === 700) ff = fontFamily.literata.boldItalic;
    else if (weight === 600) ff = fontFamily.literata.semiBoldItalic;
    else ff = fontFamily.literata.italic; // Default to regular italic (400)
  } else {
    if (weight === 800) ff = fontFamily.literata.extraBold;
    else if (weight === 700) ff = fontFamily.literata.bold;
    else if (weight === 600) ff = fontFamily.literata.semiBold;
    else ff = fontFamily.literata.regular; // Default to regular (400)
  }
  return {
    fontFamily: ff,
    fontWeight: weight,
  };
};

// Create text style using static font
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

  if (fontSet === "inter") {
    Object.assign(style, getInterStyle(weight, italic));
  } else {
    Object.assign(style, getLiterataStyle(weight, italic)); // Removed opticalSize (size) argument
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
    title: createLiterataStyle(32, 40, 800 as FontWeight),
    heading1: createLiterataStyle(24, 32, 700 as FontWeight),
    heading2: createLiterataStyle(22, 30, 700 as FontWeight),
    heading3: createLiterataStyle(20, 28, 600 as FontWeight),
    caption: createLiterataStyle(14, 20, 400 as FontWeight, 0, true),
    quote: createLiterataStyle(18, 28, 400 as FontWeight, 0, true),
  },
};
