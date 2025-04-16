import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleApiError } from '../services/api';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
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

// Async thunks
export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    // In a real app, you would call your API
    const response = await fetch('https://api.yourblogapp.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'Login failed');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const signup = createAsyncThunk<
  AuthResponse,
  SignupCredentials,
  { rejectValue: string }
>('auth/signup', async (credentials, { rejectWithValue }) => {
  try {
    // In a real app, you would call your API
    const response = await fetch('https://api.yourblogapp.com/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'Signup failed');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const refreshAccessToken = createAsyncThunk<
  { token: string },
  void,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/refreshToken', async (_, { getState, rejectWithValue }) => {
  try {
    const { refreshToken } = getState().auth;
    
    if (!refreshToken) {
      return rejectWithValue('No refresh token available');
    }

    // In a real app, you would call your API
    const response = await fetch('https://api.yourblogapp.com/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'Token refresh failed');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  // Clear any auth-related storage
  await AsyncStorage.removeItem('auth_token');
  return;
});

// Slice
const authSlice = createSlice({
  name: 'auth',
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
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Login failed';
    });

    // Signup
    builder.addCase(signup.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signup.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    });
    builder.addCase(signup.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Signup failed';
    });

    // Refresh token
    builder.addCase(refreshAccessToken.fulfilled, (state, action) => {
      state.token = action.payload.token;
    });
    builder.addCase(refreshAccessToken.rejected, (state) => {
      // If token refresh fails, log the user out
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });
  },
});

export const { resetAuthError, updateUser } = authSlice.actions;

export default authSlice.reducer;