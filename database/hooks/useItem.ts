// src/database/hooks/useItem.ts
import { useEffect, useState } from 'react';
import { useItemsCollection } from './useItemCollections';
import { ItemModel } from '../models';

/**
 * Hook to fetch a single item by ID
 */
export const useItem = (id: string) => {
  const itemsCollection = useItemsCollection();
  const [item, setItem] = useState<ItemModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadItem = async () => {
      try {
        setLoading(true);
        const result = await itemsCollection.find(id);
        setItem(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadItem();
    }
  }, [itemsCollection, id]);
  
  return { item, loading, error };
};