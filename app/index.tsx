import { Redirect } from "expo-router";
import { useAppSelector } from "@/redux/hook";

export default function Index() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const path = isAuthenticated ? "/" : "/auth-start";

  // Redirect to tabs if authenticated, otherwise to auth login screen
  return <Redirect href={path} />;
}
