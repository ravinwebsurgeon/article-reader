import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const path = isAuthenticated ? "/(tabs)" : "/signup";

  // Redirect to tabs if authenticated, otherwise to auth signup screen
  return <Redirect href={path} />;
}
