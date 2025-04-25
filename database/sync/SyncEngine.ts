import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';
import Constants from 'expo-constants';

// API URL from environment
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.pckt.dev/v4';

/**
 * SyncEngine handles database synchronization between local device and server
 * Using WatermelonDB's synchronization capabilities
 */
class SyncEngine {
  private database: Database;
  // Authentication token required for API requests
  private token: string | null = null;

  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Set the authentication token for API requests
   * @param token JWT token string or null to clear
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Synchronize local database with server
   * @param isFirstSync If true, enables Turbo Login for faster initial sync
   * @returns Promise resolving to true when sync completes successfully
   * @throws Error if token is not set or sync fails
   */
  async sync(isFirstSync = false) {
    if (!this.token) {
      throw new Error('Authentication token not set');
    }

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

          // Fetch changes from server
          const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          });

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
    }
  }
}

// Create and export a singleton instance
// The actual database will be set by DatabaseProvider
export const syncEngine = new SyncEngine(null as any);
