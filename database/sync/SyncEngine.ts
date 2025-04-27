import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce, DebouncedFunc } from 'lodash-es';
import { Subscription } from 'rxjs';

// API URL from environment configuration.
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.pckt.dev/v4';

const LOG_PREFIX = '[SyncEngine]';

/**
 * Represents the state of a sync promise operation
 */
type SyncPromiseState = {
  promise: Promise<boolean>;
  resolve: (value: boolean) => void;
  reject: (reason?: any) => void;
};

/**
 * SyncEngine orchestrates database synchronization between the local device
 * and the remote server using WatermelonDB's sync mechanism. It ensures
 * that only one sync operation runs at a time and provides a consistent
 * promise-based interface for sync requests.
 */
class SyncEngine {
  // The WatermelonDB database instance. Needs to be set after initialization.
  public database: Database | null;
  // Authentication token for API requests.
  public token: string | null = null;
  // Flag indicating if a synchronization operation (`_syncInternal`) is currently active.
  private isSyncing: boolean = false;
  // Object containing the current sync promise state (promise, resolve, reject)
  private syncState: SyncPromiseState | null = null;
  // Debounced version of the internal sync logic (`_syncInternal`).
  // Ensures that actual sync operations are not triggered too frequently.
  private debouncedSync: DebouncedFunc<(isFirstSync?: boolean) => Promise<void>>;
  // Subscription to database changes
  private subscription: Subscription | null = null;

  constructor(database: Database | null = null) {
    this.database = database;
    // Initialize the debounced function.
    // `leading: true` runs the function immediately on the first call within the wait period.
    // `trailing: false` prevents an additional run after the wait period.
    this.debouncedSync = debounce(this._syncInternal.bind(this), 250, {
      leading: true,
      trailing: false,
    });
  }

  /**
   * Sets up a subscription to monitor changes in database tables
   * and automatically trigger sync when local changes are detected.
   */
  watchForChanges(): void {
    if (!this.database) {
      console.error(`${LOG_PREFIX} Cannot watch for changes: Database not initialized`);
      return;
    }

    if (this.subscription) {
      console.log(`${LOG_PREFIX} Stopping existing subscription before creating a new one`);
      this.stopWatchForChanges();
    }

    const tables = ['items', 'tags', 'item_tags'];
    console.log(`${LOG_PREFIX} Setting up watch for changes on tables: ${tables.join(', ')}`);
    this.subscription = this.database.withChangesForTables(tables).subscribe((changes) => {
      if (changes) {
        // Only trigger sync if at least one record has a status other than 'synced'
        // This prevents infinite loops where sync operations trigger more syncs
        const hasLocalChanges = changes.some((change) => change.record.syncStatus !== 'synced');

        if (hasLocalChanges) {
          console.log(`${LOG_PREFIX} Auto sync triggered due to local changes`);
          this.sync();
        }
      }
    });
  }

  /**
   * Stops watching for database changes by unsubscribing from the subscription
   */
  stopWatchForChanges(): void {
    if (this.subscription) {
      console.log(`${LOG_PREFIX} Stopping watch for changes`);
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Updates the authentication token used for synchronization.
   * @param token JWT token string or null to clear.
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Asynchronously loads the authentication token from AsyncStorage.
   * @returns Promise resolving to the token or null if not found or error occurs.
   */
  async loadToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      this.token = token; // Update the instance property
      return token;
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to load auth token:`, error);
      return null;
    }
  }

  /**
   * Retrieves the current auth token, loading it from storage if necessary.
   * @returns Promise resolving to the current token or null.
   */
  async getToken(): Promise<string | null> {
    // Load from storage only if the token isn't already available in memory.
    if (!this.token) {
      return this.loadToken();
    }
    return this.token;
  }

  /**
   * Initiates database synchronization with the server.
   * If a sync is already in progress or debounced, it returns the existing promise.
   * Otherwise, it creates a new promise, stores its resolvers, and triggers the
   * debounced internal sync logic.
   *
   * @param isFirstSync If true, enables WatermelonDB's unsafeTurbo mode for potentially faster initial sync.
   * @returns A Promise resolving to true upon successful sync completion, or rejecting on failure.
   */
  sync(isFirstSync = false): Promise<boolean> {
    // If we're actually syncing, just return the existing promise without extending the debounce
    if (this.isSyncing && this.syncState) {
      console.log(`${LOG_PREFIX} Already actively syncing, returning existing promise.`);
      return this.syncState.promise;
    }

    // Create a new promise if we don't have one yet
    if (!this.syncState) {
      console.log(`${LOG_PREFIX} Creating new sync promise.`);

      let resolve!: (value: boolean) => void;
      let reject!: (reason?: any) => void;

      const promise = new Promise<boolean>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      this.syncState = { promise, resolve, reject };
    }

    // Always trigger the debounced function to extend the debounce period
    // unless we're actively syncing
    console.log(`${LOG_PREFIX} Triggering debounced sync.`);
    this.debouncedSync(isFirstSync);

    // Return the promise
    return this.syncState.promise;
  }

  /**
   * The internal, debounced synchronization logic.
   * This method performs the actual `synchronize` call with WatermelonDB.
   * It handles token loading, manages the `isSyncing` flag, and calls
   * `_finalizeSync` upon completion or error.
   *
   * @param isFirstSync Passed from the public `sync` method.
   */
  private async _syncInternal(isFirstSync = false): Promise<void> {
    // Safeguard: Check if `_syncInternal` was somehow called directly while already syncing.
    // This shouldn't happen with the current debounce settings but provides robustness.
    if (this.isSyncing) {
      console.warn(
        `${LOG_PREFIX} _syncInternal called while another sync was already in progress.`,
      );
      return; // Let the existing operation complete; do not interfere.
    }

    // --- Token Loading: Critical prerequisite ---
    if (!this.token) {
      try {
        this.token = await this.loadToken();
        // Ensure token was successfully loaded.
        if (!this.token) throw new Error('Authentication token could not be loaded');
      } catch (error) {
        console.error(`${LOG_PREFIX} Failed to load token for sync:`, error);
        // If token loading fails, reject the promise and clean up immediately.
        this._finalizeSync(new Error('Authentication token not set'));
        return; // Stop execution; `_finalizeSync` handles cleanup.
      }
    }
    // --- End Token Loading ---

    // Check if database is initialized
    if (!this.database) {
      console.error(`${LOG_PREFIX} Database not initialized`);
      this._finalizeSync(new Error('Database not initialized'));
      return;
    }

    // Mark sync as active *before* the async `synchronize` call.
    this.isSyncing = true;
    const syncStartTime = Date.now();
    console.log(`${LOG_PREFIX} Starting sync operation (isFirstSync: ${isFirstSync})`);
    const useTurbo = isFirstSync;
    let syncError: Error | null = null; // Track error state for the finally block.

    try {
      // --- Main WatermelonDB Synchronization ---
      await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          // Fetch changes from the server since the last pull.
          const params = new URLSearchParams();
          params.set('last_pulled_at', String(lastPulledAt || 0));
          params.set('schema_version', String(schemaVersion));
          params.set('migration', JSON.stringify(migration));

          console.log(`${LOG_PREFIX} Pulling changes...`);
          const pullStartTime = Date.now();
          const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(`${LOG_PREFIX} Pull response status: ${response.status}`);
          if (!response.ok) {
            // Throw an error to be caught by the outer try/catch.
            throw new Error(`Pull failed: ${await response.text()}`);
          }

          const pullEndTime = Date.now();
          const pullDuration = pullEndTime - pullStartTime;

          // Handle turbo mode (raw JSON string) vs standard mode (parsed JSON).
          if (useTurbo) {
            const json = await response.text();
            console.log(`${LOG_PREFIX} Pull successful (turbo). Duration: ${pullDuration}ms`);
            return { syncJson: json };
          } else {
            const { changes, timestamp } = await response.json();
            console.log(`${LOG_PREFIX} Pull successful. Duration: ${pullDuration}ms`);
            return { changes, timestamp };
          }
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          // Send local changes to the server.
          const params = new URLSearchParams();
          params.set('last_pulled_at', String(lastPulledAt));

          console.log(`${LOG_PREFIX} Pushing changes...`);
          const pushStartTime = Date.now();
          const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changes),
          });

          const pushEndTime = Date.now();
          const pushDuration = pushEndTime - pushStartTime;

          console.log(`${LOG_PREFIX} Push response status: ${response.status}`);
          if (!response.ok) {
            // Throw an error to be caught by the outer try/catch.
            throw new Error(`Push failed: ${await response.text()}`);
          }
          console.log(`${LOG_PREFIX} Push successful. Duration: ${pushDuration}ms`);
        },
        // Pass turbo mode flag to WatermelonDB.
        unsafeTurbo: useTurbo,
        // Specify the schema version at which migrations are enabled.
        migrationsEnabledAtVersion: 1,
        // Created records are sent as updated records.
        sendCreatedAsUpdated: true,
      });
      // --- End Synchronization Logic ---

      console.log(`${LOG_PREFIX} Sync operation completed successfully.`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Sync operation failed:`, error);
      // Store the error to be handled in the finally block.
      syncError = error instanceof Error ? error : new Error(String(error));
    } finally {
      const syncEndTime = Date.now();
      const syncDuration = syncEndTime - syncStartTime;
      console.log(`${LOG_PREFIX} Total sync duration: ${syncDuration}ms`);
      // Centralized cleanup and promise resolution/rejection.
      this._finalizeSync(syncError);
      console.log(`${LOG_PREFIX} Finished sync operation execution cycle.`);
    }
  }

  /**
   * Finalizes the synchronization cycle.
   * Resolves or rejects the promise in syncState based on the outcome,
   * clears the syncState, and resets the `isSyncing` flag.
   *
   * @param error Optional error object. If provided, the promise is rejected.
   *              Otherwise (if null/undefined), the promise is resolved successfully.
   */
  private _finalizeSync(error: Error | null): void {
    if (error) {
      // Reject the promise if an error occurred during the sync process.
      if (this.syncState) {
        console.log(`${LOG_PREFIX} Rejecting sync promise.`); // Error details logged previously
        this.syncState.reject(error);
      } else {
        // This case should be rare (promise created but rejector not stored), log a warning.
        console.warn(`${LOG_PREFIX} Sync failed, but no syncState was available.`);
      }
    } else {
      // Resolve the promise successfully if no error occurred.
      if (this.syncState) {
        console.log(`${LOG_PREFIX} Resolving sync promise successfully.`);
        this.syncState.resolve(true); // Resolve with `true` to indicate success.
      } else {
        // This case should be rare, log a warning.
        console.warn(`${LOG_PREFIX} Sync succeeded, but no syncState was available.`);
      }
    }

    // Clean up the stored promise state, regardless of outcome.
    console.log(`${LOG_PREFIX} Cleaning up promise state.`);
    this.syncState = null;

    // Reset the flag indicating an active sync operation.
    this.isSyncing = false;
    console.log(`${LOG_PREFIX} isSyncing flag reset.`);
  }
}

// Export a singleton instance of the SyncEngine.
// The actual database instance will be properly set during app initialization
export const syncEngine = new SyncEngine(null);
