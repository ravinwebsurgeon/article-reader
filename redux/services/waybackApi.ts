import { api } from "./api";

export interface WaybackAvailableResponse {
  available: boolean;
  url?: string;
  timestamp?: string;
  error?: string;
}

export const waybackApi = api.injectEndpoints({
  endpoints: (builder) => ({
    checkWaybackAvailable: builder.query<WaybackAvailableResponse, string>({
      query: (url) => ({
        url: `/wayback/available`,
        params: { url },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useCheckWaybackAvailableQuery, useLazyCheckWaybackAvailableQuery } = waybackApi;
