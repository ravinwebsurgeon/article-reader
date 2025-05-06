import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { map } from 'rxjs/operators';
import Item from '../models/ItemModel';
import database from '../database';
import { ItemFilter } from '@/types/item';
import { SortOption } from '@/components/common/menu/SortMenu';
import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';

/**
 * Access to the items collection in the WatermelonDB database
 */
const itemsCollection = database.collections.get<Item>('items');

/**
 * Creates a new item in the database with the provided URL
 * @param url - The URL to be saved
 * @returns The newly created Item instance
 */
export const createItem = async (url: string) => {
  return database.write(async () => {
    const newItem = await itemsCollection.create((item) => {
      item.url = url;
      item.savedAt = new Date();
      item.archived = false;
      item.favorite = false;
      item.progress = 0;
    });
    return newItem;
  });
};

/**
 * Marks an item as deleted in the database
 * @param item - The Item instance to delete
 */
export const deleteItem = async (item: Item) => {
  return database.write(async () => {
    await item.markAsDeleted();
  });
};

/**
 * Creates a reactive subscription to a single item by ID
 * @param id - Item ID to observe
 * @returns A function that provides the item as a prop to components
 */
export const withItem = (id: string) => {
  return withObservables(['id'], () => ({
    item: itemsCollection.findAndObserve(id),
  }));
};

interface WithItemsProps {
  filter?: ItemFilter;
  sorted?: SortOption;
}

/**
 * Creates a reactive subscription to a filtered list of items
 * @param filter - Optional filter type to apply ('all', 'favorites', 'archived', etc.)
 * @returns A function that provides the filtered items as props to components
 */
export const withItems = ({ filter = 'all', sorted = 'newest' }: WithItemsProps = {}) => {
  const sort = sorted === 'newest' ? Q.desc : Q.asc;
  
  return withObservables(['filter'], () => {
    let query;

    if (filter === 'favorites') {
      query = itemsCollection.query(
        Q.where('favorite', true),
        Q.where('archived', false),
        Q.sortBy('created_at', sort),
      );
    } else if (filter === 'archived') {
      query = itemsCollection.query(Q.where('archived', true), Q.sortBy('created_at', sort));
    } else if (filter === 'tagged') {
      query = itemsCollection.query(
        Q.where('archived', false),
        Q.experimentalJoinTables(['item_tags']),
        Q.on('item_tags', Q.where('tag_id', Q.notEq(null))),
        Q.sortBy('created_at', sort),
      );
    } else if (filter === 'short') {
      query = itemsCollection.query(
        // 260wpm * 4min = 1040 words
        Q.where('word_count', Q.lte(1040)),
        Q.where('archived', false),
        Q.sortBy('created_at', sort),
      );
    } else if (filter === 'long') {
      query = itemsCollection.query(
        // 260wpm * 10min = 2600 words
        Q.where('word_count', Q.gte(2600)),
        Q.where('archived', false),
        Q.sortBy('created_at', sort),
      );
    } else {
      // Default to unarchived items
      query = itemsCollection.query(Q.where('archived', false), Q.sortBy('created_at', sort));
    }

    return {
      items: query.observe(),
    };
  });
};

export function useItems({
  filter = 'all',
  sorted = 'newest',
}: {
  filter: ItemFilter;
  sorted: SortOption;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const sortOrder = sorted === 'newest' ? Q.desc : Q.asc;
    let query = database.collections
      .get<Item>('items')
      .query(Q.where('archived', false), Q.sortBy('created_at', sortOrder));

    // apply the extra filter clauses
    switch (filter) {
      case 'favorites':
        query = database.collections
          .get<Item>('items')
          .query(
            Q.where('favorite', true),
            Q.where('archived', false),
            Q.sortBy('created_at', sortOrder),
          );
        break;

      case 'archived':
        query = database.collections
          .get<Item>('items')
          .query(Q.where('archived', true), Q.sortBy('created_at', sortOrder));
        break;

      case 'tagged':
        query = database.collections
          .get<Item>('items')
          .query(
            Q.where('archived', false),
            Q.experimentalJoinTables(['item_tags']),
            Q.on('item_tags', Q.where('tag_id', Q.notEq(null))),
            Q.sortBy('created_at', sortOrder),
          );
        break;

      case 'short':
        query = database.collections
          .get<Item>('items')
          .query(
            Q.where('word_count', Q.lte(1040)),
            Q.where('archived', false),
            Q.sortBy('created_at', sortOrder),
          );
        break;

      case 'long':
        query = database.collections
          .get<Item>('items')
          .query(
            Q.where('word_count', Q.gte(2600)),
            Q.where('archived', false),
            Q.sortBy('created_at', sortOrder),
          );
        break;

      case 'all':
      default:
        // already defaulted above
        break;
    }

    console.time('Items.observe()');
    const subscription: Subscription = query.observe().subscribe((freshItems) => {
      console.timeEnd('Items.observe()');
      console.log('[useItems] got items:', freshItems);
      setItems(freshItems);
      setLoading(false);

    });

    // cleanup on unmount / deps change
    return () => {
      subscription.unsubscribe();
      setLoading(false);
    };
  }, [filter, sorted]);

  return {items, loading};
}

interface WithSearchProps {
  query?: string;
}

/**
 * Creates a reactive subscription to search results
 * @param query - Optional search term to filter items
 * @returns A function that provides the search results as props to components
 */
export const withSearch = ({ query }: WithSearchProps = {}) => {
  return withObservables(['query'], ({ query: searchQuery }: { query?: string }) => {
    const searchInput = searchQuery || '';

    if (!searchInput.trim()) {
      return {
        items: itemsCollection.query(Q.sortBy('id', Q.desc)).observe(),
      };
    }

    // Split the query into individual words
    const searchTerms = searchInput
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    // For each term, create a condition that checks if it exists in any field
    const termConditions = searchTerms.map((term) =>
      Q.or(
        Q.where('title', Q.like(`%${term}%`)),
        Q.where('description', Q.like(`%${term}%`)),
        Q.where('url', Q.like(`%${term}%`)),
        Q.where('site_name', Q.like(`%${term}%`)),
      ),
    );

    // Use Q.and to require that ALL terms are present (can be across different fields)
    const searchCondition =
      termConditions.length === 1
        ? termConditions[0] // Just use the single condition if only one term
        : Q.and(...termConditions); // Require all terms to be present

    return {
      items: itemsCollection
        .query(searchCondition)
        .observe()
        .pipe(
          map((results: Item[]) => {
            if (results.length === 0) return results;

            // Create a scoring function to avoid repeated string operations
            const getFieldScore = (field: string, term: string): number => {
              if (!field.includes(term)) return 0;

              let score = 0;
              // Core match score
              score += field === term ? 150 : 100;
              // Starting with term is valuable
              score += field.startsWith(term) ? 25 : 0;

              return score;
            };

            // Calculate thirtyDaysAgo once outside the loop
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const scoredResults = results.map((item: Item) => {
              // Extract and lowercase text fields only once
              const title = (item.title || '').toLowerCase();
              const description = (item.description || '').toLowerCase();
              const url = (item.url || '').toLowerCase();
              const siteName = (item.siteName || '').toLowerCase();

              // Track matched terms for multiplier calculation
              const matchedTerms = new Set<string>();
              let totalScore = 0;

              // Calculate score for each search term
              for (const term of searchTerms) {
                // Title (highest weight)
                const titleScore = getFieldScore(title, term);
                if (titleScore > 0) {
                  totalScore += titleScore;
                  matchedTerms.add(term);
                }

                // Description (medium weight)
                const descScore = description.includes(term) ? 50 : 0;
                if (descScore > 0) {
                  totalScore += descScore;
                  matchedTerms.add(term);
                }

                // URL (lower weight)
                if (url.includes(term)) {
                  totalScore += 30;
                  matchedTerms.add(term);
                  // Domain match bonus
                  if (url.replace(/https?:\/\/(www\.)?/, '').startsWith(term)) {
                    totalScore += 15;
                  }
                }

                // Site name
                const siteScore = getFieldScore(siteName, term) * 0.4; // 40% weight of title
                if (siteScore > 0) {
                  totalScore += siteScore;
                  matchedTerms.add(term);
                }
              }

              // Add recency boost for items saved in the last 30 days
              if (item.savedAt > thirtyDaysAgo) {
                // Calculate how recent the item is (0-1 scale, 1 being newest)
                const ageInDays = (Date.now() - item.savedAt.getTime()) / (1000 * 60 * 60 * 24);
                const recencyFactor = Math.max(0, (30 - ageInDays) / 30);

                // Apply boost: up to 75 points for very recent items, gradually decreasing
                const recencyBoost = 75 * recencyFactor;
                totalScore += recencyBoost;
              }

              return { item, score: totalScore };
            });

            // Sort by score (descending) and extract items
            return scoredResults
              .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
              .map((result: { item: Item }) => result.item);
          }),
        ),
    };
  });
};
