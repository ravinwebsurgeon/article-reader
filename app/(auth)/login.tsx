import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Text,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { login, resetAuthError } from "@/redux/slices/authSlice";
import { Image } from "expo-image";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { FormInput } from "@/components/ui/form/form-input";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/assets";

function LoginScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    console.log(data);
    // Handle login logic here
    // try {
    //   await dispatch(login({ email, password })).unwrap();
    //    Success! The auth slice will automatically redirect to the main app
    // } catch (error) {
    //    Error handling is done via the auth slice error state
    // }
  };

  const navigateToSignUp = () => {
    // Navigate to sign up screen
    router.push("/(auth)/signup");
  };

  const navigateToForgotPassword = () => {
    // Navigate to forgot password screen
    // navigation.navigate("ForgotPassword");
  };

  // Show error alert if needed
  useEffect(() => {
    if (error) {
      Alert.alert("Login Error", error);
      dispatch(resetAuthError());
    }
  }, [error, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Let's Make Reading Simple.</Text>
          </View>

          <View style={styles.formContainer}>
            <FormInput
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              placeholder="Enter your email address"
              keyboardType="email-address"
              icon={<Ionicons name="mail-outline" size={20} color="#1e40af" />}
            />

            <FormInput
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              }}
              placeholder="Enter your password"
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#1e40af"
                />
              }
            />

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={navigateToForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            
            <Button
              title="Sign in"
              onPress={handleSubmit(onSubmit)}
              style={styles.signInButton}
            />
          </View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={styles.signUpLinkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  logoHeart: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.placeholder,
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
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 45,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  signInButtonText: {
    color: COLORS.buttonText,
    fontSize: 18,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signUpText: {
    color: COLORS.text,
    fontSize: 16,
  },
  signUpLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginScreen;
