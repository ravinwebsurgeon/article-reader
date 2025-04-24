import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';
import Constants from 'expo-constants';

// API URL from environment
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.pckt.dev/v4';

class SyncEngine {
  private database: Database;
  private token: string | null = null;
  
  constructor(database: Database) {
    this.database = database;
  }
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  async sync() {
    if (!this.token) {
      throw new Error('Authentication token not set');
    }
    
    try {
      await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt }) => {
          const response = await fetch(`${API_URL}/sync?lastPulledAt=${lastPulledAt || 0}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Pull changes failed: ${response.status}`);
          }
          
          const { changes, timestamp } = await response.json();
          return { changes, timestamp };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          const response = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              changes,
              lastPulledAt,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Push changes failed: ${errorData.message}`);
          }
        },
        migrationsEnabledAtVersion: 1,
      });
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const syncEngine = new SyncEngine(null as any); // Will be set by DatabaseProvider
