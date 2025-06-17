import React, { ReactNode } from "react";

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Simple pass-through provider for network functionality.
 * Network state can be checked using Expo Network utilities when needed.
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  // Just pass through children - use Expo Network utilities where needed
  return <>{children}</>;
};

export default NetworkProvider;
