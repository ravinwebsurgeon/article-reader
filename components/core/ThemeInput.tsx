import { useTheme } from '@/theme/hooks';
import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { ThemeText } from './ThemeText';
import { getInterVariableStyle } from '@/theme';

export interface ThemeInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
}

export const ThemeInput: React.FC<ThemeInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputContainerStyle,
  style,
  ...inputProps
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Handle focus state
  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (inputProps.onFocus) {
      inputProps.onFocus(e);
    }
  };

  // Handle blur state
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (inputProps.onBlur) {
      inputProps.onBlur(e);
    }
  };

  // Get border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.error.main;
    if (isFocused) return theme.colors.primary.main;
    return theme.colors.divider;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemeText
          variant="subtitle2"
          color={error ? theme.colors.error.main : theme.colors.text.primary}
          style={styles.label}
        >
          {label}
        </ThemeText>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: theme.colors.inputBackground,
          },
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          inputContainerStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text.primary,
              ...getInterVariableStyle(400, false),
            },
            style,
          ]}
          placeholderTextColor={theme.colors.text.hint}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || hint) && (
        <ThemeText
          variant="caption"
          color={error ? theme.colors.error.main : theme.colors.text.hint}
          style={styles.helperText}
        >
          {error || hint}
        </ThemeText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputContainerFocused: {
    borderWidth: 2,
  },
  inputContainerError: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 16,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 4,
  },
});
