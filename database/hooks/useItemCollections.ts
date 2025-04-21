// src/database/hooks/useItemsCollection.ts
import { Collection } from '@nozbe/watermelondb';
import { ItemModel } from '../models';
import { useDatabase } from './useDatabase';

/**
 * Hook to access the items collection
 */
export const useItemsCollection = (): Collection<ItemModel> => {
  const database = useDatabase();
  return database.collections.get<ItemModel>('items');
};