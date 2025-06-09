import { Database, Model, Q } from "@nozbe/watermelondb";
import Constants from "expo-constants";
import { debounce, DebouncedFunc } from "lodash-es";
import Item from "../models/ItemModel";
import ItemContent from "../models/ItemContentModel";

// Constants
const API_URL = Constants.expoConfig?.extra?.apiUrl || "https://api.savewithfolio.com/v4";
const BATCH_SIZE = 50;
const LOG_PREFIX = "[ItemContentSync]";

/**
 * ItemContentSyncer handles the synchronization of item content from the API.
 *
 * DESIGN PRINCIPLES (same as SyncEngine):
 * 1. Only one sync can run at a time
 * 2. Multiple sync requests return the same promise
 * 3. All state is managed through a single currentSyncPromise
 */
export default class ItemContentSyncer {
  // Core dependencies
  public database: Database | null = null;
  public token: string | null = null;

  // Sync state - SINGLE SOURCE OF TRUTH
  private currentSyncPromise: Promise<void> | null = null;

  // Debounced sync function
  private debouncedSync: DebouncedFunc<(includeArchived?: boolean) => Promise<void>>;

  constructor() {
    // Create debounced sync function - prevents rapid successive syncs
    this.debouncedSync = debounce(this._performSync.bind(this), 250, {
      leading: true,
      trailing: true,
    });
  }

  /**
   * Main sync method - always returns the same promise if sync is in progress
   */
  async sync(includeArchived: boolean = false): Promise<void> {
    // If sync is already running, return the existing promise
    if (this.currentSyncPromise) {
      console.log(`${LOG_PREFIX} Sync already in progress, returning existing promise`);
      // Trigger debounced sync to extend debounce period
      this.debouncedSync(includeArchived);
      return this.currentSyncPromise;
    }

    console.log(`${LOG_PREFIX} Starting new content sync operation`);

    // Create and store the sync promise
    const syncPromise = this.debouncedSync(includeArchived);
    if (!syncPromise) {
      // This shouldn't happen with our debounce settings, but handle it gracefully
      throw new Error("Failed to create content sync promise");
    }

    this.currentSyncPromise = syncPromise;

    // Add cleanup when promise completes (success or failure)
    syncPromise.finally(() => {
      console.log(`${LOG_PREFIX} Content sync promise completed, clearing state`);
      this.currentSyncPromise = null;
    });

    return syncPromise;
  }

  /**
   * Sync content for a specific item by ID
   */
  async syncItem(itemId: string): Promise<void> {
    if (!this.database || !this.token) {
      console.warn(`${LOG_PREFIX} Database or token not available. Skipping item content sync.`);
      return;
    }

    try {
      console.log(`${LOG_PREFIX} Starting sync for item ${itemId}`);
      const item = await this.database.get<Item>("items").find(itemId);

      if (!item.contentHash) {
        console.log(`${LOG_PREFIX} Item ${itemId} has no content hash, skipping sync`);
        return;
      }

      const existingContent = await item.itemContentQuery?.fetch();
      const needsContent =
        !existingContent ||
        existingContent.length === 0 ||
        existingContent[0].contentHash !== item.contentHash;

      if (needsContent) {
        console.log(`${LOG_PREFIX} Fetching content for item ${itemId}`);
        await this.fetchAndStoreContent([item]);
      } else {
        console.log(`${LOG_PREFIX} Item ${itemId} content is up to date`);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error syncing item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * The actual sync implementation - called by debounced function
   */
  private async _performSync(includeArchived: boolean = false): Promise<void> {
    console.log(`${LOG_PREFIX} Executing content sync operation`);
    const syncStartTime = Date.now();

    try {
      // Validate prerequisites
      this._ensurePrerequisites();

      // Find items that need content
      const itemsNeedingContent = await this._findItemsNeedingContent(includeArchived);

      // Sync content if needed
      if (itemsNeedingContent.length > 0) {
        console.log(`${LOG_PREFIX} Found ${itemsNeedingContent.length} items requiring content`);
        await this.fetchAndStoreContent(itemsNeedingContent);
      } else {
        console.log(`${LOG_PREFIX} No items require content sync`);
      }

      // Clean up orphaned content
      await this.cleanupDatabase();

      const syncDuration = Date.now() - syncStartTime;
      console.log(`${LOG_PREFIX} Content sync completed successfully in ${syncDuration}ms`);
    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      console.error(`${LOG_PREFIX} Content sync failed after ${syncDuration}ms:`, error);
      throw error;
    }
  }

  /**
   * Validate that we have necessary prerequisites
   */
  private _ensurePrerequisites(): void {
    if (!this.database || !this.token) {
      throw new Error("Database or token not available");
    }
  }

  /**
   * Find items that need content syncing
   */
  private async _findItemsNeedingContent(includeArchived: boolean): Promise<Item[]> {
    if (!this.database) return [];

    // Build query conditions
    const queryConditions = [
      Q.where("content_hash", Q.notEq(null)),
      Q.where("content_hash", Q.notEq("")),
    ];

    // Exclude archived items unless specifically requested
    if (!includeArchived) {
      queryConditions.push(Q.where("archived", Q.notEq(true)));
    }

    const itemsWithContentHash = await this.database
      .get<Item>("items")
      .query(...queryConditions)
      .fetch();

    // Filter to items that actually need content
    const itemsNeedingContent = [];

    for (const item of itemsWithContentHash) {
      const existingContent = await item.itemContentQuery?.fetch();

      if (!existingContent || existingContent.length === 0) {
        // No content exists - need to fetch
        itemsNeedingContent.push(item);
      } else {
        // Content exists - check if hash matches
        const currentContent = existingContent[0];
        if (item.contentHash !== currentContent.contentHash) {
          // Hash mismatch - need to fetch updated content
          itemsNeedingContent.push(item);
        }
      }
    }

    // Sort by priority: unarchived first, unviewed first, newest first
    itemsNeedingContent.sort((a, b) => {
      // Sort by archived (false first)
      if (a.archived !== b.archived) {
        return a.archived ? 1 : -1;
      }

      // Then by viewed (false first)
      if (a.viewed !== b.viewed) {
        return a.viewed ? 1 : -1;
      }

      // Then by saved_at/created_at (desc)
      const aDate = a.savedAt ?? a.createdAt ?? 0;
      const bDate = b.savedAt ?? b.createdAt ?? 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return itemsNeedingContent;
  }

  /**
   * Fetch content from the API and store it in the database
   */
  private async fetchAndStoreContent(items: Item[]): Promise<void> {
    if (!this.database || !this.token || items.length === 0) return;

    // Create a lookup map for efficient access
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const itemIds = [...itemMap.keys()];
    const totalBatches = Math.ceil(itemIds.length / BATCH_SIZE);

    console.log(`${LOG_PREFIX} Processing ${itemIds.length} items in ${totalBatches} batches`);

    // Process in batches
    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
      const batchIds = itemIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      try {
        console.log(
          `${LOG_PREFIX} Fetching batch ${batchNumber}/${totalBatches} (${batchIds.length} items)`,
        );

        // Fetch content for this batch
        const response = await fetch(`${API_URL}/items/content_batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`,
          },
          body: JSON.stringify({ ids: batchIds }),
        });

        if (!response.ok) {
          console.error(`${LOG_PREFIX} API error for batch ${batchNumber}: ${response.status}`);
          continue;
        }

        const responseText = await response.text();
        const contentLines = responseText.split("\n").filter(Boolean);

        // Process and store the content
        if (contentLines.length > 0) {
          console.log(
            `${LOG_PREFIX} Processing ${contentLines.length} content items in batch ${batchNumber}`,
          );
          await this.database.write(async () => {
            const operations: Model[] = [];

            for (const line of contentLines) {
              try {
                const {
                  id,
                  content,
                  content_hash: serverContentHash,
                  takeaways,
                  description,
                  dek,
                  author,
                } = JSON.parse(line);

                const item = itemMap.get(id as string);
                if (!item) continue;

                // Find and mark existing content as deleted
                let existingContents: ItemContent[] = [];
                if (item.itemContentQuery) {
                  existingContents = await item.itemContentQuery.fetch();
                }
                existingContents.forEach((content) =>
                  operations.push(content.prepareMarkAsDeleted()),
                );

                // Create new content
                operations.push(
                  this.database!.get<ItemContent>("item_contents").prepareCreate((newContent) => {
                    if (newContent.item) {
                      newContent.item.set(item);
                    }
                    newContent.content = content;
                    newContent.contentHash = serverContentHash;
                    newContent.takeaways = takeaways;
                    newContent.description = description;
                    newContent.dek = dek;
                    newContent.author = author;
                  }),
                );

                // Update item's content hash if needed
                if (item.contentHash !== serverContentHash) {
                  operations.push(
                    item.prepareUpdate((itemToUpdate) => {
                      itemToUpdate.contentHash = serverContentHash;
                    }),
                  );
                }
              } catch (error) {
                console.error(`${LOG_PREFIX} Failed to process content line:`, line, error);
              }
            }

            if (operations.length > 0) {
              await this.database!.batch(...operations);
              console.log(
                `${LOG_PREFIX} Successfully stored ${operations.length} operations for batch ${batchNumber}`,
              );
            }
          });
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error processing batch ${batchNumber}:`, error);
      }
    }
  }

  /**
   * Clean up orphaned content for deleted items and old archived content
   */
  private async cleanupDatabase(): Promise<void> {
    if (!this.database) return;

    console.log(`${LOG_PREFIX} Starting content cleanup...`);
    await this.database.write(async () => {
      const operations: ItemContent[] = [];

      // 1. Find orphaned content (content for deleted items)
      const existingItemIds = await this.database!.get<Item>("items").query().fetchIds();
      const orphanedContent =
        existingItemIds.length > 0
          ? await this.database!.get<ItemContent>("item_contents")
              .query(Q.where("item_id", Q.notIn(existingItemIds)))
              .fetch()
          : await this.database!.get<ItemContent>("item_contents").query().fetch();

      if (orphanedContent.length > 0) {
        console.log(`${LOG_PREFIX} Found ${orphanedContent.length} orphaned content records`);
        operations.push(...orphanedContent);
      }

      // 2. Find content for archived items older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const oldArchivedItems = await this.database!.get<Item>("items")
        .query(Q.where("archived", true), Q.where("updated_at", Q.lt(thirtyDaysAgo.getTime())))
        .fetch();

      if (oldArchivedItems.length > 0) {
        console.log(
          `${LOG_PREFIX} Found ${oldArchivedItems.length} archived items older than 30 days`,
        );

        // Get content for these old archived items
        const oldArchivedItemIds = oldArchivedItems.map((item) => item.id);
        const oldArchivedContent = await this.database!.get<ItemContent>("item_contents")
          .query(Q.where("item_id", Q.oneOf(oldArchivedItemIds)))
          .fetch();

        if (oldArchivedContent.length > 0) {
          console.log(
            `${LOG_PREFIX} Found ${oldArchivedContent.length} content records for old archived items`,
          );
          operations.push(...oldArchivedContent);
        }
      }

      // 3. Delete all content marked for cleanup
      if (operations.length > 0) {
        console.log(`${LOG_PREFIX} Removing ${operations.length} content records`);
        // Since we don't sync the item_contents table, we need to destroy the records permanently
        const deleteOperations = operations.map((content) => content.prepareDestroyPermanently());
        await this.database!.batch(...deleteOperations);
      } else {
        console.log(`${LOG_PREFIX} No content to clean up`);
      }
    });
  }

  /**
   * Check if content sync is currently running
   */
  isRunning(): boolean {
    return this.currentSyncPromise !== null;
  }
}
