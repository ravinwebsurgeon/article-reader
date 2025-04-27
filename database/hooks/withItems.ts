import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import Item from '../models/ItemModel';
import database from '../database';
import { ItemFilter } from '@/types/item';

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
 * Searches for items matching the provided query
 * @param query - Search term to find in item fields
 * @returns Promise resolving to matching items
 */
export const searchItems = (query: string) => {
  const searchTerm = query.toLowerCase();

  return itemsCollection
    .query(
      Q.or(
        Q.where('title', Q.like(`%${searchTerm}%`)),
        Q.where('description', Q.like(`%${searchTerm}%`)),
        Q.where('url', Q.like(`%${searchTerm}%`)),
        Q.where('site_name', Q.like(`%${searchTerm}%`))
      )
    )
    .fetch();
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
}

/**
 * Creates a reactive subscription to a filtered list of items
 * @param filter - Optional filter type to apply ('all', 'favorites', 'archived', etc.)
 * @returns A function that provides the filtered items as props to components
 */
export const withItems = ({ filter = 'all' }: WithItemsProps = {}) => {
  return withObservables(['filter'], () => {
    let query;

    if (filter === 'favorites') {
      query = itemsCollection.query(
        Q.where('favorite', true),
        Q.where('archived', false),
        Q.sortBy('id', Q.desc)
      );
    } else if (filter === 'archived') {
      query = itemsCollection.query(Q.where('archived', true), Q.sortBy('id', Q.desc));
    } else if (filter === 'tagged') {
      query = itemsCollection.query(
        Q.where('archived', false),
        Q.experimentalJoinTables(['item_tags']),
        Q.on('item_tags', Q.where('tag_id', Q.notEq(null))),
        Q.sortBy('id', Q.desc)
      );
    } else if (filter === 'short') {
      query = itemsCollection.query(
        Q.where('word_count', Q.lte(800)),
        Q.where('archived', false),
        Q.sortBy('id', Q.desc)
      );
    } else if (filter === 'long') {
      query = itemsCollection.query(
        Q.where('word_count', Q.gt(800)),
        Q.where('archived', false),
        Q.sortBy('id', Q.desc)
      );
    } else {
      // Default to unarchived items
      query = itemsCollection.query(Q.where('archived', false), Q.sortBy('id', Q.desc));
    }

    return {
      items: query.observe(),
    };
  });
};

interface WithSearchProps {
  query?: string;
}

/**
 * Creates a reactive subscription to search results
 * @param query - Optional search term to filter items
 * @returns A function that provides the search results as props to components
 */
export const withSearch = ({ query }: WithSearchProps = {}) => {
  return withObservables(['query'], ({ query }: { query?: string }) => {
    const searchTerm = (query || '').toLowerCase();

    return {
      items: itemsCollection
        .query(
          Q.or(
            Q.where('title', Q.like(`%${searchTerm}%`)),
            Q.where('description', Q.like(`%${searchTerm}%`)),
            Q.where('url', Q.like(`%${searchTerm}%`)),
            Q.where('site_name', Q.like(`%${searchTerm}%`))
          )
        )
        .observe(),
    };
  });
};
