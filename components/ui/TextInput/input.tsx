import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, lightColors } from '@/theme';
import { scaler } from '@/utils';
import { ThemeText } from '@/components/core';
import { useDarkMode } from '@/theme';

interface InputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  rules?: Record<string, any>;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  icon?: React.ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
}

// Reusable Input Component
export const Input = <T extends FieldValues>({
  control,
  name,
  rules = {},
  placeholder,
  label,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  style,
}: InputProps<T>) => {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const dark = useDarkMode();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={[styles.inputWrapper, style]}>
          {label && <ThemeText style={styles.inputLabel}>{label}</ThemeText>}
          <View style={styles.inputContainer}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              secureTextEntry={secureTextEntry && !isSecureTextVisible}
              style={[
                styles.input,
                { color: dark ? lightColors.text.disabled : COLORS.text },
                error ? styles.inputError : undefined,
                icon ? styles.inputWithIcon : undefined,
                secureTextEntry ? styles.inputWithSecureToggle : undefined,
                multiline ? styles.multilineInput : undefined,
              ]}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              placeholderTextColor={lightColors.text.disabled}
              multiline={multiline}
              numberOfLines={multiline ? numberOfLines : 1}
              textAlignVertical={multiline ? 'top' : 'center'}
            />
            {secureTextEntry && (
              <TouchableOpacity
                style={styles.secureTextToggle}
                onPress={() => setIsSecureTextVisible(!isSecureTextVisible)}
              >
                <Ionicons
                  name={isSecureTextVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={lightColors.text.disabled}
                />
              </TouchableOpacity>
            )}
          </View>
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
};

// Styles for form components
const styles = StyleSheet.create({
  // Input styles
  inputWrapper: {
    marginBottom: scaler(16),
    width: '100%',
  },
  inputLabel: {
    fontSize: scaler(14),
    marginBottom: scaler(8),
    // color: COLORS.text,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: scaler(56),
    borderWidth: scaler(1),
    borderColor: lightColors.divider,
    borderRadius: scaler(12),
    paddingHorizontal: scaler(16),
    fontSize: scaler(16),
    // backgroundColor: COLORS.white,
  },
  multilineInput: {
    height: scaler(120),
    paddingTop: scaler(12),
    paddingBottom: scaler(12),
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    paddingLeft: scaler(44),
  },
  inputWithSecureToggle: {
    paddingRight: scaler(44),
  },
  inputError: {
    borderColor: COLORS.error.main,
  },
  iconContainer: {
    position: 'absolute',
    left: scaler(16),
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  secureTextToggle: {
    position: 'absolute',
    right: scaler(16),
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  errorText: {
    color: COLORS.error.main,
    fontSize: scaler(12),
    marginTop: scaler(4),
    marginLeft: scaler(4),
  },

  // Button styles
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scaler(28),
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary.main,
    shadowColor: COLORS.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: scaler(0.25),
    shadowRadius: scaler(4),
    elevation: scaler(5),
  },
  secondaryButton: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: scaler(0.25),
    shadowRadius: scaler(4),
    elevation: scaler(5),
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: scaler(1),
    borderColor: COLORS.primary.main,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  smallButton: {
    height: scaler(40),
    paddingHorizontal: scaler(16),
  },
  mediumButton: {
    height: scaler(56),
    paddingHorizontal: scaler(24),
  },
  largeButton: {
    height: scaler(64),
    paddingHorizontal: scaler(32),
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: scaler(0),
    elevation: scaler(0),
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: scaler(16),
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: scaler(16),
    fontWeight: '600',
  },
  outlineButtonText: {
    color: COLORS.primary.main,
    fontSize: scaler(16),
    fontWeight: '600',
  },
  textButtonText: {
    color: COLORS.primary.main,
    fontSize: scaler(16),
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  },
  leftIcon: {
    marginRight: scaler(8),
  },
  rightIcon: {
    marginLeft: scaler(8),
  },
});
