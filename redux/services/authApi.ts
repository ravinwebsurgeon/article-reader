// src/services/authApi.ts
import { api } from './api';
import { User, AuthToken, UserCredentials, UserRegistration } from '../../types/api';

// Auth API endpoints
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Register a new user
    register: builder.mutation<{ token: string; user: User }, { user: UserRegistration }>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Login
    login: builder.mutation<{ token: string; user: User }, { user: UserCredentials }>({
      query: (data) => ({
        url: '/sessions',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Logout
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/sessions',
        method: 'DELETE',
      }),
    }),
    
    // Get current user
    getCurrentUser: builder.query<{ user: User }, void>({
      query: () => '/users/current',
      providesTags: ['User'],
    }),
    
    // Update current user
    updateCurrentUser: builder.mutation<{ user: User }, { user: Partial<UserRegistration> }>({
      query: (data) => ({
        url: '/users/current',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Delete current user
    deleteCurrentUser: builder.mutation<void, void>({
      query: () => ({
        url: '/users/current',
        method: 'DELETE',
      }),
    }),
  }),
});

// Export hooks
export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useDeleteCurrentUserMutation,
} = authApi;