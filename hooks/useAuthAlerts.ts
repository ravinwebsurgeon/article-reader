import { useEffect } from "react";
import { useAppSelector } from "@/redux/hook";
import { useAlert } from "@/provider/AlertProvider";
import { AlertPresets } from "@/utils/alert";

/**
 * Hook that automatically shows alerts based on auth state changes
 */
export const useAuthAlerts = () => {
  const alert = useAlert();
  const authError = useAppSelector((state) => state.auth.error);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (authError) {
      // Parse error message for better user experience
      let errorMessage = authError;

      if (authError.toLowerCase().includes("unauthorized")) {
        errorMessage = "Invalid email or password";
      } else if (authError.toLowerCase().includes("network")) {
        alert.show(AlertPresets.networkError());
        return;
      } else if (authError.toLowerCase().includes("exists")) {
        errorMessage = "An account with this email already exists";
      }

      alert.show(AlertPresets.authError(errorMessage));
    }
  }, [authError, alert]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Show success alert when user logs in
      if (user.name || user.email) {
        // alert.show(AlertPresets.loginSuccess(user.name || user.email));
      }
    }
  }, [isAuthenticated, user?.id]); // Only trigger on actual user change

  return alert;
};
