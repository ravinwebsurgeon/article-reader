import React from 'react';
import { View, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, lightColors } from '@/theme';
import { ThemeText } from '@/components/core';
import { ThemedView } from '@/components/ThemedView';
import { scaler } from '@/utils';
import { useDarkMode } from '@/theme';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T>;
  placeholder?: string;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
}

/**
 * A reusable form input component that integrates with react-hook-form
 * and supports icons, validation, and theming.
 */
export const FormInput = <T extends FieldValues>({
  control,
  name,
  rules = {},
  placeholder,
  secureTextEntry = false,
  icon,
  keyboardType = 'default',
}: FormInputProps<T>) => {
  const dark = useDarkMode();
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <ThemedView style={styles.inputContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            style={[styles.input, error && styles.inputError]}
            keyboardType={keyboardType}
            placeholderTextColor="#9E9E9E"
          />
          {error && <ThemeText style={styles.errorText}>{error.message}</ThemeText>}
        </ThemedView>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background.default,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: scaler(24),
    paddingTop: scaler(40),
    paddingBottom: scaler(24),
  },
  header: {
    alignItems: 'center',
    marginBottom: scaler(40),
  },
  logoContainer: {
    marginBottom: scaler(24),
  },
  logoCircle: {
    width: scaler(80),
    height: scaler(80),
    borderRadius: scaler(40),
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaler(15),
  },
  logoHeart: {
    width: scaler(30),
    height: scaler(30),
    backgroundColor: COLORS.primary.light,
    borderRadius: scaler(15),
  },
  title: {
    fontSize: scaler(28),
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: scaler(8),
  },
  subtitle: {
    fontSize: 16,
    color: lightColors.text.disabled,
    marginBottom: scaler(16),
  },
  formContainer: {
    width: '100%',
    marginBottom: scaler(24),
  },
  inputContainer: {
    marginBottom: scaler(20),
  },
  iconContainer: {
    position: 'absolute',
    left: scaler(12),
    top: scaler(15),
    zIndex: 1,
  },
  input: {
    height: scaler(56),
    borderWidth: scaler(1),
    borderColor: lightColors.divider,
    borderRadius: scaler(12),
    paddingHorizontal: scaler(45),
    fontSize: scaler(16),
    color: lightColors.text.disabled,
  },
  inputError: {
    borderColor: COLORS.error.main,
  },
  errorText: {
    color: COLORS.error.main,
    fontSize: scaler(12),
    marginTop: scaler(4),
    marginLeft: scaler(12),
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: scaler(24),
  },
  forgotPasswordText: {
    color: COLORS.primary.main,
    fontSize: scaler(14),
  },
  signInButton: {
    backgroundColor: COLORS.primary.main,
    height: scaler(56),
    borderRadius: scaler(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: scaler(4),
    elevation: scaler(5),
  },
  signInButtonText: {
    color: COLORS.primary.contrast,
    fontSize: scaler(18),
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scaler(24),
  },
  signUpText: {
    color: COLORS.text,
    fontSize: scaler(16),
  },
  signUpLinkText: {
    color: COLORS.primary.main,
    fontSize: scaler(16),
    fontWeight: '600',
  },
});
