import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

// Import reducers
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';

// Import API services
import { api } from "./services/api";
import { tokenRefreshMiddleware } from "./middleware/tokenRefresh";

// Persistence configuration
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "theme"], // Only persist these reducers
  blacklist: [api.reducerPath], // Don't persist API cache
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  [api.reducerPath]: api.reducer, // Add the API reducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  // Adding the api middleware enables caching, invalidation, polling, and other features
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability check
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(api.middleware)
      .concat(tokenRefreshMiddleware),
});

// Create persistor
export const persistor = persistStore(store);

// Required for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export typed hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
