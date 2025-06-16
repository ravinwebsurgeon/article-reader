import { useAlert } from "@/provider/AlertProvider";
import { AlertBuilder, AlertPresets } from "@/utils/alert";
import { useCallback } from "react";

interface ErrorHandlerOptions {
  defaultTitle?: string;
  defaultMessage?: string;
  duration?: number;
  showStackTrace?: boolean;
}

/**
 * Hook for standardized error handling across the app
 */
export const useErrorHandler = (options?: ErrorHandlerOptions) => {
  const alert = useAlert();

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      let title = options?.defaultTitle || "Error";
      let message = options?.defaultMessage || "An unexpected error occurred";

      if (error instanceof Error) {
        message = customMessage || error.message;

        // Handle specific error types
        if (error.name === "NetworkError") {
          alert.show(AlertPresets.networkError());
          return;
        }

        if (options?.showStackTrace && __DEV__ && error.stack) {
          message += `\n\n${error.stack}`;
        }
      } else if (typeof error === "string") {
        message = error;
      }

      alert.show(
        new AlertBuilder()
          .type("error")
          .title(title)
          .message(message)
          .duration(options?.duration || 5000)
          .build(),
      );
    },
    [alert, options],
  );

  return { handleError };
};
