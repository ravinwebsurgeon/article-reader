import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import Constants from 'expo-constants';

// Set the API base URL from environment variables or use a default
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://getpocket.com/v4';


// Setup network debugging in dev mode
if (__DEV__) {
  try {
    // Only import in dev mode to avoid bundling in production
    const { addPlugin } = require('react-native-flipper');
    const { createNetworkFlipperPlugin } = require('react-native-flipper-network-plugin');
    const networkFlipperPlugin = createNetworkFlipperPlugin();
    addPlugin(networkFlipperPlugin);
    
    // Store plugin globally for use with fetchBaseQuery
    global.networkFlipperPlugin = networkFlipperPlugin;
  } catch (error) {
    console.warn('Could not setup Flipper Network plugin', error);
  }
}

// Custom fetch function that logs to Flipper
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Only track in dev mode when plugin is available
  if (__DEV__ && global.networkFlipperPlugin) {
    const { url, method } = typeof input === 'string' 
      ? { url: input, method: init?.method || 'GET' }
      : { url: input.url, method: input instanceof Request ? input.method : 'GET' };
    
    const requestId = String(Date.now());
    
    // Track request
    global.networkFlipperPlugin.trackRequest({
      id: requestId,
      url,
      method,
      headers: init?.headers,
      data: init?.body,
    });

    try {
      // Make the actual request
      const response = await fetch(input, init);
      
      // Clone the response to read the body (reading it consumes the stream)
      const responseClone = response.clone();
      let data;
      const contentType = response.headers.get('content-type');
      
      // Process response body based on content type
      if (contentType && contentType.includes('application/json')) {
        data = await responseClone.json();
      } else {
        data = await responseClone.text();
      }
      
      // Track response
      global.networkFlipperPlugin.trackResponse({
        id: requestId,
        url,
        method,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      });
      
      return response;
    } catch (error) {
      // Track error
      global.networkFlipperPlugin.trackResponse({
        id: requestId,
        url,
        method,
        status: 0,
        headers: {},
        data: { error: String(error) },
      });
      
      throw error;
    }
  }
  
  // In production or if plugin isn't available, just use the regular fetch
  return fetch(input, init);
};



// Create our API service with a base URL and endpoints
export const api = createApi({
  reducerPath: 'api',
  tagTypes: ['Blogs', 'User', 'Tags', 'Comments', 'Bookmarks'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    // fetchFn: customFetch,
    // Include auth token in all requests if available
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  endpoints: () => ({}), // We'll define these in separate files
});

// Helper function to handle async errors consistently
export const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    // Handle RTK Query error objects
    if ('status' in error) {
      const errMsg = 'error' in error ? error.error : JSON.stringify(error);
      return `Error: ${errMsg}`;
    }
    
    // Handle standard Error objects
    if (error instanceof Error) {
      return error.message;
    }
  }
  
  return 'An unknown error occurred';
};

// Add TypeScript definitions for global networkFlipperPlugin
declare global {
  var networkFlipperPlugin: any;
}