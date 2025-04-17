import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useForm } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/ui/TextInput/input";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { COLORS } from "@/assets";
import { useAuth } from "@/hooks/useAuth";

const SignUpScreen = ({ navigation }) => {
  const [loader, setLoader] = useState(false);
  const { registerUser } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: any) => {
    console.log(data);
    setLoader(true);
    try {
      const response = await fetch("https://api.pckt.dev/v4/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            username: data?.username,
            email: data?.email,
            password: data?.password,
          },
        }),
      });
      console.warn("response", response);
      const resultData = await response.json();
      console.warn("resultData", resultData?.errors);
      if (resultData?.errors) {
        Alert.alert("Error", resultData?.errors[0]);
      }
      if (response.ok) {
        Alert.alert("Success", "You are registered successfully!");
      }
      if (!response.ok) {
        throw new Error(
          resultData.message || resultData?.errors || "Something went wrong"
        );
      }
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoader(false);
    }   
  };

  const navigateToLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loader && <ActivityIndicator size="small" color="#007AFF" />}
          <View style={styles.header}>
            <Text style={styles.title}>Sign Up</Text>
            {/* <Text style={styles.subtitle}>Sign Up to Connect.</Text> */}
          </View>

          <View style={styles.formContainer}>
            <Input
              control={control}
              name="userName"
              label="Username"
              rules={{ required: "Username is required" }}
              placeholder="Enter your Username"
              icon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.primary}
                />
              }
              autoCapitalize="words"
            />

            <Input
              control={control}
              name="email"
              label="Email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              placeholder="Enter your Email"
              keyboardType="email-address"
              icon={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.primary}
                />
              }
            />

            <Input
              control={control}
              name="password"
              label="Password"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must contain uppercase, lowercase, number and special character",
                },
              }}
              placeholder="Enter your Password"
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                />
              }
            />

            <Input
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              rules={{
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              }}
              placeholder="Confirm your Password"
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                />
              }
            />

            <Button
              title={loader ? "Submiting..." : "Sign Up"}
              onPress={handleSubmit(onSubmit)}
              style={styles.signUpButton}
            />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLinkText} onPress={navigateToLogin}>
              Sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
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
  signUpButton: {
    marginTop: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    color: COLORS.text,
    fontSize: 16,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SignUpScreen;
