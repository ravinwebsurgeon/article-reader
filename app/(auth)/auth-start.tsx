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
import { scaler } from "@/utils";
import { SvgIcon } from "@/components/SvgIcon";

interface LoginFormData {
  email: string;
  password: string;
}

function AuthStart() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

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
      fontSize: scaler(17),
      lineHeight: scaler(26),
      fontWeight: "400" as const,
      color: theme.colors.text.disabled,
      marginBottom: scaler(16),
    },
    signInButton: {
      backgroundColor: theme.colors.white,
      borderRadius: scaler(28),
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: scaler(14),
      borderWidth: scaler(1),
      borderColor: theme.colors.primary.main,
    },
    signInButtonText: {
      color: theme.colors.primary.main,
      fontSize: scaler(14),
      lineHeight: scaler(18),
    },
    signUpLinkText: {
      color: theme.colors.primary.main,
      fontSize: scaler(16),
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
              How would you like to sign in?
            </ThemeText>
            <ThemeText style={dynamicStyles.subtitle}>Choose a method to get started.</ThemeText>
          </ThemeView>

          <ThemeView style={styles.buttonContainer}>
            <ThemeButton
              title="Sign in with Google"
              style={dynamicStyles.signInButton}
              textStyle={dynamicStyles.signInButtonText}
              leftIcon={<SvgIcon name="google" size={24} color={theme.colors.primary.main} />}
              rightIcon={null}
            />
            <ThemeButton
              title="Sign in with Apple"
              style={dynamicStyles.signInButton}
              textStyle={dynamicStyles.signInButtonText}
              leftIcon={<SvgIcon name="apple" size={24} color={theme.colors.primary.main} />}
              rightIcon={null}
            />
            <ThemeButton
              title="Sign in with Email"
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signInButton}
              textStyle={dynamicStyles.signInButtonText}
              leftIcon={<SvgIcon name="envelope" size={24} color={theme.colors.primary.main} />}
              rightIcon={null}
            />
          </ThemeView>

          <ThemeView style={styles.signUpContainer}>
            <ThemeText style={styles.signUpText}>New Here? </ThemeText>
            <TouchableOpacity onPress={navigateToSignUp}>
              <ThemeText style={dynamicStyles.signUpLinkText}>Create and account</ThemeText>
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
    paddingHorizontal: scaler(24),
    paddingTop: scaler(40),
    paddingBottom: scaler(24),
  },
  header: {
    alignItems: "flex-start",
    marginBottom: scaler(40),
    marginTop: scaler(20),
  },
  logoContainer: {
    marginBottom: scaler(24),
  },
  title: {
    fontSize: scaler(28),
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: scaler(8),
  },
  buttonContainer: {
    width: "100%",
    marginBottom: scaler(24),
    gap: scaler(16),
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: scaler(24),
  },
  signUpText: {
    fontSize: scaler(16),
  },
});

export default AuthStart;
