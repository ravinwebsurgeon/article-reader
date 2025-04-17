// src/services/itemsApi.ts
import { api } from './api';
import { Item, ItemsResponse, ItemCreateRequest, ItemUpdateRequest } from '../types/api';

// Items API endpoints
export const itemsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get list of items
    getItems: builder.query<ItemsResponse, { since?: string; cursor_id?: number; limit?: number }>({
      query: (params) => ({
        url: '/items',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Items' as const, id })),
              { type: 'Items', id: 'LIST' },
            ]
          : [{ type: 'Items', id: 'LIST' }],
    }),
    
    // Get a single item
    getItem: builder.query<{ item: Item }, number>({
      query: (id) => `/items/${id}`,
      providesTags: (_, __, id) => [{ type: 'Items', id }],
    }),
    
    // Create an item
    createItem: builder.mutation<{ item: Item }, { item: ItemCreateRequest }>({
      query: (data) => ({
        url: '/items',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Items', id: 'LIST' }],
    }),
    
    // Update an item
    updateItem: builder.mutation<{ item: Item }, { id: number; item: ItemUpdateRequest }>({
      query: ({ id, item }) => ({
        url: `/items/${id}`,
        method: 'PATCH',
        body: { item },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Items', id }, { type: 'Items', id: 'LIST' }],
    }),
    
    // Delete an item
    deleteItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Items', id: 'LIST' }],
    }),
  }),
});

// Export hooks
export const {
  useGetItemsQuery,
  useGetItemQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemsApi;