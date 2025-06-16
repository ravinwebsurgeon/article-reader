import { NativeModules } from "react-native";
const { TokenManager } = NativeModules;

// After successful login
export const saveToken = async (token: string) => {
  console.log("token", token);
  TokenManager.saveToken(token);
  console.log("token");
};

// Get token
export const getToken = async () => {
  try {
    return await TokenManager.getToken();
  } catch (error) {
    return null;
  }
};

// During logout
export const removeToken = () => {
  TokenManager.removeToken();
};
