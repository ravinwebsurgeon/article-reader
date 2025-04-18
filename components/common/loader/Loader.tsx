// src/components/common/Loader/Loader.tsx
import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing } from '../../../styles';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = colors.primary,
  text,
  fullScreen = false,
  style,
}) => {
  const rootStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ];

  return (
    <View style={rootStyle}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 10,
  },
  text: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});