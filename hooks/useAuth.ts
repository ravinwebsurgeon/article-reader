import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

// This is a simplified auth hook - in a real app you would use a more robust solution
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        // In a real app, validate the token with your backend
        const userData = await AsyncStorage.getItem("user_data");
        setUser(userData ? JSON.parse(userData) : null);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Replace with actual API call
      const response = (await mockLoginApi(email, password)) as LoginResponse;

      // Store auth data
      await AsyncStorage.setItem("auth_token", response.token);
      await AsyncStorage.setItem("user_data", JSON.stringify(response.user));

      setUser(response.user);
      setIsAuthenticated(true);

      // Navigate to the home screen
      router.replace("/(tabs)");
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Clear auth data
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user_data");

      setUser(null);
      setIsAuthenticated(false);

      // Navigate to the login screen
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock API function - replace with real API calls
  const mockLoginApi = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          resolve({
            token: "mock-jwt-token",
            user: { id: "1", email, name: "User Name" },
          });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 1000);
    });
  };

  const registerUser = async ({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      const response = await fetch("https://api.pckt.dev/v4/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            username: username,
            email: email,
            password: password,
          },
        }),
      });
      const resultData = await response.json();
      if (!response.ok) {
        throw new Error(resultData.errors || "Something went wrong");
      }
      return resultData;
    } catch (error: any) {
      console.error(error);
      return error;
    }
  };
  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    registerUser,
    checkAuthStatus,
  };
}
