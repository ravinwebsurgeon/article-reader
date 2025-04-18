export * from './Colors';
export * from './Fonts';
export * from './Images';


export const FONT_FAMILY = {
    regular: 'Poppins',
    medium: 'PoppinsMedium',
    bold: 'PoppinsBold',
  };
  
  // Spacings
  export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };
  
  // Screen width breakpoints
  export const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1440,
  };
  
  // Z-index values
  export const Z_INDEX = {
    base: 0,
    above: 1,
    modal: 10,
    toast: 20,
  };
  
  // Storage keys
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'pocket_auth_token',
    USER_DATA: 'pocket_user_data',
    THEME_PREFERENCE: 'pocket_theme_preference',
    READING_PREFERENCES: 'pocket_reading_preferences',
  };