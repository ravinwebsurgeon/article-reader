// src/database/actions/userActions.ts
import { Q } from '@nozbe/watermelondb';
import database from '../database';
import { UserModel } from '../models';

/**
 * Database actions for users collection
 */
export const userActions = {
  /**
   * Get current user
   */
  async getCurrentUser(remoteId: string) {
    const usersCollection = database.collections.get<UserModel>('users');
    const users = await usersCollection.query(Q.where('remote_id', remoteId)).fetch();
    
    return users.length > 0 ? users[0] : null;
  },
  
  /**
   * Create or update user
   */
  async createOrUpdateUser({
    remoteId,
    name,
    email,
    avatar,
  }: {
    remoteId: string;
    name: string;
    email: string;
    avatar?: string;
  }) {
    return await database.write(async () => {
      const usersCollection = database.collections.get<UserModel>('users');
      const users = await usersCollection.query(Q.where('remote_id', remoteId)).fetch();
      
      if (users.length > 0) {
        // Update existing user
        const user = users[0];
        return await user.update(user => {
          user.name = name;
          user.email = email;
          if (avatar) user.avatar = avatar;
          user.updatedAt = new Date();
        });
      } else {
        // Create new user
        return await usersCollection.create(user => {
          user.remoteId = remoteId;
          user.name = name;
          user.email = email;
          if (avatar) user.avatar = avatar;
          user.createdAt = new Date();
          user.updatedAt = new Date();
        });
      }
    });
  },
};