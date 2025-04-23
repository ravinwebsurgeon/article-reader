import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import { typography, spacing } from '../../../styles';
import { COLORS as colors } from '@/assets';


export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  icon,
  leftIcon,
  rightIcon,
  buttonStyle,
  textStyle,
  disabled = false,
  ...rest
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle = styles.button;
    const variantStyle = styles[`button_${variant}`];
    const sizeStyle = styles[`button_${size}`];
    const disabledStyle = disabled ? styles.button_disabled : {};
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...sizeStyle,
      ...disabledStyle,
      ...buttonStyle,
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle = styles.text;
    const variantStyle = styles[`text_${variant}`];
    const sizeStyle = styles[`text_${size}`];
    const disabledStyle = disabled ? styles.text_disabled : {};
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...sizeStyle,
      ...disabledStyle,
      ...textStyle,
    };
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />;
    }

    if (icon && !title) {
      return icon;
    }

    return (
      <>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        {title && <Text style={getTextStyles()}>{title}</Text>}
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.gray[200],
  },
  button_tertiary: {
    backgroundColor: 'transparent',
  },
  button_icon: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  button_small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  button_medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  button_large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  button_disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
    ...typography.button,
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.text.primary,
  },
  text_tertiary: {
    color: colors.primary,
  },
  text_icon: {
    color: colors.text.primary,
  },
  text_small: {
    ...typography.button_small,
  },
  text_medium: {
    ...typography.button_medium,
  },
  text_large: {
    ...typography.button_large,
  },
  text_disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});