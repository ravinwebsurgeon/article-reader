import { synchronize } from "@nozbe/watermelondb/sync";
import { Database } from "@nozbe/watermelondb";
import Constants from "expo-constants";
import { TokenStorage } from "@/utils/storage";
import { debounce, DebouncedFunc } from "lodash-es";
import { Subscription } from "rxjs";
import ItemContentSyncer from "./ItemContentSyncer";
import { ServerChangesListener } from "./ServerChangesListener";

// API URL from environment configuration.
const API_URL = Constants.expoConfig?.extra?.apiUrl || "https://api.savewithfolio.com/v4";
const LOG_PREFIX = "[SyncEngine]";

/**
 * SyncEngine orchestrates database synchronization between the local device
 * and the remote server using WatermelonDB's sync mechanism.
 *
 * DESIGN PRINCIPLES:
 * 1. Only one sync can run at a time
 * 2. Multiple sync requests return the same promise
 * 3. Server notifications are debounced to prevent spam
 * 4. All state is managed through a single currentSyncPromise
 */
class SyncEngine {
  // Core dependencies
  private database: Database | null;
  public token: string | null = null;
  private itemContentSyncer: ItemContentSyncer;
  private serverChangesListener: ServerChangesListener;

  // Sync state - SINGLE SOURCE OF TRUTH
  private currentSyncPromise: Promise<boolean> | null = null;

  // Debounced functions
  private debouncedSync: DebouncedFunc<() => Promise<boolean>>;
  private debouncedServerSync: DebouncedFunc<() => void>;

  // Change monitoring
  private subscription: Subscription | null = null;

  constructor(database: Database | null = null) {
    this.database = database;

    // Initialize dependencies
    this.itemContentSyncer = new ItemContentSyncer();
    if (database) {
      this.itemContentSyncer.database = database;
    }
    this.serverChangesListener = new ServerChangesListener(API_URL as string);

    // Create debounced sync function - this is the core sync logic
    this.debouncedSync = debounce(this._performSync.bind(this), 250, {
      leading: true,
      trailing: true,
    });

    // Create debounced server notification handler - prevents notification spam
    this.debouncedServerSync = debounce(
      () => {
        this.sync().catch((error: Error) => {
          console.error(`${LOG_PREFIX} Server notification sync failed:`, error);
        });
      },
      1000,
      {
        leading: true,
        trailing: false, // Don't need trailing for server notifications
      },
    );
  }

  /**
   * Main sync method - always returns the same promise if sync is in progress
   */
  sync(isFirstSync = false): Promise<boolean> {
    // If sync is already running, return the existing promise
    if (this.currentSyncPromise) {
      console.log(`${LOG_PREFIX} Sync already in progress, returning existing promise`);
      // Trigger debounced sync to extend debounce period
      this.debouncedSync();
      return this.currentSyncPromise;
    }

    console.log(`${LOG_PREFIX} Starting new sync operation`);

    // Create and store the sync promise
    const syncPromise = this.debouncedSync();
    if (!syncPromise) {
      // This shouldn't happen with our debounce settings, but handle it gracefully
      throw new Error("Failed to create sync promise");
    }

    this.currentSyncPromise = syncPromise;

    // Add cleanup when promise completes (success or failure)
    syncPromise.finally(() => {
      console.log(`${LOG_PREFIX} Sync promise completed, clearing state`);
      this.currentSyncPromise = null;
    });

    return syncPromise;
  }

  /**
   * The actual sync implementation - called by debounced function
   */
  private async _performSync(): Promise<boolean> {
    console.log(`${LOG_PREFIX} Executing sync operation`);
    const syncStartTime = Date.now();

    try {
      // Validate prerequisites
      await this._ensureToken();
      this._ensureDatabase();

      // Perform WatermelonDB sync
      await this._syncWithServer();

      // Start content sync (async, don't wait)
      this._startContentSync();

      const syncDuration = Date.now() - syncStartTime;
      console.log(`${LOG_PREFIX} Sync completed successfully in ${syncDuration}ms`);
      return true;
    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      console.error(`${LOG_PREFIX} Sync failed after ${syncDuration}ms:`, error);
      throw error;
    }
  }

  /**
   * Ensure we have a valid auth token
   */
  private async _ensureToken(): Promise<void> {
    if (!this.token) {
      console.log(`${LOG_PREFIX} Loading auth token from storage`);
      this.token = TokenStorage.get() ?? null;
      if (!this.token) {
        throw new Error("Authentication token not available");
      }
    }
  }

  /**
   * Ensure database is available
   */
  private _ensureDatabase(): void {
    if (!this.database) {
      throw new Error("Database not initialized");
    }
  }

  /**
   * Perform the actual WatermelonDB synchronization
   */
  private async _syncWithServer(): Promise<void> {
    console.log(`${LOG_PREFIX} Syncing with server`);

    const useTurbo = false; // Disable turbo for now to avoid complications

    await synchronize({
      database: this.database!,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const params = new URLSearchParams();
        params.set("last_pulled_at", String(lastPulledAt || 0));
        params.set("schema_version", String(schemaVersion));
        params.set("migration", JSON.stringify(migration));

        console.log(`${LOG_PREFIX} Pulling changes from server`);
        const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Pull failed: ${await response.text()}`);
        }

        const { changes, timestamp } = await response.json();
        console.log(`${LOG_PREFIX} Pull successful`);
        return { changes, timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        // Exclude item_contents from sync (handled separately)
        const { item_contents, ...changesToPush } = changes as any;

        const params = new URLSearchParams();
        params.set("last_pulled_at", String(lastPulledAt));

        console.log(`${LOG_PREFIX} Pushing changes to server`);
        const response = await fetch(`${API_URL}/sync?${params.toString()}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changesToPush),
        });

        if (!response.ok) {
          throw new Error(`Push failed: ${await response.text()}`);
        }

        console.log(`${LOG_PREFIX} Push successful`);
      },
      unsafeTurbo: useTurbo,
      migrationsEnabledAtVersion: 1,
      sendCreatedAsUpdated: true,
    });
  }

  /**
   * Start content sync asynchronously
   */
  private _startContentSync(): void {
    console.log(`${LOG_PREFIX} Starting content sync (async)`);
    this.itemContentSyncer.sync(false).catch((error: Error) => {
      console.error(`${LOG_PREFIX} Content sync failed:`, error);
    });
  }

  /**
   * Check if sync is currently running
   */
  isRunning(): boolean {
    return this.currentSyncPromise !== null;
  }

  // ===========================================
  // DATABASE CHANGE MONITORING
  // ===========================================

  watchForChanges(): void {
    if (!this.database) {
      console.error(`${LOG_PREFIX} Cannot watch for changes: Database not initialized`);
      return;
    }

    if (this.subscription) {
      this.stopWatchForChanges();
    }

    const tables = ["items", "tags", "item_tags", "annotations"];
    console.log(`${LOG_PREFIX} Watching for changes on: ${tables.join(", ")}`);

    this.subscription = this.database.withChangesForTables(tables).subscribe((changes) => {
      if (changes) {
        const hasLocalChanges = changes.some((change) => change.record.syncStatus !== "synced");
        if (hasLocalChanges) {
          console.log(`${LOG_PREFIX} Local changes detected, triggering sync`);
          this.sync().catch((error) => {
            console.error(`${LOG_PREFIX} Auto-sync failed:`, error);
          });
        }
      }
    });
  }

  stopWatchForChanges(): void {
    if (this.subscription) {
      console.log(`${LOG_PREFIX} Stopping change monitoring`);
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  // ===========================================
  // SERVER NOTIFICATION HANDLING
  // ===========================================

  private listenForServerChanges(): void {
    if (this.serverChangesListener.isConnectedOrConnecting()) {
      return;
    }

    this.serverChangesListener.connect({
      onConnected: () => {
        console.log(`${LOG_PREFIX} Connected to server notifications`);
      },
      onDisconnected: () => {
        console.log(`${LOG_PREFIX} Disconnected from server notifications`);
      },
      onMessage: (message: any) => {
        const isSync =
          (typeof message === "object" && message.type === "sync") || message === "sync";
        if (isSync) {
          console.log(`${LOG_PREFIX} Server notification received`);
          this.debouncedServerSync();
        }
      },
      onError: (error: any) => {
        console.error(`${LOG_PREFIX} Server notification error:`, error);
      },
    });
  }

  private stopListeningForServerChanges(): void {
    this.serverChangesListener.disconnect();
  }

  // ===========================================
  // CONFIGURATION AND LIFECYCLE
  // ===========================================

  setDatabase(database: Database | null) {
    this.database = database;
    this.itemContentSyncer.database = database;
  }

  setToken(token: string | null) {
    this.token = token;
    this.itemContentSyncer.token = token;
    this.serverChangesListener.setToken(token);

    if (token) {
      this.listenForServerChanges();
    } else {
      this.stopListeningForServerChanges();
    }
  }

  async loadToken(): Promise<string | null> {
    try {
      const token = TokenStorage.get() ?? null;
      this.setToken(token);
      return token;
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to load token:`, error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      return this.loadToken();
    }
    return this.token;
  }

  // Content sync methods
  async syncItemContent(itemId: string): Promise<void> {
    return this.itemContentSyncer.syncItem(itemId);
  }

  async syncAllContent(): Promise<void> {
    return this.itemContentSyncer.sync(true);
  }

  // Cleanup
  cleanup(): void {
    console.log(`${LOG_PREFIX} Cleaning up`);
    this.stopWatchForChanges();
    this.stopListeningForServerChanges();
    this.debouncedSync.cancel();
    this.debouncedServerSync.cancel();
    this.token = null;
    // Note: Don't cancel currentSyncPromise - let it complete naturally
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine(null);
