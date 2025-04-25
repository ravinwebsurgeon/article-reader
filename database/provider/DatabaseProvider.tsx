// src/database/provider/DatabaseProvider.tsx
import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hook';
import { selectAuthToken } from '@/redux/utils';
import { syncEngine } from '../sync/SyncEngine';
import { ActivityIndicator } from 'react-native';
import { ThemeView, ThemeText } from '@/components/core';
import { useTheme } from '@/theme/hooks';
import database from '../database';

// Set the database instance in the sync engine
syncEngine.database = database;

// Create a context for database access
export const DatabaseContext = React.createContext(database);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const token = useAppSelector(selectAuthToken);
  const theme = useTheme();

  // Initialize database and sync
  useEffect(() => {
    const initialize = async () => {
      try {
        // Set token in sync engine if available
        if (token) {
          syncEngine.setToken(token);

          // Perform initial sync
          await syncEngine.sync();
        }

        setIsReady(true);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err instanceof Error ? err : new Error('Unknown database error'));
        setIsReady(true); // Still set ready to true so the app can function offline
      }
    };

    initialize();
  }, [token]);

  // Update token in sync engine when it changes
  useEffect(() => {
    syncEngine.setToken(token);
  }, [token]);

  if (!isReady) {
    return (
      <ThemeView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <ThemeText style={{ marginTop: 16 }}>Initializing database...</ThemeText>
      </ThemeView>
    );
  }

  if (error) {
    console.warn('Database initialized with errors, continuing in offline mode');
  }

  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
};

// Hook to access the database
export const useDatabase = () => {
  const database = React.useContext(DatabaseContext);
  if (!database) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return database;
};
