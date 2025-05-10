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
import { useLoginMutation } from "@/redux/services/authApi";
import { ThemeText, ThemeView } from "@/components";
import { scaler } from "@/utils";
import { Input } from "@/components/ui/TextInput/input";
import { SvgIcon } from "@/components/SvgIcon";
import { Button } from "@/components/ui/button";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const { error } = useAppSelector((state) => state.auth);
  const [login] = useLoginMutation();
  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        user: {
          email: data.email,
          password: data.password,
        },
      }).unwrap();
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
      width: scaler(80),
      height: scaler(80),
      borderRadius: scaler(40),
      backgroundColor: theme.colors.primary.main,
      justifyContent: "center",
      alignItems: "center",
      padding: scaler(15),
    },
    logoHeart: {
      width: scaler(30),
      height: scaler(30),
      backgroundColor: theme.colors.primary.light,
      borderRadius: scaler(15),
    },
    subtitle: {
      fontSize: scaler(17),
      lineHeight: scaler(26),
      fontWeight: "400" as const,
      color: theme.colors.text.disabled,
      marginBottom: scaler(16),
    },
    inputError: {
      borderColor: theme.colors.error.main,
    },
    errorText: {
      color: theme.colors.error.main,
      fontSize: scaler(12),
      marginTop: scaler(4),
    },
    forgotPasswordText: {
      color: theme.colors.primary.main,
      fontSize: scaler(14),
    },
    signInButton: {
      backgroundColor: theme.colors.primary.main,
      height: scaler(56),
      borderRadius: scaler(28),
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.colors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: scaler(0.25),
      shadowRadius: scaler(4),
      elevation: 5,
    },
    signInButtonText: {
      color: theme.colors.white,
      fontSize: scaler(18),
      fontWeight: "600" as const,
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
              Welcome Back
            </ThemeText>
            <ThemeText style={dynamicStyles.subtitle}>Pick up where you left off.</ThemeText>
          </ThemeView>

          <ThemeView style={styles.formContainer}>
            <Input
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              placeholder="Email"
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
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              }}
              placeholder="Password"
              secureTextEntry
              icon={<SvgIcon name="key" size={24} color={theme.colors.primary.main} />}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={navigateToForgotPassword}
            >
              {/* <ThemeText style={dynamicStyles.forgotPasswordText}>Forgot password?</ThemeText> */}
            </TouchableOpacity>

            <Button
              title="Log In"
              onPress={handleSubmit(onSubmit)}
              style={dynamicStyles.signInButton}
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
    marginBottom: scaler(20),
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
  formContainer: {
    marginTop: scaler(32),
  },
  input: {
    marginBottom: scaler(16),
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: scaler(24),
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

export default LoginScreen;
