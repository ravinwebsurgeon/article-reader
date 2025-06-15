import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/TextInput/input";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { useRegisterMutation } from "@/redux/services/authApi";
import { useTheme } from "@/theme";
import { ThemeText, ThemeView } from "@/components";
import { SvgIcon } from "@/components/SvgIcon";
import { useTranslation } from "react-i18next";
import { sendExtensionAuthToken } from "@/utils/extension";
import zxcvbn from "zxcvbn";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [loader, setLoader] = useState(false);
  const [register] = useRegisterMutation();
  const theme = useTheme();
  const { t } = useTranslation();

  const { control, handleSubmit, watch } = useForm<SignUpFormData>({
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: SignUpFormData) => {
    console.log(data);
    setLoader(true);
    try {
      const result = await register({
        user: {
          email: data.email,
          password: data.password,
        },
      }).unwrap();

      // Send auth token to extension if registration was successful
      if (result.token) {
        sendExtensionAuthToken(result.token);
      }

      // Set flag to show Pocket import prompt for new users
      await AsyncStorage.setItem("show_pocket_import", "true");
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoader(false);
    }
  };

  const navigateToLogin = () => {
    router.push("/(auth)/login");
  };

  const dynamicStyles: {
    container: ViewStyle;
    subtitle: TextStyle;
    signUpButton: ViewStyle;
    loginLinkText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.disabled,
      marginBottom: 16,
    },
    signUpButton: {
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
    loginLinkText: {
      color: theme.colors.primary.main,
      fontSize: 16,
      fontWeight: "600" as const,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemeView style={styles.header}>
            <ThemeView style={styles.logoContainer}>
              <SvgIcon name="logo" size={48} color={theme.colors.primary.main} />
            </ThemeView>
            <ThemeText variant="h2" style={styles.title}>
              {t("auth.signup.title")}
            </ThemeText>
            <ThemeText style={dynamicStyles.subtitle}>{t("auth.signup.subtitle")}</ThemeText>
          </ThemeView>

          <View style={styles.formContainer}>
            <Input
              control={control}
              name="email"
              rules={{
                required: t("errors.validation.email.required"),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t("errors.validation.email.invalid"),
                },
              }}
              placeholder={t("auth.signup.email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              icon={<SvgIcon name="envelope" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
            />

            <Input
              control={control}
              name="password"
              rules={{
                required: t("errors.validation.password.required"),
                validate: (value: string) => {
                  const result = zxcvbn(value);
                  if (result.score < 2) {
                    return result.feedback.warning || "Password is too weak";
                  }
                  return true;
                },
              }}
              placeholder={t("auth.signup.password")}
              secureTextEntry
              icon={<SvgIcon name="key" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
            />

            <Input
              control={control}
              name="confirmPassword"
              rules={{
                required: t("errors.validation.confirmPassword.required"),
                validate: (value: string) =>
                  value === password || t("errors.validation.confirmPassword.mismatch"),
              }}
              placeholder={t("auth.signup.confirmPassword")}
              secureTextEntry
              icon={<SvgIcon name="key-renter" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
            />

            <Button
              title={t("auth.signup.button")}
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signUpButton}
              rightIcon={null}
              loading={loader}
            />
          </View>

          <View style={styles.loginContainer}>
            <ThemeText style={styles.loginText}>{t("auth.signup.hasAccount")} </ThemeText>
            <ThemeText style={dynamicStyles.loginLinkText} onPress={navigateToLogin}>
              {t("auth.signup.logIn")}
            </ThemeText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logoContainer: {
    marginBottom: 24,
  },
  formContainer: {
    marginTop: 32,
  },
  input: {
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
  },
});

export default SignUpScreen;
