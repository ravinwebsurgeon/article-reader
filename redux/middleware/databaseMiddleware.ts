import { Middleware } from 'redux';
import { AppDispatch, RootState } from '../store';
import { syncEngine } from '@/database/sync/SyncEngine';
import { selectAuthToken } from '../utils';
import NetInfo from '@react-native-community/netinfo';

// Define action types for type checking
interface NetworkStatusAction {
  type: 'network/statusChanged';
  payload: {
    isConnected: boolean;
    isInternetReachable: boolean | null;
  };
}

interface AuthAction {
  type: 'auth/login/fulfilled' | 'auth/refreshToken/fulfilled' | 'auth/logout/fulfilled';
}

interface RejectedAction {
  type: string;
  error?: {
    name: string;
  };
}

type AppAction = NetworkStatusAction | AuthAction | RejectedAction;

/**
 * Middleware to handle database integration with Redux
 */
export const databaseMiddleware: Middleware<{}, RootState, AppDispatch> =
  (store) => (next) => (action: unknown) => {
    // Type guard to check if action is AppAction
    if (!action || typeof action !== 'object' || !('type' in action)) {
      return next(action);
    }

    // Execute the action first
    const result = next(action);

    // Get the current state
    const state = store.getState();

    // Handle auth token changes for sync engine
    if (action.type === 'auth/login/fulfilled' || action.type === 'auth/refreshToken/fulfilled') {
      const token = selectAuthToken(state);
      syncEngine.setToken(token);

      // Trigger initial sync when user logs in
      NetInfo.fetch().then((state) => {
        if (state.isConnected) {
          syncEngine.sync().catch((error) => {
            console.error('Initial sync failed:', error);
          });
        }
      });
    }

    // Clear token on logout
    if (action.type === 'auth/logout/fulfilled') {
      syncEngine.setToken(null);
    }

    // Trigger sync when network comes back online
    if (
      action.type === 'network/statusChanged' &&
      'payload' in action &&
      action.payload &&
      typeof action.payload === 'object' &&
      'isConnected' in action.payload &&
      action.payload.isConnected
    ) {
      // Check if user is authenticated before syncing
      const token = selectAuthToken(state);
      if (token) {
        syncEngine.sync().catch((error) => {
          console.error('Network reconnect sync failed:', error);
        });
      }
    }

    // Handle API actions that should be performed offline
    if (
      typeof action.type === 'string' &&
      action.type.endsWith('/rejected') &&
      'error' in action &&
      action.error &&
      typeof action.error === 'object' &&
      'name' in action.error &&
      action.error.name === 'NetworkError'
    ) {
      // Store failed network requests for later sync
      if (action.type.includes('items/')) {
        // Queue item operation for later sync when back online
        // This would be a good place to implement a more robust queuing system
        console.log('Queued offline operation:', action);

        // You can store these in a special WatermelonDB collection for offline operations
        // or in AsyncStorage
      }
    }

    return result;
  };
