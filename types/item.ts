export interface Item {
  id: number;
  canonical_url: string;
  title: string;
  excerpt: string;
  archived: boolean;
  favorite: boolean;
  progress: number;
  notes?: string;
  page_variant_id?: number;
  updated_at: string;

  // Additional fields we need for display
  source: string; // Website name (e.g., "Mashable", "Rolling Stone")
  readTime: number; // Reading time in minutes
  thumbnail?: string; // Image URL
  tags?: string[]; // Tags associated with the item
}

export interface ItemsResponse {
  items: Item[];
  meta: {
    next_cursor_id?: number;
    has_more: boolean;
    total_count: number;
    synced_at: string;
  };
}

export interface ItemCreateRequest {
  url: string;
  archived?: boolean;
  favorite?: boolean;
  progress?: number;
  notes?: string;
  page_variant_id?: number;
}

export interface ItemUpdateRequest {
  archived?: boolean;
  favorite?: boolean;
  progress?: number;
  notes?: string;
  page_variant_id?: number;
}

// Filter types
export type ItemFilter = "all" | "favorites" | "tagged" | "short" | "long" | "archived";
