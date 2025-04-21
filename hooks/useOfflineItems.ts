// src/hooks/useOfflineItems.ts
import { useState, useEffect } from 'react';
import { useGetItemsQuery } from '@/redux/services/itemsApi';
import { useAppSelector } from '@/redux/hook';
import { useItems } from '@/database/hooks/useItems';
import { itemActions } from '@/database/actions';
import { syncEngine } from '@/database/sync/SyncEngine';
import { useNetworkStatus } from '@/utils/hooks';

/**
 * Custom hook that combines API and database data for a seamless offline-first experience
 */
export const useOfflineItems = ({
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
  // Get network status
  const { isConnected } = useNetworkStatus();
  
  // Get auth state
  const token = useAppSelector(state => state.auth.token);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  
  // Query options
  const queryParams = { favorite, archived, search, limit };
  
  // Get data from API (only when online)
  const { 
    data: apiData, 
    isLoading: apiLoading, 
    error: apiError,
    refetch 
  } = useGetItemsQuery(queryParams, {
    // Only fetch from API if online and authenticated
    skip: !isConnected || !isAuthenticated,
  });
  
  // Get data from database
  const { 
    items: dbItems, 
    loading: dbLoading, 
    error: dbError 
  } = useItems(queryParams);
  
  // Combined loading state
  const isLoading = apiLoading || dbLoading;
  
  // Combined error state
  const error = apiError || dbError;
  
  // Sync data from API to database when API data changes
  useEffect(() => {
    const syncApiToDatabase = async () => {
      if (apiData?.items && isConnected && token) {
        // For each item from the API, create or update in database
        for (const apiItem of apiData.items) {
          try {
            // Check if item exists in database
            const localItems = await itemActions.getItems({
              remoteId: apiItem.id.toString(),
            });
            
            if (localItems.length === 0) {
              // Create new item
              await itemActions.createItem({
                title: apiItem.title,
                content: apiItem.content || '',
                url: apiItem.url || '',
                favorite: apiItem.favorite || false,
                archived: apiItem.archived || false,
                remoteId: apiItem.id.toString(),
                userId: apiItem.user_id.toString(),
                synced: true, // Mark as synced since it came from API
              });
            } else {
              // Update existing item
              await itemActions.updateItem(localItems[0].id, {
                title: apiItem.title,
                content: apiItem.content || '',
                url: apiItem.url || '',
                favorite: apiItem.favorite || false,
                archived: apiItem.archived || false,
                synced: true, // Mark as synced since it came from API
              });
            }
          } catch (error) {
            console.error('Error syncing item to database:', error);
          }
        }
      }
    };
    
    syncApiToDatabase();
  }, [apiData, isConnected, token]);
  
  // Trigger sync when coming back online
  useEffect(() => {
    if (isConnected && token) {
      syncEngine.sync().catch(error => {
        console.error('Sync failed in useOfflineItems hook:', error);
      });
    }
  }, [isConnected, token]);
  
  // Helper functions for manipulating items
  const toggleFavorite = async (id: string) => {
    try {
      // First update in database
      await itemActions.toggleFavorite(id);
      
      // If online, refetch from API
      if (isConnected) {
        refetch();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  const toggleArchive = async (id: string) => {
    try {
      // First update in database
      await itemActions.toggleArchive(id);
      
      // If online, refetch from API
      if (isConnected) {
        refetch();
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };
  
  const deleteItem = async (id: string) => {
    try {
      // First delete in database
      await itemActions.deleteItem(id);
      
      // If online, refetch from API
      if (isConnected) {
        refetch();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  
  // Return data from database as the source of truth
  return {
    items: dbItems,
    isLoading,
    error,
    isOnline: isConnected,
    toggleFavorite,
    toggleArchive,
    deleteItem,
    refetch: async () => {
      if (isConnected) {
        return await refetch();
      }
    }
  };
};