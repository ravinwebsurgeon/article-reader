import { Platform, TextStyle } from 'react-native';

export const Fonts = {
  black: 'Poppins-Black',
  blackItalic: 'Poppins-BlackItalic',
  bold: 'Poppins-Bold',
  boldItalic: 'Poppins-BoldItalic',
  extraBold: 'Poppins-ExtraBold',
  extraBoldItalic: 'Poppins-ExtraBoldItalic',
  extraLight: 'Poppins-ExtraLight',
  extraLightItalic: 'Poppins-ExtraLightItalic',
  italic: 'Poppins-Italic',
  light: 'Poppins-Light',
  lightItalic: 'Poppins-LightItalic',
  medium: 'Poppins-Medium',
  mediumItalic: 'Poppins-MediumItalic',
  regular: 'Poppins-Regular',
  semiBold: 'Poppins-SemiBold',
  semiBoldItalic: 'Poppins-SemiBoldItalic',
  thin: 'Poppins-Thin',
  thinItalic: 'Poppins-ThinItalic',
};

export const getFontStyleFromWeight = (fontWeight: TextStyle['fontWeight'] = 400) => {
  const styles: TextStyle = {
    fontFamily: Fonts.regular,
    fontWeight: fontWeight?.toString() as TextStyle['fontWeight'],
    includeFontPadding: false,
  };
  if (Platform.OS === 'android') {
    styles.fontWeight = undefined;
    switch (fontWeight) {
      case '100':
        styles.fontFamily = Fonts.thin;
        break;
      case '200':
        styles.fontFamily = Fonts.extraLight;
        break;
      case '300':
        styles.fontFamily = Fonts.light;
        break;
      case '400':
      case undefined:
        styles.fontFamily = Fonts.regular;
        break;
      case '500':
        styles.fontFamily = Fonts.medium;
        break;
      case '600':
        styles.fontFamily = Fonts.semiBold;
        break;
      case '700':
      case 'bold':
        styles.fontFamily = Fonts.bold;
        break;
      case '800':
        styles.fontFamily = Fonts.extraBold;
        break;
      case '900':
        styles.fontFamily = Fonts.black;
        break;
    }
  }
  return styles;
};
