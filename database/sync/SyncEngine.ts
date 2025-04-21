// src/database/sync/SyncEngine.ts
import { synchronize } from '@nozbe/watermelondb/sync';
import database from '../database';
import { RootState } from '@/redux/store';
import { selectAuthToken } from '@/redux/utils';
import Constants from 'expo-constants';
import { ItemModel } from '../models/ItemModel';

// API URL from env
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.pckt.dev/v4';

/**
 * SyncEngine class to handle synchronization between WatermelonDB and the API
 */
export class SyncEngine {
  private token: string | null = null;
  private lastSyncTimestamp: number | null = null;
  
  constructor() {
    this.lastSyncTimestamp = null;
  }
  
  /**
   * Set auth token for API requests
   */
  setToken(token: string | null) {
    this.token = token;
  }
  
  /**
   * Main sync function
   */
  async sync() {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    
    try {
      // Get changes since last sync
      const timestamp = this.lastSyncTimestamp || 0;
      
      // Execute the sync
      await synchronize({
        database,
        pullChanges: async ({ lastPulledAt }) => {
          // Fetch changes from the server
          const response = await this.fetchChangesFromServer(lastPulledAt);
          
          // Return changes in the expected format
          return {
            changes: response.changes,
            timestamp: response.timestamp,
          };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          // Push local changes to server
          await this.pushChangesToServer(changes, lastPulledAt);
        },
        migrationsEnabledAtVersion: 1,
      });
      
      // Update the last sync timestamp
      this.lastSyncTimestamp = Date.now();
      
      return { success: true };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Fetch changes from the server
   */
  private async fetchChangesFromServer(lastPulledAt: number | null) {
    // Fetch data for each collection
    const timestamp = Date.now();
    
    // Format for API: convert lastPulledAt to ISO format if it exists
    const since = lastPulledAt ? new Date(lastPulledAt).toISOString() : undefined;
    
    // Fetch items
    const itemsResponse = await fetch(`${API_URL}/items${since ? `?since=${since}` : ''}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    
    const itemsData = await itemsResponse.json();
    
    // Map API response to WatermelonDB format
    const changes = {
      items: {
        created: itemsData.items.map(this.mapItemFromAPI),
        updated: [],
        deleted: [],
      },
      tags: {
        created: [],
        updated: [],
        deleted: [],
      },
      // Add other collections as needed
    };
    
    return { changes, timestamp };
  }
  
  /**
   * Push local changes to the server
   */
  private async pushChangesToServer(changes: any, lastPulledAt: number | null) {
    // Process created items
    for (const item of changes.items.created) {
      await this.createItemOnServer(item);
    }
    
    // Process updated items
    for (const item of changes.items.updated) {
      await this.updateItemOnServer(item);
    }
    
    // Process deleted items
    for (const itemId of changes.items.deleted) {
      await this.deleteItemOnServer(itemId);
    }
    
    // Process other collections similarly
  }
  
  /**
   * Map an item from API format to WatermelonDB format
   */
  private mapItemFromAPI(apiItem: any) {
    return {
      id: apiItem.id.toString(),
      title: apiItem.title,
      content: apiItem.content || '',
      url: apiItem.url || '',
      favorite: apiItem.favorite || false,
      archived: apiItem.archived || false,
      created_at: new Date(apiItem.created_at).getTime(),
      updated_at: new Date(apiItem.updated_at).getTime(),
      synced: true,
      remote_id: apiItem.id.toString(),
      user_id: apiItem.user_id.toString(),
    };
  }
  
  /**
   * Create an item on the server
   */
  private async createItemOnServer(item: any) {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        item: {
          title: item.title,
          content: item.content,
          url: item.url,
          favorite: item.favorite,
          archived: item.archived,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create item: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Update an item on the server
   */
  private async updateItemOnServer(item: any) {
    const remoteId = item.remote_id;
    
    if (!remoteId) {
      throw new Error('Cannot update item without remote ID');
    }
    
    const response = await fetch(`${API_URL}/items/${remoteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        item: {
          title: item.title,
          content: item.content,
          url: item.url,
          favorite: item.favorite,
          archived: item.archived,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update item: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Delete an item on the server
   */
  private async deleteItemOnServer(itemId: string) {
    // Find the item in the database to get its remote ID
    const itemsCollection = database.collections.get<ItemModel>('items');
    const item = await itemsCollection.find(itemId);
    const remoteId = item.remoteId;
    
    if (!remoteId) {
      throw new Error('Cannot delete item without remote ID');
    }
    
    const response = await fetch(`${API_URL}/items/${remoteId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.statusText}`);
    }
  }
}

// Create and export a singleton instance
export const syncEngine = new SyncEngine();

export default syncEngine;