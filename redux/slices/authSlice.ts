import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "../services/authApi";
import { User } from "../../types/api";

// Types
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthError(state) {
      state.error = null;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addMatcher(authApi.endpoints.login.matchPending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = payload.user;
      state.token = payload.token;
    });
    builder.addMatcher(authApi.endpoints.login.matchRejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Login failed";
    });

    // Register
    builder.addMatcher(authApi.endpoints.register.matchPending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addMatcher(authApi.endpoints.register.matchFulfilled, (state, { payload }) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = payload.user;
      state.token = payload.token;
    });
    builder.addMatcher(authApi.endpoints.register.matchRejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Registration failed";
    });

    // Logout
    builder.addMatcher(authApi.endpoints.logout.matchPending, (state) => {
      state.isLoading = true;
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });
    builder.addMatcher(authApi.endpoints.logout.matchRejected, (state) => {
      // Even if the API call fails, we still log out on the client
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });

    // Token refresh
    builder.addMatcher(authApi.endpoints.refreshToken.matchFulfilled, (state, { payload }) => {
      state.token = payload.token;
    });

    // Initialize auth
    builder.addMatcher(authApi.endpoints.initializeAuth.matchFulfilled, (state, { payload }) => {
      if (payload) {
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      }
      state.isLoading = false;
    });
  },
});

export const { resetAuthError, updateUser } = authSlice.actions;

export default authSlice.reducer;
