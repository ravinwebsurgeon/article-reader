import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { SyncEngine } from "../sync/SyncEngine";
import database from "@/database";

export const SyncContext = React.createContext<{
  syncEngine: SyncEngine | null;
  isReady: boolean;
}>({
  syncEngine: null,
  isReady: false,
});

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [currentEngine, setCurrentEngine] = useState<SyncEngine | null>(null);
  const { token, isAuthenticated } = useAuthStore();

  // Manage SyncEngine lifecycle with bulletproof cleanup
  useEffect(() => {
    let isMounted = true;

    const setupSyncEngine = async () => {
      // Only create engine if we have valid auth
      if (!isAuthenticated || !token) {
        setIsReady(false);
        return;
      }

      try {
        console.log("[SyncProvider] Creating new SyncEngine instance");
        const newEngine = new SyncEngine(database, token);

        // Only proceed if component is still mounted
        if (isMounted) {
          setCurrentEngine(newEngine);
          setIsReady(true);
          console.log("[SyncProvider] SyncEngine ready");
        } else {
          // Component unmounted during setup - cleanup immediately
          console.log("[SyncProvider] Component unmounted during setup - cleaning up");
          newEngine.cleanup();
        }
      } catch (error) {
        console.error("[SyncProvider] Failed to create SyncEngine:", error);
        if (isMounted) {
          setIsReady(false);
        }
      }
    };

    const cleanupCurrentEngine = async () => {
      if (currentEngine) {
        console.log("[SyncProvider] Cleaning up existing SyncEngine");
        try {
          currentEngine.cleanup();
        } catch (error) {
          console.error("[SyncProvider] Error during SyncEngine cleanup:", error);
        }
        setCurrentEngine(null);
      }
      setIsReady(false);
    };

    // Cleanup existing engine before creating new one
    cleanupCurrentEngine().then(() => {
      if (isMounted) {
        setupSyncEngine();
      }
    });

    return () => {
      isMounted = false;
      if (currentEngine) {
        console.log("[SyncProvider] Component unmounting - cleaning up SyncEngine");
        currentEngine.cleanup();
      }
    };
  }, [isAuthenticated, token]); // Recreate when auth state changes

  return (
    <SyncContext.Provider value={{ syncEngine: currentEngine, isReady }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = React.useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  if (!context.syncEngine) {
    throw new Error("SyncEngine not ready - components should not render until app is ready");
  }
  return {
    syncEngine: context.syncEngine,
    isReady: context.isReady,
  };
};

export const useSyncReady = () => {
  const context = React.useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncReady must be used within a SyncProvider");
  }
  return context.isReady;
};
