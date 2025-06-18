import { synchronize } from "@nozbe/watermelondb/sync";
import { Database } from "@nozbe/watermelondb";
import Constants from "expo-constants";
import { debounce, throttle, DebouncedFunc } from "lodash-es";
import { Subscription } from "rxjs";
import ItemContentSyncer from "./ItemContentSyncer";
import { ServerChangesWatcher } from "./ServerChangesWatcher";

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
 * 5. Auth token must be provided by SyncProvider before sync operations
 */
export class SyncEngine {
  // Core dependencies
  private database: Database;
  private token: string;
  private itemContentSyncer: ItemContentSyncer;
  private serverChangesWatcher: ServerChangesWatcher;

  // Sync state - SINGLE SOURCE OF TRUTH
  private currentSyncPromise: Promise<boolean> | null = null;
  private pendingFirstSync: boolean = false;

  // Debounced functions
  private debouncedSync: DebouncedFunc<() => Promise<boolean>>;
  private debouncedServerSync: DebouncedFunc<() => void>;

  // Change monitoring
  private subscription: Subscription | null = null;

  constructor(database: Database, token: string) {
    this.database = database;
    this.token = token;

    // Initialize dependencies
    this.itemContentSyncer = new ItemContentSyncer();
    this.itemContentSyncer.database = database;
    this.itemContentSyncer.token = token;
    this.serverChangesWatcher = new ServerChangesWatcher(API_URL as string);
    this.serverChangesWatcher.setToken(token);

    console.log(`${LOG_PREFIX} Initialized with database and token - ready for sync operations`);

    // Create debounced sync function - this is the core sync logic
    this.debouncedSync = debounce(() => this._performSync(), 250, {
      leading: true,
      trailing: true,
    });

    // Create throttled server notification handler - prevents notification spam
    this.debouncedServerSync = throttle(
      () => {
        this.sync().catch((error: Error) => {
          console.error(`${LOG_PREFIX} Server notification sync failed:`, error);
        });
      },
      5000,
      {
        leading: true,
        trailing: true, // Ensure we don't miss final state of server changes
      },
    );

    // Start watching for changes automatically
    this.watch();
  }

  /**
   * Main sync method - always returns the same promise if sync is in progress
   */
  sync(isFirstSync = false): Promise<boolean> {
    // Set first sync flag if requested
    if (isFirstSync) {
      this.pendingFirstSync = true;
    }

    // If sync is already running, return the existing promise but extend debounce
    if (this.currentSyncPromise) {
      console.log(`${LOG_PREFIX} Sync already in progress, extending debounce period`);
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
    const isFirstSync = this.pendingFirstSync;
    this.pendingFirstSync = false; // Reset flag

    console.log(`${LOG_PREFIX} Executing sync operation (turbo: ${isFirstSync})`);
    const syncStartTime = Date.now();

    try {
      // Perform WatermelonDB sync
      await this._syncWithServer(isFirstSync);

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
   * Perform the actual WatermelonDB synchronization
   */
  private async _syncWithServer(isFirstSync = false): Promise<void> {
    console.log(`${LOG_PREFIX} Syncing with server`);

    // Enable turbo sync for first sync to improve performance
    const useTurbo = isFirstSync;

    await synchronize({
      database: this.database,
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

        if (useTurbo) {
          // For turbo sync, return raw JSON text
          const syncJson = await response.text();
          console.log(`${LOG_PREFIX} Pull successful (turbo mode)`);
          return { syncJson };
        } else {
          // For normal sync, return parsed data
          const responseData = await response.json();
          const { changes, timestamp } = responseData;
          console.log(`${LOG_PREFIX} Pull successful`);
          return { changes, timestamp };
        }
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

  private watchForDatabaseChanges(): void {
    if (this.subscription) {
      this.stopWatchingForDatabaseChanges();
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

  private stopWatchingForDatabaseChanges(): void {
    if (this.subscription) {
      console.log(`${LOG_PREFIX} Stopping change monitoring`);
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  // ===========================================
  // SERVER NOTIFICATION HANDLING
  // ===========================================

  private watchForServerChanges(): void {
    if (this.serverChangesWatcher.isConnectedOrConnecting()) {
      return;
    }

    this.serverChangesWatcher.connect({
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

  private stopWatchingForServerChanges(): void {
    this.serverChangesWatcher.disconnect();
  }

  // ===========================================
  // CONFIGURATION AND LIFECYCLE
  // ===========================================

  /**
   * Start watching for both database changes and server notifications
   */
  watch(): void {
    console.log(`${LOG_PREFIX} Starting to watch for database and server changes`);
    this.watchForDatabaseChanges();
    this.watchForServerChanges();
  }

  /**
   * Stop watching for all changes
   */
  stopWatching(): void {
    console.log(`${LOG_PREFIX} Stopping all change monitoring`);
    this.stopWatchingForDatabaseChanges();
    this.stopWatchingForServerChanges();
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
    this.stopWatching();
    this.debouncedSync.cancel();
    this.debouncedServerSync.cancel();
    this.pendingFirstSync = false;
    // Note: Don't cancel currentSyncPromise - let it complete naturally
  }
}
