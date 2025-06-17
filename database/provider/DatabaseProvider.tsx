import React, { useEffect, useState } from "react";
import database from "@/database";

// Create a context for database access
export const DatabaseContext = React.createContext<{
  database: typeof database;
  isReady: boolean;
}>({ database, isReady: false });

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize database
  useEffect(() => {
    const initialize = async () => {
      try {
        // Database initialization is now purely local
        setIsReady(true);
      } catch (err) {
        console.error("Database initialization error:", err);
        setError(err instanceof Error ? err : new Error("Unknown database error"));
        setIsReady(true); // Still set ready to true so the app can function offline
      }
    };

    initialize();
  }, []);

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

export const useDatabaseReady = () => {
  const context = React.useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabaseReady must be used within a DatabaseProvider");
  }
  return context.isReady;
};
