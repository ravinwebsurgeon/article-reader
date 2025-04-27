import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce, DebouncedFunc } from 'lodash-es';

// API URL from environment
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.pckt.dev/v4';

/**
 * SyncEngine handles database synchronization between local device and server
 * Using WatermelonDB's synchronization capabilities
 */
class SyncEngine {
  public database: Database;
  // Authentication token required for API requests
  public token: string | null = null;
  // Track if a sync is in progress
  private isSyncing: boolean = false;
  // Track if another sync is queued
  private queuedSync: boolean = false;
  // Debounced sync function
  private debouncedSync: DebouncedFunc<(isFirstSync?: boolean) => Promise<boolean>>;

  constructor(database: Database) {
    this.database = database;
    // Create debounced sync function with 250ms delay and leading edge execution
    this.debouncedSync = debounce(this._sync.bind(this), 250, { leading: true, trailing: true });
  }

  /**
   * Set the authentication token for API requests
   * @param token JWT token string or null to clear
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Load authentication token from AsyncStorage
   * @returns Promise resolving to the token or null if not found
   */
  async loadToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      this.token = token;
      return token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
      return null;
    }
  }

  /**
   * Get the current auth token, loading from AsyncStorage if not yet loaded
   * @returns Promise resolving to the current token or null
   */
  async getToken(): Promise<string | null> {
    if (!this.token) {
      return this.loadToken();
    }
    return this.token;
  }

  /**
   * Synchronize local database with server
   * @param isFirstSync If true, enables Turbo Login for faster initial sync
   * @returns Promise resolving to true when sync completes successfully
   * @throws Error if token is not set or sync fails
   */
  async sync(isFirstSync = false) {
    // If a sync is already in progress, queue another sync
    if (this.isSyncing) {
      console.log('Sync in progress, queueing another sync');
      this.queuedSync = true;
      return false;
    }

    return this.debouncedSync(isFirstSync);
  }

  /**
   * Internal sync implementation
   * @param isFirstSync If true, enables Turbo Login for faster initial sync
   * @returns Promise resolving to true when sync completes successfully
   * @throws Error if token is not set or sync fails
   */
  private async _sync(isFirstSync = false) {
    if (!this.token) {
      try {
        this.token = await this.loadToken();
      } catch (error) {
        throw new Error('Authentication token not set');
      }
    }

    // Set syncing flag
    this.isSyncing = true;

    // Use turbo mode for the first sync
    const useTurbo = isFirstSync;

    try {
      await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          // Build query parameters for the sync request
          const params = new URLSearchParams();
          params.set('last_pulled_at', String(lastPulledAt || 0));
          params.set('schema_version', String(schemaVersion));
          params.set('migration', JSON.stringify(migration));

          console.log('does the code here');

          // Fetch changes from server
          const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
            // const response = await fetch(`${API_URL}/sync`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('response', response);

          if (!response.ok) {
            throw new Error(await response.text());
          }

          if (useTurbo) {
            // For turbo mode, return raw text without parsing
            // This optimizes performance for large initial syncs
            const json = await response.text();
            return { syncJson: json };
          } else {
            // For regular syncs, parse the JSON response
            const { changes, timestamp } = await response.json();
            return { changes, timestamp };
          }
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          // Build query parameters for the push request
          const params = new URLSearchParams();
          params.set('last_pulled_at', String(lastPulledAt));

          // Send local changes to server
          const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changes),
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }
        },
        // Enable turbo mode for initial sync
        unsafeTurbo: useTurbo,
        migrationsEnabledAtVersion: 1,
      });

      return true;
    } catch (error) {
      // Log and rethrow the error for higher-level handling
      console.error('Sync failed:', error);
      throw error;
    } finally {
      // Always reset syncing flag
      this.isSyncing = false;

      // If another sync was queued, run it now
      if (this.queuedSync) {
        console.log('Running queued sync');
        this.queuedSync = false;
        this.debouncedSync(isFirstSync);
      }
    }
  }
}

// Create and export a singleton instance
// The actual database will be set by DatabaseProvider
export const syncEngine = new SyncEngine(null as any);
