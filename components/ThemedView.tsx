import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const backgroundColorToApply =
    theme.mode === 'dark'
      ? (darkColor ?? theme.colors.background.default)
      : (lightColor ?? theme.colors.background.default);

  return <View style={[{ backgroundColor: backgroundColorToApply }, style]} {...otherProps} />;
}
