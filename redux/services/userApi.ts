import { api } from './api';

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Define a service for user-related endpoints
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user profile
    getProfile: builder.query<UserProfile, void>({
      query: () => '/user/profile',
      providesTags: ['User'],
    }),

    // Update user profile
    updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: (profileData) => ({
        url: '/user/profile',
        method: 'PATCH',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<{ success: boolean }, ChangePasswordRequest>({
      query: (passwordData) => ({
        url: '/user/change-password',
        method: 'POST',
        body: passwordData,
      }),
    }),

    // Request password reset
    requestPasswordReset: builder.mutation<{ success: boolean }, { email: string }>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Verify OTP
    verifyOtp: builder.mutation<
      { success: boolean; token: string },
      { email: string; otp: string }
    >({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),

    // Reset password with token
    resetPassword: builder.mutation<{ success: boolean }, { token: string; newPassword: string }>({
      query: (data) => ({
        url: '/auth/reset-password/confirm',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRequestPasswordResetMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} = userApi;
