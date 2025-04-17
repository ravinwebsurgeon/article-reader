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

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

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



// Initialize auth from storage
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        // Fetch current user to validate token
        const response = await fetch('https://getpocket.com/v4/users/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return { user: data.user, token };
        } else {
          // Token is invalid, clear it
          await AsyncStorage.removeItem('auth_token');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return null;
    }
  }
);

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
  },
});

export const { resetAuthError, updateUser } = authSlice.actions;

export default authSlice.reducer;