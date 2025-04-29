import { useTextColor, useTheme } from '@/theme/hooks';
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'h7'
  | 'h8'
  | 'body1'
  | 'body2'
  | 'body1Bold'
  | 'body2Bold'
  | 'subtitle1'
  | 'subtitle2'
  | 'caption'
  | 'caption2'
  | 'overline'
  | 'tagStyle'
  | 'button'
  | 'guide'
  | 'meta'
  | 'meta2';

export type ThemeTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
};

export const ThemeText: React.FC<ThemeTextProps> = ({
  style,
  variant = 'body1',
  color,
  align,
  bold = false,
  italic = false,
  underline = false,
  uppercase = false,
  lowercase = false,
  capitalize = false,
  children,
  ...otherProps
}) => {
  const theme = useTheme();
  const defaultTextColor = useTextColor();

  // Get font style based on variant
  const getVariantStyle = () => {
    return theme.typography[variant] || theme.typography.body1;
  };

  // Transform text if needed
  const transformText = (text: React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') return text;

    let transformedText = text;

    if (uppercase) transformedText = transformedText.toUpperCase();
    else if (lowercase) transformedText = transformedText.toLowerCase();
    else if (capitalize) {
      transformedText = transformedText
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    return transformedText;
  };

  // Combine styles
  const combinedStyle = [
    getVariantStyle(),
    { color: color || defaultTextColor },
    align && { textAlign: align },
    bold && styles.bold,
    italic && styles.italic,
    underline && styles.underline,
    style,
  ];

  return (
    <Text style={combinedStyle} {...otherProps}>
      {transformText(children)}
    </Text>
  );
};

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
