// src/database/hooks/useItems.ts
import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { useItemsCollection } from './useItemCollections';
import { ItemModel } from '../models';

/**
 * Hook to query items with filtering capabilities
 */
export const useItems = ({
  favorite = null,
  archived = null,
  search = '',
  limit = 100,
}: {
  favorite?: boolean | null;
  archived?: boolean | null;
  search?: string;
  limit?: number;
} = {}) => {
  const itemsCollection = useItemsCollection();
  const [items, setItems] = useState<ItemModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        
        // Build query conditions
        const conditions = [];
        
        if (favorite !== null) {
          conditions.push(Q.where('favorite', favorite));
        }
        
        if (archived !== null) {
          conditions.push(Q.where('archived', archived));
        }
        
        if (search) {
          conditions.push(
            Q.or(
              Q.where('title', Q.like(`%${search}%`)),
              Q.where('content', Q.like(`%${search}%`))
            )
          );
        }
        
        // Execute query
        const query = conditions.length > 0
          ? itemsCollection.query(...conditions, Q.take(limit))
          : itemsCollection.query(Q.take(limit));
          
        const results = await query.fetch();
        setItems(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadItems();
  }, [itemsCollection, favorite, archived, search, limit]);
  
  return { items, loading, error };
};