// src/database/actions/itemActions.ts
import database from '../database';
import { Q } from '@nozbe/watermelondb';
import { ItemModel } from '../models';

/**
 * Database actions for items collection
 */
export const itemActions = {
  /**
   * Get all items with optional filtering
   */
  async getItems({
    favorite = null,
    archived = null,
    search = '',
    limit = 100,
  }: {
    favorite?: boolean | null;
    archived?: boolean | null;
    search?: string;
    limit?: number;
  } = {}) {
    const itemsCollection = database.collections.get<ItemModel>('items');
    
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
      
    return await query.fetch();
  },
  
  /**
   * Get a single item by ID
   */
  async getItem(id: string) {
    const itemsCollection = database.collections.get<ItemModel>('items');
    return await itemsCollection.find(id);
  },
  
  /**
   * Create a new item
   */
  async createItem({
    title,
    content = '',
    url = '',
    favorite = false,
    archived = false,
    userId,
  }: {
    title: string;
    content?: string;
    url?: string;
    favorite?: boolean;
    archived?: boolean;
    userId: string;
  }) {
    return await database.write(async () => {
      const itemsCollection = database.collections.get<ItemModel>('items');
      
      return await itemsCollection.create(item => {
        item.title = title;
        item.content = content;
        item.url = url;
        item.favorite = favorite;
        item.archived = archived;
        item.userId = userId;
        item.synced = false; // Mark as not synced with server
        item.createdAt = new Date();
        item.updatedAt = new Date();
      });
    });
  },
  
  /**
   * Update an existing item
   */
  async updateItem(id: string, data: Partial<{
    title: string;
    content: string;
    url: string;
    favorite: boolean;
    archived: boolean;
  }>) {
    return await database.write(async () => {
      const itemsCollection = database.collections.get<ItemModel>('items');
      const item = await itemsCollection.find(id);
      
      return await item.update(item => {
        if (data.title !== undefined) item.title = data.title;
        if (data.content !== undefined) item.content = data.content;
        if (data.url !== undefined) item.url = data.url;
        if (data.favorite !== undefined) item.favorite = data.favorite;
        if (data.archived !== undefined) item.archived = data.archived;
        item.synced = false; // Mark as not synced with server
        item.updatedAt = new Date();
      });
    });
  },
  
  /**
   * Delete an item
   */
  async deleteItem(id: string) {
    return await database.write(async () => {
      const itemsCollection = database.collections.get<ItemModel>('items');
      const item = await itemsCollection.find(id);
      return await item.markAsDeleted();
    });
  },
  
  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string) {
    return await database.write(async () => {
      const itemsCollection = database.collections.get<ItemModel>('items');
      const item = await itemsCollection.find(id);
      
      return await item.update(item => {
        item.favorite = !item.favorite;
        item.synced = false; // Mark as not synced with server
        item.updatedAt = new Date();
      });
    });
  },
  
  /**
   * Toggle archive status
   */
  async toggleArchive(id: string) {
    return await database.write(async () => {
      const itemsCollection = database.collections.get<ItemModel>('items');
      const item = await itemsCollection.find(id);
      
      return await item.update(item => {
        item.archived = !item.archived;
        item.synced = false; // Mark as not synced with server
        item.updatedAt = new Date();
      });
    });
  },
};



