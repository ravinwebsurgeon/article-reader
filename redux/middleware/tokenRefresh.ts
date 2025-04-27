import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware, UnknownAction } from 'redux';
import type { ThunkDispatch } from '@reduxjs/toolkit';
import { authApi } from '../services/authApi';
import { RootState } from '../store';

interface RejectedAction {
  payload?: {
    status?: number;
  };
  meta?: {
    arg?: UnknownAction;
  };
}

// This middleware intercepts API errors to handle token refreshing
export const tokenRefreshMiddleware: Middleware =
  ({ dispatch, getState }) =>
  (next) =>
  async (action) => {
    // We need to check if this is a rejected action due to 401 error
    if (isRejectedWithValue(action)) {
      const rejectedAction = action as RejectedAction;

      if (rejectedAction.payload?.status === 401) {
        const { auth } = getState() as RootState;

        // Only attempt to refresh if we have a refresh token
        if (auth.refreshToken) {
          try {
            // Try to get a new token using the refreshToken mutation
            const refreshResult = await (
              dispatch as ThunkDispatch<RootState, unknown, UnknownAction>
            )(authApi.endpoints.refreshToken.initiate({ refreshToken: auth.refreshToken }));

            if ('error' in refreshResult) {
              throw new Error('Token refresh failed');
            }

            // If successful, retry the original request
            if (rejectedAction.meta?.arg) {
              return dispatch(rejectedAction.meta.arg);
            }
          } catch {
            // If refresh fails, let the original error through
            return next(action);
          }
        }
      }
    }

    return next(action);
  };
