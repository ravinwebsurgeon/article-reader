import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  KeyboardTypeOptions,
} from "react-native";
import { Controller, Control, FieldValues, Path, RegisterOptions } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type Theme } from "@/theme";
import { scaler } from "@/utils";
import { ThemeText } from "@/components/core";

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
}: InputProps<T>) => {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
            />
            {secureTextEntry && (
              <TouchableOpacity
                style={styles.secureTextToggle}
                onPress={() => setIsSecureTextVisible(!isSecureTextVisible)}
              >
                <Ionicons
                  name={isSecureTextVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.colors.icon}
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

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    inputWrapper: { marginBottom: scaler(16), width: "100%" },
    inputLabel: {
      fontSize: scaler(14),
      marginBottom: scaler(8),
      color: theme.colors.text.primary,
      fontWeight: "500",
    },
    inputContainer: { position: "relative", width: "100%" },
    input: {
      height: scaler(50),
      borderWidth: scaler(1),
      borderColor: theme.colors.divider,
      borderRadius: scaler(16),
      paddingHorizontal: scaler(16),
      fontSize: scaler(16),
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.text.primary,
    },
    multilineInput: {
      height: scaler(120),
      paddingTop: scaler(12),
      paddingBottom: scaler(12),
      textAlignVertical: "top",
    },
    inputWithIcon: { paddingLeft: scaler(44) },
    inputWithSecureToggle: { paddingRight: scaler(44) },
    inputError: { borderColor: theme.colors.error.main },
    iconContainer: {
      position: "absolute",
      left: scaler(16),
      top: "50%",
      transform: [{ translateY: -10 }],
      zIndex: 1,
    },
    secureTextToggle: {
      position: "absolute",
      right: scaler(16),
      top: "50%",
      transform: [{ translateY: -10 }],
      zIndex: 1,
    },
    errorText: {
      color: theme.colors.error.main,
      fontSize: scaler(12),
      marginTop: scaler(4),
      marginLeft: scaler(4),
    },
  });
