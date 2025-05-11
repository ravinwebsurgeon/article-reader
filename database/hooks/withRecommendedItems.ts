import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import Item from "../models/ItemModel";
import { switchMap, map } from "rxjs/operators";
import { combineLatest, of as of$ } from "rxjs";

interface RecommendedItemsProps {
  currentItem: Item;
  limit?: number;
}

/**
 * Creates a reactive subscription to recommended articles (Up Next) based on the current item
 * Uses a multi-factor scoring system to find the most relevant items:
 * 1. Same domain (site) - highest priority
 * 2. Tagged with the same tags - second priority
 * 3. Not archived and not the current item
 *
 * @param props - The props containing the current item and optional limit
 * @returns A function that provides the recommended items as props to components
 */
export const withRecommendedItems = ({ currentItem, limit = 3 }: RecommendedItemsProps) => {
  return withObservables(["currentItem"], () => {
    const itemsCollection = currentItem.database.collections.get<Item>("items");

    // Get the current item's domain
    const currentDomain = currentItem.domain;

    // Build the base query conditions
    const baseConditions = [Q.where("id", Q.notEq(currentItem.id)), Q.where("archived", false)];

    // Add domain condition if available
    if (currentDomain) {
      baseConditions.push(Q.where("domain", Q.eq(currentDomain)));
    }

    // Get items with similar tags
    const similarTagItems = currentItem.itemTags.observe().pipe(
      switchMap(async (itemTags) => {
        if (!itemTags || itemTags.length === 0) {
          return [];
        }

        // Get the tag IDs from the current item's tags
        const tagIds = await Promise.all(
          itemTags.map(async (itemTag) => {
            const tag = await itemTag.tag.fetch();
            return tag.id;
          }),
        );

        // Query for items with any of these tags
        return itemsCollection
          .query(
            ...baseConditions,
            Q.experimentalJoinTables(["item_tags"]),
            Q.on("item_tags", "tag_id", Q.oneOf(tagIds)),
            Q.sortBy("published_at", Q.desc),
            Q.take(limit),
          )
          .fetch();
      }),
    );

    // Get items from the same domain
    const sameDomainItems = currentDomain
      ? itemsCollection
          .query(
            ...baseConditions,
            Q.where("domain", Q.eq(currentDomain)),
            Q.sortBy("published_at", Q.desc),
            Q.take(limit),
          )
          .observe()
      : of$([]);

    // Combine both queries and deduplicate results
    const recommendedItems = combineLatest([sameDomainItems, similarTagItems]).pipe(
      map(([domainItems, tagItems]) => {
        const seen = new Set();
        const results = [];

        // Add domain items first (higher priority)
        for (const item of domainItems) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            results.push(item);
          }
        }

        // Add tag items if we haven't reached the limit
        for (const item of tagItems) {
          if (!seen.has(item.id) && results.length < limit) {
            seen.add(item.id);
            results.push(item);
          }
        }

        return results;
      }),
    );

    return {
      recommendedItems,
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
