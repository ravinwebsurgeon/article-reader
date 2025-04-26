import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import Item from '../models/ItemModel';
import database from '../database';
import { ItemFilter } from '@/types/item';

const itemsCollection = database.collections.get<Item>('items');

// Create a new item
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

// Delete an item
export const deleteItem = async (item: Item) => {
  return database.write(async () => {
    await item.markAsDeleted();
  });
};

// Search items
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

// HOC to observe a single item
export const withItem = (id: string) => {
  return withObservables(['id'], () => ({
    item: itemsCollection.findAndObserve(id),
  }));
};

interface WithItemsProps {
  filter?: ItemFilter;
}

// HOC to observe items with a filter
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
        Q.unsafeSqlQuery(
          'SELECT items.* FROM items JOIN item_tags ON items.id = item_tags.item_id ORDER BY items.id DESC'
        )
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

// HOC to observe search results
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
