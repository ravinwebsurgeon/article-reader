import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hook";
import { selectAuthToken } from "@/redux/utils";
import { syncEngine } from "../sync/SyncEngine";
import database from "../database";

// Set the database instance in the sync engine
syncEngine.database = database;

// Automatically sync changes from the database
syncEngine.watchForChanges();

// Create a context for database access
export const DatabaseContext = React.createContext<{
  database: typeof database;
  isReady: boolean;
}>({ database, isReady: false });

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const token = useAppSelector(selectAuthToken);

  // Initialize database
  useEffect(() => {
    const initialize = async () => {
      try {
        // Set token in sync engine if available
        if (token) {
          syncEngine.setToken(token);
        }
        setIsReady(true);
      } catch (err) {
        console.error("Database initialization error:", err);
        setError(err instanceof Error ? err : new Error("Unknown database error"));
        setIsReady(true); // Still set ready to true so the app can function offline
      }
    };

    initialize();
  }, [token]);

  // Update token in sync engine when it changes
  useEffect(() => {
    syncEngine.setToken(token);
  }, [token]);

  if (error) {
    console.warn("Database initialized with errors, continuing in offline mode");
  }

  return (
    <DatabaseContext.Provider value={{ database, isReady }}>{children}</DatabaseContext.Provider>
  );
};

// Hook to access the database
export const useDatabase = () => {
  const context = React.useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};
