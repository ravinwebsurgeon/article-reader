import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";

// Selectors
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Theme selectors
export const selectThemeMode = (state: RootState) => state.theme.mode;
export const selectSystemPrefersDark = (state: RootState) =>
  state.theme.systemPrefersDark;

// Computed theme selector that resolves to actual light/dark value
export const selectActiveTheme = createSelector(
  [selectThemeMode, selectSystemPrefersDark],
  (mode, systemPrefersDark) => {
    if (mode === "system") {
      return systemPrefersDark ? "dark" : "light";
    }
    return mode;
  }
);

// Helper function to handle API loading states
export const createLoadingSelector =
  (actions: string[]) => (state: RootState) => {
    return actions.some((action) => {
      const matcher = action.match(/(.*)\/([^/]+)$/);
      if (!matcher) return false;

      const [, slice, actionType] = matcher;
      return state[slice]?.loadingState?.[actionType] === "pending";
    });
  };
