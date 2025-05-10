import React, { useMemo } from "react";
import { View, TextInput, StyleSheet, KeyboardTypeOptions } from "react-native";
import { Control, Controller, FieldValues, Path, RegisterOptions } from "react-hook-form";
import { useTheme, type Theme } from "@/theme";
import { ThemeText, ThemeView } from "@/components/core";

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T>;
  placeholder?: string;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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
  keyboardType = "default",
  autoCapitalize = "none",
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
        <ThemeView style={styles.inputContainer}>
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
        </ThemeView>
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
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    logoContainer: {
      marginBottom: 24,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary.main,
      justifyContent: "center",
      alignItems: "center",
      padding: 15,
    },
    logoHeart: {
      width: 30,
      height: 30,
      backgroundColor: theme.colors.primary.light,
      borderRadius: 15,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.disabled,
      marginBottom: 16,
    },
    formContainer: {
      width: "100%",
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 20,
    },
    iconContainer: {
      position: "absolute",
      left: 12,
      top: 15,
      zIndex: 1,
    },
    input: {
      height: 56,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 45,
      fontSize: 16,
      borderColor: theme.colors.divider,
      color: theme.colors.text.primary,
    },
    inputError: {
      borderColor: theme.colors.error.main,
    },
    errorText: {
      fontSize: 12,
      marginTop: 4,
      marginLeft: 12,
      color: theme.colors.error.main,
    },
    forgotPasswordContainer: {
      alignSelf: "flex-end",
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: theme.colors.primary.main,
      fontSize: 14,
    },
    signInButton: {
      backgroundColor: theme.colors.primary.main,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    signInButtonText: {
      color: theme.colors.primary.contrast,
      fontSize: 18,
      fontWeight: "600",
    },
    signUpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    signUpText: {
      color: theme.colors.text.primary,
      fontSize: 16,
    },
    signUpLinkText: {
      color: theme.colors.primary.main,
      fontSize: 16,
      fontWeight: "600",
    },
  });
