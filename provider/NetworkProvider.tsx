import React, { ReactNode, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch } from 'react-redux';
import { networkStatusChanged } from '@/redux/slices/networkSlice';

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Provider that monitors network connectivity and dispatches Redux actions
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initial network check
    const checkNetworkInitially = async () => {
      const networkState = await NetInfo.fetch();
      dispatch(
        networkStatusChanged({
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
        })
      );
    };

    checkNetworkInitially();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch(
        networkStatusChanged({
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
        })
      );
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default NetworkProvider;
