export interface User {
  name: string;
  id: number;
  username: string;
  email: string;
}

export interface AuthToken {
  token: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration {
  email: string;
  password: string;
}

export interface Item {
  id: number;
  url: string;
  archived: boolean;
  favorite: boolean;
  progress: number;
  notes?: string;
  page_variant_id?: number;
  updated_at: string;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}
