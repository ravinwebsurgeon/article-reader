import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import Item from "../models/ItemModel";

/**
 * Creates a reactive subscription to recommended articles (Up Next) based on the current item
 *
 * @param currentItem - The current item being viewed
 * @param limit - Maximum number of items to fetch (default: 3)
 * @returns A function that provides the recommended items as props to components
 */
export const withRecommendedItems = (currentItem: Item, limit: number = 3) => {
  return withObservables(["currentItem"], () => {
    const itemsCollection = currentItem.database.collections.get<Item>("items");

    // Strategy to find related items based on various signals
    // 1. Same domain (site) - highest priority
    // 2. Tagged with the same tags - second priority
    // 3. Not archived and not the current item

    // Get the current item's tags
    const currentItemTags = currentItem.tags;

    // Query for similar items
    const query = itemsCollection.query(
      // Not the current item
      Q.where("id", Q.notEq(currentItem.id)),
      // Not archived
      Q.where("archived", false),
      // Sort by relevance priority
      Q.sortBy("site_name", Q.desc), // Same site first
      Q.sortBy("published_at", Q.desc), // Then by recency
      Q.sortBy("id", Q.desc), // Finally by ID (newest first)
      // Limit results
      Q.take(limit),
    );

    return {
      recommendedItems: query.observe(),
    };
  });
};

/**
 * Creates a reactive subscription to recommended articles (Up Next) based on domain similarity
 *
 * @param currentItem - The current item being viewed
 * @param limit - Maximum number of items to fetch (default: 3)
 * @returns A function that provides the recommended items as props to components
 */
export const withSimilarDomainItems = (currentItem: Item, limit: number = 3) => {
  return withObservables(["currentItem"], () => {
    const itemsCollection = currentItem.database.collections.get<Item>("items");

    // Get the domain of the current item
    const currentDomain = currentItem.domain;

    // Query for items from the same domain
    const query = itemsCollection.query(
      // Not the current item
      Q.where("id", Q.notEq(currentItem.id)),
      // Not archived
      Q.where("archived", false),
      // From the same domain (if available)
      ...(currentDomain ? [Q.where("domain", Q.eq(currentDomain))] : []),
      // Sort by recency
      Q.sortBy("published_at", Q.desc),
      // Limit results
      Q.take(limit),
    );

    return {
      similarDomainItems: query.observe(),
    };
  });
};

/**
 * Creates a reactive subscription to recommended articles (Up Next) based on tag similarity
 *
 * @param currentItem - The current item being viewed
 * @param limit - Maximum number of items to fetch (default: 3)
 * @returns A function that provides the recommended items as props to components
 */
export const withSimilarTagItems = (currentItem: Item, limit: number = 3) => {
  return withObservables(["currentItem"], () => {
    const itemsCollection = currentItem.database.collections.get<Item>("items");

    // Query for items with similar tags
    const query = itemsCollection.query(
      // Not the current item
      Q.where("id", Q.notEq(currentItem.id)),
      // Not archived
      Q.where("archived", false),
      // Has tags (join with item_tags)
      Q.experimentalJoinTables(["item_tags"]),
      // Only include items that have tags
      Q.on("item_tags", Q.where("tag_id", Q.notEq(null))),
      // Sort by recency
      Q.sortBy("published_at", Q.desc),
      // Limit results
      Q.take(limit),
    );

    return {
      similarTagItems: query.observe(),
    };
  });
};

/**
 * Creates a reactive subscription to unread articles (those with progress = 0)
 *
 * @param currentItem - The current item being viewed
 * @param limit - Maximum number of items to fetch (default: 3)
 * @returns A function that provides the unread items as props to components
 */
export const withUnreadItems = (currentItem: Item, limit: number = 3) => {
  return withObservables(["currentItem"], () => {
    const itemsCollection = currentItem.database.collections.get<Item>("items");

    // Query for unread items
    const query = itemsCollection.query(
      // Not archived
      Q.where("archived", false),
      // Not read yet (progress = 0)
      Q.where("progress", Q.eq(0)),
      // Sort by recency
      Q.sortBy("id", Q.desc),
      // Limit results
      Q.take(limit),
    );

    return {
      unreadItems: query.observe(),
    };
  });
};
