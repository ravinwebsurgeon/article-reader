// src/theme/tokens/typography.ts
import { Platform, TextStyle } from 'react-native';

// Font family definitions
export const fontFamily = {
  poppins: {
    thin: 'Poppins-Thin',
    thinItalic: 'Poppins-ThinItalic',
    extraLight: 'Poppins-ExtraLight',
    extraLightItalic: 'Poppins-ExtraLightItalic',
    light: 'Poppins-Light',
    lightItalic: 'Poppins-LightItalic',
    regular: 'Poppins-Regular',
    italic: 'Poppins-Italic',
    medium: 'Poppins-Medium',
    mediumItalic: 'Poppins-MediumItalic',
    semiBold: 'Poppins-SemiBold',
    semiBoldItalic: 'Poppins-SemiBoldItalic',
    bold: 'Poppins-Bold',
    boldItalic: 'Poppins-BoldItalic',
    extraBold: 'Poppins-ExtraBold',
    extraBoldItalic: 'Poppins-ExtraBoldItalic',
    black: 'Poppins-Black',
    blackItalic: 'Poppins-BlackItalic',
  },
};

// Helper function to get font family based on weight
export const getFontFamily = (weight: TextStyle['fontWeight'] = '400'): string => {
  if (Platform.OS === 'ios') {
    return 'Poppins';
  }
  
  switch (weight) {
    case '100':
      return fontFamily.poppins.thin;
    case '200':
      return fontFamily.poppins.extraLight;
    case '300':
      return fontFamily.poppins.light;
    case '400':
    case 'normal':
      return fontFamily.poppins.regular;
    case '500':
      return fontFamily.poppins.medium;
    case '600':
      return fontFamily.poppins.semiBold;
    case '700':
    case 'bold':
      return fontFamily.poppins.bold;
    case '800':
      return fontFamily.poppins.extraBold;
    case '900':
      return fontFamily.poppins.black;
    default:
      return fontFamily.poppins.regular;
  }
};

// Create consistent text style
export const createTextStyle = (
  size: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'] = '400',
  letterSpacing: number = 0,
  fontStyle: TextStyle['fontStyle'] = 'normal',
): TextStyle => {
  const style: TextStyle = {
    fontSize: size,
    lineHeight,
    letterSpacing,
    fontStyle,
    includeFontPadding: false, // For consistency between iOS and Android
  };
  
  if (Platform.OS === 'ios') {
    style.fontFamily = 'Poppins';
    style.fontWeight = fontWeight;
  } else {
    style.fontFamily = getFontFamily(fontWeight);
    // Android handles weight through font file selection
  }
  
  return style;
};

// Typography scale
export const typography = {
  // Headings
  h1: createTextStyle(32, 40, '700'),
  h2: createTextStyle(28, 36, '700'),
  h3: createTextStyle(24, 32, '700'),
  h4: createTextStyle(22, 28, '600'),
  h5: createTextStyle(20, 26, '600'),
  h6: createTextStyle(18, 24, '600'),
  
  // Body text
  body1: createTextStyle(16, 24, '400'),
  body2: createTextStyle(14, 20, '400'),
  body1Bold: createTextStyle(16, 24, '700'),
  body2Bold: createTextStyle(14, 20, '700'),
  
  // Other text styles
  subtitle1: createTextStyle(16, 24, '500'),
  subtitle2: createTextStyle(14, 20, '500'),
  caption: createTextStyle(12, 16, '400'),
  overline: createTextStyle(10, 14, '500', 1.5),
  
  // Button text
  button: createTextStyle(14, 20, '600'),
  button_small: createTextStyle(12, 18, '600'),
  button_medium: createTextStyle(14, 20, '600'),
  button_large: createTextStyle(16, 24, '600'),
};