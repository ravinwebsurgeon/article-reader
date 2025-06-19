import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  KeyboardTypeOptions,
  TextInputProps,
} from "react-native";
import { Controller, Control, FieldValues, Path, RegisterOptions } from "react-hook-form";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme, type Theme } from "@/theme";
import { ThemeText } from "@/components/primitives";
import { useTranslation } from "react-i18next";

interface InputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T>;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  icon?: React.ReactNode;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  spellCheck?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "go" | "next" | "search" | "send" | "default";
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
}

// Reusable Input Component
export const Input = <T extends FieldValues>({
  control,
  name,
  rules = {},
  placeholder,
  label,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  autoCapitalize = "none",
  autoCorrect = false,
  spellCheck = false,
  multiline = false,
  numberOfLines = 1,
  style,
  onSubmitEditing,
  returnKeyType = "default",
  autoComplete,
  textContentType,
}: InputProps<T>) => {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={[styles.inputWrapper, style]}>
          {label && <ThemeText style={styles.inputLabel}>{t(label)}</ThemeText>}
          <View style={styles.inputContainer}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder ? t(placeholder) : undefined}
              secureTextEntry={secureTextEntry && !isSecureTextVisible}
              style={[
                styles.input,
                error ? styles.inputError : undefined,
                icon ? styles.inputWithIcon : undefined,
                secureTextEntry ? styles.inputWithSecureToggle : undefined,
                multiline ? styles.multilineInput : undefined,
              ]}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              spellCheck={spellCheck}
              placeholderTextColor={theme.colors.text.hint}
              multiline={multiline}
              numberOfLines={multiline ? numberOfLines : 1}
              textAlignVertical={multiline ? "top" : "center"}
              onSubmitEditing={onSubmitEditing}
              returnKeyType={returnKeyType}
              autoComplete={autoComplete}
              textContentType={textContentType}
            />
            {secureTextEntry && (
              <TouchableOpacity
                style={styles.secureTextToggle}
                onPress={() => setIsSecureTextVisible(!isSecureTextVisible)}
                accessibilityLabel={isSecureTextVisible ? "Hide password" : "Show password"}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isSecureTextVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.colors.icon}
                />
              </TouchableOpacity>
            )}
          </View>
          {error && <Text style={styles.errorText}>{t(`errors.${error.message}`)}</Text>}
        </View>
      )}
    />
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    inputWrapper: { marginBottom: 16, width: "100%" },
    inputLabel: {
      fontSize: 14,
      marginBottom: 8,
      color: theme.colors.text.primary,
      fontWeight: "500",
    },
    inputContainer: { position: "relative", width: "100%" },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      borderRadius: 16,
      paddingHorizontal: 16,
      fontSize: 16,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.text.primary,
    },
    multilineInput: {
      height: 120,
      paddingTop: 12,
      paddingBottom: 12,
      textAlignVertical: "top",
    },
    inputWithIcon: { paddingLeft: 48 },
    inputWithSecureToggle: { paddingRight: 48 },
    inputError: { borderColor: theme.colors.error.main },
    iconContainer: {
      position: "absolute",
      left: 16,
      top: "50%",
      transform: [{ translateY: -12 }],
      zIndex: 1,
    },
    secureTextToggle: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: [{ translateY: -16 }],
      zIndex: 1,
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
    },
    errorText: {
      color: theme.colors.error.main,
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
  });
