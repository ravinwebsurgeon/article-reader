import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware } from 'redux';
import { refreshAccessToken } from '../slices/authSlice';

// This middleware intercepts API errors to handle token refreshing
export const tokenRefreshMiddleware: Middleware =
  ({ dispatch, getState }) =>
  (next) =>
  async (action) => {
    // We need to check if this is a rejected action due to 401 error
    if (isRejectedWithValue(action) && action.payload?.status === 401) {
      const { auth } = getState();

      // Only attempt to refresh if we have a refresh token
      if (auth.refreshToken) {
        try {
          // Try to get a new token
          await dispatch(refreshAccessToken()).unwrap();

          // If successful, retry the original request
          // This assumes your API services have a way to retry the failed request
          const retryResult = await dispatch(action.meta.arg);
          return retryResult;
        } catch (error) {
          // If refresh fails, let the original error through
          return next(action);
        }
      }
    }

    return next(action);
  };
