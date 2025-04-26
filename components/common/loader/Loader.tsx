import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle, TextStyle } from 'react-native';
import { useColors, useTypography, useSpacing } from '@/theme/hooks';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
  style,
}) => {
  const colors = useColors();
  const typography = useTypography();
  const spacing = useSpacing();

  const containerStyle: ViewStyle = {
    padding: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const fullScreenStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 10,
  };

  const textStyle: TextStyle = {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center' as const,
  };

  const rootStyle: ViewStyle[] = [containerStyle, fullScreen && fullScreenStyle, style].filter(
    Boolean
  ) as ViewStyle[];

  return (
    <View style={rootStyle}>
      <ActivityIndicator size={size} color={color || colors.primary.main} />
      {text && <Text style={textStyle}>{text}</Text>}
    </View>
  );
};
