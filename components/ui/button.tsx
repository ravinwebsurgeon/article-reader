import { useTheme, type Theme } from '@/theme';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

// Reusable Button Component
export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = true,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'text':
        return styles.textButton;
      default:
        return styles.primaryButton;
    }
  };

  const getButtonTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButtonText;
      case 'outline':
        return styles.outlineButtonText;
      case 'text':
        return styles.textButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getButtonSize(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <Text style={[getButtonTextStyle(), disabled && styles.disabledButtonText]}>{title}</Text>
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </TouchableOpacity>
  );
};

// Styles for form components
const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    // Input styles
    inputWrapper: {
      marginBottom: 16,
      width: '100%',
    },
    inputLabel: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: '500',
    },
    inputContainer: {
      position: 'relative',
      width: '100%',
    },
    input: {
      height: 56,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
    },
    multilineInput: {
      height: 120,
      paddingTop: 12,
      paddingBottom: 12,
      textAlignVertical: 'top',
    },
    inputWithIcon: {
      paddingLeft: 44,
    },
    inputWithSecureToggle: {
      paddingRight: 44,
    },
    inputError: {},
    iconContainer: {
      position: 'absolute',
      left: 16,
      top: '50%',
      transform: [{ translateY: -10 }],
      zIndex: 1,
    },
    secureTextToggle: {
      position: 'absolute',
      right: 16,
      top: '50%',
      transform: [{ translateY: -10 }],
      zIndex: 1,
    },
    errorText: {
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },

    // Button styles
    button: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 28,
    },
    fullWidth: {
      width: '100%',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary.main,
      shadowColor: theme.colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    secondaryButton: {
      backgroundColor: theme.colors.warning.main,
      shadowColor: theme.colors.warning.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary.main,
    },
    textButton: {
      backgroundColor: 'transparent',
    },
    smallButton: {
      height: 40,
      paddingHorizontal: 16,
    },
    mediumButton: {
      height: 56,
      paddingHorizontal: 24,
    },
    largeButton: {
      height: 64,
      paddingHorizontal: 32,
    },
    disabledButton: {
      backgroundColor: theme.colors.gray[300],
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryButtonText: {
      color: theme.colors.primary.contrast,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: theme.colors.warning.contrast,
      fontSize: 16,
      fontWeight: '600',
    },
    outlineButtonText: {
      color: theme.colors.primary.main,
      fontSize: 16,
      fontWeight: '600',
    },
    textButtonText: {
      color: theme.colors.primary.main,
      fontSize: 16,
      fontWeight: '600',
    },
    disabledButtonText: {
      color: theme.colors.text.disabled,
    },
    leftIcon: {
      marginRight: 8,
    },
    rightIcon: {
      marginLeft: 8,
    },
  });
