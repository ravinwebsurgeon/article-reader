import { Platform, TextStyle } from 'react-native';

// Font family setup
const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    semibold: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
});

const createFontStyle = (
  size: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'] = 'normal',
  letterSpacing: number = 0
): TextStyle => ({
  fontSize: size,
  lineHeight: lineHeight,
  fontWeight: fontWeight,
  letterSpacing: letterSpacing,
  fontFamily: fontWeight === 'bold' || fontWeight === '700' 
    ? fontFamily?.bold 
    : fontWeight === '600' || fontWeight === 'semibold'
      ? fontFamily?.semibold
      : fontWeight === '500' || fontWeight === 'medium'
        ? fontFamily?.medium
        : fontFamily?.regular,
});

export const typography = {
  // Heading styles
  h1: createFontStyle(32, 40, 'bold'),
  h2: createFontStyle(28, 36, 'bold'),
  h3: createFontStyle(24, 32, 'bold'),
  h4: createFontStyle(22, 28, 'bold'),
  h5: createFontStyle(20, 26, 'bold'),
  h6: createFontStyle(18, 24, 'bold'),
  
  // Body text styles
  body1: createFontStyle(16, 24),
  body2: createFontStyle(14, 20),
  body3: createFontStyle(12, 18),
  
  // Button styles
  button: createFontStyle(14, 20, '600'),
  button_small: createFontStyle(12, 18, '600'),
  button_medium: createFontStyle(14, 20, '600'),
  button_large: createFontStyle(16, 24, '600'),
  
  // Caption & overline
  caption: createFontStyle(12, 16),
  overline: createFontStyle(10, 14, '500', 1.5),
  
  // Subtitle
  subtitle1: createFontStyle(16, 24, '500'),
  subtitle2: createFontStyle(14, 20, '500'),
};