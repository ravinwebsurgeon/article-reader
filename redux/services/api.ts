import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import Constants from "expo-constants";

// Set the API base URL from environment variables or use a default
const API_URL = Constants.expoConfig?.extra?.apiUrl || "https://api.pckt.dev/v4";

// Create our API service with a base URL and endpoints
export const api = createApi({
  reducerPath: "api",
  tagTypes: ["Blogs", "User", "Tags", "Comments", "Bookmarks", "Items"],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    // Include auth token in all requests if available
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: () => ({}), // We'll define these in separate files
});

// Helper function to handle async errors consistently
export const handleApiError = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    // Handle RTK Query error objects
    if ("status" in error) {
      const errMsg = "error" in error ? error.error : JSON.stringify(error);
      return `Error: ${errMsg}`;
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return error.message;
    }
  }

  return "An unknown error occurred";
};

// Add TypeScript definitions for global networkFlipperPlugin
declare global {
  let networkFlipperPlugin: unknown;
}
