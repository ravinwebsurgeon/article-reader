import { Database, Model, Q } from "@nozbe/watermelondb";
import Constants from "expo-constants";
import Item from "../models/ItemModel";
import ItemContent from "../models/ItemContentModel";

// Constants
const API_URL = Constants.expoConfig?.extra?.apiUrl || "https://api.savewithfolio.com/v4";
const BATCH_SIZE = 50;
const LOG_PREFIX = "[ItemContentSync]";

/**
 * ItemContentSyncer handles the synchronization of item content from the API.
 * It ensures that only one sync operation runs at a time and provides
 * functionality to retry sync if a request comes in while syncing.
 */
export default class ItemContentSyncer {
  // The WatermelonDB database instance
  public database: Database | null = null;
  // Authentication token for API requests
  public token: string | null = null;
  // Flag indicating if a synchronization operation is currently active
  private isSyncing: boolean = false;
  // Flag indicating if a sync was requested while one was already in progress
  private pendingSync: boolean = false;

  /**
   * Sync content for a specific item by ID
   * @param itemId The ID of the item to sync content for
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
   * Main method to run the item content synchronization process.
   * If a sync is already in progress, it will mark for a retry after
   * the current sync completes.
   * @param includeArchived Whether to include archived items in sync (default: false)
   */
  async sync(includeArchived: boolean = false): Promise<void> {
    if (this.isSyncing) {
      console.log(`${LOG_PREFIX} Already syncing content, marking for retry.`);
      this.pendingSync = true;
      return;
    }

    if (!this.database || !this.token) {
      console.warn(`${LOG_PREFIX} Database or token not available. Skipping content sync.`);
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();
    console.log(`${LOG_PREFIX} Starting content sync...`);

    try {
      await this._syncInternal(includeArchived);
      const duration = (Date.now() - startTime) / 1000;
      console.log(`${LOG_PREFIX} Sync completed in ${duration}s.`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error during content sync:`, error);
    } finally {
      this.isSyncing = false;

      // If another sync was requested while syncing, perform one more sync
      if (this.pendingSync) {
        console.log(`${LOG_PREFIX} Performing pending content sync.`);
        this.pendingSync = false;
        // Trigger another sync, but don't await it (non-blocking)
        this.sync().catch((error) => {
          console.error(`${LOG_PREFIX} Error during pending sync:`, error);
        });
      }
    }
  }

  /**
   * Internal implementation of the sync process
   * @param includeArchived Whether to include archived items in sync
   */
  private async _syncInternal(includeArchived: boolean = false): Promise<void> {
    if (!this.database || !this.token) return;

    // 1. Find items that need content (have content_hash but no content)
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

    // Filter to items that need content (no content OR content hash mismatch)
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

    // Sort the results
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
    console.log("itemsNeedingContent", itemsNeedingContent);
    // 2. If items need content, fetch and store it
    if (itemsNeedingContent.length > 0) {
      console.log(`${LOG_PREFIX} Found ${itemsNeedingContent.length} items requiring content.`);
      await this.fetchAndStoreContent(itemsNeedingContent);
    } else {
      console.log(`${LOG_PREFIX} No items require content sync.`);
    }

    // 3. Clean up with a single efficient query
    await this.cleanupDatabase();
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
}
