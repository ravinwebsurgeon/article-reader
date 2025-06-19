import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { usePassTranslationsToNative } from "@/utils/hooks";

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const path = isAuthenticated ? "/(tabs)" : "/signup";

  usePassTranslationsToNative();

  // Redirect to tabs if authenticated, otherwise to auth signup screen
  return <Redirect href={path} />;
}
