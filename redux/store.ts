import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { reduxStorage } from "@/utils/storage";
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
import authReducer from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";
import networkReducer from "./slices/networkSlice";

// Import API services
import { api } from "./services/api";
import { tokenRefreshMiddleware } from "./middleware/tokenRefresh";

// Persistence configuration
const persistConfig = {
  key: "root",
  storage: reduxStorage,
  whitelist: ["auth", "theme"], // Only persist these reducers
  blacklist: [api.reducerPath, "network"], // Don't persist API cache
};

const middlewares = [api.middleware, tokenRefreshMiddleware];

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  network: networkReducer,
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
    }).concat(middlewares),
});

// Create persistor
export const persistor = persistStore(store);

// Required for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export typed hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
