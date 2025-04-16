import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/assets';

// Reusable Input Component
export const Input = ({ 
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
}) => {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={[styles.inputWrapper, style]}>
          {label && <Text style={styles.inputLabel}>{label}</Text>}
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
                error && styles.inputError,
                icon && styles.inputWithIcon,
                secureTextEntry && styles.inputWithSecureToggle,
                multiline && styles.multilineInput
              ]}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              placeholderTextColor={COLORS.placeholder}
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
                  color={COLORS.placeholder} 
                />
              </TouchableOpacity>
            )}
          </View>
          {error && (
            <Text style={styles.errorText}>{error.message}</Text>
          )}
        </View>
      )}
    />
  );
};



// Styles for form components
const styles = StyleSheet.create({
  // Input styles
  inputWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: COLORS.cardBackground,
    color: COLORS.text,
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
  inputError: {
    borderColor: COLORS.error,
  },
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
    color: COLORS.error,
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
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  textButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});