import { api } from "./api";

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
      query: () => "/user/profile",
      providesTags: ["User"],
    }),

    // Update user profile
    updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: (profileData) => ({
        url: "/user/profile",
        method: "PATCH",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),

    // Change password
    changePassword: builder.mutation<{ success: boolean }, ChangePasswordRequest>({
      query: (passwordData) => ({
        url: "/user/change-password",
        method: "POST",
        body: passwordData,
      }),
    }),

  }),
});

// Export hooks for usage in functional components
export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi;
