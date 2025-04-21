// src/database/provider/DatabaseProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { Database } from '@nozbe/watermelondb';
import database from '../database';

// Create context
interface DatabaseContextType {
  database: Database;
}

export const DatabaseContext = createContext<DatabaseContextType | null>(null);

// Provider props
interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes database instance available to any
 * child component that calls useDatabase().
 */
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  return (
    <DatabaseContext.Provider value={{ database }}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Custom hook for components to get the database context
 */
export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};