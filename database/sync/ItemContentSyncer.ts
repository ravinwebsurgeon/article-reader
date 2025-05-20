import { Database, Model, Q } from "@nozbe/watermelondb";
import Constants from "expo-constants";
import Item from "../models/ItemModel";
import ItemContent from "../models/ItemContentModel";

// Constants
const API_URL = Constants.expoConfig?.extra?.apiUrl || "https://api.pckt.dev/v4";
const BATCH_SIZE = 50;
const LOG_PREFIX = "[ItemContentSync]";

/**
 * Main function to run the item content synchronization process
 */
export async function syncItemContent(
  database: Database | null,
  token: string | null,
): Promise<void> {
  if (!database || !token) {
    console.warn(`${LOG_PREFIX} Database or token not available. Skipping content sync.`);
    return;
  }

  const startTime = Date.now();
  console.log(`${LOG_PREFIX} Starting content sync...`);

  try {
    // 1. Find items that need content (have content_hash but no content)
    const itemsNeedingContent = await database
      .get<Item>("items")
      .query(
        Q.unsafeSqlQuery(
          `SELECT items.* FROM items 
           LEFT JOIN item_contents ON item_contents.item_id = items.id 
           WHERE items.content_hash IS NOT NULL 
           AND items.content_hash != ''
           AND item_contents.id IS NULL`,
        ),
      )
      .fetch();

    // 2. If items need content, fetch and store it
    if (itemsNeedingContent.length > 0) {
      console.log(`${LOG_PREFIX} Found ${itemsNeedingContent.length} items requiring content.`);
      await fetchAndStoreContent(database, token, itemsNeedingContent);
    } else {
      console.log(`${LOG_PREFIX} No items require content sync.`);
    }

    // 3. Clean up with a single efficient query
    await cleanupDatabase(database);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`${LOG_PREFIX} Sync completed in ${duration}s.`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error during content sync:`, error);
  }
}

/**
 * Fetch content from the API and store it in the database
 */
async function fetchAndStoreContent(
  database: Database,
  token: string,
  items: Item[],
): Promise<void> {
  if (items.length === 0) return;

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
          "Authorization": `Bearer ${token}`,
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
        await database.write(async () => {
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

              const item = itemMap.get(id);
              if (!item) continue;

              // Find and mark existing content as deleted
              const existingContents = await item.itemContentQuery.fetch();
              existingContents.forEach((content) =>
                operations.push(content.prepareMarkAsDeleted()),
              );

              // Create new content
              operations.push(
                database.get<ItemContent>("item_contents").prepareCreate((newContent) => {
                  newContent.item.set(item);
                  newContent.content = content;
                  newContent.contentHash = serverContentHash;

                  if (takeaways !== undefined) newContent.takeaways = takeaways;
                  if (description !== undefined) newContent.description = description;
                  if (dek !== undefined) newContent.dek = dek;
                  if (author !== undefined) newContent.author = author;
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
              console.error(
                `${LOG_PREFIX} Failed to process content for item ${JSON.parse(line).id}:`,
                error,
              );
            }
          }

          if (operations.length > 0) {
            await database.batch(...operations);
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
 * Efficient cleanup with simple queries
 */
async function cleanupDatabase(database: Database): Promise<void> {
  console.log(`${LOG_PREFIX} Starting database cleanup...`);
  await database.write(async () => {
    // 1. Delete content for items with null/empty content_hash in one query
    const contentForItemsWithoutHash = await database
      .get<ItemContent>("item_contents")
      .query(Q.on("items", Q.or(Q.where("content_hash", null), Q.where("content_hash", ""))))
      .fetch();

    // 2. Find orphaned content (where item doesn't exist)
    const orphanedContent = await database
      .get<ItemContent>("item_contents")
      .query(
        Q.unsafeSqlQuery(
          `SELECT item_contents.* FROM item_contents 
           LEFT JOIN items ON items.id = item_contents.item_id 
           WHERE items.id IS NULL`,
        ),
      )
      .fetch();

    // Combine all deletions in one batch operation
    const operations = [
      ...contentForItemsWithoutHash.map((content) => content.prepareMarkAsDeleted()),
      ...orphanedContent.map((content) => content.prepareMarkAsDeleted()),
    ];

    if (operations.length > 0) {
      console.log(
        `${LOG_PREFIX} Cleaning up ${operations.length} content records (${contentForItemsWithoutHash.length} without hash, ${orphanedContent.length} orphaned)`,
      );
      await database.batch(...operations);
    } else {
      console.log(`${LOG_PREFIX} No content records to clean up`);
    }
  });
}
