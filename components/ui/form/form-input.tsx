import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { useTheme, type Theme } from '@/theme';
import { ThemeText } from '@/components/core';
import { ThemedView } from '@/components/ThemedView';
import { scaler } from '@/utils';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T>;
  placeholder?: string;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  spellCheck?: boolean;
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
  autoCapitalize = 'none',
  autoCorrect = false,
  spellCheck = false,
}: FormInputProps<T>) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
            placeholderTextColor={theme.colors.text.hint}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            spellCheck={spellCheck}
          />
          {error && <ThemeText style={styles.errorText}>{error.message}</ThemeText>}
        </ThemedView>
      )}
    />
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
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
      backgroundColor: theme.colors.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
      padding: scaler(15),
    },
    logoHeart: {
      width: scaler(30),
      height: scaler(30),
      backgroundColor: theme.colors.primary.light,
      borderRadius: scaler(15),
    },
    title: {
      fontSize: scaler(28),
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: scaler(8),
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.disabled,
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
      borderRadius: scaler(12),
      paddingHorizontal: scaler(45),
      fontSize: scaler(16),
      borderColor: theme.colors.divider,
      color: theme.colors.text.primary,
    },
    inputError: {
      borderColor: theme.colors.error.main,
    },
    errorText: {
      fontSize: scaler(12),
      marginTop: scaler(4),
      marginLeft: scaler(12),
      color: theme.colors.error.main,
    },
    forgotPasswordContainer: {
      alignSelf: 'flex-end',
      marginBottom: scaler(24),
    },
    forgotPasswordText: {
      color: theme.colors.primary.main,
      fontSize: scaler(14),
    },
    signInButton: {
      backgroundColor: theme.colors.primary.main,
      height: scaler(56),
      borderRadius: scaler(28),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: scaler(4),
      elevation: scaler(5),
    },
    signInButtonText: {
      color: theme.colors.primary.contrast,
      fontSize: scaler(18),
      fontWeight: '600',
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: scaler(24),
    },
    signUpText: {
      color: theme.colors.text.primary,
      fontSize: scaler(16),
    },
    signUpLinkText: {
      color: theme.colors.primary.main,
      fontSize: scaler(16),
      fontWeight: '600',
    },
  });
