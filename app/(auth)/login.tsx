import React, { useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { resetAuthError } from "@/redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useForm } from "react-hook-form";
import { useTheme } from "@/theme";
import { useLoginMutation } from "@/redux/services/authApi";
import { ThemeText, ThemeView } from "@/components";
import { Input } from "@/components/ui/TextInput/input";
import { SvgIcon } from "@/components/SvgIcon";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { sendExtensionAuthToken } from "@/utils/extension";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { t } = useTranslation();

  const { error } = useAppSelector((state) => state.auth);
  const [login] = useLoginMutation();
  const { control, handleSubmit, setFocus } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({
        user: {
          email: data.email,
          password: data.password,
        },
      }).unwrap();

      // Send auth token to extension if login was successful
      if (result.token) {
        sendExtensionAuthToken(result.token);
      }
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const navigateToSignUp = () => {
    router.push("/(auth)/signup");
  };

  const navigateToForgotPassword = () => {
    // navigation.navigate("ForgotPassword");
  };

  // Show error alert if needed
  useEffect(() => {
    if (error) {
      Alert.alert("Login Error", error);
      dispatch(resetAuthError());
    }
  }, [error, dispatch]);

  const dynamicStyles: {
    container: ViewStyle;
    logoCircle: ViewStyle;
    logoHeart: ViewStyle;
    subtitle: TextStyle;
    inputError: ViewStyle;
    errorText: TextStyle;
    forgotPasswordText: TextStyle;
    signInButton: ViewStyle;
    signInButtonText: TextStyle;
    signUpLinkText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
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
    subtitle: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "400" as const,
      color: theme.colors.text.disabled,
      marginBottom: 16,
    },
    inputError: {
      borderColor: theme.colors.error.main,
    },
    errorText: {
      color: theme.colors.error.main,
      fontSize: 12,
      marginTop: 4,
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
      color: theme.colors.white,
      fontSize: 18,
      fontWeight: "600" as const,
    },
    signUpLinkText: {
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
              {t("auth.login.title")}
            </ThemeText>
            <ThemeText style={dynamicStyles.subtitle}>{t("auth.login.subtitle")}</ThemeText>
          </ThemeView>

          <ThemeView style={styles.formContainer}>
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
              placeholder={t("auth.login.email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              icon={<SvgIcon name="envelope" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
              onSubmitEditing={() => setFocus("password")}
              returnKeyType="next"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Input
              control={control}
              name="password"
              rules={{
                required: t("errors.validation.password.required"),
                minLength: {
                  value: 8,
                  message: t("errors.validation.password.minLength"),
                },
              }}
              placeholder={t("auth.login.password")}
              secureTextEntry
              icon={<SvgIcon name="key" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="go"
              autoComplete="current-password"
              textContentType="password"
            />

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={navigateToForgotPassword}
            >
              <ThemeText style={dynamicStyles.forgotPasswordText}>
                {t("auth.login.forgotPassword")}
              </ThemeText>
            </TouchableOpacity>

            <Button
              title={t("auth.login.button")}
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signInButton}
              rightIcon={null}
            />
          </ThemeView>

          <ThemeView style={styles.signUpContainer}>
            <ThemeText style={styles.signUpText}>{t("auth.login.noAccount")} </ThemeText>
            <TouchableOpacity onPress={navigateToSignUp}>
              <ThemeText style={dynamicStyles.signUpLinkText}>{t("auth.login.signUp")}</ThemeText>
            </TouchableOpacity>
          </ThemeView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 8,
  },
  formContainer: {
    marginTop: 32,
  },
  input: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signUpText: {
    fontSize: 16,
  },
});

export default LoginScreen;
