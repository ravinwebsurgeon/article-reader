import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  lastChecked: number | null;
}

const initialState: NetworkState = {
  isConnected: null,
  isInternetReachable: null,
  lastChecked: null,
};

const networkSlice = createSlice({
  name: "network",
  initialState,
  reducers: {
    networkStatusChanged(
      state,
      action: PayloadAction<{
        isConnected: boolean | null;
        isInternetReachable: boolean | null;
      }>,
    ) {
      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
      state.lastChecked = Date.now();
    },
  },
});

export const { networkStatusChanged } = networkSlice.actions;
export default networkSlice.reducer;
