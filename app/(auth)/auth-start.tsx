import React, { useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from "react-native";
import { router } from "expo-router";
import { resetAuthError } from "@/redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useForm } from "react-hook-form";
import { useTheme } from "@/theme";
import { ThemeButton, ThemeText, ThemeView } from "@/components";
import { SvgIcon } from "@/components/SvgIcon";
import { useTranslation } from "react-i18next";

interface LoginFormData {
  email: string;
  password: string;
}

function AuthStart() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { t } = useTranslation();

  const { error } = useAppSelector((state) => state.auth);
  const { handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      router.push("/(auth)/login");
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const navigateToSignUp = () => {
    router.push("/(auth)/signup");
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
    subtitle: TextStyle;
    signInButton: ViewStyle;
    signInButtonText: TextStyle;
    signUpLinkText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    subtitle: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "400" as const,
      color: theme.colors.text.disabled,
      marginBottom: 16,
    },
    signInButton: {
      backgroundColor: theme.colors.white,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.colors.primary.main,
    },
    signInButtonText: {
      color: theme.colors.primary.main,
      fontSize: 14,
      lineHeight: 18,
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
              <SvgIcon name="pocket-pink" size={48} color={theme.colors.primary.main} />
            </ThemeView>
            <ThemeText variant="h2" style={styles.title}>
              {t("auth.authStart.title")}
            </ThemeText>
            <ThemeText style={dynamicStyles.subtitle}>{t("auth.authStart.subtitle")}</ThemeText>
          </ThemeView>

          <ThemeView style={styles.buttonContainer}>
            <ThemeButton
              title={t("auth.authStart.googleSignIn")}
              style={dynamicStyles.signInButton}
              textStyle={dynamicStyles.signInButtonText}
              leftIcon={<SvgIcon name="google" size={24} color={theme.colors.primary.main} />}
              rightIcon={null}
            />
            <ThemeButton
              title={t("auth.authStart.appleSignIn")}
              style={dynamicStyles.signInButton}
              textStyle={dynamicStyles.signInButtonText}
              leftIcon={<SvgIcon name="apple" size={24} color={theme.colors.primary.main} />}
              rightIcon={null}
            />
            <ThemeButton
              title={t("auth.authStart.emailSignIn")}
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signInButton}
              textStyle={dynamicStyles.signInButtonText}
              leftIcon={<SvgIcon name="envelope" size={24} color={theme.colors.primary.main} />}
              rightIcon={null}
            />
          </ThemeView>

          <ThemeView style={styles.signUpContainer}>
            <ThemeText style={styles.signUpText}>{t("auth.signup.newHere")} </ThemeText>
            <TouchableOpacity onPress={navigateToSignUp}>
              <ThemeText style={dynamicStyles.signUpLinkText}>{t("auth.signup.button")}</ThemeText>
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
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 40,
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
  buttonContainer: {
    width: "100%",
    marginBottom: 24,
    gap: 16,
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

export default AuthStart;
